const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

// Database connection configuration
const databaseConfig = {
  // Connection pool settings
  connectionLimit: 20, // Maximum number of connections in the pool
  acquireTimeoutMillis: 60000, // 60 seconds
  timeout: 60000, // 60 seconds
  idleTimeoutMillis: 300000, // 5 minutes
  
  // Connection settings
  maxConnections: 20,
  minConnections: 2,
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  
  // Logging
  logLevel: 'info',
  logQueries: process.env.NODE_ENV === 'development',
};

// Create Prisma client with optimized configuration
const prisma = new PrismaClient({
  log: databaseConfig.logQueries ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration
  __internal: {
    engine: {
      connectTimeout: databaseConfig.acquireTimeoutMillis,
      queryTimeout: databaseConfig.timeout,
      poolTimeout: databaseConfig.idleTimeoutMillis,
    },
  },
});

// Connection health check
const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
};

// Connection retry logic
const connectWithRetry = async (maxRetries = databaseConfig.maxRetries) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const isConnected = await checkDatabaseConnection();
      if (isConnected) {
        logger.info(`Database connected successfully on attempt ${attempt}`);
        return true;
      }
    } catch (error) {
      logger.warn(`Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        logger.error('All database connection attempts failed');
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, databaseConfig.retryDelay * attempt));
    }
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  await disconnectDatabase();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await disconnectDatabase();
  process.exit(1);
});

module.exports = {
  prisma,
  checkDatabaseConnection,
  disconnectDatabase,
  connectWithRetry,
  databaseConfig,
};
