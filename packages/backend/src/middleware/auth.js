const logger = require('../utils/logger');

// Simple auth middleware for development
const auth = (req, res, next) => {
  try {
    // For development, just log the request and continue
    logger.info('Auth middleware - request authenticated (development mode)');
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = auth;
