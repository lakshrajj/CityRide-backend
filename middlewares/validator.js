const { body, param, query } = require('express-validator');

// User validation rules
exports.registerValidator = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid phone number'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

exports.loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Ride validation rules
exports.createRideValidator = [
  body('source.address')
    .trim()
    .notEmpty().withMessage('Source address is required'),
  
  body('source.location.coordinates')
    .isArray().withMessage('Source coordinates should be an array')
    .custom(coords => {
      if (!coords || coords.length !== 2) {
        throw new Error('Source coordinates must contain longitude and latitude');
      }
      return true;
    }),
  
  body('destination.address')
    .trim()
    .notEmpty().withMessage('Destination address is required'),
  
  body('destination.location.coordinates')
    .isArray().withMessage('Destination coordinates should be an array')
    .custom(coords => {
      if (!coords || coords.length !== 2) {
        throw new Error('Destination coordinates must contain longitude and latitude');
      }
      return true;
    }),
  
  body('departureTime')
    .notEmpty().withMessage('Departure time is required')
    .isISO8601().withMessage('Departure time must be a valid date')
    .custom(time => {
      const departureTime = new Date(time);
      const now = new Date();
      if (departureTime <= now) {
        throw new Error('Departure time must be in the future');
      }
      return true;
    }),
  
  body('seatsAvailable')
    .notEmpty().withMessage('Number of available seats is required')
    .isInt({ min: 1 }).withMessage('At least one seat must be available'),
  
  body('seatsTotal')
    .notEmpty().withMessage('Total number of seats is required')
    .isInt({ min: 1 }).withMessage('Total seats must be at least 1'),
  
  body('pricePerSeat')
    .notEmpty().withMessage('Price per seat is required')
    .isFloat({ min: 0 }).withMessage('Price cannot be negative')
];

exports.updateRideValidator = [
  body('departureTime')
    .optional()
    .isISO8601().withMessage('Departure time must be a valid date')
    .custom(time => {
      const departureTime = new Date(time);
      const now = new Date();
      if (departureTime <= now) {
        throw new Error('Departure time must be in the future');
      }
      return true;
    }),
  
  body('seatsAvailable')
    .optional()
    .isInt({ min: 0 }).withMessage('Seats available must be a non-negative integer'),
  
  body('pricePerSeat')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price cannot be negative')
];

// Booking validation rules
exports.createBookingValidator = [
  body('ride')
    .notEmpty().withMessage('Ride ID is required')
    .isMongoId().withMessage('Valid ride ID is required'),
  
  body('seatsBooked')
    .notEmpty().withMessage('Number of seats to book is required')
    .isInt({ min: 1 }).withMessage('At least one seat must be booked'),
  
  body('pickupPoint.address')
    .optional()
    .trim()
    .notEmpty().withMessage('Pickup address cannot be empty if provided'),
  
  body('dropoffPoint.address')
    .optional()
    .trim()
    .notEmpty().withMessage('Dropoff address cannot be empty if provided')
];

// Rating validation rules
exports.createRatingValidator = [
  body('booking')
    .notEmpty().withMessage('Booking ID is required')
    .isMongoId().withMessage('Valid booking ID is required'),
  
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('review')
    .optional()
    .isLength({ max: 500 }).withMessage('Review cannot exceed 500 characters')
];

// Search ride validation rules
exports.searchRideValidator = [
  query('sourceAddress')
    .optional()
    .trim()
    .notEmpty().withMessage('Source address cannot be empty if provided'),
  
  query('destinationAddress')
    .optional()
    .trim()
    .notEmpty().withMessage('Destination address cannot be empty if provided'),
  
  query('departureDate')
    .optional()
    .isISO8601().withMessage('Departure date must be a valid date'),
  
  query('seats')
    .optional()
    .isInt({ min: 1 }).withMessage('Seats must be at least 1'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Max price cannot be negative')
];

// Id parameter validation
exports.idParamValidator = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];
