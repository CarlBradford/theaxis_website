const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const { authenticateToken, requirePermission, requireAnyPermission, canManageUserRole, canCreateUserWithRole } = require('../middleware/auth');
const { asyncHandler, sendSuccessResponse, sendErrorResponse, createNotFoundError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();
const prisma = new PrismaClient();

// Password generation utility
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by user status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [lastLoginAt, createdAt, firstName, lastName]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
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
  requirePermission(PERMISSIONS.USER_READ),
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build where clause
  const where = {};
  if (role) where.role = role;
  if (status) {
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
  }
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  // Hide SYSTEM_ADMIN users from EIC and ADVISER
  if (['EDITOR_IN_CHIEF', 'ADVISER'].includes(req.user.role)) {
    if (role) {
      // If role filter is set and it's not SYSTEM_ADMIN, keep the filter
      if (role !== 'SYSTEM_ADMIN') {
        where.role = role;
      } else {
        // If trying to filter by SYSTEM_ADMIN, return empty result
        where.role = 'NONEXISTENT_ROLE';
      }
    } else {
      // If no role filter, exclude SYSTEM_ADMIN
      where.role = { not: 'SYSTEM_ADMIN' };
    }
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
      orderBy: { [sortBy]: sortOrder },
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
 * /users:
 *   post:
 *     summary: Create a new user (Admin/Editor only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *                 description: Unique username
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: User's last name
 *               role:
 *                 type: string
 *                 enum: [READER, STAFF, SECTION_HEAD, EDITOR_IN_CHIEF, ADVISER, SYSTEM_ADMIN]
 *                 description: User's role in the system
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 description: User's biography
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the user account is active
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         username:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         role:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     temporaryPassword:
 *                       type: string
 *                       description: Auto-generated password for the user
 *       400:
 *         description: Validation error or user already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post('/', [
  authenticateToken,
  requirePermission(PERMISSIONS.USER_CREATE),
  canCreateUserWithRole,
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('role')
    .isIn(['STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'])
    .withMessage('Invalid role specified'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { email, username, firstName, lastName, role, bio, isActive = true } = req.body;

  // Check if user already exists
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  const existingUserByUsername = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (existingUserByEmail && existingUserByUsername) {
    return sendErrorResponse(res, 400, 'Both email and username already exist');
  } else if (existingUserByEmail) {
    return sendErrorResponse(res, 400, 'Email address already exists');
  } else if (existingUserByUsername) {
    return sendErrorResponse(res, 400, 'Username already exists');
  }

  // Generate temporary password
  const temporaryPassword = generatePassword();
  const passwordHash = await argon2.hash(temporaryPassword);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      firstName,
      lastName,
      passwordHash,
      role,
      bio,
      isActive,
      emailVerified: false,
    },
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
      createdAt: true,
    },
  });

  logger.info('User created by admin', {
    adminId: req.user.id,
    adminRole: req.user.role,
    userId: newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
  });

  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
    data: {
      user: newUser,
      temporaryPassword,
    },
  });
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
  requirePermission('USER_READ'),
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
  requirePermission('USER_UPDATE'),
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
  requirePermission(PERMISSIONS.USER_DEACTIVATE),
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('Deactivate user request:', { userId: id, requesterRole: req.user.role });

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
  requirePermission(PERMISSIONS.USER_ACTIVATE),
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('Activate user request:', { userId: id, requesterRole: req.user.role });

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
  requirePermission(PERMISSIONS.USER_ROLE_CHANGE),
  canManageUserRole,
  body('role')
    .isIn(['STAFF', 'SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'])
    .withMessage('Invalid role specified'),
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const { role } = req.body;

  console.log('Role update request:', { userId: id, newRole: role, requesterRole: req.user.role });

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

  // Prevent users from changing their own role to a lower privilege level
  if (existingUser.id === req.user.id) {
    const roleHierarchy = {
      'STAFF': 0,
      'SECTION_HEAD': 1,
      'EDITOR_IN_CHIEF': 2,
      'ADVISER': 3,
      'SYSTEM_ADMIN': 4,
    };
    
    const currentRoleLevel = roleHierarchy[req.user.role] || 0;
    const targetRoleLevel = roleHierarchy[role] || 0;
    
    // Only allow changing to same or higher privilege level
    if (targetRoleLevel < currentRoleLevel) {
      return sendErrorResponse(res, 403, 'Cannot change your own role to a lower privilege level');
    }
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

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user account (Editor-in-Chief and System Admin only)
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
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete own account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */
router.delete('/:id', [
  authenticateToken,
  requirePermission(PERMISSIONS.USER_DELETE),
], asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent users from deleting their own account
  if (req.user.id === id) {
    return sendErrorResponse(res, 400, 'You cannot delete your own account');
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { 
      id: true, 
      email: true, 
      username: true, 
      firstName: true, 
      lastName: true, 
      role: true 
    },
  });

  if (!existingUser) {
    throw createNotFoundError('User', id);
  }

  // Prevent deletion of SYSTEM_ADMIN accounts (only SYSTEM_ADMIN can delete other SYSTEM_ADMIN)
  if (existingUser.role === 'SYSTEM_ADMIN' && req.user.role !== 'SYSTEM_ADMIN') {
    return sendErrorResponse(res, 403, 'Only System Administrators can delete other System Administrator accounts');
  }

  // Delete user
  await prisma.user.delete({
    where: { id },
  });

  logger.warn('User account deleted by admin', {
    adminId: req.user.id,
    adminRole: req.user.role,
    deletedUserId: id,
    deletedUserEmail: existingUser.email,
    deletedUserRole: existingUser.role,
  });

  sendSuccessResponse(res, null, 'User account deleted successfully');
}));

module.exports = router;
