const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../src/middleware/auth');
const notificationService = require('../src/services/notificationService');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `flipbook_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 20MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed.'
    });
  }
  
  next(error);
};

// Get public flipbooks (no authentication required)
router.get('/public', async (req, res) => {
  try {
    const { type, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const where = {
      isActive: true // Only show active flipbooks
    };
    
    // Filter by type if provided
    if (type) {
      where.type = type.toUpperCase();
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build orderBy object
    let orderBy = {};
    if (sortBy === 'name' || sortBy === 'title') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'type') {
      orderBy.type = sortOrder;
    } else if (sortBy === 'releaseDate') {
      orderBy.releaseDate = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }
    
    const [flipbooks, total] = await Promise.all([
      prisma.flipbook.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.flipbook.count({ where })
    ]);
    
    res.json({
      success: true,
      data: {
        items: flipbooks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching public flipbooks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flipbooks',
      error: error.message
    });
  }
});

// Get all flipbooks (with optional filtering) - requires authentication
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, isActive, page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const where = {};
    
    // Filter by type if provided
    if (type) {
      where.type = type.toUpperCase();
    }
    
    // Filter by active status if provided
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    // Add search functionality
    if (search && search.trim()) {
      where.OR = [
        {
          name: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build orderBy object
    let orderBy = {};
    if (sortBy === 'name' || sortBy === 'title') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'type') {
      orderBy.type = sortOrder;
    } else if (sortBy === 'isActive') {
      orderBy.isActive = sortOrder;
    } else if (sortBy === 'releaseDate') {
      orderBy.releaseDate = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }
    
    const [flipbooks, total] = await Promise.all([
      prisma.flipbook.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.flipbook.count({ where })
    ]);
    
    res.json({
      success: true,
      data: {
        items: flipbooks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching flipbooks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flipbooks',
      error: error.message
    });
  }
});

// Get a specific flipbook by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const flipbook = await prisma.flipbook.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });
    
    if (!flipbook) {
      return res.status(404).json({
        success: false,
        message: 'Flipbook not found'
      });
    }
    
    res.json({
      success: true,
      data: flipbook
    });
  } catch (error) {
    console.error('Error fetching flipbook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flipbook',
      error: error.message
    });
  }
});

// Create a new flipbook
router.post('/', authenticateToken, upload.single('thumbnailImage'), handleMulterError, async (req, res) => {
  try {
    console.log('🔍 Flipbook creation request received:');
    console.log('   User:', req.user.username, '(', req.user.email, ')');
    console.log('   Role:', req.user.role);
    console.log('   User ID:', req.user.id);
    console.log('   User Active:', req.user.isActive);
    console.log('   Request body:', req.body);
    console.log('   Uploaded file:', req.file);
    
    // Manual role check for debugging
    const allowedRoles = ['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADMINISTRATOR', 'SYSTEM_ADMIN'];
    const hasRequiredRole = allowedRoles.includes(req.user.role);
    console.log('   Manual role check - Allowed roles:', allowedRoles);
    console.log('   Manual role check - User role:', req.user.role);
    console.log('   Manual role check - Has required role:', hasRequiredRole);
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource',
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          userId: req.user.id
        }
      });
    }
    
    const { name, embedUrl, type, releaseDate } = req.body;
    const userId = req.user.id;
    
    // Handle uploaded image
    let thumbnailUrl = null;
    if (req.file) {
      thumbnailUrl = `/uploads/${req.file.filename}`;
      console.log('   Thumbnail uploaded:', thumbnailUrl);
    }
    
    // Validate required fields
    if (!name || !embedUrl || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name, embed URL, and type are required'
      });
    }
    
    // Validate publication type
    const validTypes = ['NEWSLETTER', 'TABLOID', 'MAGAZINE', 'LITERARY_FOLIO', 'ART_COMPILATION', 'SPECIAL_EDITIONS'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid publication type'
      });
    }
    
    // Validate URL format
    try {
      new URL(embedUrl);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid embed URL format'
      });
    }
    
    const flipbook = await prisma.flipbook.create({
      data: {
        name: name.trim(),
        embedUrl: embedUrl.trim(),
        type: type.toUpperCase(),
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        thumbnailUrl: thumbnailUrl,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });
    
    // Send notification to EIC when Section Head creates a flipbook
    try {
      if (req.user.role === 'SECTION_HEAD') {
        await notificationService.notifyEICFlipbookCreated(flipbook.id, req.user.id);
      }
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification error during flipbook creation:', notificationError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Flipbook created successfully',
      data: flipbook
    });
  } catch (error) {
    console.error('Error creating flipbook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create flipbook',
      error: error.message
    });
  }
});

// Update a flipbook
router.put('/:id', authenticateToken, upload.single('thumbnailImage'), handleMulterError, async (req, res) => {
  try {
    console.log('🔍 Flipbook update request received:');
    console.log('   User:', req.user.username, '(', req.user.email, ')');
    console.log('   Role:', req.user.role);
    console.log('   User ID:', req.user.id);
    console.log('   User Active:', req.user.isActive);
    console.log('   Flipbook ID:', req.params.id);
    
    // Manual role check for debugging
    const allowedRoles = ['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADMINISTRATOR', 'SYSTEM_ADMIN'];
    const hasRequiredRole = allowedRoles.includes(req.user.role);
    console.log('   Manual role check - Allowed roles:', allowedRoles);
    console.log('   Manual role check - User role:', req.user.role);
    console.log('   Manual role check - Has required role:', hasRequiredRole);
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource',
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          userId: req.user.id
        }
      });
    }
    
    const { id } = req.params;
    const { name, embedUrl, type, releaseDate, isActive } = req.body;
    const userId = req.user.id;
    
    // Check if flipbook exists
    const existingFlipbook = await prisma.flipbook.findUnique({
      where: { id }
    });
    
    if (!existingFlipbook) {
      return res.status(404).json({
        success: false,
        message: 'Flipbook not found'
      });
    }
    
    // Check if user owns the flipbook or has admin privileges
    console.log('🔍 Ownership check:');
    console.log('   Flipbook owner ID:', existingFlipbook.userId);
    console.log('   Current user ID:', userId);
    console.log('   User role:', req.user.role);
    console.log('   Is owner:', existingFlipbook.userId === userId);
    console.log('   Is admin role:', ['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADMINISTRATOR', 'SYSTEM_ADMIN'].includes(req.user.role));
    
    if (existingFlipbook.userId !== userId && !['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADMINISTRATOR', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      console.log('   ❌ Ownership check failed');
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own flipbooks'
      });
    }
    
    console.log('   ✅ Ownership check passed');
    
    // Validate publication type if provided
    if (type) {
      const validTypes = ['NEWSLETTER', 'TABLOID', 'MAGAZINE', 'LITERARY_FOLIO', 'ART_COMPILATION', 'SPECIAL_EDITIONS'];
      if (!validTypes.includes(type.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid publication type'
        });
      }
    }
    
    // Validate URL format if provided
    if (embedUrl) {
      try {
        new URL(embedUrl);
      } catch (urlError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid embed URL format'
        });
      }
    }
    
    // Handle uploaded image
    let thumbnailUrl = existingFlipbook.thumbnailUrl; // Keep existing thumbnail by default
    if (req.file) {
      thumbnailUrl = `/uploads/${req.file.filename}`;
      console.log('   New thumbnail uploaded:', thumbnailUrl);
    }
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (embedUrl) updateData.embedUrl = embedUrl.trim();
    if (type) updateData.type = type.toUpperCase();
    if (releaseDate !== undefined) updateData.releaseDate = releaseDate ? new Date(releaseDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.thumbnailUrl = thumbnailUrl; // Always update thumbnailUrl
    
    const flipbook = await prisma.flipbook.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });
    
    // Send notification to EIC when Section Head updates a flipbook
    try {
      if (req.user.role === 'SECTION_HEAD') {
        await notificationService.notifyEICFlipbookUpdated(id, req.user.id);
      }
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification error during flipbook update:', notificationError);
    }
    
    res.json({
      success: true,
      message: 'Flipbook updated successfully',
      data: flipbook
    });
  } catch (error) {
    console.error('Error updating flipbook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update flipbook',
      error: error.message
    });
  }
});

// Delete a flipbook
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Flipbook delete request received:');
    console.log('   User:', req.user.username, '(', req.user.email, ')');
    console.log('   Role:', req.user.role);
    console.log('   User ID:', req.user.id);
    console.log('   User Active:', req.user.isActive);
    console.log('   Flipbook ID:', req.params.id);
    
    // Manual role check for debugging
    const allowedRoles = ['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADMINISTRATOR', 'SYSTEM_ADMIN'];
    const hasRequiredRole = allowedRoles.includes(req.user.role);
    console.log('   Manual role check - Allowed roles:', allowedRoles);
    console.log('   Manual role check - User role:', req.user.role);
    console.log('   Manual role check - Has required role:', hasRequiredRole);
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource',
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          userId: req.user.id
        }
      });
    }
    
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if flipbook exists
    const existingFlipbook = await prisma.flipbook.findUnique({
      where: { id }
    });
    
    if (!existingFlipbook) {
      return res.status(404).json({
        success: false,
        message: 'Flipbook not found'
      });
    }
    
    // Check if user owns the flipbook or has admin privileges
    console.log('🔍 Ownership check:');
    console.log('   Flipbook owner ID:', existingFlipbook.userId);
    console.log('   Current user ID:', userId);
    console.log('   User role:', req.user.role);
    console.log('   Is owner:', existingFlipbook.userId === userId);
    console.log('   Is admin role:', ['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADMINISTRATOR', 'SYSTEM_ADMIN'].includes(req.user.role));
    
    if (existingFlipbook.userId !== userId && !['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADMINISTRATOR', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      console.log('   ❌ Ownership check failed');
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own flipbooks'
      });
    }
    
    console.log('   ✅ Ownership check passed');
    
    await prisma.flipbook.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Flipbook deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting flipbook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete flipbook',
      error: error.message
    });
  }
});

// Toggle flipbook active status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Flipbook toggle request received:');
    console.log('   User:', req.user.username, '(', req.user.email, ')');
    console.log('   Role:', req.user.role);
    console.log('   User ID:', req.user.id);
    console.log('   User Active:', req.user.isActive);
    console.log('   Flipbook ID:', req.params.id);
    
    // Manual role check for debugging
    const allowedRoles = ['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADMINISTRATOR', 'SYSTEM_ADMIN'];
    const hasRequiredRole = allowedRoles.includes(req.user.role);
    console.log('   Manual role check - Allowed roles:', allowedRoles);
    console.log('   Manual role check - User role:', req.user.role);
    console.log('   Manual role check - Has required role:', hasRequiredRole);
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource',
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          userId: req.user.id
        }
      });
    }
    
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if flipbook exists
    const existingFlipbook = await prisma.flipbook.findUnique({
      where: { id }
    });
    
    if (!existingFlipbook) {
      return res.status(404).json({
        success: false,
        message: 'Flipbook not found'
      });
    }
    
    // Check if user owns the flipbook or has admin privileges
    if (existingFlipbook.userId !== userId && !['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADMINISTRATOR', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify your own flipbooks'
      });
    }
    
    const flipbook = await prisma.flipbook.update({
      where: { id },
      data: {
        isActive: !existingFlipbook.isActive
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      message: `Flipbook ${flipbook.isActive ? 'activated' : 'deactivated'} successfully`,
      data: flipbook
    });
  } catch (error) {
    console.error('Error toggling flipbook status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle flipbook status',
      error: error.message
    });
  }
});

module.exports = router;
