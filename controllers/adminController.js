const User = require('../models/user');
const Ride = require('../models/ride');
const Booking = require('../models/booking');
const Rating = require('../models/rating');
const Notification = require('../models/notification');
const { getPaginationOptions, createPaginationResult } = require('../utils/helpers');
const { NOTIFICATION_TYPES } = require('../utils/constants');
const notificationController = require('./notificationController');

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/v1/admin/dashboard
 * @access  Private (Admin only)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get counts of users, rides, bookings
    const totalUsers = await User.countDocuments();
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const totalPassengers = await User.countDocuments({ role: 'passenger' });
    const totalRides = await Ride.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalCompletedRides = await Ride.countDocuments({ status: 'completed' });
    const totalCancelledRides = await Ride.countDocuments({ status: 'cancelled' });
    const activeRides = await Ride.countDocuments({ status: { $in: ['scheduled', 'in-progress'] } });

    // Get new users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get pending driver verifications
    const pendingDriverVerifications = await User.countDocuments({
      role: 'driver',
      'driverDetails.isVerified': false,
      'driverDetails.licenseNumber': { $exists: true, $ne: '' }
    });

    // Get recent activity
    const recentRides = await Ride.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'driver',
        select: 'firstName lastName profileImage'
      });

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'passenger',
        select: 'firstName lastName profileImage'
      })
      .populate({
        path: 'ride',
        select: 'source destination departureTime'
      });

    // Get revenue statistics (assuming pricePerSeat * seatsBooked = revenue)
    const completedBookings = await Booking.find({ 
      status: 'completed' 
    });
    
    const totalRevenue = completedBookings.reduce(
      (sum, booking) => sum + booking.totalPrice, 
      0
    );

    // Monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyBookings = await Booking.find({
      status: 'completed',
      createdAt: { $gte: sixMonthsAgo }
    });
    
    // Group by month
    const monthlyRevenue = {};
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = month.toISOString().substring(0, 7); // YYYY-MM format
      monthlyRevenue[monthKey] = 0;
    }
    
    monthlyBookings.forEach(booking => {
      const month = booking.createdAt.toISOString().substring(0, 7);
      if (monthlyRevenue[month] !== undefined) {
        monthlyRevenue[month] += booking.totalPrice;
      }
    });

    // Format for chart
    const revenueChartData = Object.keys(monthlyRevenue)
      .sort()
      .map(month => ({
        month,
        revenue: monthlyRevenue[month]
      }));

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          drivers: totalDrivers,
          passengers: totalPassengers,
          newUsersLast30Days: newUsers,
          pendingDriverVerifications
        },
        rides: {
          total: totalRides,
          completed: totalCompletedRides,
          cancelled: totalCancelledRides,
          active: activeRides
        },
        bookings: {
          total: totalBookings
        },
        revenue: {
          total: totalRevenue,
          chart: revenueChartData
        },
        recentActivity: {
          rides: recentRides,
          bookings: recentBookings
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all users (with filters)
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin only)
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { 
      role, 
      search, 
      isVerified, 
      isActive, 
      sortBy, 
      sortOrder 
    } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isVerified === 'true' && role === 'driver') {
      query['driverDetails.isVerified'] = true;
    } else if (isVerified === 'false' && role === 'driver') {
      query['driverDetails.isVerified'] = false;
    }
    
    if (isActive === 'true') {
      query.isActive = true;
    } else if (isActive === 'false') {
      query.isActive = false;
    }
    
    // Search by name or email
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    // Sort options
    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort = { createdAt: -1 };
    }
    
    // Get pagination options
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await User.countDocuments(query);
    const pagination = createPaginationResult(paginationOptions, total);
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single user
 * @route   GET /api/v1/admin/users/:id
 * @access  Private (Admin only)
 */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user stats
    const ridesCount = user.role === 'driver'
      ? await Ride.countDocuments({ driver: user._id })
      : 0;
    
    const bookingsCount = user.role === 'passenger'
      ? await Booking.countDocuments({ passenger: user._id })
      : await Booking.countDocuments({ driver: user._id });
    
    const ratingsCount = await Rating.countDocuments({ ratedUser: user._id });
    
    const recentActivity = {
      rides: [],
      bookings: [],
      ratings: []
    };
    
    // Get recent rides if driver
    if (user.role === 'driver') {
      recentActivity.rides = await Ride.find({ driver: user._id })
        .sort({ createdAt: -1 })
        .limit(5);
    }
    
    // Get recent bookings
    const bookingQuery = user.role === 'passenger'
      ? { passenger: user._id }
      : { driver: user._id };
    
    recentActivity.bookings = await Booking.find(bookingQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'ride',
        select: 'source destination departureTime'
      });
    
    // Get recent ratings
    recentActivity.ratings = await Rating.find({ ratedUser: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'ratedBy',
        select: 'firstName lastName profileImage'
      });
    
    res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          ridesCount,
          bookingsCount,
          ratingsCount
        },
        recentActivity
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a user
 * @route   PUT /api/v1/admin/users/:id
 * @access  Private (Admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, role, isActive, isEmailVerified, isPhoneVerified } = req.body;
    
    // Build update object
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isEmailVerified !== undefined) updateData.isEmailVerified = isEmailVerified;
    if (isPhoneVerified !== undefined) updateData.isPhoneVerified = isPhoneVerified;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Notify user of changes
    await notificationController.createNotification({
      recipient: user._id,
      type: NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
      title: 'Account Updated',
      message: 'Your account details have been updated by an administrator.',
      deliveryMethod: 'all'
    });
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify driver account
 * @route   PUT /api/v1/admin/users/:id/verify-driver
 * @access  Private (Admin only)
 */
exports.verifyDriverAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user is a driver
    if (user.role !== 'driver') {
      return res.status(400).json({
        success: false,
        message: 'User is not a driver'
      });
    }
    
    // Mark driver as verified
    user.driverDetails.isVerified = true;
    await user.save();
    
    // Notify driver
    await notificationController.createNotification({
      recipient: user._id,
      type: NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
      title: 'Driver Account Verified',
      message: 'Your driver account has been verified. You can now create rides.',
      deliveryMethod: 'all'
    });
    
    res.status(200).json({
      success: true,
      message: 'Driver account verified successfully',
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all rides (with filters)
 * @route   GET /api/v1/admin/rides
 * @access  Private (Admin only)
 */
exports.getRides = async (req, res, next) => {
  try {
    const { status, driverId, fromDate, toDate, sortBy, sortOrder } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (driverId) {
      query.driver = driverId;
    }
    
    // Filter by date range
    if (fromDate || toDate) {
      query.departureTime = {};
      
      if (fromDate) {
        query.departureTime.$gte = new Date(fromDate);
      }
      
      if (toDate) {
        query.departureTime.$lte = new Date(toDate);
      }
    }
    
    // Sort options
    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort = { departureTime: -1 };
    }
    
    // Get pagination options
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;
    
    // Execute query with pagination
    const rides = await Ride.find(query)
      .populate({
        path: 'driver',
        select: 'firstName lastName profileImage'
      })
      .sort(sort)
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
 * @desc    Get all bookings (with filters)
 * @route   GET /api/v1/admin/bookings
 * @access  Private (Admin only)
 */
exports.getBookings = async (req, res, next) => {
  try {
    const { status, passengerId, driverId, rideId, fromDate, toDate, sortBy, sortOrder } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (passengerId) {
      query.passenger = passengerId;
    }
    
    if (driverId) {
      query.driver = driverId;
    }
    
    if (rideId) {
      query.ride = rideId;
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
    
    // Sort options
    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort = { createdAt: -1 };
    }
    
    // Get pagination options
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;
    
    // Execute query with pagination
    const bookings = await Booking.find(query)
      .populate({
        path: 'passenger',
        select: 'firstName lastName profileImage'
      })
      .populate({
        path: 'driver',
        select: 'firstName lastName profileImage'
      })
      .populate({
        path: 'ride',
        select: 'source destination departureTime status'
      })
      .sort(sort)
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
 * @desc    Send system notification to user(s)
 * @route   POST /api/v1/admin/notifications
 * @access  Private (Admin only)
 */
exports.sendNotification = async (req, res, next) => {
  try {
    const { recipients, title, message, deliveryMethod } = req.body;
    
    if (!recipients || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipients, title and message are required'
      });
    }
    
    // Check if sending to all users
    if (recipients === 'all') {
      const users = await User.find().select('_id');
      const notificationPromises = users.map(user => 
        notificationController.createNotification({
          recipient: user._id,
          sender: req.user.id,
          type: NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
          title,
          message,
          deliveryMethod: deliveryMethod || 'in_app'
        })
      );
      
      await Promise.all(notificationPromises);
      
      return res.status(200).json({
        success: true,
        message: `Notification sent to ${users.length} users`
      });
    }
    
    // Check if sending to a specific role
    if (recipients === 'drivers' || recipients === 'passengers' || recipients === 'admins') {
      const role = recipients === 'drivers' ? 'driver' : recipients === 'passengers' ? 'passenger' : 'admin';
      const users = await User.find({ role }).select('_id');
      
      const notificationPromises = users.map(user => 
        notificationController.createNotification({
          recipient: user._id,
          sender: req.user.id,
          type: NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
          title,
          message,
          deliveryMethod: deliveryMethod || 'in_app'
        })
      );
      
      await Promise.all(notificationPromises);
      
      return res.status(200).json({
        success: true,
        message: `Notification sent to ${users.length} ${role}s`
      });
    }
    
    // Send to specific user IDs
    if (Array.isArray(recipients)) {
      const notificationPromises = recipients.map(userId => 
        notificationController.createNotification({
          recipient: userId,
          sender: req.user.id,
          type: NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
          title,
          message,
          deliveryMethod: deliveryMethod || 'in_app'
        })
      );
      
      await Promise.all(notificationPromises);
      
      return res.status(200).json({
        success: true,
        message: `Notification sent to ${recipients.length} users`
      });
    }
    
    // Send to a single user
    await notificationController.createNotification({
      recipient: recipients,
      sender: req.user.id,
      type: NOTIFICATION_TYPES.SYSTEM_NOTIFICATION,
      title,
      message,
      deliveryMethod: deliveryMethod || 'in_app'
    });
    
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (err) {
    next(err);
  }
};
