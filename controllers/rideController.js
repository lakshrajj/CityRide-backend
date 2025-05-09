const Ride = require('../models/ride');
const Booking = require('../models/booking');
const User = require('../models/user');
const Notification = require('../models/notification');
const { 
  calculateDistance, 
  estimateTravelTime, 
  getPaginationOptions, 
  createPaginationResult 
} = require('../utils/helpers');
const { RIDE_STATUS, NOTIFICATION_TYPES } = require('../utils/constants');
const notificationController = require('./notificationController');

/**
 * @desc    Create a new ride
 * @route   POST /api/v1/rides
 * @access  Private (Driver only)
 */
exports.createRide = async (req, res, next) => {
  try {
    // Check if user is a driver
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can create rides'
      });
    }

    // Check if driver is verified
    if (!req.user.driverDetails?.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Driver account is not verified yet'
      });
    }

    // Extract ride data from request
    const {
      source,
      destination,
      intermediateStops,
      departureTime,
      seatsAvailable,
      pricePerSeat,
      preferences,
      additionalNotes,
      isRecurring,
      recurringDetails
    } = req.body;

    // Calculate estimated arrival time
    const estimatedMinutes = estimateTravelTime(
      source.location.coordinates,
      destination.location.coordinates
    );
    
    const departureDate = new Date(departureTime);
    const estimatedArrivalTime = new Date(
      departureDate.getTime() + estimatedMinutes * 60000
    );

    // Get vehicle details from driver profile
    const driverDetails = req.user.driverDetails || {};
    const vehicleDetails = {
      model: driverDetails.vehicleModel || '',
      color: driverDetails.vehicleColor || '',
      licensePlate: driverDetails.licensePlate || ''
    };

    // Create ride
    const ride = await Ride.create({
      driver: req.user.id,
      source,
      destination,
      intermediateStops: intermediateStops || [],
      departureTime,
      estimatedArrivalTime,
      seatsAvailable,
      seatsTotal: seatsAvailable,
      pricePerSeat,
      vehicleDetails,
      preferences: preferences || {},
      additionalNotes,
      isRecurring: isRecurring || false,
      recurringDetails: isRecurring ? recurringDetails : undefined
    });

    // Increment user's total rides count
    await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { totalRides: 1 } }
    );

    res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      data: ride
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all rides (with filters)
 * @route   GET /api/v1/rides
 * @access  Private
 */
exports.getRides = async (req, res, next) => {
  try {
    // Build query based on filters
    const {
      sourceAddress,
      destinationAddress,
      departureDate,
      seats,
      maxPrice,
      status
    } = req.query;

    const query = {};

    // Filter by date range
    if (departureDate) {
      const date = new Date(departureDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      query.departureTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Filter by available seats
    if (seats) {
      query.seatsAvailable = { $gte: parseInt(seats) };
    }

    // Filter by max price
    if (maxPrice) {
      query.pricePerSeat = { $lte: parseFloat(maxPrice) };
    }

    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // By default, only show scheduled and in-progress rides
      query.status = { $in: ['scheduled', 'in-progress'] };
    }

    // Implement geospatial filtering if coordinates provided
    // This would be more advanced in a real app with proper geocoding

    // Get pagination options
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;

    // Execute query with pagination
    const rides = await Ride.find(query)
      .populate({
        path: 'driver',
        select: 'firstName lastName profileImage avgRating'
      })
      .sort({ departureTime: 1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await Ride.countDocuments(query);
    const pagination = createPaginationResult(paginationOptions, total);

    res.status(200).json({
      success: true,
      count: rides.length,
      pagination,
      data: rides
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single ride
 * @route   GET /api/v1/rides/:id
 * @access  Private
 */
exports.getRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate({
        path: 'driver',
        select: 'firstName lastName profileImage avgRating phone'
      });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Get bookings for this ride
    const bookings = await Booking.find({ ride: ride._id })
      .populate({
        path: 'passenger',
        select: 'firstName lastName profileImage'
      });

    res.status(200).json({
      success: true,
      data: {
        ride,
        bookings
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a ride
 * @route   PUT /api/v1/rides/:id
 * @access  Private (Driver only)
 */
exports.updateRide = async (req, res, next) => {
  try {
    let ride = await Ride.findById(req.params.id);

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
        message: 'Not authorized to update this ride'
      });
    }

    // Check if ride can be updated (only scheduled rides can be updated)
    if (ride.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ride that is ${ride.status}`
      });
    }

    // Extract update data
    const {
      departureTime,
      seatsAvailable,
      pricePerSeat,
      preferences,
      additionalNotes
    } = req.body;

    // Create update object
    const updateData = {};
    if (departureTime) {
      updateData.departureTime = departureTime;
      
      // Recalculate estimated arrival time
      const estimatedMinutes = estimateTravelTime(
        ride.source.location.coordinates,
        ride.destination.location.coordinates
      );
      
      const departureDate = new Date(departureTime);
      updateData.estimatedArrivalTime = new Date(
        departureDate.getTime() + estimatedMinutes * 60000
      );
    }
    
    if (seatsAvailable !== undefined) {
      // Check if new seat count is valid (not less than booked seats)
      const bookedSeats = ride.seatsTotal - ride.seatsAvailable;
      if (seatsAvailable < bookedSeats) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce seats below the number of booked seats (${bookedSeats})`
        });
      }
      
      updateData.seatsAvailable = seatsAvailable;
      updateData.seatsTotal = seatsAvailable + bookedSeats;
    }
    
    if (pricePerSeat !== undefined) updateData.pricePerSeat = pricePerSeat;
    if (preferences) updateData.preferences = { ...ride.preferences, ...preferences };
    if (additionalNotes) updateData.additionalNotes = additionalNotes;

    // Update ride
    ride = await Ride.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Notify passengers about the ride update
    if (Object.keys(updateData).length > 0) {
      // Find all bookings for this ride
      const bookings = await Booking.find({ 
        ride: ride._id,
        status: { $in: ['pending', 'approved'] }
      });
      
      // Notify each passenger
      for (const booking of bookings) {
        await notificationController.createNotification({
          recipient: booking.passenger,
          sender: req.user.id,
          type: NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
          title: 'Ride Details Updated',
          message: 'The details of a ride you are booked on have been updated.',
          relatedResource: {
            resourceType: 'ride',
            resourceId: ride._id
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Ride updated successfully',
      data: ride
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel a ride
 * @route   PUT /api/v1/rides/:id/cancel
 * @access  Private (Driver only)
 */
exports.cancelRide = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    let ride = await Ride.findById(req.params.id);

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
        message: 'Not authorized to cancel this ride'
      });
    }

    // Check if ride can be cancelled (only scheduled rides can be cancelled)
    if (ride.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ride that is ${ride.status}`
      });
    }

    // Update ride status
    ride = await Ride.findByIdAndUpdate(
      req.params.id,
      { 
        status: RIDE_STATUS.CANCELLED,
        additionalNotes: reason 
          ? `${ride.additionalNotes || ''}\n\nCancellation reason: ${reason}`
          : ride.additionalNotes
      },
      { new: true }
    );

    // Update all associated bookings
    const bookings = await Booking.find({ 
      ride: ride._id,
      status: { $in: ['pending', 'approved'] }
    });

    for (const booking of bookings) {
      // Update booking status
      await Booking.findByIdAndUpdate(
        booking._id,
        { 
          status: 'cancelled',
          cancellationReason: 'Ride cancelled by driver',
          cancelledBy: req.user.id
        }
      );

      // Notify passenger
      await notificationController.createNotification({
        recipient: booking.passenger,
        sender: req.user.id,
        type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
        title: 'Ride Cancelled',
        message: reason 
          ? `Your ride has been cancelled by the driver. Reason: ${reason}`
          : 'Your ride has been cancelled by the driver.',
        relatedResource: {
          resourceType: 'booking',
          resourceId: booking._id
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      data: ride
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Start a ride
 * @route   PUT /api/v1/rides/:id/start
 * @access  Private (Driver only)
 */
exports.startRide = async (req, res, next) => {
  try {
    let ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is the ride owner
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this ride'
      });
    }

    // Check if ride can be started (only scheduled rides can be started)
    if (ride.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot start a ride that is ${ride.status}`
      });
    }

    // Update ride status
    ride = await Ride.findByIdAndUpdate(
      req.params.id,
      { status: RIDE_STATUS.IN_PROGRESS },
      { new: true }
    );

    // Notify all passengers with approved bookings
    const bookings = await Booking.find({ 
      ride: ride._id,
      status: 'approved'
    });

    for (const booking of bookings) {
      await notificationController.createNotification({
        recipient: booking.passenger,
        sender: req.user.id,
        type: NOTIFICATION_TYPES.RIDE_STARTED,
        title: 'Ride Started',
        message: 'Your ride has started. The driver is on the way.',
        relatedResource: {
          resourceType: 'ride',
          resourceId: ride._id
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride started successfully',
      data: ride
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Complete a ride
 * @route   PUT /api/v1/rides/:id/complete
 * @access  Private (Driver only)
 */
exports.completeRide = async (req, res, next) => {
  try {
    let ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is the ride owner
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this ride'
      });
    }

    // Check if ride can be completed (only in-progress rides can be completed)
    if (ride.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete a ride that is ${ride.status}`
      });
    }

    // Update ride status
    ride = await Ride.findByIdAndUpdate(
      req.params.id,
      { status: RIDE_STATUS.COMPLETED },
      { new: true }
    );

    // Update all associated bookings and notify passengers
    const bookings = await Booking.find({ 
      ride: ride._id,
      status: 'approved'
    });

    for (const booking of bookings) {
      // Update booking status
      await Booking.findByIdAndUpdate(
        booking._id,
        { status: 'completed' }
      );

      // Notify passenger
      await notificationController.createNotification({
        recipient: booking.passenger,
        sender: req.user.id,
        type: NOTIFICATION_TYPES.RIDE_COMPLETED,
        title: 'Ride Completed',
        message: 'Your ride has been completed. Please rate your experience.',
        relatedResource: {
          resourceType: 'booking',
          resourceId: booking._id
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ride completed successfully',
      data: ride
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Search for rides with advanced filtering
 * @route   POST /api/v1/rides/search
 * @access  Private
 */
exports.searchRides = async (req, res, next) => {
  try {
    const {
      sourceCoordinates,
      destinationCoordinates,
      departureDate,
      returnDate,
      seats,
      maxPrice,
      preferences
    } = req.body;

    // Basic query for scheduled rides
    let query = {
      status: 'scheduled',
      departureTime: { $gt: new Date() }
    };

    // Filter by departure date
    if (departureDate) {
      const date = new Date(departureDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      query.departureTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Filter by available seats
    if (seats) {
      query.seatsAvailable = { $gte: parseInt(seats) };
    }

    // Filter by max price
    if (maxPrice) {
      query.pricePerSeat = { $lte: parseFloat(maxPrice) };
    }

    // Filter by preferences
    if (preferences) {
      for (const [key, value] of Object.entries(preferences)) {
        if (value !== undefined) {
          query[`preferences.${key}`] = value;
        }
      }
    }

    // Geospatial search if coordinates provided
    // This is a simplified version - a real app would use $geoNear and proper indexes
    if (sourceCoordinates && sourceCoordinates.length === 2) {
      // Find rides with source within X kilometers of the given coordinates
      query['source.location'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: sourceCoordinates
          },
          $maxDistance: 5000 // 5 kilometers
        }
      };
    }

    if (destinationCoordinates && destinationCoordinates.length === 2) {
      // Find rides with destination within X kilometers of the given coordinates
      query['destination.location'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: destinationCoordinates
          },
          $maxDistance: 5000 // 5 kilometers
        }
      };
    }

    // Get pagination options
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;

    // Execute query with pagination
    const rides = await Ride.find(query)
      .populate({
        path: 'driver',
        select: 'firstName lastName profileImage avgRating'
      })
      .sort({ departureTime: 1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await Ride.countDocuments(query);
    const pagination = createPaginationResult(paginationOptions, total);

    res.status(200).json({
      success: true,
      count: rides.length,
      pagination,
      data: rides
    });
  } catch (err) {
    next(err);
  }
};
