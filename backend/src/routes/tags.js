const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const {
  authenticateToken,
  requireSectionHead,
  requireEditorInChief,
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
 *     TagCreate:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         color:
 *           type: string
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *     Tag:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         slug: { type: string }
 *         description: { type: string }
 *         color: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Create a new tag (Section Head+)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagCreate'
 *     responses:
 *       201:
 *         description: Tag created
 */
router.post(
  '/',
  [
    authenticateToken,
    requireSectionHead,
    body('name').isLength({ min: 1 }).withMessage('Name is required'),
    body('description').optional().isLength({ max: 500 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const { name, description, color } = req.body;
    const slug = generateSlug(name);

    // Check if tag already exists
    const existing = await prisma.tag.findFirst({
      where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug }] },
    });
    if (existing) {
      return sendErrorResponse(res, 409, 'Tag with this name or slug already exists');
    }

    const created = await prisma.tag.create({
      data: { name, slug, description, color },
      select: { id: true, name: true, slug: true, description: true, color: true, createdAt: true },
    });

    sendSuccessResponse(res, created, 'Tag created', 201);
  })
);

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: List all tags
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tags retrieved
 */
router.get(
  '/',
  [query('search').optional().isString()],
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.tag.findMany({
      where,
      select: { id: true, name: true, slug: true, description: true, color: true, createdAt: true },
      orderBy: { name: 'asc' },
    });

    sendSuccessResponse(res, { items }, 'Tags retrieved');
  })
);

/**
 * @swagger
 * /tags/{id}:
 *   get:
 *     summary: Get tag by ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tag retrieved
 *       404:
 *         description: Tag not found
 */
router.get(
  '/:id',
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const tag = await prisma.tag.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, description: true, color: true, createdAt: true, updatedAt: true },
    });

    if (!tag) throw createNotFoundError('Tag', id);
    sendSuccessResponse(res, tag, 'Tag retrieved');
  })
);

/**
 * @swagger
 * /tags/{id}:
 *   put:
 *     summary: Update tag (Section Head+)
 *     tags: [Tags]
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
 *             $ref: '#/components/schemas/TagCreate'
 *     responses:
 *       200:
 *         description: Tag updated
 */
router.put(
  '/:id',
  [
    authenticateToken,
    requireSectionHead,
    param('id').isString(),
    body('name').optional().isLength({ min: 1 }),
    body('description').optional().isLength({ max: 500 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const { id } = req.params;
    const { name, description, color } = req.body;

    const existing = await prisma.tag.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!existing) throw createNotFoundError('Tag', id);

    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;

    const updated = await prisma.tag.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, slug: true, description: true, color: true, updatedAt: true },
    });

    sendSuccessResponse(res, updated, 'Tag updated');
  })
);

/**
 * @swagger
 * /tags/{id}:
 *   delete:
 *     summary: Delete tag (Editor-in-Chief+)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tag deleted
 */
router.delete(
  '/:id',
  [authenticateToken, requireEditorInChief, param('id').isString()],
  auditLog('delete', 'tag'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const exists = await prisma.tag.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw createNotFoundError('Tag', id);

    await prisma.tag.delete({ where: { id } });
    sendSuccessResponse(res, null, 'Tag deleted');
  })
);

module.exports = router;
