require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5175'],

  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    testUrl: process.env.TEST_DATABASE_URL,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    argon2: {
      memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 65536,
      timeCost: parseInt(process.env.ARGON2_TIME_COST) || 3,
      parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 1,
    },
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100), // More lenient in development
  },

  // File upload configuration
  upload: {
    maxFileSize: 104857600, // Force 100MB regardless of environment
    path: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/webm',
      'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  // Email configuration (for future use)
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.EMAIL_FROM || 'noreply@theaxis.local',
  },

  // Google Analytics (for future use)
  analytics: {
    ga4MeasurementId: process.env.GA4_MEASUREMENT_ID,
    ga4PrivateKey: process.env.GA4_PRIVATE_KEY,
  },

  // Redis configuration (for future use)
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },

  // API documentation
  apiDocs: {
    enabled: process.env.API_DOCS_ENABLED === 'true',
    path: process.env.API_DOCS_PATH || '/api/docs',
  },

  // Validation
  validate() {
    const required = ['DATABASE_URL'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (!this.jwt.secret || this.jwt.secret === 'fallback-secret-key') {
      console.warn('Warning: Using fallback JWT secret. Set JWT_SECRET in production.');
    }

    return true;
  },

  // Check if running in production
  isProduction() {
    return this.nodeEnv === 'production';
  },

  // Check if running in test environment
  isTest() {
    return this.nodeEnv === 'test';
  },

  // Check if running in development
  isDevelopment() {
    return this.nodeEnv === 'development';
  },
};

// Validate configuration on load
if (!config.isTest()) {
  config.validate();
}

module.exports = config;
