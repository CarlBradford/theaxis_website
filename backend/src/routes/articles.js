const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const {
  authenticateToken,
  optionalAuth,
  requireSectionHead,
  requireEditorInChief,
  requireStaff,
  requireOwnership,
  auditLog,
} = require('../middleware/auth');
const {
  asyncHandler,
  sendSuccessResponse,
  sendErrorResponse,
  createNotFoundError,
  createValidationError,
} = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

const allowedStatuses = ['DRAFT', 'IN_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

/**
 * @swagger
 * components:
 *   schemas:
 *     ArticleCreate:
 *       type: object
 *       required: [title, content]
 *       properties:
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         featuredImage:
 *           type: string
 *           description: URL/path to image
 *         mediaCaption:
 *           type: string
 *           description: Caption for featured media
 *         publicationDate:
 *           type: string
 *           format: date-time
 *           description: Publication date
 *         tags:
 *           type: array
 *           description: Connect by slug
 *           items:
 *             type: string
 *         categories:
 *           type: array
 *           description: Connect by slug
 *           items:
 *             type: string
 *         authors:
 *           type: array
 *           description: Additional authors (user IDs)
 *           items:
 *             type: string
 *     Article:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *         content:
 *           type: string
 *         featuredImage:
 *           type: string
 *         mediaCaption:
 *           type: string
 *         status:
 *           type: string
 *           enum: [DRAFT, IN_REVIEW, NEEDS_REVISION, APPROVED, SCHEDULED, PUBLISHED, ARCHIVED]
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         publicationDate:
 *           type: string
 *           format: date-time
 *         viewCount:
 *           type: integer
 *         likeCount:
 *           type: integer
 *         dislikeCount:
 *           type: integer
 *         commentCount:
 *           type: integer
 *         socialShares:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const generateSlug = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create a new article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArticleCreate'
 *     responses:
 *       201:
 *         description: Article created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
// Create article
router.post(
  '/',
  [
    authenticateToken,
    requireStaff,
    body('title').isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('content').isLength({ min: 1 }).withMessage('Content is required'),
    body('featuredImage').optional().isString(),
    body('mediaCaption').optional().isLength({ max: 500 }).withMessage('Media caption max 500 chars'),
    body('publicationDate').optional().isISO8601().withMessage('Invalid publication date format'),
    body('tags').optional().isArray(),
    body('categories').optional().isArray(),
    body('authors').optional().isArray(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { 
      title, 
      content, 
      featuredImage, 
      mediaCaption,
      publicationDate,
      tags = [], 
      categories = [],
      authors = []
    } = req.body;

    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let suffix = 1;
    // ensure unique slug
    while (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    // Validate additional authors exist if provided
    if (authors.length > 0) {
      const authorUsers = await prisma.user.findMany({
        where: { id: { in: authors } },
        select: { id: true }
      });
      if (authorUsers.length !== authors.length) {
        return sendErrorResponse(res, 400, 'One or more authors not found');
      }
    }

    const created = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        featuredImage,
        mediaCaption,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        authorId: req.user.id,
        // connect tags/categories if provided as array of slugs
        ...(tags.length > 0 && {
          tags: { connect: tags.map((s) => ({ slug: s })) },
        }),
        ...(categories.length > 0 && {
          categories: { connect: categories.map((s) => ({ slug: s })) },
        }),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
      },
    });

    // Create additional authors if provided
    if (authors.length > 0) {
      await prisma.articleAuthor.createMany({
        data: authors.map((authorId, index) => ({
          articleId: created.id,
          userId: authorId,
          role: index === 0 ? 'Co-Author' : 'Contributor',
          order: index + 1
        }))
      });
    }

    sendSuccessResponse(res, created, 'Article created', 201);
  })
);

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: List articles
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, IN_REVIEW, NEEDS_REVISION, APPROVED, SCHEDULED, PUBLISHED, ARCHIVED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Articles retrieved
 */
// List articles (published for public, broader list for staff+)
router.get(
  '/',
  [
    optionalAuth,
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(allowedStatuses),
    query('search').optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (!req.user) where.status = 'PUBLISHED';

    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where,
        select: { 
          id: true, 
          title: true, 
          slug: true, 
          status: true, 
          publishedAt: true, 
          publicationDate: true,
          viewCount: true,
          likeCount: true,
          dislikeCount: true,
          commentCount: true,
          socialShares: true,
          createdAt: true 
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.article.count({ where }),
    ]);

    sendSuccessResponse(res, { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 'Articles retrieved');
  })
);

/**
 * @swagger
 * /articles/create:
 *   get:
 *     summary: Get article creation form data
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Form data for creating articles
 *       401:
 *         description: Unauthorized
 */
// Get article creation form data
router.get(
  '/create',
  [authenticateToken, requireStaff],
  asyncHandler(async (req, res) => {
    // Return form data needed for creating articles
    const formData = {
      categories: await prisma.category.findMany({
        select: { id: true, name: true, slug: true }
      }),
      tags: await prisma.tag.findMany({
        select: { id: true, name: true, slug: true }
      }),
      statuses: allowedStatuses,
      currentUser: {
        id: req.user.id,
        role: req.user.role
      }
    };
    
    sendSuccessResponse(res, formData, 'Article creation form data');
  })
);

/**
 * @swagger
 * /articles/{idOrSlug}:
 *   get:
 *     summary: Get article by id or slug
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Article retrieved
 *       403:
 *         description: Article not published
 *       404:
 *         description: Not found
 */
// Get article by id or slug (public if published)
router.get(
  '/:idOrSlug',
  [optionalAuth, param('idOrSlug').isString()],
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const by = idOrSlug.includes('-') ? { slug: idOrSlug } : { id: idOrSlug };
    const article = await prisma.article.findFirst({
      where: by,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        featuredImage: true,
        status: true,
        publishedAt: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!article) throw createNotFoundError('Article', idOrSlug);

    const canView =
      article.status === 'PUBLISHED' ||
      (req.user && (req.user.id === article.authorId || ['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER'].includes(req.user.role)));
    if (!canView) {
      return sendErrorResponse(res, 403, 'Article not published');
    }

    sendSuccessResponse(res, article, 'Article retrieved');
  })
);

/**
 * @swagger
 * /articles/{id}:
 *   put:
 *     summary: Update an article
 *     tags: [Articles]
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
 *             $ref: '#/components/schemas/ArticleCreate'
 *     responses:
 *       200:
 *         description: Article updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
// Update article (author ownership or section head+)
router.put(
  '/:id',
  [
    authenticateToken,
    requireOwnership('article', 'id'),
    body('title').optional().isLength({ min: 3 }),
    body('content').optional().isLength({ min: 1 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const existing = await prisma.article.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!existing) throw createNotFoundError('Article', id);

    const updateData = { ...req.body };
    if (updateData.title) {
      const baseSlug = generateSlug(updateData.title);
      let slug = baseSlug;
      let i = 1;
      while (await prisma.article.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`;
      }
      updateData.slug = slug;
    }

    const updated = await prisma.article.update({
      where: { id },
      data: updateData,
      select: { id: true, title: true, slug: true, updatedAt: true },
    });

    sendSuccessResponse(res, updated, 'Article updated');
  })
);

/**
 * @swagger
 * /articles/{id}/status:
 *   patch:
 *     summary: Change article status (workflow)
 *     tags: [Articles]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, IN_REVIEW, NEEDS_REVISION, APPROVED, SCHEDULED, PUBLISHED, ARCHIVED]
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid transition
 */
// Change status (workflow transitions)
router.patch(
  '/:id/status',
  [
    authenticateToken,
    requireSectionHead,
    body('status').isIn(allowedStatuses),
    body('scheduledAt').optional().isISO8601(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const { status, scheduledAt } = req.body;
    const article = await prisma.article.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!article) throw createNotFoundError('Article', id);

    const transitions = {
      DRAFT: ['IN_REVIEW'],
      IN_REVIEW: ['NEEDS_REVISION', 'APPROVED'],
      NEEDS_REVISION: ['IN_REVIEW'],
      APPROVED: ['SCHEDULED', 'PUBLISHED'],
      SCHEDULED: ['PUBLISHED'],
      PUBLISHED: ['ARCHIVED'],
      ARCHIVED: [],
    };

    if (!transitions[article.status].includes(status)) {
      throw createValidationError('status', `Cannot transition from ${article.status} to ${status}`);
    }

    const data = { status };
    if (status === 'SCHEDULED' && scheduledAt) data.scheduledAt = new Date(scheduledAt);
    if (status === 'PUBLISHED') data.publishedAt = new Date();

    const updated = await prisma.article.update({ where: { id }, data, select: { id: true, status: true, publishedAt: true, scheduledAt: true } });

    sendSuccessResponse(res, updated, 'Status updated');
  })
);

/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: Delete article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Article deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
// Delete article (editor-in-chief or adviser)
router.delete(
  '/:id',
  [authenticateToken, requireEditorInChief, param('id').isString()],
  auditLog('delete', 'article'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const exists = await prisma.article.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw createNotFoundError('Article', id);
    await prisma.article.delete({ where: { id } });
    sendSuccessResponse(res, null, 'Article deleted');
  })
);

/**
 * @swagger
 * /articles/{id}/authors:
 *   get:
 *     summary: Get article authors
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Article authors retrieved
 */
// Get article authors
router.get(
  '/:id/authors',
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const authors = await prisma.articleAuthor.findMany({
      where: { articleId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    sendSuccessResponse(res, authors, 'Article authors retrieved');
  })
);

/**
 * @swagger
 * /articles/{id}/authors:
 *   post:
 *     summary: Add author to article
 *     tags: [Articles]
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
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 default: "Co-Author"
 *     responses:
 *       201:
 *         description: Author added to article
 */
// Add author to article
router.post(
  '/:id/authors',
  [
    authenticateToken,
    requireStaff,
    param('id').isString(),
    body('userId').isString().withMessage('User ID is required'),
    body('role').optional().isString()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const { userId, role = 'Co-Author' } = req.body;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!article) {
      throw createNotFoundError('Article', id);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    if (!user) {
      return sendErrorResponse(res, 400, 'User not found');
    }

    // Check if author already exists
    const existingAuthor = await prisma.articleAuthor.findUnique({
      where: {
        articleId_userId: {
          articleId: id,
          userId: userId
        }
      }
    });
    if (existingAuthor) {
      return sendErrorResponse(res, 400, 'User is already an author of this article');
    }

    // Get next order number
    const lastAuthor = await prisma.articleAuthor.findFirst({
      where: { articleId: id },
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    const nextOrder = (lastAuthor?.order || 0) + 1;

    const articleAuthor = await prisma.articleAuthor.create({
      data: {
        articleId: id,
        userId,
        role,
        order: nextOrder
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true
          }
        }
      }
    });

    sendSuccessResponse(res, articleAuthor, 'Author added to article', 201);
  })
);

/**
 * @swagger
 * /articles/{id}/view:
 *   post:
 *     summary: Track article view
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: View tracked
 */
// Track article view
router.post(
  '/:id/view',
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!article) {
      throw createNotFoundError('Article', id);
    }

    // Increment view count
    await prisma.article.update({
      where: { id },
      data: {
        viewCount: { increment: 1 }
      }
    });

    // Record view history
    await prisma.articleViewHistory.create({
      data: {
        articleId: id,
        userId: req.user?.id || null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    sendSuccessResponse(res, { message: 'View tracked' }, 'View tracked');
  })
);

/**
 * @swagger
 * /articles/{id}/like:
 *   post:
 *     summary: Like or dislike article
 *     tags: [Articles]
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
 *             required: [isLike]
 *             properties:
 *               isLike:
 *                 type: boolean
 *                 description: true for like, false for dislike
 *     responses:
 *       200:
 *         description: Like/dislike recorded
 */
// Like or dislike article
router.post(
  '/:id/like',
  [
    authenticateToken,
    param('id').isString(),
    body('isLike').isBoolean().withMessage('isLike must be a boolean')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const { isLike } = req.body;
    
    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!article) {
      throw createNotFoundError('Article', id);
    }

    // Check if user already liked/disliked
    const existingLike = await prisma.articleLikeHistory.findUnique({
      where: {
        articleId_userId: {
          articleId: id,
          userId: req.user.id
        }
      }
    });

    if (existingLike) {
      // Update existing like/dislike
      await prisma.articleLikeHistory.update({
        where: { id: existingLike.id },
        data: { isLike }
      });

      // Update counters
      if (existingLike.isLike && !isLike) {
        // Changed from like to dislike
        await prisma.article.update({
          where: { id },
          data: {
            likeCount: { decrement: 1 },
            dislikeCount: { increment: 1 }
          }
        });
      } else if (!existingLike.isLike && isLike) {
        // Changed from dislike to like
        await prisma.article.update({
          where: { id },
          data: {
            likeCount: { increment: 1 },
            dislikeCount: { decrement: 1 }
          }
        });
      }
    } else {
      // Create new like/dislike
      await prisma.articleLikeHistory.create({
        data: {
          articleId: id,
          userId: req.user.id,
          isLike,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Update counters
      await prisma.article.update({
        where: { id },
        data: {
          likeCount: isLike ? { increment: 1 } : undefined,
          dislikeCount: !isLike ? { increment: 1 } : undefined
        }
      });
    }

    sendSuccessResponse(res, { isLike }, 'Like/dislike recorded');
  })
);

/**
 * @swagger
 * /articles/{id}/analytics:
 *   get:
 *     summary: Get article analytics
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Article analytics retrieved
 */
// Get article analytics
router.get(
  '/:id/analytics',
  [
    authenticateToken,
    requireStaff,
    param('id').isString(),
    query('days').optional().isInt({ min: 1, max: 365 }).toInt()
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const days = req.query.days || 30;
    
    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!article) {
      throw createNotFoundError('Article', id);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await prisma.articleAnalytics.findMany({
      where: {
        articleId: id,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    sendSuccessResponse(res, analytics, 'Article analytics retrieved');
  })
);

module.exports = router;
