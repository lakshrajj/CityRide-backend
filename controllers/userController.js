const User = require('../models/user');
const Ride = require('../models/ride');
const Booking = require('../models/booking');
const Rating = require('../models/rating');
const { filterUserData, getPaginationOptions, createPaginationResult } = require('../utils/helpers');

/**
 * @desc    Get user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: filterUserData(user.toObject())
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/users/profile
 * @access  Private
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, address, profileImage } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (address) updateData.address = address;
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: filterUserData(user.toObject())
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update driver details
 * @route   PUT /api/v1/users/driver-details
 * @access  Private (Driver only)
 */
exports.updateDriverDetails = async (req, res, next) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can update driver details'
      });
    }

    const {
      licenseNumber,
      licenseExpiry,
      vehicleModel,
      vehicleColor,
      vehicleYear,
      licensePlate,
      seatingCapacity
    } = req.body;

    const driverDetails = {};
    if (licenseNumber) driverDetails['driverDetails.licenseNumber'] = licenseNumber;
    if (licenseExpiry) driverDetails['driverDetails.licenseExpiry'] = licenseExpiry;
    if (vehicleModel) driverDetails['driverDetails.vehicleModel'] = vehicleModel;
    if (vehicleColor) driverDetails['driverDetails.vehicleColor'] = vehicleColor;
    if (vehicleYear) driverDetails['driverDetails.vehicleYear'] = vehicleYear;
    if (licensePlate) driverDetails['driverDetails.licensePlate'] = licensePlate;
    if (seatingCapacity) driverDetails['driverDetails.seatingCapacity'] = seatingCapacity;

    // Driver details submitted for verification
    if (Object.keys(driverDetails).length > 0) {
      // Reset verification status when details change
      driverDetails['driverDetails.isVerified'] = false;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      driverDetails,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Driver details updated successfully. Verification pending.',
      data: filterUserData(user.toObject())
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user's ride history (as passenger)
 * @route   GET /api/v1/users/rides/passenger
 * @access  Private
 */
exports.getPassengerRideHistory = async (req, res, next) => {
  try {
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;

    const bookings = await Booking.find({ 
      passenger: req.user.id 
    })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate({
        path: 'ride',
        select: 'source destination departureTime status pricePerSeat'
      })
      .populate({
        path: 'driver',
        select: 'firstName lastName profileImage avgRating'
      });

    const total = await Booking.countDocuments({ passenger: req.user.id });
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
 * @desc    Get user's ride history (as driver)
 * @route   GET /api/v1/users/rides/driver
 * @access  Private (Driver only)
 */
exports.getDriverRideHistory = async (req, res, next) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can access this endpoint'
      });
    }

    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;

    const rides = await Ride.find({ driver: req.user.id })
      .sort({ departureTime: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Ride.countDocuments({ driver: req.user.id });
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
 * @desc    Get user's ratings
 * @route   GET /api/v1/users/ratings
 * @access  Private
 */
exports.getUserRatings = async (req, res, next) => {
  try {
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;

    const ratings = await Rating.find({ 
      ratedUser: req.user.id 
    })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate({
        path: 'ratedBy',
        select: 'firstName lastName profileImage'
      })
      .populate({
        path: 'booking',
        select: 'ride status',
        populate: {
          path: 'ride',
          select: 'source destination departureTime'
        }
      });

    const total = await Rating.countDocuments({ ratedUser: req.user.id });
    const pagination = createPaginationResult(paginationOptions, total);

    res.status(200).json({
      success: true,
      count: ratings.length,
      pagination,
      data: ratings
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Deactivate user account
 * @route   PUT /api/v1/users/deactivate
 * @access  Private
 */
exports.deactivateAccount = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isActive: false },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get public profile of a user
 * @route   GET /api/v1/users/:id/profile
 * @access  Private
 */
exports.getPublicUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      'firstName lastName role profileImage avgRating totalRides totalRatings'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get ride and rating stats
    let rideCount = 0;
    if (user.role === 'driver') {
      rideCount = await Ride.countDocuments({ 
        driver: user._id,
        status: 'completed'
      });
    } else {
      rideCount = await Booking.countDocuments({
        passenger: user._id,
        status: 'completed'
      });
    }

    const ratingCount = await Rating.countDocuments({ ratedUser: user._id });
    
    const userData = user.toObject();
    userData.completedRides = rideCount;
    userData.ratingCount = ratingCount;

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (err) {
    next(err);
  }
};
