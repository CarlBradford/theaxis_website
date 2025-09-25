const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const {
  authenticateToken,
  optionalAuth,
  requireRole,
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
const { NotificationService } = require('../services/notificationService');
const notificationService = NotificationService;

const router = express.Router();
const prisma = new PrismaClient();

const allowedStatuses = ['DRAFT', 'IN_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

// Helper function to calculate read time in minutes
const calculateReadTime = (content) => {
  if (!content) return 1;
  
  // Remove HTML tags and get plain text
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Split by whitespace and filter out empty strings
  const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
  
  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;
  const minutes = Math.ceil(words.length / wordsPerMinute);
  
  // Minimum 1 minute read time
  return Math.max(1, minutes);
};

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
    requireRole('STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'),
    body('title').isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('content').isLength({ min: 1 }).withMessage('Content is required'),
    body('featuredImage').optional().isString(),
    body('mediaCaption').optional().isLength({ max: 500 }).withMessage('Media caption max 500 chars'),
    body('publicationDate').optional().isISO8601().withMessage('Invalid publication date format'),
    body('status').optional().isIn(allowedStatuses).withMessage('Invalid status'),
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
      status = 'DRAFT',
      tags = [], 
      categories = [],
      authors = []
    } = req.body;

    // Determine initial status based on user role and action
    let initialStatus = status;
    if (req.user.role === 'SECTION_HEAD') {
      // Section Head content workflow:
      // - "Save as Draft" stays as DRAFT
      // - "Submit for Review" becomes IN_REVIEW (goes to Section Head queue for review)
      // - "Send to EIC" becomes APPROVED (bypasses Section Head review)
      if (status === 'IN_REVIEW') {
        initialStatus = 'IN_REVIEW'; // Keep as IN_REVIEW for Section Head review
      } else if (status === 'APPROVED') {
        initialStatus = 'APPROVED'; // Direct to EIC
      }
      // If status is 'DRAFT', keep it as 'DRAFT'
    }

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
        status: initialStatus,
        authorId: req.user.id,
        // Set reviewerId for Section Head when they approve/send to EIC
        ...(req.user.role === 'SECTION_HEAD' && initialStatus === 'APPROVED' && {
          reviewerId: req.user.id
        }),
        // Set publishedAt and publicationDate for PUBLISHED status
        ...(initialStatus === 'PUBLISHED' && {
          publishedAt: new Date(),
          publicationDate: publicationDate ? new Date(publicationDate) : new Date()
        }),
        // Set archivedAt for ARCHIVED status (only if previously published)
        ...(initialStatus === 'ARCHIVED' && {
          publishedAt: new Date(), // Assume it was published first
          archivedAt: new Date()
        }),
        readingTime: calculateReadTime(content), // Calculate and store read time
        // connect tags/categories if provided as array of slugs
        ...(tags.length > 0 && {
          tags: { 
            connectOrCreate: tags.map((slug) => ({
              where: { slug },
              create: { 
                name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                slug 
              }
            }))
          },
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
        readingTime: true,
      },
    });

    // Send notifications based on initial status
    try {
      if (initialStatus === 'IN_REVIEW') {
        // Notify Section Head when article is created and submitted for review
        await notificationService.notifySectionHeadArticleSubmitted(created.id, req.user);
      }
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification error during article creation:', notificationError);
    }

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
 *         description: Search in title and author name
 *       - in: query
 *         name: authorId
 *         schema: { type: string }
 *         description: Filter by author ID
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by category name or slug
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, updatedAt, publishedAt, title, viewCount, author], default: createdAt }
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *         description: Sort order
 *       - in: query
 *         name: publicationDateStart
 *         schema: { type: string, format: date-time }
 *         description: Filter articles published after this date
 *       - in: query
 *         name: publicationDateEnd
 *         schema: { type: string, format: date-time }
 *         description: Filter articles published before this date
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
    query('authorId').optional().isString(),
    query('category').optional().isString(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'publishedAt', 'publicationDate', 'title', 'viewCount', 'author']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('publicationDateStart').optional().isISO8601(),
    query('publicationDateEnd').optional().isISO8601(),
  ],
  asyncHandler(async (req, res) => {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const skip = (page - 1) * limit;
    const { status, search, authorId, category, sortBy = 'createdAt', sortOrder = 'desc', publicationDateStart, publicationDateEnd } = req.query;

      const where = {};
    
    // Search filter
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
        { author: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }
    
    // Status filter
      if (status) {
        // Convert lowercase status to uppercase enum value
        const statusMap = {
          'draft': 'DRAFT',
          'in_review': 'IN_REVIEW',
          'needs_revision': 'NEEDS_REVISION',
          'approved': 'APPROVED',
          'scheduled': 'SCHEDULED',
          'published': 'PUBLISHED',
          'archived': 'ARCHIVED'
        };
        where.status = statusMap[status.toLowerCase()] || status.toUpperCase();
      }
    
    // Author filter
      if (authorId) where.authorId = authorId;
    
    // Category filter
    if (category && category !== 'all') {
      where.categories = {
        some: {
          OR: [
            { name: { contains: category, mode: 'insensitive' } },
            { slug: { contains: category, mode: 'insensitive' } }
          ]
        }
      };
    }
    
    // Publication date range filter
    if (publicationDateStart || publicationDateEnd) {
      where.publicationDate = {};
      if (publicationDateStart) {
        where.publicationDate.gte = new Date(publicationDateStart);
      }
      if (publicationDateEnd) {
        where.publicationDate.lte = new Date(publicationDateEnd);
      }
    }
    
    // Public users can only see published articles
      if (!req.user) where.status = 'PUBLISHED';

    // Build orderBy clause
    let orderBy = {};
    switch (sortBy) {
      case 'title':
        orderBy = { title: sortOrder };
        break;
      case 'viewCount':
        orderBy = { viewCount: sortOrder };
        break;
      case 'publishedAt':
        orderBy = { publishedAt: sortOrder };
        break;
      case 'publicationDate':
        orderBy = { publicationDate: sortOrder };
        break;
      case 'updatedAt':
        orderBy = { updatedAt: sortOrder };
        break;
      case 'author':
        orderBy = { author: { firstName: sortOrder } };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

      const [items, total] = await Promise.all([
        prisma.article.findMany({
          where,
          select: { 
            id: true, 
            title: true, 
            slug: true, 
            content: true,
            featuredImage: true,
            status: true, 
            publishedAt: true, 
            publicationDate: true,
            viewCount: true,
            likeCount: true,
            dislikeCount: true,
            commentCount: true,
            socialShares: true,
            readingTime: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true
              }
            },
            articleAuthors: {
              select: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    role: true
                  }
                },
                role: true,
                order: true
              },
              orderBy: {
                order: 'asc'
              }
            },
            categories: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            tags: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          },
          skip,
          take: limit,
        orderBy,
        }),
        prisma.article.count({ where }),
      ]);

      sendSuccessResponse(res, { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 'Articles retrieved');
  })
);

/**
 * @swagger
 * /articles/stats:
 *   get:
 *     summary: Get article statistics
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: authorId
 *         schema: { type: string }
 *         description: Filter stats by author ID
 *       - in: query
 *         name: queueType
 *         schema: { type: string, enum: [section-head, eic] }
 *         description: Queue type for review queue stats
 *       - in: query
 *         name: publicationDateStart
 *         schema: { type: string, format: date-time }
 *         description: Filter stats for articles published after this date
 *       - in: query
 *         name: publicationDateEnd
 *         schema: { type: string, format: date-time }
 *         description: Filter stats for articles published before this date
 *     responses:
 *       200:
 *         description: Article statistics retrieved
 *       401:
 *         description: Unauthorized
 */
// Get article statistics
router.get(
  '/stats',
  [
    authenticateToken,
    query('authorId').optional().isString(),
    query('queueType').optional().isIn(['section-head', 'eic']),
    query('publicationDateStart').optional().isISO8601(),
    query('publicationDateEnd').optional().isISO8601(),
  ],
  asyncHandler(async (req, res) => {
    const { authorId, queueType, publicationDateStart, publicationDateEnd } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    // Build base where clause
    let baseWhere = {};
    if (authorId) {
      baseWhere.authorId = authorId;
    }
    
    // Add publication date range filter
    if (publicationDateStart || publicationDateEnd) {
      baseWhere.publicationDate = {};
      if (publicationDateStart) {
        baseWhere.publicationDate.gte = new Date(publicationDateStart);
      }
      if (publicationDateEnd) {
        baseWhere.publicationDate.lte = new Date(publicationDateEnd);
      }
    }

    // Role-based stats
    if (userRole === 'STAFF') {
      // Staff: Focus on their own content
      const staffWhere = { ...baseWhere, authorId: userId };
      
      stats = {
        totalContent: await prisma.article.count({ where: staffWhere }),
        drafts: await prisma.article.count({ where: { ...staffWhere, status: 'DRAFT' } }),
        inReview: await prisma.article.count({ where: { ...staffWhere, status: 'IN_REVIEW' } }),
        needsRevision: await prisma.article.count({ where: { ...staffWhere, status: 'NEEDS_REVISION' } }),
        published: await prisma.article.count({ where: { ...staffWhere, status: 'PUBLISHED' } }),
        archived: await prisma.article.count({ where: { ...staffWhere, status: 'ARCHIVED' } }),
        totalViews: await prisma.article.aggregate({
          where: staffWhere,
          _sum: { viewCount: true }
        }).then(result => result._sum.viewCount || 0)
      };
    } else if (['EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'].includes(userRole)) {
      // EIC and higher: All content stats
      stats = {
        totalContent: await prisma.article.count({ where: baseWhere }),
        published: await prisma.article.count({ where: { ...baseWhere, status: 'PUBLISHED' } }),
        approved: await prisma.article.count({ where: { ...baseWhere, status: 'APPROVED' } }),
        archived: await prisma.article.count({ where: { ...baseWhere, status: 'ARCHIVED' } }),
        totalViews: await prisma.article.aggregate({
          where: baseWhere,
          _sum: { viewCount: true }
        }).then(result => result._sum.viewCount || 0),
        avgViews: await prisma.article.aggregate({
          where: baseWhere,
          _avg: { viewCount: true }
        }).then(result => Math.round(result._avg.viewCount || 0))
      };
    } else if (['SECTION_HEAD'].includes(userRole)) {
      // Section Head: Review queue stats
      if (queueType === 'section-head') {
        stats = {
          totalArticles: await prisma.article.count({ 
            where: { ...baseWhere, status: { in: ['IN_REVIEW', 'NEEDS_REVISION'] } }
          }),
          inReview: await prisma.article.count({ 
            where: { ...baseWhere, status: 'IN_REVIEW' }
          }),
          needsRevision: await prisma.article.count({ 
            where: { ...baseWhere, status: 'NEEDS_REVISION' }
          })
        };
      } else if (queueType === 'eic') {
        stats = {
          totalArticles: await prisma.article.count({ 
            where: { ...baseWhere, status: 'APPROVED' }
          }),
          readyForPublication: await prisma.article.count({ 
            where: { ...baseWhere, status: 'APPROVED' }
          }),
          needsRevision: await prisma.article.count({ 
            where: { ...baseWhere, status: 'NEEDS_REVISION' }
          })
        };
      } else {
        // Default section head stats
        stats = {
          totalArticles: await prisma.article.count({ 
            where: { ...baseWhere, status: { in: ['IN_REVIEW', 'NEEDS_REVISION'] } }
          }),
          inReview: await prisma.article.count({ 
            where: { ...baseWhere, status: 'IN_REVIEW' }
          }),
          needsRevision: await prisma.article.count({ 
            where: { ...baseWhere, status: 'NEEDS_REVISION' }
          })
        };
      }
    } else {
      // Default fallback
      stats = {
        totalContent: await prisma.article.count({ where: baseWhere }),
        published: await prisma.article.count({ where: { ...baseWhere, status: 'PUBLISHED' } }),
        inReview: await prisma.article.count({ where: { ...baseWhere, status: 'IN_REVIEW' } }),
        needsRevision: await prisma.article.count({ where: { ...baseWhere, status: 'NEEDS_REVISION' } })
      };
    }

    sendSuccessResponse(res, stats, 'Statistics retrieved');
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
  [authenticateToken, requireRole('STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN')],
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
 * /articles/review-queue:
 *   get:
 *     summary: Get articles for review queue based on user role
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: queueType
 *         schema: { type: string, enum: [section-head, eic] }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by category name or slug
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, updatedAt, submittedAt, title, author], default: submittedAt }
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Review queue articles retrieved
 *       401:
 *         description: Unauthorized
 */
// Get review queue articles
router.get(
  '/review-queue',
  [
    authenticateToken,
    requireRole('SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'),
    query('queueType').optional().isIn(['section-head', 'eic']),
    query('status').optional().isString(),
    query('search').optional().isString(),
    query('category').optional().isString(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'submittedAt', 'title', 'author']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const { queueType, status, search, category, sortBy = 'submittedAt', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Determine queue type based on user role if not specified
    let effectiveQueueType = queueType;
    if (!effectiveQueueType) {
      if (req.user.role === 'EDITOR_IN_CHIEF' || req.user.role === 'ADVISER') {
        effectiveQueueType = 'eic';
      } else {
        effectiveQueueType = 'section-head';
      }
    }

    // Build where clause based on queue type
    let where = {};
    
    if (effectiveQueueType === 'section-head') {
      // Section Head Queue: Show articles submitted by publication staff for review
      where.status = { in: ['IN_REVIEW', 'NEEDS_REVISION'] };
    } else if (effectiveQueueType === 'eic') {
      // EIC Queue: Show articles approved by section heads
      where.status = 'APPROVED';
    }

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    // Add status filter if specified
    if (status && status !== 'all') {
      where.status = status;
    }

    // Add category filter if specified
    if (category && category !== 'all') {
      where.categories = {
        some: {
          OR: [
            { name: { contains: category, mode: 'insensitive' } },
            { slug: { contains: category, mode: 'insensitive' } }
          ]
        }
      };
    }

    // Build orderBy clause
    let orderBy = {};
    switch (sortBy) {
      case 'title':
        orderBy = { title: sortOrder };
        break;
      case 'author':
        orderBy = { author: { firstName: sortOrder } };
        break;
      case 'submittedAt':
        orderBy = { createdAt: sortOrder };
        break;
      case 'updatedAt':
        orderBy = { updatedAt: sortOrder };
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          featuredImage: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          readingTime: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          },
          categories: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.article.count({ where }),
    ]);

    // Transform data to match frontend expectations
    const transformedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      author: `${article.author.firstName} ${article.author.lastName}`,
      category: article.categories[0]?.name || 'Uncategorized',
      submittedAt: article.createdAt,
      status: article.status.toLowerCase().replace('_', '-'),
      wordCount: Math.ceil((article.content?.length || 0) / 5), // Rough word count
      estimatedReadTime: article.readingTime ? `${article.readingTime} min` : '5 min',
      tags: article.tags.map(tag => tag.slug),
      excerpt: article.content ? article.content.substring(0, 150) + '...' : '',
      featuredImage: article.featuredImage,
      reviewer: article.reviewer ? `${article.reviewer.firstName} ${article.reviewer.lastName}` : null
    }));

    sendSuccessResponse(res, {
      articles: transformedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Review queue articles retrieved');
  })
);

/**
 * @swagger
 * /articles/{id}/review-action:
 *   patch:
 *     summary: Update article status for review workflow
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
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve-to-eic, request-revision, publish, return-to-section]
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Article status updated
 *       400:
 *         description: Invalid action
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Article not found
 */
// Update article status for review workflow
router.patch(
  '/:id/review-action',
  [
    authenticateToken,
    requireRole('SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'),
    param('id').isString(),
    body('action').isIn(['approve-to-eic', 'request-revision', 'publish', 'return-to-section']),
    body('feedback').optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const { action, feedback } = req.body;

    const article = await prisma.article.findUnique({ 
      where: { id }, 
      select: { 
        id: true, 
        status: true, 
        title: true,
        authorId: true 
      } 
    });
    
    if (!article) {
      throw createNotFoundError('Article', id);
    }

    let newStatus;
    let updateData = { reviewerId: req.user.id };

    switch (action) {
      case 'approve-to-eic':
        // Only allow approval if article is IN_REVIEW
        if (article.status !== 'IN_REVIEW') {
          console.error(`Article ${id} status is ${article.status}, expected IN_REVIEW for approval`);
          throw createValidationError('action', `Can only approve articles that are in review. Current status: ${article.status}`);
        }
        newStatus = 'APPROVED';
        break;
      
      case 'request-revision':
        if (article.status !== 'IN_REVIEW') {
          throw createValidationError('action', 'Can only request revision for articles that are in review');
        }
        newStatus = 'NEEDS_REVISION';
        break;
      
      case 'publish':
        if (article.status !== 'APPROVED') {
          throw createValidationError('action', 'Can only publish approved articles');
        }
        newStatus = 'PUBLISHED';
        updateData.publishedAt = new Date();
        break;
      
      case 'return-to-section':
        if (article.status !== 'APPROVED') {
          throw createValidationError('action', 'Can only return approved articles to section head');
        }
        newStatus = 'IN_REVIEW';
        break;
      
      default:
        throw createValidationError('action', 'Invalid action');
    }

    updateData.status = newStatus;

    const updated = await prisma.article.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        reviewerId: true,
        publishedAt: true
      }
    });

    // Create review feedback if provided
    if (feedback) {
      await prisma.reviewFeedback.create({
        data: {
          articleId: id,
          reviewerId: req.user.id,
          feedback,
          feedbackType: action === 'request-revision' ? 'REVISION_REQUEST' : 
                       action === 'approve-to-eic' ? 'APPROVAL' : 'COMMENT'
        }
      });
    }

    // Send notifications based on review action using comprehensive role-based notifications
    try {
      await notificationService.notifyRoleBasedStatusChange(
        id, 
        article.status, 
        newStatus, 
        feedback, 
        req.user.role
      );
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification error:', notificationError);
    }

    sendSuccessResponse(res, updated, 'Article status updated');
  })
);

/**
 * @swagger
 * /articles/featured:
 *   get:
 *     summary: Get featured articles
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: Featured articles retrieved
 */
// Get featured articles
router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const featuredArticles = await prisma.article.findMany({
      where: {
        featured: true,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        publicationDate: true,
        publishedAt: true,
        viewCount: true,
        createdAt: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true
          }
        },
        articleAuthors: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                role: true
              }
            },
            role: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        publicationDate: 'desc'
      },
      take: 5 // Limit to 5 featured articles
    });

    sendSuccessResponse(res, featuredArticles, 'Featured articles retrieved');
  })
);

/**
 * @swagger
 * /articles/featured:
 *   put:
 *     summary: Update featured articles
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [articleIds]
 *             properties:
 *               articleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 5
 *                 description: Array of article IDs to feature (max 5)
 *     responses:
 *       200:
 *         description: Featured articles updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
// Update featured articles
router.put(
  '/featured',
  [
    authenticateToken,
    requireRole('EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'),
    body('articleIds').isArray({ max: 5 }).withMessage('Maximum 5 articles can be featured'),
    body('articleIds.*').isString().withMessage('Article ID must be a string')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { articleIds } = req.body;

    // Validate that all articles exist and are published
    const articles = await prisma.article.findMany({
      where: {
        id: { in: articleIds },
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true
      }
    });

    if (articles.length !== articleIds.length) {
      return sendErrorResponse(res, 400, 'One or more articles not found or not published');
    }

    // First, unfeature all articles
    await prisma.article.updateMany({
      where: {
        featured: true
      },
      data: {
        featured: false
      }
    });

    // Then feature the selected articles
    if (articleIds.length > 0) {
      await prisma.article.updateMany({
        where: {
          id: { in: articleIds }
        },
        data: {
          featured: true
        }
      });
    }

    // Return the updated featured articles
    const updatedFeaturedArticles = await prisma.article.findMany({
      where: {
        featured: true,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        publicationDate: true,
        publishedAt: true,
        viewCount: true,
        createdAt: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      },
      orderBy: {
        publicationDate: 'desc'
      }
    });

    sendSuccessResponse(res, updatedFeaturedArticles, 'Featured articles updated');
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
        content: true,
        featuredImage: true,
        mediaCaption: true,
        publicationDate: true,
        status: true,
        publishedAt: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        articleAuthors: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true
              }
            }
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        additionalMedia: {
          select: {
            id: true,
            order: true,
            caption: true,
            createdAt: true,
            media: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                mimeType: true,
                size: true,
                url: true,
                altText: true,
                caption: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
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
    body('featuredImage').optional().isString(),
    body('mediaCaption').optional().isLength({ max: 500 }),
    body('publicationDate').optional().isISO8601(),
    body('tags').optional().isArray(),
    body('categories').optional().isArray(),
    body('authors').optional().isArray(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const existing = await prisma.article.findUnique({ where: { id }, select: { id: true, title: true, status: true } });
    if (!existing) throw createNotFoundError('Article', id);

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

    const updateData = { 
      title, 
      content, 
      featuredImage, 
      mediaCaption,
      publicationDate: publicationDate ? new Date(publicationDate) : undefined,
      readingTime: content ? calculateReadTime(content) : undefined, // Calculate read time if content is updated
    };

    // Handle slug update if title changed
    if (title) {
      const baseSlug = generateSlug(title);
      let slug = baseSlug;
      let i = 1;
      while (await prisma.article.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`;
      }
      updateData.slug = slug;
    }

    // Handle tags and categories connections
    if (tags.length > 0) {
      updateData.tags = { 
        set: [], // Clear existing tags
        connectOrCreate: tags.map((slug) => ({
          where: { slug },
          create: { 
            name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            slug 
          }
        }))
      };
    }

    if (categories.length > 0) {
      updateData.categories = { 
        set: [], // Clear existing categories
        connect: categories.map((s) => ({ slug: s }))
      };
    }

    const updated = await prisma.article.update({
      where: { id },
      data: updateData,
      select: { id: true, title: true, slug: true, updatedAt: true },
    });

    // Send notifications if article is updated during review
    try {
      if (existing.status === 'IN_REVIEW' && content) {
        // Notify reviewers when article content is updated during review
        await notificationService.notifyReviewersArticleUpdated(id, req.user);
      }
      
      // Check if this is an update to a published article by a Section Head
      if (existing.status === 'PUBLISHED' && req.user.role === 'SECTION_HEAD' && (title || content || featuredImage)) {
        // Notify EIC when Section Head updates and republishes an article
        await notificationService.notifyEICArticleUpdatedAndPublished(id, req.user.id);
      }
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification error during article update:', notificationError);
    }

    // Handle additional authors if provided
    if (authors.length > 0) {
      // Validate additional authors exist
      const authorUsers = await prisma.user.findMany({
        where: { id: { in: authors } },
        select: { id: true }
      });
      if (authorUsers.length !== authors.length) {
        return sendErrorResponse(res, 400, 'One or more authors not found');
      }

      // Clear existing additional authors and add new ones
      await prisma.articleAuthor.deleteMany({ where: { articleId: id } });
      await prisma.articleAuthor.createMany({
        data: authors.map(authorId => ({ articleId: id, userId: authorId }))
      });
    }

    sendSuccessResponse(res, updated, 'Article updated');
  })
);

/**
 * @swagger
 * /articles/{id}/status:
 *   patch:
 *     summary: Change article status (author ownership or editor-in-chief+)
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
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only change status of your own articles
 *       404:
 *         description: Article not found
 */
// Change status (workflow transitions)
router.patch(
  '/:id/status',
  [
    authenticateToken,
    requireOwnership('article', 'id'),
    body('status').isIn(allowedStatuses),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { id } = req.params;
    const { status } = req.body;
    const article = await prisma.article.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!article) throw createNotFoundError('Article', id);

    // Define transitions based on user role
    let transitions = {
      DRAFT: ['IN_REVIEW', 'PUBLISHED'],
      IN_REVIEW: ['NEEDS_REVISION', 'APPROVED'],
      NEEDS_REVISION: ['IN_REVIEW'],
      APPROVED: ['SCHEDULED', 'PUBLISHED'],
      SCHEDULED: ['PUBLISHED'],
      PUBLISHED: ['ARCHIVED'],
      ARCHIVED: ['DRAFT', 'IN_REVIEW'],
    };

    // Section Heads can submit their own articles for review or directly to EIC
    if (req.user.role === 'SECTION_HEAD') {
      transitions.DRAFT = ['IN_REVIEW', 'APPROVED', 'PUBLISHED'];
      transitions.IN_REVIEW = ['NEEDS_REVISION', 'APPROVED']; // Allow Section Heads to approve their own articles
    }

    if (!transitions[article.status].includes(status)) {
      throw createValidationError('status', `Cannot transition from ${article.status} to ${status}`);
    }

    const data = { status };
    if (status === 'PUBLISHED') {
      data.publishedAt = new Date();
      // Ensure publication date is set when publishing
      const existingArticle = await prisma.article.findUnique({
        where: { id },
        select: { publicationDate: true, publishedAt: true }
      });
      if (!existingArticle?.publicationDate) {
        data.publicationDate = new Date();
      }
    }
    if (status === 'ARCHIVED') {
      // Only set archivedAt if the article was previously published
      const existingArticle = await prisma.article.findUnique({
        where: { id },
        select: { publishedAt: true }
      });
      if (existingArticle?.publishedAt) {
        data.archivedAt = new Date();
      }
    }

    const updated = await prisma.article.update({ where: { id }, data, select: { id: true, status: true, publishedAt: true, archivedAt: true } });

    // Send notifications based on status change using comprehensive role-based notifications
    try {
      await notificationService.notifyRoleBasedStatusChange(
        id, 
        article.status, 
        status, 
        null, 
        req.user.role
      );

      // Additional specific notifications for Published Content actions
      if (status === 'ARCHIVED' && req.user.role === 'SECTION_HEAD') {
        // Notify EIC when Section Head archives an article
        await notificationService.notifyEICArticleArchived(id, req.user.id);
      } else if (status === 'IN_REVIEW' && req.user.role === 'EDITOR_IN_CHIEF') {
        // Notify Section Heads when EIC restores an article
        await notificationService.notifySectionHeadsArticleRestored(id, req.user.id);
      }
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification error:', notificationError);
    }

    sendSuccessResponse(res, updated, 'Status updated');
  })
);


/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: Delete article (author ownership or editor-in-chief+)
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
 *       403:
 *         description: Can only delete your own articles
 *       404:
 *         description: Not found
 */
// Delete article (author ownership or editor-in-chief+)
router.delete(
  '/:id',
  [authenticateToken, requireOwnership('article', 'id'), param('id').isString()],
  auditLog('delete', 'article'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const exists = await prisma.article.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw createNotFoundError('Article', id);
    
    // Delete related records first to avoid foreign key constraint violations
    // Delete comments first
    await prisma.comment.deleteMany({ where: { articleId: id } });
    
    // Delete article authors
    await prisma.articleAuthor.deleteMany({ where: { articleId: id } });
    
    // Delete article likes
    await prisma.articleLikeHistory.deleteMany({ where: { articleId: id } });
    
    // Delete article views
    await prisma.articleViewHistory.deleteMany({ where: { articleId: id } });
    
    // Delete editorial notes
    await prisma.editorialNote.deleteMany({ where: { articleId: id } });
    
    // Delete review feedback
    await prisma.reviewFeedback.deleteMany({ where: { articleId: id } });
    
    // Delete flipbook articles
    await prisma.flipbookArticle.deleteMany({ where: { articleId: id } });
    
    // Finally delete the article
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
    requireRole('STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'),
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
    requireRole('STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'),
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
