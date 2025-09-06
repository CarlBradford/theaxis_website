const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const {
  authenticateToken,
  requireStaff,
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
 *     EditorialNoteCreate:
 *       type: object
 *       required: [articleId, content]
 *       properties:
 *         articleId:
 *           type: string
 *         content:
 *           type: string
 *         isInternal:
 *           type: boolean
 *           default: true
 *     EditorialNote:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         content: { type: string }
 *         isInternal: { type: boolean }
 *         authorId: { type: string }
 *         articleId: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

/**
 * @swagger
 * /editorial-notes:
 *   post:
 *     summary: Create an editorial note (Staff+)
 *     tags: [Editorial Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditorialNoteCreate'
 *     responses:
 *       201:
 *         description: Editorial note created
 */
router.post(
  '/',
  [
    authenticateToken,
    requireStaff,
    body('articleId').isString().withMessage('articleId required'),
    body('content').isLength({ min: 1 }).withMessage('content required'),
    body('isInternal').optional().isBoolean(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const { articleId, content, isInternal = true } = req.body;

    // Verify article exists
    const article = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
    if (!article) throw createNotFoundError('Article', articleId);

    const created = await prisma.editorialNote.create({
      data: {
        articleId,
        content,
        isInternal,
        authorId: req.user.id,
      },
      select: { id: true, content: true, isInternal: true, createdAt: true },
    });

    sendSuccessResponse(res, created, 'Editorial note created', 201);
  })
);

/**
 * @swagger
 * /editorial-notes:
 *   get:
 *     summary: List editorial notes for an article (Staff+)
 *     tags: [Editorial Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: articleId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: includeInternal
 *         schema: { type: boolean }
 *         description: "Include internal notes (default: true for staff+)"
 *     responses:
 *       200:
 *         description: Editorial notes retrieved
 */
router.get(
  '/',
  [
    authenticateToken,
    requireStaff,
    query('articleId').isString().withMessage('articleId required'),
    query('includeInternal').optional().isBoolean(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const { articleId, includeInternal } = req.query;
    const includeInternalBool = includeInternal === 'true' || includeInternal === true;

    // Verify article exists
    const article = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
    if (!article) throw createNotFoundError('Article', articleId);

    const where = { articleId };
    if (!includeInternalBool) {
      where.isInternal = false;
    }

    const items = await prisma.editorialNote.findMany({
      where,
      select: {
        id: true,
        content: true,
        isInternal: true,
        authorId: true,
        createdAt: true,
        author: {
          select: { firstName: true, lastName: true, username: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    sendSuccessResponse(res, { items }, 'Editorial notes retrieved');
  })
);

/**
 * @swagger
 * /editorial-notes/{id}:
 *   put:
 *     summary: Update editorial note (owner only)
 *     tags: [Editorial Notes]
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
 *               isInternal: { type: boolean }
 *     responses:
 *       200:
 *         description: Editorial note updated
 */
router.put(
  '/:id',
  [
    authenticateToken,
    requireOwnership('editorialNote', 'id'),
    param('id').isString(),
    body('content').optional().isLength({ min: 1 }),
    body('isInternal').optional().isBoolean(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const { id } = req.params;
    const exists = await prisma.editorialNote.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw createNotFoundError('Editorial note', id);

    const updated = await prisma.editorialNote.update({
      where: { id },
      data: req.body,
      select: { id: true, content: true, isInternal: true, updatedAt: true },
    });

    sendSuccessResponse(res, updated, 'Editorial note updated');
  })
);

/**
 * @swagger
 * /editorial-notes/{id}:
 *   delete:
 *     summary: Delete editorial note (owner only)
 *     tags: [Editorial Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Editorial note deleted
 */
router.delete(
  '/:id',
  [authenticateToken, requireOwnership('editorialNote', 'id'), param('id').isString()],
  auditLog('delete', 'editorialNote'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const exists = await prisma.editorialNote.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw createNotFoundError('Editorial note', id);

    await prisma.editorialNote.delete({ where: { id } });
    sendSuccessResponse(res, null, 'Editorial note deleted');
  })
);

module.exports = router;
