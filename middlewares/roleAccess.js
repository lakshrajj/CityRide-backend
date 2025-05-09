const Booking = require('../models/booking');
const Ride = require('../models/ride');

/**
 * Middleware to check if user is the owner of a ride
 */
exports.isRideOwner = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }
    
    // Check if user is the ride owner
    if (ride.driver.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this ride'
      });
    }
    
    req.ride = ride;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * Middleware to check if user is associated with a booking
 * (either as driver or passenger)
 */
exports.isBookingParticipant = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user is the driver or passenger of the booking
    if (
      booking.passenger.toString() !== req.user.id &&
      booking.driver.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }
    
    req.booking = booking;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * Middleware to check if user is the passenger of a booking
 */
exports.isBookingPassenger = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user is the passenger of the booking
    if (booking.passenger.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized - only the passenger can perform this action'
      });
    }
    
    req.booking = booking;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * Middleware to check if user is the driver of a booking
 */
exports.isBookingDriver = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user is the driver of the booking
    if (booking.driver.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized - only the driver can perform this action'
      });
    }
    
    req.booking = booking;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

/**
 * Middleware to verify driver role and check if driver is verified
 */
exports.isVerifiedDriver = async (req, res, next) => {
  if (req.user.role !== 'driver' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only drivers can perform this action'
    });
  }
  
  if (req.user.role === 'driver' && !req.user.driverDetails.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Driver account is not verified yet'
    });
  }
  
  next();
};
