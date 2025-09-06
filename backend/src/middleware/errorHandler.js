const { logger } = require('../utils/logger');
const config = require('../config');

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 Not Found middleware
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  logger.logError(err, req);

  // Handle Prisma errors
  if (err.code === 'P2002') {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  if (err.code === 'P2014') {
    const message = 'Invalid ID value';
    error = new AppError(message, 400);
  }

  if (err.code === 'P2025') {
    const message = 'Record not found';
    error = new AppError(message, 404);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Handle Joi validation errors
  if (err.isJoi) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = new AppError(message, 400);
  }

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = `File too large. Maximum size is ${config.upload.maxFileSize / 1024 / 1024}MB`;
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new AppError(message, 400);
  }

  // Set default values if not set
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // Determine if we should send error details to client
  const isDevelopment = config.isDevelopment();
  const isTest = config.isTest();

  // Prepare error response
  const errorResponse = {
    status: error.status,
    message: error.message,
    ...(isDevelopment && { stack: error.stack }),
    ...(isDevelopment && { details: error }),
  };

  // Send error response
  res.status(error.statusCode).json(errorResponse);
};

// Async error wrapper for route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response helper
const sendErrorResponse = (res, statusCode, message, details = null) => {
  const response = {
    status: 'error',
    message,
  };

  if (details && config.isDevelopment()) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};

// Success response helper
const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

// Validation error helper
const createValidationError = (field, message) => {
  return new AppError(`${field}: ${message}`, 400);
};

// Permission error helper
const createPermissionError = (action, resource) => {
  return new AppError(`Insufficient permissions to ${action} ${resource}`, 403);
};

// Not found error helper
const createNotFoundError = (resource, identifier) => {
  return new AppError(`${resource} with ${identifier} not found`, 404);
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
  asyncHandler,
  sendErrorResponse,
  sendSuccessResponse,
  createValidationError,
  createPermissionError,
  createNotFoundError,
};
