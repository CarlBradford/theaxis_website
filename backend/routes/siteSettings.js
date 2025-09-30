const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireRole } = require('../src/middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const ensureUploadsDir = async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all site settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: 'asc' }
    });
    
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });
    
    res.json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site settings'
    });
  }
});

// Get color settings (must be before /settings/:key to avoid route conflicts)
router.get('/settings/colors', async (req, res) => {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'color_palette' }
    });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Color settings not found'
      });
    }
    
    res.json({
      success: true,
      data: setting.value
    });
  } catch (error) {
    console.error('Error fetching color settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch color settings'
    });
  }
});

// Update site settings (colors)
router.put('/settings/colors', authenticateToken, requireRole(['ADVISER', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { colors } = req.body;
    const userId = req.user.id;
    
    // Validate colors object
    const requiredColors = ['primary', 'secondary', 'background', 'textPrimary', 'header', 'footer'];
    const missingColors = requiredColors.filter(color => !colors[color]);
    
    if (missingColors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required colors: ${missingColors.join(', ')}`
      });
    }
    
    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const invalidColors = Object.entries(colors).filter(([key, value]) => 
      !hexColorRegex.test(value)
    );
    
    if (invalidColors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid color format: ${invalidColors.map(([key]) => key).join(', ')}`
      });
    }
    
    // Update or create color settings
    const colorSettings = await prisma.siteSetting.upsert({
      where: { key: 'color_palette' },
      update: {
        value: colors,
        updatedBy: userId
      },
      create: {
        key: 'color_palette',
        value: colors,
        description: 'Website color palette settings',
        updatedBy: userId
      }
    });
    
    res.json({
      success: true,
      message: 'Color settings updated successfully',
      data: colorSettings.value
    });
  } catch (error) {
    console.error('Error updating color settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update color settings'
    });
  }
});

// Get specific setting (must be after specific routes to avoid conflicts)
router.get('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await prisma.siteSetting.findUnique({
      where: { key }
    });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    res.json({
      success: true,
      data: setting.value
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting'
    });
  }
});

// Get current site assets
router.get('/assets', async (req, res) => {
  try {
    const assets = await prisma.siteAsset.findMany({
      where: { isActive: true },
      orderBy: { assetType: 'asc' }
    });
    
    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Error fetching site assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site assets'
    });
  }
});

// Upload logo
router.post('/assets/logo', authenticateToken, requireRole(['ADVISER', 'SYSTEM_ADMIN']), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const userId = req.user.id;
    const { originalname, filename, path: filePath, size, mimetype } = req.file;
    
    // Deactivate existing logo
    await prisma.siteAsset.updateMany({
      where: { 
        assetType: 'logo',
        isActive: true
      },
      data: { isActive: false }
    });
    
    // Create new logo asset
    const logoAsset = await prisma.siteAsset.create({
      data: {
        assetType: 'logo',
        fileName: filename,
        originalName: originalname,
        filePath: filePath,
        fileSize: size,
        mimeType: mimetype,
        uploadedBy: userId
      }
    });
    
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        id: logoAsset.id,
        fileName: logoAsset.fileName,
        originalName: logoAsset.originalName,
        fileSize: logoAsset.fileSize,
        mimeType: logoAsset.mimeType,
        url: `/uploads/${filename}`
      }
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo'
    });
  }
});

// Upload wordmark
router.post('/assets/wordmark', authenticateToken, requireRole(['ADVISER', 'SYSTEM_ADMIN']), upload.single('wordmark'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const userId = req.user.id;
    const { originalname, filename, path: filePath, size, mimetype } = req.file;
    
    // Deactivate existing wordmark
    await prisma.siteAsset.updateMany({
      where: { 
        assetType: 'wordmark',
        isActive: true
      },
      data: { isActive: false }
    });
    
    // Create new wordmark asset
    const wordmarkAsset = await prisma.siteAsset.create({
      data: {
        assetType: 'wordmark',
        fileName: filename,
        originalName: originalname,
        filePath: filePath,
        fileSize: size,
        mimeType: mimetype,
        uploadedBy: userId
      }
    });
    
    res.json({
      success: true,
      message: 'Wordmark uploaded successfully',
      data: {
        id: wordmarkAsset.id,
        fileName: wordmarkAsset.fileName,
        originalName: wordmarkAsset.originalName,
        fileSize: wordmarkAsset.fileSize,
        mimeType: wordmarkAsset.mimeType,
        url: `/uploads/${filename}`
      }
    });
  } catch (error) {
    console.error('Error uploading wordmark:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload wordmark'
    });
  }
});

// Delete asset
router.delete('/assets/:id', authenticateToken, requireRole(['ADVISER', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const asset = await prisma.siteAsset.findUnique({
      where: { id }
    });
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }
    
    // Delete file from filesystem
    try {
      await fs.unlink(asset.filePath);
    } catch (unlinkError) {
      console.error('Error deleting file:', unlinkError);
    }
    
    // Delete from database
    await prisma.siteAsset.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset'
    });
  }
});

// Reset color settings to default
router.post('/settings/colors/reset', authenticateToken, requireRole(['ADVISER', 'SYSTEM_ADMIN']), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const defaultColors = {
      primary: '#215d55',
      secondary: '#656362',
      background: '#ffffff',
      textPrimary: '#1c4643',
      header: '#1c4643',
      footer: '#656362'
    };
    
    const colorSettings = await prisma.siteSetting.upsert({
      where: { key: 'color_palette' },
      update: {
        value: defaultColors,
        updatedBy: userId
      },
      create: {
        key: 'color_palette',
        value: defaultColors,
        description: 'Website color palette settings',
        updatedBy: userId
      }
    });
    
    res.json({
      success: true,
      message: 'Color settings reset to default',
      data: colorSettings.value
    });
  } catch (error) {
    console.error('Error resetting color settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset color settings'
    });
  }
});

module.exports = router;
