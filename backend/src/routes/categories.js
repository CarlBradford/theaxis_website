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
 *     CategoryCreate:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         parentCategoryId:
 *           type: string
 *           description: ID of parent category for hierarchy
 *     Category:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         slug: { type: string }
 *         description: { type: string }
 *         parentCategoryId: { type: string }
 *         parentCategory: { $ref: '#/components/schemas/Category' }
 *         subCategories: { type: array, items: { $ref: '#/components/schemas/Category' } }
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
 * /categories:
 *   post:
 *     summary: Create a new category (Section Head+)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryCreate'
 *     responses:
 *       201:
 *         description: Category created
 */
router.post(
  '/',
  [
    authenticateToken,
    requireSectionHead,
    body('name').isLength({ min: 1 }).withMessage('Name is required'),
    body('description').optional().isLength({ max: 500 }),
    body('parentCategoryId').optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const { name, description, parentCategoryId } = req.body;
    const slug = generateSlug(name);

    // Check if category already exists
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug }] },
    });
    if (existing) {
      return sendErrorResponse(res, 409, 'Category with this name or slug already exists');
    }

    // Validate parent category if provided
    if (parentCategoryId) {
      const parent = await prisma.category.findUnique({ where: { id: parentCategoryId }, select: { id: true } });
      if (!parent) {
        return sendErrorResponse(res, 400, 'Parent category not found');
      }
    }

    const created = await prisma.category.create({
      data: { name, slug, description, parentCategoryId },
      select: { id: true, name: true, slug: true, description: true, parentCategoryId: true, createdAt: true },
    });

    sendSuccessResponse(res, created, 'Category created', 201);
  })
);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List all categories (with hierarchy)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: includeSubcategories
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Categories retrieved
 */
router.get(
  '/',
  [query('search').optional().isString(), query('includeSubcategories').optional().isBoolean()],
  asyncHandler(async (req, res) => {
    const { search, includeSubcategories } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const select = {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentCategoryId: true,
      createdAt: true,
    };

    if (includeSubcategories === 'true' || includeSubcategories === true) {
      select.subCategories = { select };
    }

    const items = await prisma.category.findMany({
      where,
      select,
      orderBy: { name: 'asc' },
    });

    sendSuccessResponse(res, { items }, 'Categories retrieved');
  })
);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID with hierarchy
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category retrieved
 *       404:
 *         description: Category not found
 */
router.get(
  '/:id',
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentCategoryId: true,
        parentCategory: {
          select: { id: true, name: true, slug: true },
        },
        subCategories: {
          select: { id: true, name: true, slug: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!category) throw createNotFoundError('Category', id);
    sendSuccessResponse(res, category, 'Category retrieved');
  })
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category (Section Head+)
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/CategoryCreate'
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put(
  '/:id',
  [
    authenticateToken,
    requireSectionHead,
    param('id').isString(),
    body('name').optional().isLength({ min: 1 }),
    body('description').optional().isLength({ max: 500 }),
    body('parentCategoryId').optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const { id } = req.params;
    const { name, description, parentCategoryId } = req.body;

    const existing = await prisma.category.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!existing) throw createNotFoundError('Category', id);

    // Prevent circular references
    if (parentCategoryId === id) {
      return sendErrorResponse(res, 400, 'Category cannot be its own parent');
    }

    // Validate parent category if provided
    if (parentCategoryId) {
      const parent = await prisma.category.findUnique({ where: { id: parentCategoryId }, select: { id: true } });
      if (!parent) {
        return sendErrorResponse(res, 400, 'Parent category not found');
      }
    }

    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }
    if (description !== undefined) updateData.description = description;
    if (parentCategoryId !== undefined) updateData.parentCategoryId = parentCategoryId;

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, slug: true, description: true, parentCategoryId: true, updatedAt: true },
    });

    sendSuccessResponse(res, updated, 'Category updated');
  })
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category (Editor-in-Chief+)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete(
  '/:id',
  [authenticateToken, requireEditorInChief, param('id').isString()],
  auditLog('delete', 'category'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const exists = await prisma.category.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw createNotFoundError('Category', id);

    // Check if category has subcategories
    const subcategories = await prisma.category.count({ where: { parentCategoryId: id } });
    if (subcategories > 0) {
      return sendErrorResponse(res, 400, 'Cannot delete category with subcategories');
    }

    await prisma.category.delete({ where: { id } });
    sendSuccessResponse(res, null, 'Category deleted');
  })
);

module.exports = router;
