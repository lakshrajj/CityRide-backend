const passport = require('passport');
const { validationResult } = require('express-validator');

/**
 * Middleware to protect routes - verifies JWT token
 */
exports.protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication',
        error: err.message
      });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info ? info.message : 'Authentication failed. Please log in.'
      });
    }
    
    // Add user to req object
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware to restrict access based on user role
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. User role ${req.user.role} is not authorized.`
      });
    }

    next();
  };
};

/**
 * Middleware to validate request data
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};
