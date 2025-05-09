const Booking = require('../models/booking');
const Ride = require('../models/ride');
const User = require('../models/user');
const { BOOKING_STATUS, NOTIFICATION_TYPES } = require('../utils/constants');
const { generateConfirmationCode, getPaginationOptions, createPaginationResult } = require('../utils/helpers');
const notificationController = require('./notificationController');

/**
 * @desc    Create a new booking
 * @route   POST /api/v1/bookings
 * @access  Private
 */
exports.createBooking = async (req, res, next) => {
  try {
    const { ride: rideId, seatsBooked, pickupPoint, dropoffPoint, passengerNotes } = req.body;

    // Find the ride
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is trying to book their own ride
    if (ride.driver.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own ride'
      });
    }

    // Check if ride is still scheduled
    if (ride.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot book a ride that is ${ride.status}`
      });
    }

    // Check if there are enough seats available
    if (ride.seatsAvailable < seatsBooked) {
      return res.status(400).json({
        success: false,
        message: `Only ${ride.seatsAvailable} seats available`
      });
    }

    // Check if user already has a booking for this ride
    const existingBooking = await Booking.findOne({
      ride: rideId,
      passenger: req.user.id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking for this ride'
      });
    }

    // Calculate total price
    const totalPrice = ride.pricePerSeat * seatsBooked;

    // Create booking
    const booking = await Booking.create({
      ride: rideId,
      passenger: req.user.id,
      driver: ride.driver,
      seatsBooked,
      totalPrice,
      pickupPoint: pickupPoint || ride.source,
      dropoffPoint: dropoffPoint || ride.destination,
      passengerNotes
    });

    // Notify driver of new booking request
    await notificationController.createNotification({
      recipient: ride.driver,
      sender: req.user.id,
      type: NOTIFICATION_TYPES.BOOKING_REQUEST,
      title: 'New Booking Request',
      message: `You have a new booking request for your ride from ${ride.source.address} to ${ride.destination.address}`,
      relatedResource: {
        resourceType: 'booking',
        resourceId: booking._id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully, awaiting driver approval',
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all bookings (with filters for user's role)
 * @route   GET /api/v1/bookings
 * @access  Private
 */
exports.getBookings = async (req, res, next) => {
  try {
    const { status, fromDate, toDate } = req.query;
    
    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'driver') {
      query.driver = req.user.id;
    } else {
      query.passenger = req.user.id;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by date range
    if (fromDate || toDate) {
      query.createdAt = {};
      
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }
    
    // Get pagination options
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;
    
    // Execute query with pagination
    const bookings = await Booking.find(query)
      .populate({
        path: 'ride',
        select: 'source destination departureTime status pricePerSeat'
      })
      .populate({
        path: 'passenger',
        select: 'firstName lastName profileImage'
      })
      .populate({
        path: 'driver',
        select: 'firstName lastName profileImage'
      })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await Booking.countDocuments(query);
    const pagination = createPaginationResult(paginationOptions, total);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single booking
 * @route   GET /api/v1/bookings/:id
 * @access  Private
 */
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'ride',
        select: 'source destination departureTime status pricePerSeat vehicleDetails additionalNotes',
        populate: {
          path: 'driver',
          select: 'firstName lastName profileImage phone avgRating'
        }
      })
      .populate({
        path: 'passenger',
        select: 'firstName lastName profileImage phone'
      });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user is associated with the booking
    if (
      booking.passenger._id.toString() !== req.user.id &&
      booking.driver.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Approve a booking
 * @route   PUT /api/v1/bookings/:id/approve
 * @access  Private (Driver only)
 */
exports.approveBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user is the driver of the booking
    if (booking.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this booking'
      });
    }
    
    // Check if booking is in pending status
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a booking with status: ${booking.status}`
      });
    }
    
    // Get the ride
    const ride = await Ride.findById(booking.ride);
    
    // Check if there are enough seats available
    if (ride.seatsAvailable < booking.seatsBooked) {
      return res.status(400).json({
        success: false,
        message: `Not enough seats available. Only ${ride.seatsAvailable} seats left`
      });
    }
    
    // Update booking status
    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status: BOOKING_STATUS.APPROVED,
        driverNotes: req.body.driverNotes || booking.driverNotes
      },
      { new: true }
    );
    
    // Update ride's available seats
    await Ride.findByIdAndUpdate(
      booking.ride,
      { $inc: { seatsAvailable: -booking.seatsBooked } }
    );
    
    // Notify passenger of booking approval
    await notificationController.createNotification({
      recipient: booking.passenger,
      sender: req.user.id,
      type: NOTIFICATION_TYPES.BOOKING_APPROVED,
      title: 'Booking Approved',
      message: 'Your booking request has been approved by the driver.',
      relatedResource: {
        resourceType: 'booking',
        resourceId: booking._id
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reject a booking
 * @route   PUT /api/v1/bookings/:id/reject
 * @access  Private (Driver only)
 */
exports.rejectBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user is the driver of the booking
    if (booking.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this booking'
      });
    }
    
    // Check if booking can be rejected
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a booking with status: ${booking.status}`
      });
    }
    
    // Update booking status
    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status: BOOKING_STATUS.REJECTED,
        driverNotes: req.body.driverNotes || booking.driverNotes
      },
      { new: true }
    );
    
    // Notify passenger of booking rejection
    await notificationController.createNotification({
      recipient: booking.passenger,
      sender: req.user.id,
      type: NOTIFICATION_TYPES.BOOKING_REJECTED,
      title: 'Booking Rejected',
      message: req.body.driverNotes 
        ? `Your booking request has been rejected. Reason: ${req.body.driverNotes}`
        : 'Your booking request has been rejected by the driver.',
      relatedResource: {
        resourceType: 'booking',
        resourceId: booking._id
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel a booking
 * @route   PUT /api/v1/bookings/:id/cancel
 * @access  Private
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user is associated with the booking
    const isPassenger = booking.passenger.toString() === req.user.id;
    const isDriver = booking.driver.toString() === req.user.id;
    
    if (!isPassenger && !isDriver && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }
    
    // Check if booking can be cancelled
    if (booking.status !== 'pending' && booking.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status: ${booking.status}`
      });
    }
    
    // If booking was approved, return seats to the ride
    if (booking.status === 'approved') {
      await Ride.findByIdAndUpdate(
        booking.ride,
        { $inc: { seatsAvailable: booking.seatsBooked } }
      );
    }
    
    // Get the reason for cancellation
    const cancellationReason = req.body.reason || 'No reason provided';
    
    // Update booking status
    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status: BOOKING_STATUS.CANCELLED,
        cancellationReason,
        cancelledBy: req.user.id
      },
      { new: true }
    );
    
    // Notify the other party about the cancellation
    const recipientId = isPassenger ? booking.driver : booking.passenger;
    const senderRole = isPassenger ? 'passenger' : 'driver';
    
    await notificationController.createNotification({
      recipient: recipientId,
      sender: req.user.id,
      type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
      title: 'Booking Cancelled',
      message: `Booking has been cancelled by the ${senderRole}. Reason: ${cancellationReason}`,
      relatedResource: {
        resourceType: 'booking',
        resourceId: booking._id
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get driver's pending booking requests
 * @route   GET /api/v1/bookings/requests
 * @access  Private (Driver only)
 */
exports.getBookingRequests = async (req, res, next) => {
  try {
    // Check if user is a driver
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can access booking requests'
      });
    }
    
    // Get pagination options
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;
    
    // Get all pending bookings for rides owned by the driver
    const bookings = await Booking.find({
      driver: req.user.id,
      status: 'pending'
    })
      .populate({
        path: 'ride',
        select: 'source destination departureTime status pricePerSeat'
      })
      .populate({
        path: 'passenger',
        select: 'firstName lastName profileImage avgRating'
      })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await Booking.countDocuments({
      driver: req.user.id,
      status: 'pending'
    });
    
    const pagination = createPaginationResult(paginationOptions, total);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get passenger's upcoming bookings
 * @route   GET /api/v1/bookings/upcoming
 * @access  Private
 */
exports.getUpcomingBookings = async (req, res, next) => {
  try {
    // Get pagination options
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;
    
    // Find bookings
    const bookings = await Booking.find({
      passenger: req.user.id,
      status: 'approved'
    })
      .populate({
        path: 'ride',
        select: 'source destination departureTime status pricePerSeat',
        match: { departureTime: { $gt: new Date() } }
      })
      .populate({
        path: 'driver',
        select: 'firstName lastName profileImage avgRating phone'
      })
      .sort({ 'ride.departureTime': 1 })
      .skip(startIndex)
      .limit(limit);
    
    // Filter out bookings where ride is null (past rides)
    const upcomingBookings = bookings.filter(booking => booking.ride !== null);
    
    // Get total count - this is an approximation since we can't easily count after the populate filter
    const total = upcomingBookings.length;
    const pagination = createPaginationResult(paginationOptions, total);
    
    res.status(200).json({
      success: true,
      count: upcomingBookings.length,
      pagination,
      data: upcomingBookings
    });
  } catch (err) {
    next(err);
  }
};
