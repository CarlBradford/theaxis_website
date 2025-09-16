const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../src/middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all flipbooks (with optional filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, isActive, page = 1, limit = 10 } = req.query;
    
    const where = {};
    
    // Filter by type if provided
    if (type) {
      where.type = type.toUpperCase();
    }
    
    // Filter by active status if provided
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
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
        orderBy: {
          createdAt: 'desc'
        },
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
router.post('/', authenticateToken, requireRole(['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    console.log('🔍 Flipbook creation request received:');
    console.log('   User:', req.user.username, '(', req.user.email, ')');
    console.log('   Role:', req.user.role);
    console.log('   User ID:', req.user.id);
    console.log('   Request body:', req.body);
    
    const { name, embedUrl, type, releaseDate } = req.body;
    const description = req.body.description || null; // Make description optional
    const userId = req.user.id;
    
    // Validate required fields
    if (!name || !embedUrl || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name, embed URL, and type are required'
      });
    }
    
    // Validate publication type
    const validTypes = ['NEWSLETTER', 'TABLOID', 'MAGAZINE', 'LITERARY_FOLIO', 'ART_COMPILATION'];
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
        description: description?.trim() || null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
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
router.put('/:id', authenticateToken, requireRole(['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, embedUrl, type, releaseDate, isActive } = req.body;
    const description = req.body.description || null; // Make description optional
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
    if (existingFlipbook.userId !== userId && !['EDITOR_IN_CHIEF', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own flipbooks'
      });
    }
    
    // Validate publication type if provided
    if (type) {
      const validTypes = ['NEWSLETTER', 'TABLOID', 'MAGAZINE', 'LITERARY_FOLIO', 'ART_COMPILATION'];
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
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (embedUrl) updateData.embedUrl = embedUrl.trim();
    if (type) updateData.type = type.toUpperCase();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (releaseDate !== undefined) updateData.releaseDate = releaseDate ? new Date(releaseDate) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    
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
router.delete('/:id', authenticateToken, requireRole(['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
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
    if (existingFlipbook.userId !== userId && !['EDITOR_IN_CHIEF', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own flipbooks'
      });
    }
    
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
router.patch('/:id/toggle', authenticateToken, requireRole(['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
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
    if (existingFlipbook.userId !== userId && !['EDITOR_IN_CHIEF', 'SYSTEM_ADMIN'].includes(req.user.role)) {
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
