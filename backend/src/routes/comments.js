const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const {
  authenticateToken,
  optionalAuth,
  requireSectionHead,
  requireOwnership,
  auditLog,
} = require('../middleware/auth');
const {
  asyncHandler,
  sendSuccessResponse,
  sendErrorResponse,
  createNotFoundError,
} = require('../middleware/errorHandler');

const prisma = new PrismaClient();
const router = express.Router();

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
    body('isPublic').optional().isBoolean(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const { articleId, content, isPublic = true } = req.body;

    const article = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
    if (!article) throw createNotFoundError('Article', articleId);

    const created = await prisma.comment.create({
      data: {
        articleId,
        content,
        isPublic,
        isApproved: false,
        authorId: req.user.id,
      },
      select: { id: true, isApproved: true, content: true, createdAt: true },
    });

    sendSuccessResponse(res, created, 'Comment submitted for approval', 201);
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
  [authenticateToken, requireSectionHead, param('id').isString()],
  auditLog('approve', 'comment'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id }, select: { id: true, isApproved: true, articleId: true } });
    if (!comment) throw createNotFoundError('Comment', id);

    if (comment.isApproved) {
      return sendSuccessResponse(res, { id: comment.id }, 'Already approved');
    }

    await prisma.$transaction([
      prisma.comment.update({ where: { id }, data: { isApproved: true } }),
      prisma.article.update({ where: { id: comment.articleId }, data: { commentCount: { increment: 1 } } }),
    ]);

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
  [authenticateToken, requireSectionHead, param('id').isString()],
  auditLog('reject', 'comment'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};
    const comment = await prisma.comment.findUnique({ where: { id }, select: { id: true, isApproved: true } });
    if (!comment) throw createNotFoundError('Comment', id);

    await prisma.comment.update({ where: { id }, data: { isApproved: false, isModerated: true, moderationReason: reason || 'Rejected' } });
    sendSuccessResponse(res, { id }, 'Comment rejected');
  })
);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment (owner or Section Head+)
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
  [authenticateToken, requireOwnership('comment', 'id')],
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

module.exports = router;
