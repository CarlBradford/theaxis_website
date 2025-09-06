const authService = require('../../../src/services/authService');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../../src/middleware/errorHandler');

// Mock Prisma
jest.mock('@prisma/client');

describe('AuthService', () => {
  let mockPrisma;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create fresh mock Prisma instance
    mockPrisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    
    PrismaClient.mockImplementation(() => mockPrisma);
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'password123',
      role: 'READER',
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'READER',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await authService.register(validUserData);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
      expect(result.message).toBe('User registered successfully');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          role: 'READER',
          emailVerificationToken: 'mock-uuid',
        }),
        select: expect.any(Object),
      });
    });

    it('should throw error if email already exists', async () => {
      const existingUser = { email: 'test@example.com' };
      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(authService.register(validUserData)).rejects.toThrow(
        'email: Email already registered'
      );
    });

    it('should throw error if username already exists', async () => {
      const existingUser = { username: 'testuser' };
      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      await expect(authService.register(validUserData)).rejects.toThrow(
        'username: Username already taken'
      );
    });

    it('should throw error if email format is invalid', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      await expect(authService.register(invalidData)).rejects.toThrow(
        'email: Invalid email format'
      );
    });

    it('should throw error if password is too short', async () => {
      const invalidData = { ...validUserData, password: '123' };

      await expect(authService.register(invalidData)).rejects.toThrow(
        'password: Password must be at least 8 characters long'
      );
    });

    it('should throw error if username format is invalid', async () => {
      const invalidData = { ...validUserData, username: 'test@user' };

      await expect(authService.register(invalidData)).rejects.toThrow(
        'username: Username must be 3-20 characters and contain only letters, numbers, and underscores'
      );
    });

    it('should throw error if required fields are missing', async () => {
      const invalidData = { email: 'test@example.com' };

      await expect(authService.register(invalidData)).rejects.toThrow(
        'registration: All required fields must be provided'
      );
    });
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'READER',
      isActive: true,
      emailVerified: true,
      lastLoginAt: null,
      passwordHash: 'hashed-password',
    };

    it('should login user successfully with email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await authService.login(validCredentials);

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.message).toBe('Login successful');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should login user successfully with username', async () => {
      const credentialsWithUsername = { email: 'testuser', password: 'password123' };
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await authService.login(credentialsWithUsername);

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.login(validCredentials)).rejects.toThrow(
        'credentials: Invalid email or password'
      );
    });

    it('should throw error if account is deactivated', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      mockPrisma.user.findFirst.mockResolvedValue(deactivatedUser);

      await expect(authService.login(validCredentials)).rejects.toThrow(
        'account: Account is deactivated'
      );
    });

    it('should throw error if password is incorrect', async () => {
      // Mock argon2.verify to return false
      const argon2 = require('argon2');
      argon2.verify.mockResolvedValue(false);

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(authService.login(validCredentials)).rejects.toThrow(
        'credentials: Invalid email or password'
      );
    });

    it('should throw error if credentials are missing', async () => {
      const invalidCredentials = { email: 'test@example.com' };

      await expect(authService.login(invalidCredentials)).rejects.toThrow(
        'login: Email and password are required'
      );
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      const userId = 'user-123';
      const token = authService.generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid JWT token', () => {
      const userId = 'user-123';
      const token = authService.generateToken(userId);
      const decoded = authService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      // Mock JWT verify to throw error
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.verifyToken('invalid-token')).toThrow(
        'Invalid or expired token'
      );
    });
  });

  describe('changePassword', () => {
    const userId = 'user-123';
    const currentPassword = 'current123';
    const newPassword = 'newpassword123';

    it('should change password successfully', async () => {
      const mockUser = { passwordHash: 'hashed-current-password' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      expect(result.message).toBe('Password changed successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'mock-hashed-password' },
      });
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow('User not found');
    });

    it('should throw error if current password is incorrect', async () => {
      const mockUser = { passwordHash: 'hashed-current-password' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Mock argon2.verify to return false for current password
      const argon2 = require('argon2');
      argon2.verify.mockResolvedValue(false);

      await expect(
        authService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow('password: Current password is incorrect');
    });

    it('should throw error if new password is too short', async () => {
      const shortPassword = '123';

      await expect(
        authService.changePassword(userId, currentPassword, shortPassword)
      ).rejects.toThrow('password: New password must be at least 8 characters long');
    });

    it('should throw error if passwords are missing', async () => {
      await expect(
        authService.changePassword(userId, '', newPassword)
      ).rejects.toThrow('password: Current and new passwords are required');
    });
  });

  describe('getUserProfile', () => {
    const userId = 'user-123';

    it('should return user profile successfully', async () => {
      const mockProfile = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'READER',
        isActive: true,
        emailVerified: true,
        profileImage: null,
        bio: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockProfile);

      const result = await authService.getUserProfile(userId);

      expect(result).toEqual(mockProfile);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getUserProfile(userId)).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    const userId = 'user-123';
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      bio: 'Updated bio',
    };

    it('should update user profile successfully', async () => {
      const updatedProfile = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Updated',
        lastName: 'Name',
        role: 'READER',
        isActive: true,
        emailVerified: true,
        profileImage: null,
        bio: 'Updated bio',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(updatedProfile);

      const result = await authService.updateUserProfile(userId, updateData);

      expect(result).toEqual(updatedProfile);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: expect.any(Object),
      });
    });

    it('should throw error if no valid fields to update', async () => {
      const invalidUpdateData = { invalidField: 'value' };

      await expect(
        authService.updateUserProfile(userId, invalidUpdateData)
      ).rejects.toThrow('update: No valid fields to update');
    });

    it('should filter out invalid fields', async () => {
      const mixedData = {
        firstName: 'Updated',
        invalidField: 'value',
        role: 'STAFF', // This should be filtered out
      };

      const expectedData = { firstName: 'Updated' };

      mockPrisma.user.update.mockResolvedValue({});

      await authService.updateUserProfile(userId, mixedData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expectedData,
        select: expect.any(Object),
      });
    });
  });

  describe('requestPasswordReset', () => {
    const email = 'test@example.com';

    it('should request password reset successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await authService.requestPasswordReset(email);

      expect(result.message).toBe('If the email exists, a password reset link has been sent');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          passwordResetToken: 'mock-uuid',
          passwordResetExpires: expect.any(Date),
        },
      });
    });

    it('should return success message even if user not found (security)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.requestPasswordReset(email);

      expect(result.message).toBe('If the email exists, a password reset link has been sent');
    });

    it('should throw error if email is missing', async () => {
      await expect(authService.requestPasswordReset('')).rejects.toThrow(
        'email: Email is required'
      );
    });
  });

  describe('resetPassword', () => {
    const token = 'reset-token-123';
    const newPassword = 'newpassword123';

    it('should reset password successfully', async () => {
      const mockUser = {
        id: 'user-123',
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour from now
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await authService.resetPassword(token, newPassword);

      expect(result.message).toBe('Password reset successful');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          passwordHash: 'mock-hashed-password',
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
    });

    it('should throw error if token is invalid', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.resetPassword(token, newPassword)
      ).rejects.toThrow('token: Invalid or expired reset token');
    });

    it('should throw error if token is expired', async () => {
      const mockUser = {
        id: 'user-123',
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() - 3600000), // 1 hour ago
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        authService.resetPassword(token, newPassword)
      ).rejects.toThrow('token: Invalid or expired reset token');
    });

    it('should throw error if new password is too short', async () => {
      const shortPassword = '123';

      await expect(
        authService.resetPassword(token, shortPassword)
      ).rejects.toThrow('password: New password must be at least 8 characters long');
    });

    it('should throw error if token or password is missing', async () => {
      await expect(
        authService.resetPassword('', newPassword)
      ).rejects.toThrow('reset: Token and new password are required');
    });
  });

  describe('verifyEmail', () => {
    const token = 'verification-token-123';

    it('should verify email successfully', async () => {
      const mockUser = {
        id: 'user-123',
        emailVerificationToken: token,
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await authService.verifyEmail(token);

      expect(result.message).toBe('Email verified successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      });
    });

    it('should throw error if token is invalid', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.verifyEmail(token)).rejects.toThrow(
        'token: Invalid verification token'
      );
    });

    it('should throw error if token is missing', async () => {
      await expect(authService.verifyEmail('')).rejects.toThrow(
        'token: Verification token is required'
      );
    });
  });
});
