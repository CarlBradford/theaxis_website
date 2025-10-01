const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const {
  authenticateToken,
  requireEditorInChief,
} = require('../middleware/auth');
const {
  asyncHandler,
  sendSuccessResponse,
  sendErrorResponse,
} = require('../middleware/errorHandler');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ArticleStats:
 *       type: object
 *       properties:
 *         totalArticles: { type: integer }
 *         publishedArticles: { type: integer }
 *         draftArticles: { type: integer }
 *         inReviewArticles: { type: integer }
 *         mostViewedArticles: { type: array, items: { type: object } }
 *         recentArticles: { type: array, items: { type: object } }
 *     UserStats:
 *       type: object
 *       properties:
 *         totalUsers: { type: integer }
 *         activeUsers: { type: integer }
 *         usersByRole: { type: object }
 *         recentRegistrations: { type: array, items: { type: object } }
 *     CommentStats:
 *       type: object
 *       properties:
 *         totalComments: { type: integer }
 *         approvedComments: { type: integer }
 *         pendingComments: { type: integer }
 *         recentComments: { type: array, items: { type: object } }
 */

/**
 * @swagger
 * /analytics/articles:
 *   get:
 *     summary: Get article analytics (Admin Assistant+)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [7d, 30d, 90d, 1y], default: 30d }
 *     responses:
 *       200:
 *         description: Article analytics retrieved
 */
router.get(
  '/articles',
  [
    authenticateToken,
    requireEditorInChief,
    query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const period = req.query.period || '30d';
    const days = parseInt(period.replace('d', '').replace('y', '365'));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get article counts by status
    const [totalArticles, publishedArticles, draftArticles, inReviewArticles] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
      prisma.article.count({ where: { status: 'DRAFT' } }),
      prisma.article.count({ where: { status: 'IN_REVIEW' } }),
    ]);

    // Get most viewed articles
    const mostViewedArticles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true, slug: true, viewCount: true, publishedAt: true },
      orderBy: { viewCount: 'desc' },
      take: 10,
    });

    // Get recent articles
    const recentArticles = await prisma.article.findMany({
      where: { createdAt: { gte: startDate } },
      select: { id: true, title: true, slug: true, status: true, createdAt: true, author: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const stats = {
      totalArticles,
      publishedArticles,
      draftArticles,
      inReviewArticles,
      mostViewedArticles,
      recentArticles,
    };

    sendSuccessResponse(res, stats, 'Article analytics retrieved');
  })
);

/**
 * @swagger
 * /analytics/users:
 *   get:
 *     summary: Get user analytics (Admin Assistant+)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [7d, 30d, 90d, 1y], default: 30d }
 *     responses:
 *       200:
 *         description: User analytics retrieved
 */
router.get(
  '/users',
  [
    authenticateToken,
    requireEditorInChief,
    query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const period = req.query.period || '30d';
    const days = parseInt(period.replace('d', '').replace('y', '365'));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user counts
    const [totalUsers, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    // Get users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    // Get recent registrations
    const recentRegistrations = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { id: true, firstName: true, lastName: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const stats = {
      totalUsers,
      activeUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {}),
      recentRegistrations,
    };

    sendSuccessResponse(res, stats, 'User analytics retrieved');
  })
);

/**
 * @swagger
 * /analytics/comments:
 *   get:
 *     summary: Get comment analytics (Admin Assistant+)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [7d, 30d, 90d, 1y], default: 30d }
 *     responses:
 *       200:
 *         description: Comment analytics retrieved
 */
router.get(
  '/comments',
  [
    authenticateToken,
    requireEditorInChief,
    query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendErrorResponse(res, 400, 'Validation failed', errors.array());

    const period = req.query.period || '30d';
    const days = parseInt(period.replace('d', '').replace('y', '365'));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get comment counts
    const [totalComments, approvedComments, pendingComments] = await Promise.all([
      prisma.comment.count(),
      prisma.comment.count({ where: { isApproved: true } }),
      prisma.comment.count({ where: { isApproved: false } }),
    ]);

    // Get recent comments
    const recentComments = await prisma.comment.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        id: true,
        content: true,
        isApproved: true,
        createdAt: true,
        author: { select: { firstName: true, lastName: true, username: true } },
        article: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const stats = {
      totalComments,
      approvedComments,
      pendingComments,
      recentComments,
    };

    sendSuccessResponse(res, stats, 'Comment analytics retrieved');
  })
);

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard overview (Admin Assistant+)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved
 */
router.get(
  '/dashboard',
  [authenticateToken, requireEditorInChief],
  asyncHandler(async (req, res) => {
    // Get overview stats
    const [totalArticles, totalUsers, totalComments, pendingComments] = await Promise.all([
      prisma.article.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.comment.count({ where: { isApproved: true } }),
      prisma.comment.count({ where: { isApproved: false } }),
    ]);

    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      select: {
        id: true,
        action: true,
        resourceType: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const dashboard = {
      overview: {
        totalArticles,
        totalUsers,
        totalComments,
        pendingComments,
      },
      recentActivity,
    };

    sendSuccessResponse(res, dashboard, 'Dashboard analytics retrieved');
  })
);

module.exports = router;
