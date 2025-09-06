const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { AppError, createValidationError } = require('../middleware/errorHandler');
const config = require('../config');

const prisma = new PrismaClient();

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const { email, username, firstName, lastName, password, role = 'READER' } = userData;

      // Validate input data
      if (!email || !username || !firstName || !lastName || !password) {
        throw createValidationError('registration', 'All required fields must be provided');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw createValidationError('email', 'Invalid email format');
      }

      // Validate password strength
      if (password.length < 8) {
        throw createValidationError('password', 'Password must be at least 8 characters long');
      }

      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        throw createValidationError('username', 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          throw createValidationError('email', 'Email already registered');
        }
        if (existingUser.username === username.toLowerCase()) {
          throw createValidationError('username', 'Username already taken');
        }
      }

      // Hash password using Argon2
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: config.security.argon2.memoryCost,
        timeCost: config.security.argon2.timeCost,
        parallelism: config.security.argon2.parallelism,
      });

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          firstName,
          lastName,
          passwordHash,
          role,
          emailVerificationToken: uuidv4(),
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
          createdAt: true,
        },
      });

      // Generate JWT token
      const token = this.generateToken(user.id);

      logger.info('User registered successfully', {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      return {
        user,
        token,
        message: 'User registered successfully',
      };
    } catch (error) {
      logger.error('User registration failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async login(credentials) {
    try {
      const { email, password } = credentials;

      if (!email || !password) {
        throw createValidationError('login', 'Email and password are required');
      }

      // Find user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: email.toLowerCase() },
          ],
        },
      });

      if (!user) {
        logger.warn('Login attempt with non-existent credentials', { email });
        throw createValidationError('credentials', 'Invalid email or password');
      }

      if (!user.isActive) {
        logger.warn('Login attempt with deactivated account', { userId: user.id });
        throw createValidationError('account', 'Account is deactivated');
      }

      // Verify password
      const isValidPassword = await argon2.verify(user.passwordHash, password);
      if (!isValidPassword) {
        logger.warn('Login attempt with invalid password', { userId: user.id });
        throw createValidationError('credentials', 'Invalid email or password');
      }

      // Update last login time
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Prepare user data for response
      const userData = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
      };

      logger.info('User login successful', {
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      return {
        user: userData,
        token,
        message: 'Login successful',
      };
    } catch (error) {
      logger.error('User login failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        throw createValidationError('password', 'Current and new passwords are required');
      }

      if (newPassword.length < 8) {
        throw createValidationError('password', 'New password must be at least 8 characters long');
      }

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isValidPassword = await argon2.verify(user.passwordHash, currentPassword);
      if (!isValidPassword) {
        throw createValidationError('password', 'Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await argon2.hash(newPassword, {
        type: argon2.argon2id,
        memoryCost: config.security.argon2.memoryCost,
        timeCost: config.security.argon2.timeCost,
        parallelism: config.security.argon2.parallelism,
      });

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      logger.info('Password changed successfully', { userId });

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Password change failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      if (!email) {
        throw createValidationError('email', 'Email is required');
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, email: true, firstName: true },
      });

      if (!user) {
        // Don't reveal if user exists
        return { message: 'If the email exists, a password reset link has been sent' };
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      });

      // TODO: Send email with reset link
      logger.info('Password reset requested', { userId: user.id, email: user.email });

      return { message: 'If the email exists, a password reset link has been sent' };
    } catch (error) {
      logger.error('Password reset request failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      if (!token || !newPassword) {
        throw createValidationError('reset', 'Token and new password are required');
      }

      if (newPassword.length < 8) {
        throw createValidationError('password', 'New password must be at least 8 characters long');
      }

      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { gt: new Date() },
        },
      });

      if (!user) {
        throw createValidationError('token', 'Invalid or expired reset token');
      }

      // Hash new password
      const newPasswordHash = await argon2.hash(newPassword, {
        type: argon2.argon2id,
        memoryCost: config.security.argon2.memoryCost,
        timeCost: config.security.argon2.timeCost,
        parallelism: config.security.argon2.parallelism,
      });

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      logger.info('Password reset successful', { userId: user.id });

      return { message: 'Password reset successful' };
    } catch (error) {
      logger.error('Password reset failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    try {
      if (!token) {
        throw createValidationError('token', 'Verification token is required');
      }

      const user = await prisma.user.findFirst({
        where: { emailVerificationToken: token },
      });

      if (!user) {
        throw createValidationError('token', 'Invalid verification token');
      }

      // Mark email as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      });

      logger.info('Email verified successfully', { userId: user.id });

      return { message: 'Email verified successfully' };
    } catch (error) {
      logger.error('Email verification failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error) {
      logger.error('Get user profile failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updateData) {
    try {
      const allowedFields = ['firstName', 'lastName', 'bio', 'profileImage'];
      const filteredData = {};

      // Only allow specific fields to be updated
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          filteredData[key] = updateData[key];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        throw createValidationError('update', 'No valid fields to update');
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: filteredData,
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

      logger.info('User profile updated', { userId, updatedFields: Object.keys(filteredData) });

      return user;
    } catch (error) {
      logger.error('Update user profile failed', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = new AuthService();
