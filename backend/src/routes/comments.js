const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const ProfanityFilter = require('../utils/profanityFilter');
const {
  authenticateToken,
  optionalAuth,
  requireSectionHead,
  requireOwnership,
  requireRole,
  auditLog,
} = require('../middleware/auth');
const {
  asyncHandler,
  sendSuccessResponse,
  sendErrorResponse,
  createNotFoundError,
} = require('../middleware/errorHandler');
const { NotificationService } = require('../services/notificationService');
const notificationService = NotificationService;

const prisma = new PrismaClient();
const router = express.Router();
const profanityFilter = new ProfanityFilter();

/**
 * @swagger
 * components:
 *   schemas:
 *     CommentCreate:
 *       type: object
 *       required: [articleId, content]
 *       properties:
 *         articleId:
 *           type: string
 *         content:
 *           type: string
 *         isPublic:
 *           type: boolean
 *           default: true
 *     Comment:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         content: { type: string }
 *         isPublic: { type: boolean }
 *         isApproved: { type: boolean }
 *         authorId: { type: string }
 *         articleId: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a comment (awaits approval)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreate'
 *     responses:
 *       201:
 *         description: Comment submitted
 */
router.post(
  '/',
  [
    authenticateToken,
    body('articleId').isString().withMessage('articleId required'),
    body('content').isLength({ min: 1 }).withMessage('content required'),
    body('name').optional().isString().withMessage('name must be a string'),
    body('email').optional().isEmail().withMessage('email must be valid'),
    body('isPublic').optional().isBoolean(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const { articleId, content, name, email, isPublic = true } = req.body;

    const article = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
    if (!article) throw createNotFoundError('Article', articleId);

    // Run profanity filter on comment content
    const moderationResult = profanityFilter.moderateComment(content, name, email);
    
    let isApproved = true;
    let moderationReason = null;
    
    // If profanity or spam detected, handle accordingly
    if (!moderationResult.isClean) {
      if (moderationResult.shouldBlock) {
        // Block the comment completely
        return sendErrorResponse(res, 400, 'Comment blocked due to inappropriate content', {
          reason: moderationResult.moderationReason,
          flaggedWords: moderationResult.flaggedWords
        });
      } else if (moderationResult.shouldFlag) {
        // Flag for review but still allow
        isApproved = true;
        moderationReason = moderationResult.moderationReason;
      }
    }

    // Clean the content if profanity was detected but not blocked
    const cleanedContent = moderationResult.isClean ? content : profanityFilter.clean(content);

    // If name and email are provided, store them as additional data
    const commentData = {
      articleId,
      content: cleanedContent,
      isPublic,
      isApproved,
      authorId: req.user.id,
    };

    // Add name and email if provided (for guest comments or additional info)
    if (name) commentData.guestName = name;
    if (email) commentData.guestEmail = email;
    
    // Add moderation reason if flagged
    if (moderationReason) {
      commentData.moderationReason = moderationReason;
    }

    const created = await prisma.comment.create({
      data: commentData,
      select: { id: true, isApproved: true, content: true, createdAt: true, moderationReason: true },
    });

    // Send notification to article author when comment is posted
    try {
      await notificationService.notifyArticleAuthorNewComment(articleId, created.id);
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification error during comment creation:', notificationError);
    }

    const message = moderationResult.isClean 
      ? 'Comment posted successfully' 
      : 'Comment posted (content was cleaned)';
      
    sendSuccessResponse(res, created, message, 201);
  })
);

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: List comments (public sees approved only)
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: articleId
 *         schema: { type: string }
 *       - in: query
 *         name: includePending
 *         schema: { type: boolean }
 *         description: Staff can include pending
 *     responses:
 *       200:
 *         description: Comments retrieved
 */
router.get(
  '/',
  [optionalAuth, query('articleId').optional().isString(), query('includePending').optional().isBoolean()],
  asyncHandler(async (req, res) => {
    const { articleId } = req.query;
    const includePending = req.query.includePending === 'true' || req.query.includePending === true;

    const where = {};
    if (articleId) where.articleId = articleId;

    const isStaffOrAbove = req.user && ['STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER'].includes(req.user.role);
    if (!isStaffOrAbove || !includePending) {
      where.isApproved = true;
      where.isPublic = true;
    }

    const items = await prisma.comment.findMany({
      where,
      select: { id: true, content: true, isPublic: true, isApproved: true, authorId: true, articleId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    sendSuccessResponse(res, { items }, 'Comments retrieved');
  })
);

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment (owner or Section Head+)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               isPublic: { type: boolean }
 *     responses:
 *       200:
 *         description: Comment updated
 */
router.put(
  '/:id',
  [authenticateToken, requireOwnership('comment', 'id'), body('content').optional().isLength({ min: 1 }), body('isPublic').optional().isBoolean()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const { id } = req.params;
    const exists = await prisma.comment.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw createNotFoundError('Comment', id);

    const updated = await prisma.comment.update({ where: { id }, data: req.body, select: { id: true, content: true, isPublic: true, updatedAt: true } });
    sendSuccessResponse(res, updated, 'Comment updated');
  })
);

/**
 * @swagger
 * /comments/{id}/approve:
 *   post:
 *     summary: Approve a comment (Section Head+)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comment approved
 */
router.post(
  '/:id/approve',
  [authenticateToken, requireRole('SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'), param('id').isString()],
  auditLog('approve', 'comment'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id }, select: { id: true, isApproved: true, articleId: true } });
    if (!comment) throw createNotFoundError('Comment', id);

    if (comment.isApproved) {
      return sendSuccessResponse(res, { id: comment.id }, 'Already approved');
    }

    await prisma.$transaction([
      prisma.comment.update({ where: { id }, data: { isApproved: true, isModerated: false, moderationReason: null } }),
      prisma.article.update({ where: { id: comment.articleId }, data: { commentCount: { increment: 1 } } }),
    ]);

    // Send notification to comment author when comment is approved
    try {
      await notificationService.notifyCommentAuthorStatusChange(id, 'APPROVED');
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification error during comment approval:', notificationError);
    }

    sendSuccessResponse(res, { id }, 'Comment approved');
  })
);

/**
 * @swagger
 * /comments/{id}/reject:
 *   post:
 *     summary: Reject a comment (Section Head+)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Comment rejected
 */
router.post(
  '/:id/reject',
  [authenticateToken, requireRole('SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'), param('id').isString()],
  auditLog('reject', 'comment'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};
    const comment = await prisma.comment.findUnique({ where: { id }, select: { id: true, isApproved: true } });
    if (!comment) throw createNotFoundError('Comment', id);

    await prisma.comment.update({ where: { id }, data: { isApproved: false, isModerated: true, moderationReason: reason || 'Rejected' } });

    // Send notification to comment author when comment is rejected
    try {
      await notificationService.notifyCommentAuthorStatusChange(id, 'REJECTED', reason);
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification error during comment rejection:', notificationError);
    }

    sendSuccessResponse(res, { id }, 'Comment rejected');
  })
);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment (Section Head+)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comment deleted
 */
router.delete(
  '/:id',
  [authenticateToken, requireRole('SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN')],
  auditLog('delete', 'comment'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.comment.findUnique({ where: { id }, select: { id: true, isApproved: true, articleId: true } });
    if (!existing) throw createNotFoundError('Comment', id);

    await prisma.$transaction([
      prisma.comment.delete({ where: { id } }),
      ...(existing.isApproved
        ? [prisma.article.update({ where: { id: existing.articleId }, data: { commentCount: { decrement: 1 } } })]
        : []),
    ]);

    sendSuccessResponse(res, null, 'Comment deleted');
  })
);

/**
 * @swagger
 * /comments/admin:
 *   get:
 *     summary: Get all comments for admin management (Section Head+)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, pending, approved, rejected] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by article category name or slug
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, updatedAt, author, article], default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: All comments retrieved for management
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/admin',
  [
    authenticateToken,
    requireRole('SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['all', 'pending', 'approved', 'rejected']),
    query('search').optional().isString(),
    query('category').optional().isString(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'author', 'article']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  asyncHandler(async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;
    const { status = 'all', search, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build where clause
    const where = {};
    
    // Status filter
    if (status !== 'all') {
      switch (status) {
        case 'pending':
          where.isApproved = false;
          where.isModerated = false;
          break;
        case 'approved':
          where.isApproved = true;
          break;
        case 'rejected':
          where.isModerated = true;
          where.isApproved = false;
          break;
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { author: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } }
          ]
        }},
        { article: { 
          title: { contains: search, mode: 'insensitive' }
        }}
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      where.article = {
        ...where.article,
        categories: {
          some: {
            OR: [
              { name: { contains: category, mode: 'insensitive' } },
              { slug: { contains: category, mode: 'insensitive' } }
            ]
          }
        }
      };
    }

    // Build orderBy clause
    let orderBy = {};
    switch (sortBy) {
      case 'author':
        orderBy = { author: { firstName: sortOrder } };
        break;
      case 'article':
        orderBy = { article: { title: sortOrder } };
        break;
      case 'updatedAt':
        orderBy = { updatedAt: sortOrder };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
              role: true
            }
          },
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              publishedAt: true
            }
          },
          parentComment: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  firstName: true,
                  lastName: true,
                  username: true
                }
              }
            }
          },
          replies: {
            select: {
              id: true,
              content: true,
              isApproved: true,
              createdAt: true,
              author: {
                select: {
                  firstName: true,
                  lastName: true,
                  username: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.comment.count({ where })
    ]);

    // Transform comments for frontend
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      isPublic: comment.isPublic,
      isApproved: comment.isApproved,
      isModerated: comment.isModerated,
      moderationReason: comment.moderationReason,
      guestName: comment.guestName,
      guestEmail: comment.guestEmail,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author.id,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
        name: `${comment.author.firstName} ${comment.author.lastName}`,
        username: comment.author.username,
        email: comment.author.email,
        role: comment.author.role
      },
      article: {
        id: comment.article.id,
        title: comment.article.title,
        slug: comment.article.slug,
        status: comment.article.status,
        publishedAt: comment.article.publishedAt
      },
      parentComment: comment.parentComment ? {
        id: comment.parentComment.id,
        content: comment.parentComment.content,
        author: comment.parentComment.author
      } : null,
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        isApproved: reply.isApproved,
        createdAt: reply.createdAt,
        author: reply.author
      })),
      replyCount: comment.replies.length
    }));

    sendSuccessResponse(res, {
      comments: transformedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Comments retrieved for management');
  })
);

module.exports = router;
