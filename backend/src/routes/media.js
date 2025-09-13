const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  // Sharp is optional; thumbnail generation will be skipped if unavailable
}
const { PrismaClient } = require('@prisma/client');
const {
  authenticateToken,
  requireStaff,
  requireSectionHead,
  requirePermission,
  auditLog, 
} = require('../middleware/auth');
const { asyncHandler, sendSuccessResponse, sendErrorResponse, createNotFoundError } = require('../middleware/errorHandler');
const config = require('../config');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Media:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         filename: { type: string }
 *         originalName: { type: string }
 *         mimeType: { type: string }
 *         size: { type: integer }
 *         path: { type: string }
 *         url: { type: string }
 *         altText: { type: string }
 *         caption: { type: string }
 *         uploadedBy: { type: string }
 *         createdAt: { type: string, format: date-time }
 */

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.path);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${base}_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowed = new Set(config.upload.allowedTypes);
    if (!allowed.has(file.mimetype)) return cb(new Error('Unsupported file type'));
    cb(null, true);
  },
});

/**
 * @swagger
 * /media:
 *   post:
 *     summary: Upload an image (Staff+)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               altText:
 *                 type: string
 *               caption:
 *                 type: string
 *     responses:
 *       201:
 *         description: Media uploaded
 */
router.post(
  '/',
  [authenticateToken, upload.single('file')],
  asyncHandler(async (req, res) => {
    if (!req.file) return sendErrorResponse(res, 400, 'No file uploaded');

    const { altText, caption } = req.body || {};
    const publicUrl = `/uploads/${req.file.filename}`;

    // Optional: create a webp thumbnail next to original (non-blocking)
    const filePath = path.join(config.upload.path, req.file.filename);
    const thumbPath = filePath.replace(path.extname(filePath), '.webp');
    if (sharp) {
      sharp(filePath)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(thumbPath)
        .catch(() => {});
    }

    const created = await prisma.media.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: filePath,
        url: publicUrl,
        altText: altText || null,
        caption: caption || null,
        uploadedBy: req.user.id,
      },
      select: { id: true, url: true, filename: true, mimeType: true, size: true, createdAt: true },
    });

    sendSuccessResponse(res, created, 'Media uploaded', 201);
  })
);

/**
 * @swagger
 * /media:
 *   get:
 *     summary: List media (Staff+)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Media list
 */
router.get(
  '/',
  [authenticateToken, requireStaff],
  asyncHandler(async (req, res) => {
    const items = await prisma.media.findMany({
      select: { id: true, url: true, filename: true, mimeType: true, size: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccessResponse(res, { items }, 'Media retrieved');
  })
);

/**
 * @swagger
 * /media/{id}:
 *   delete:
 *     summary: Delete media (own files or Section Head+)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Media deleted
 *       403:
 *         description: Can only delete your own files
 */
router.delete(
  '/:id',
  [authenticateToken],
  auditLog('delete', 'media'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const media = await prisma.media.findUnique({ 
      where: { id }, 
      select: { id: true, path: true, uploadedBy: true } 
    });
    if (!media) throw createNotFoundError('Media', id);

    // Allow users to delete their own files, or SECTION_HEAD+ to delete any file
    const canDelete = media.uploadedBy === req.user.id || 
                     ['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN'].includes(req.user.role);
    
    if (!canDelete) {
      return sendErrorResponse(res, 403, 'You can only delete your own uploaded files');
    }

    try {
      if (fs.existsSync(media.path)) fs.unlinkSync(media.path);
    } catch {}

    await prisma.media.delete({ where: { id } });
    sendSuccessResponse(res, null, 'Media deleted');
  })
);

module.exports = router;
