const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { logger } = require('../utils/logger');
const { AppError, createPermissionError } = require('./errorHandler');
const { hasPermission, hasAnyPermission, hasAllPermissions, canManageRole, canCreateUserRole } = require('../config/permissions');
const config = require('../config');

// JWT token verification middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next(new AppError('Access token required', 401));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      },
    });

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    if (!user.isActive) {
      return next(new AppError('User account is deactivated', 401));
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Attach user to request object
    req.user = user;

    // Log authentication success
    console.log('🔑 User authenticated successfully:');
    console.log('   User ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);
    
    logger.info('User authenticated', {
      userId: user.id,
      username: user.username,
      role: user.role,
      ip: req.ip,
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    
    logger.error('Authentication error', { error: error.message, ip: req.ip });
    next(new AppError('Authentication failed', 401));
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication on token errors
    next();
  }
};

// Role-based access control middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Role check middleware:');
    console.log('   User:', req.user?.username, '(', req.user?.email, ')');
    console.log('   User role:', req.user?.role);
    console.log('   Required roles:', roles);
    console.log('   User has required role:', roles.includes(req.user?.role));
    console.log('   Request URL:', req.originalUrl);
    console.log('   Request method:', req.method);
    
    if (!req.user) {
      console.log('   ❌ No user found');
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      console.log('   ❌ User role not in required roles');
      logger.warn('Insufficient role access', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        action: req.method,
        resource: req.originalUrl,
      });

      return next(createPermissionError('access', 'this resource'));
    }

    console.log('   ✅ Role check passed');
    next();
  };
};

// Permission-based access control middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!hasPermission(req.user.role, permission)) {
      logger.warn('Insufficient permission access', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredPermission: permission,
        action: req.method,
        resource: req.originalUrl,
      });

      return next(createPermissionError('access', 'this resource'));
    }

    next();
  };
};

const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      logger.warn('Insufficient permission access', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredPermissions: permissions,
        action: req.method,
        resource: req.originalUrl,
      });

      return next(createPermissionError('access', 'this resource'));
    }

    next();
  };
};

const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      logger.warn('Insufficient permission access', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredPermissions: permissions,
        action: req.method,
        resource: req.originalUrl,
      });

      return next(createPermissionError('access', 'this resource'));
    }

    next();
  };
};

// Role management middleware
const canManageUserRole = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const targetRole = req.body.role || req.params.role;
  
  console.log('canManageUserRole check:', { 
    userRole: req.user.role, 
    targetRole, 
    canManage: canManageRole(req.user.role, targetRole) 
  });
  
  if (!canManageRole(req.user.role, targetRole)) {
    logger.warn('Insufficient role management access', {
      userId: req.user.id,
      userRole: req.user.role,
      targetRole: targetRole,
      action: req.method,
      resource: req.originalUrl,
    });

    return next(createPermissionError('manage', 'this user role'));
  }

  next();
};

// User creation role validation middleware
const canCreateUserWithRole = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const targetRole = req.body.role;
  
  if (!canCreateUserRole(req.user.role, targetRole)) {
    logger.warn('Insufficient user creation access', {
      userId: req.user.id,
      userRole: req.user.role,
      targetRole: targetRole,
      action: req.method,
      resource: req.originalUrl,
    });

    return next(createPermissionError('create', `users with ${targetRole} role`));
  }

  next();
};

// Specific role middleware functions
const requireAdviser = requireRole('ADVISER');
const requireSystemAdmin = requireRole('SYSTEM_ADMIN');
const requireEditorInChief = requireRole('EDITOR_IN_CHIEF');
const requireSectionHead = requireRole('SECTION_HEAD');
const requireStaff = requireRole('STAFF');

// Resource ownership middleware
const requireOwnership = (resourceType, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      // Advisers, EICs, and System Admins can access all resources
      if (['ADVISER', 'EDITOR_IN_CHIEF', 'SYSTEM_ADMIN'].includes(req.user.role)) {
        return next();
      }

      const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
      
      if (!resourceId) {
        return next(new AppError('Resource ID required', 400));
      }

      // Check resource ownership based on type
      let resource;
      switch (resourceType) {
        case 'article':
          resource = await prisma.article.findUnique({
            where: { id: resourceId },
            select: { authorId: true, reviewerId: true },
          });
          break;
        case 'comment':
          resource = await prisma.comment.findUnique({
            where: { id: resourceId },
            select: { authorId: true },
          });
          break;
        case 'user':
          resource = await prisma.user.findUnique({
            where: { id: resourceId },
            select: { id: true },
          });
          break;
        default:
          return next(new AppError('Invalid resource type', 400));
      }

      if (!resource) {
        return next(new AppError('Resource not found', 404));
      }

      // Check if user owns the resource or is a section head
      const isOwner = resource.authorId === req.user.id || resource.id === req.user.id;
      const isSectionHead = req.user.role === 'SECTION_HEAD';

      // For articles, check status-based restrictions for editing and deleting
      if (resourceType === 'article' && isOwner) {
        const article = await prisma.article.findUnique({
          where: { id: resourceId },
          select: { status: true }
        });
        
        if (article) {
          // Staff can only edit/delete articles in DRAFT or NEEDS_REVISION status
          if (req.user.role === 'STAFF' && !['DRAFT', 'NEEDS_REVISION'].includes(article.status)) {
            const action = req.method === 'DELETE' ? 'delete' : 'edit';
            logger.warn(`Staff cannot ${action} article in current status`, {
              userId: req.user.id,
              userRole: req.user.role,
              resourceType,
              resourceId,
              articleStatus: article.status,
              action: req.method,
            });

            return next(createPermissionError(action, `articles in ${article.status} status`));
          }
          
          // Section Head can edit articles in all statuses including ARCHIVED
          // This allows them to both archive and restore articles
        }
      }

      if (!isOwner && !isSectionHead) {
        logger.warn('Resource access denied', {
          userId: req.user.id,
          userRole: req.user.role,
          resourceType,
          resourceId,
          action: req.method,
        });

        return next(createPermissionError('access', 'this resource'));
      }

      next();
    } catch (error) {
      logger.error('Ownership check error', { error: error.message });
      next(new AppError('Authorization check failed', 500));
    }
  };
};

// Rate limiting for authentication endpoints
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 200 : 50, // Increased limits
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900, // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Audit logging middleware
const auditLog = (action, resourceType) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Restore original send method
      res.send = originalSend;
      
      // Log the action
      if (req.user && res.statusCode < 400) {
        prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            resourceType,
            resourceId: req.params.id || req.body.id,
            details: {
              method: req.method,
              url: req.originalUrl,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              requestBody: req.body,
              responseStatus: res.statusCode,
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          },
        }).catch(error => {
          logger.error('Audit log creation failed', { error: error.message });
        });
      }
      
      // Call original send method
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  canManageUserRole,
  canCreateUserWithRole,
  requireAdviser,
  requireSystemAdmin,
  requireEditorInChief,
  requireSectionHead,
  requireStaff,
  requireOwnership,
  authRateLimit,
  auditLog,
};
