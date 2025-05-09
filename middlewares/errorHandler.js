const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    
    return res.status(400).json({
      success: false,
      message,
      error: 'DuplicateKeyError'
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    
    return res.status(400).json({
      success: false,
      message,
      error: 'ValidationError'
    });
  }

  // Mongoose cast error (invalid ObjectID)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    
    return res.status(400).json({
      success: false,
      message,
      error: 'CastError'
    });
  }

  // JSON Web Token error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'JsonWebTokenError'
    });
  }

  // Token expired error
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'TokenExpiredError'
    });
  }

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    error: err.name || 'ServerError',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

module.exports = errorHandler;
