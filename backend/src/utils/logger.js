const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.filePath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'theaxis-backend' },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.filePath,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
    // File transport for error logs only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Add console transport for development
if (config.isDevelopment()) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Add console transport for test environment (errors only)
if (config.isTest()) {
  logger.add(
    new winston.transports.Console({
      level: 'error',
      format: consoleFormat,
    })
  );
}

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'exceptions.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'rejections.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Helper methods for common logging scenarios
logger.logRequest = (req, res, responseTime) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
  });
};

logger.logError = (error, req = null) => {
  const logData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };

  if (req) {
    logData.request = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
    };
  }

  logger.error('Application Error', logData);
};

logger.logSecurity = (event, details) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
  });
};

logger.logDatabase = (operation, table, duration) => {
  logger.debug('Database Operation', {
    operation,
    table,
    duration: `${duration}ms`,
  });
};

module.exports = { logger };
