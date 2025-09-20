const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { asyncHandler, createNotFoundError, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads/announcements');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'announcement-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *                 description: Announcement title
 *               description:
 *                 type: string
 *                 description: Announcement description
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Announcement image
 *               isActive:
 *                 type: boolean
 *                 description: Whether the announcement is active
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  [
    authenticateToken,
    requireRole('EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'),
    upload.single('image'),
    body('title').notEmpty().withMessage('Title is required'),
    body('isActive').optional().isBoolean()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { title, isActive = true } = req.body;
    const userId = req.user.id;

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/announcements/${req.file.filename}`;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        description: null,
        imageUrl,
        isActive: isActive === 'true' || isActive === true,
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

    sendSuccessResponse(res, announcement, 'Announcement created successfully', 201);
  })
);

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Announcements retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  [
    authenticateToken,
    requireRole('EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN')
  ],
  asyncHandler(async (req, res) => {
    const { isActive } = req.query;
    
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const announcements = await prisma.announcement.findMany({
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
      }
    });

    sendSuccessResponse(res, announcements, 'Announcements retrieved successfully');
  })
);

/**
 * @swagger
 * /announcements/active:
 *   get:
 *     summary: Get active announcements for public display
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: Active announcements retrieved successfully
 */
router.get(
  '/active',
  asyncHandler(async (req, res) => {
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    sendSuccessResponse(res, announcements, 'Active announcements retrieved successfully');
  })
);

/**
 * @swagger
 * /announcements/{id}:
 *   put:
 *     summary: Update an announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *       404:
 *         description: Announcement not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  '/:id',
  [
    authenticateToken,
    requireRole('EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'),
    upload.single('image')
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, isActive } = req.body;

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!existingAnnouncement) {
      throw createNotFoundError('Announcement', id);
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

    // Handle image upload
    if (req.file) {
      // Delete old image if it exists
      if (existingAnnouncement.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', existingAnnouncement.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.imageUrl = `/uploads/announcements/${req.file.filename}`;
    }

    const announcement = await prisma.announcement.update({
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

    sendSuccessResponse(res, announcement, 'Announcement updated successfully');
  })
);

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
 *       404:
 *         description: Announcement not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/:id',
  [
    authenticateToken,
    requireRole('EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN')
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if announcement exists
    const announcement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!announcement) {
      throw createNotFoundError('Announcement', id);
    }

    // Delete image file if it exists
    if (announcement.imageUrl) {
      const imagePath = path.join(__dirname, '..', announcement.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.announcement.delete({
      where: { id }
    });

    sendSuccessResponse(res, null, 'Announcement deleted successfully');
  })
);

module.exports = router;


