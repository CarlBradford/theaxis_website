const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('express-async-errors');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const articleRoutes = require('./routes/articles');
const commentRoutes = require('./routes/comments');
const mediaRoutes = require('./routes/media');
const tagRoutes = require('./routes/tags');
const categoryRoutes = require('./routes/categories');
const editorialNoteRoutes = require('./routes/editorialNotes');
const analyticsRoutes = require('./routes/analytics');
const flipbookRoutes = require('../routes/flipbooks');
const notificationRoutes = require('./routes/notifications');
const realtimeNotificationRoutes = require('./routes/realtime-notifications');
const siteSettingsRoutes = require('../routes/siteSettings');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

// Import configuration
const config = require('./config');
const { connectWithRetry, checkDatabaseConnection } = require('./config/database');

const app = express();

// Ensure uploads directory exists and serve static files
const uploadsAbsolutePath = path.isAbsolute(config.upload.path)
  ? config.upload.path
  : path.join(process.cwd(), config.upload.path);

if (!fs.existsSync(uploadsAbsolutePath)) {
  fs.mkdirSync(uploadsAbsolutePath, { recursive: true });
}
// Serve static files with proper headers for videos
app.use('/uploads', (req, res, next) => {
  // Set proper headers for video files
  if (req.path.endsWith('.mp4') || req.path.endsWith('.webm') || req.path.endsWith('.ogg')) {
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Accept-Ranges', 'bytes');
  }
  next();
}, express.static(uploadsAbsolutePath));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = Array.isArray(config.corsOrigin) ? config.corsOrigin : [config.corsOrigin];
    
    // Debug logging
    console.log('CORS check - Origin:', origin);
    console.log('CORS check - Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS check - Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development if explicitly disabled
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true';
  },
  // Add debugging for development
  onLimitReached: (req, res, options) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Rate limit reached for IP: ${req.ip}, Path: ${req.path}, Method: ${req.method}`);
    }
  },
});

// Log rate limit settings in development
if (process.env.NODE_ENV === 'development') {
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    console.log('Rate limiting: DISABLED for development');
  } else {
    console.log(`Rate limiting: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000 / 60} minutes`);
  }
}
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/editorial-notes', editorialNoteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/flipbooks', flipbookRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/realtime', realtimeNotificationRoutes.router);
app.use('/api/admin', siteSettingsRoutes);

// Initialize real-time notifications
const { setRealtimeNotifications } = require('./services/notificationService');
setRealtimeNotifications(realtimeNotificationRoutes);

// API documentation
if (config.apiDocs.enabled) {
  const swaggerJsdoc = require('swagger-jsdoc');
  const swaggerUi = require('swagger-ui-express');

  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'The AXIS API',
        version: '1.0.0',
        description: 'API documentation for The AXIS student publication platform',
        contact: {
          name: 'The AXIS Development Team',
          email: 'dev@theaxis.local',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.port}/api`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: ['./src/routes/*.js'],
  };

  const specs = swaggerJsdoc(swaggerOptions);
  app.use(config.apiDocs.path, swaggerUi.serve, swaggerUi.setup(specs));
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Initialize database connection
const initializeDatabase = async () => {
  try {
    logger.info('Initializing database connection...');
    await connectWithRetry();
    logger.info('Database connection initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database connection:', error);
    process.exit(1);
  }
};

// Initialize database on startup
initializeDatabase();

module.exports = app;
