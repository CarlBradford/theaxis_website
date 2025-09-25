const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Store active connections
const activeConnections = new Map();

// SSE endpoint for real-time notifications
router.get('/stream', async (req, res, next) => {
  try {
    // Get token from query parameter (EventSource doesn't support custom headers)
    const token = req.query.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    const jwt = require('jsonwebtoken');
    const config = require('../config');
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
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Attach user to request object
    req.user = user;
    
    const userId = req.user.id;
    
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to notification stream' })}\n\n`);

    // Store the connection
    activeConnections.set(userId, res);

    // Handle client disconnect
    req.on('close', () => {
      console.log(`Client ${userId} disconnected from notification stream`);
      activeConnections.delete(userId);
    });

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      if (activeConnections.has(userId)) {
        res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);

    console.log(`Client ${userId} connected to notification stream`);
  } catch (error) {
    console.error('Error in realtime stream:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to send notification to specific user
const sendNotificationToUser = (userId, notification) => {
  const connection = activeConnections.get(userId);
  if (connection) {
    try {
      connection.write(`data: ${JSON.stringify({
        type: 'notification',
        notification: notification
      })}\n\n`);
      console.log(`Real-time notification sent to user ${userId}: ${notification.title}`);
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
      activeConnections.delete(userId);
    }
  }
};

// Function to broadcast notification to multiple users
const broadcastNotification = (userIds, notification) => {
  userIds.forEach(userId => {
    sendNotificationToUser(userId, notification);
  });
};

// Function to get active connection count
const getActiveConnectionCount = () => {
  return activeConnections.size;
};

// Function to get connected users
const getConnectedUsers = () => {
  return Array.from(activeConnections.keys());
};

module.exports = {
  router,
  sendNotificationToUser,
  broadcastNotification,
  getActiveConnectionCount,
  getConnectedUsers
};
