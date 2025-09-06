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
 *         excerpt:
 *           type: string
 *         featuredImage:
 *           type: string
 *           description: URL/path to image
 *         seoTitle:
 *           type: string
 *         seoDescription:
 *           type: string
 *         seoKeywords:
 *           type: array
 *           items:
 *             type: string
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
 *     Article:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *         excerpt:
 *           type: string
 *         content:
 *           type: string
 *         featuredImage:
 *           type: string
 *         status:
 *           type: string
 *           enum: [DRAFT, IN_REVIEW, NEEDS_REVISION, APPROVED, SCHEDULED, PUBLISHED, ARCHIVED]
 *         publishedAt:
 *           type: string
 *           format: date-time
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
    body('excerpt').optional().isLength({ max: 300 }).withMessage('Excerpt max 300 chars'),
    body('seoTitle').optional().isLength({ max: 120 }),
    body('seoDescription').optional().isLength({ max: 160 }),
    body('seoKeywords').optional().isArray(),
    body('tags').optional().isArray(),
    body('categories').optional().isArray(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { title, content, excerpt, featuredImage, seoTitle, seoDescription, seoKeywords = [], tags = [], categories = [] } = req.body;

    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let suffix = 1;
    // ensure unique slug
    while (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const created = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        seoTitle,
        seoDescription,
        seoKeywords,
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
        select: { id: true, title: true, slug: true, status: true, publishedAt: true, createdAt: true },
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
    body('excerpt').optional().isLength({ max: 300 }),
    body('seoTitle').optional().isLength({ max: 120 }),
    body('seoDescription').optional().isLength({ max: 160 }),
    body('seoKeywords').optional().isArray(),
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

module.exports = router;
