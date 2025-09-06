const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdviser, requireEditorInChief } = require('../middleware/auth');
const { asyncHandler, sendSuccessResponse, sendErrorResponse, createNotFoundError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin/Editor only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [READER, STAFF, SECTION_HEAD, EDITOR_IN_CHIEF, ADVISER]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, username, or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/', [
  authenticateToken,
  requireEditorInChief,
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build where clause
  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get users with pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  sendSuccessResponse(res, {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
    },
  }, 'Users retrieved successfully');
}));

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
// Get current user's profile
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      emailVerified: true,
      bio: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw createNotFoundError('User', 'profile');
  }

  sendSuccessResponse(res, user, 'Profile retrieved successfully');
}));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID (Admin/Editor only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */
router.get('/:id', [
  authenticateToken,
  requireEditorInChief,
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      emailVerified: true,
      profileImage: true,
      bio: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw createNotFoundError('User', id);
  }

  sendSuccessResponse(res, user, 'User retrieved successfully');
}));

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user by ID (Admin/Editor only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [READER, STAFF, SECTION_HEAD, EDITOR_IN_CHIEF, ADVISER]
 *               isActive:
 *                 type: boolean
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */
router.put('/:id', [
  authenticateToken,
  requireAdviser,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('role')
    .optional()
    .isIn(['READER', 'STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER'])
    .withMessage('Invalid role specified'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { id } = req.params;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingUser) {
    throw createNotFoundError('User', id);
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: req.body,
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      emailVerified: true,
      profileImage: true,
      bio: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info('User updated by admin', {
    adminId: req.user.id,
    adminRole: req.user.role,
    userId: id,
    updatedFields: Object.keys(req.body),
  });

  sendSuccessResponse(res, updatedUser, 'User updated successfully');
}));

/**
 * @swagger
 * /users/{id}/deactivate:
 *   post:
 *     summary: Deactivate user account (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */
router.post('/:id/deactivate', [
  authenticateToken,
  requireAdviser,
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });

  if (!existingUser) {
    throw createNotFoundError('User', id);
  }

  if (!existingUser.isActive) {
    return sendErrorResponse(res, 400, 'User is already deactivated');
  }

  // Deactivate user
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  logger.info('User deactivated by admin', {
    adminId: req.user.id,
    adminRole: req.user.role,
    userId: id,
  });

  sendSuccessResponse(res, null, 'User deactivated successfully');
}));

/**
 * @swagger
 * /users/{id}/activate:
 *   post:
 *     summary: Activate user account (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User activated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */
router.post('/:id/activate', [
  authenticateToken,
  requireAdviser,
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });

  if (!existingUser) {
    throw createNotFoundError('User', id);
  }

  if (existingUser.isActive) {
    return sendErrorResponse(res, 400, 'User is already active');
  }

  // Activate user
  await prisma.user.update({
    where: { id },
    data: { isActive: true },
  });

  logger.info('User activated by admin', {
    adminId: req.user.id,
    adminRole: req.user.role,
    userId: id,
  });

  sendSuccessResponse(res, null, 'User activated successfully');
}));

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [READER, STAFF, SECTION_HEAD, EDITOR_IN_CHIEF, ADVISER]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */
router.put('/:id/role', [
  authenticateToken,
  requireAdviser,
  body('role')
    .isIn(['READER', 'STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER'])
    .withMessage('Invalid role specified'),
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const { role } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!existingUser) {
    throw createNotFoundError('User', id);
  }

  if (existingUser.role === role) {
    return sendErrorResponse(res, 400, 'User already has this role');
  }

  // Update user role
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info('User role updated by admin', {
    adminId: req.user.id,
    adminRole: req.user.role,
    userId: id,
    oldRole: existingUser.role,
    newRole: role,
  });

  sendSuccessResponse(res, updatedUser, 'User role updated successfully');
}));

module.exports = router;
