const Rating = require('../models/rating');
const Booking = require('../models/booking');
const User = require('../models/user');
const { NOTIFICATION_TYPES } = require('../utils/constants');
const notificationController = require('./notificationController');

/**
 * @desc    Create a new rating
 * @route   POST /api/v1/ratings
 * @access  Private
 */
exports.createRating = async (req, res, next) => {
  try {
    const { booking: bookingId, rating, review, categories } = req.body;

    // Find the booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed bookings'
      });
    }

    // Check if user is associated with the booking
    const isPassenger = booking.passenger.toString() === req.user.id;
    const isDriver = booking.driver.toString() === req.user.id;

    if (!isPassenger && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this booking'
      });
    }

    // Determine who is being rated
    const isPassengerRating = isPassenger;
    const ratedUserId = isPassengerRating ? booking.driver : booking.passenger;

    // Check if user has already rated this booking
    const existingRating = await Rating.findOne({
      booking: bookingId,
      ratedBy: req.user.id
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this booking'
      });
    }

    // Create the rating
    const newRating = await Rating.create({
      booking: bookingId,
      ratedBy: req.user.id,
      ratedUser: ratedUserId,
      rating,
      review: review || '',
      categories: categories || {},
      isPassengerRating
    });

    // Update booking rating status
    if (isPassengerRating) {
      await Booking.findByIdAndUpdate(bookingId, { isRatedByPassenger: true });
    } else {
      await Booking.findByIdAndUpdate(bookingId, { isRatedByDriver: true });
    }

    // Update user's average rating
    const allUserRatings = await Rating.find({ ratedUser: ratedUserId });
    const totalRating = allUserRatings.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / allUserRatings.length;

    await User.findByIdAndUpdate(ratedUserId, {
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalRatings: allUserRatings.length
    });

    // Notify the rated user
    await notificationController.createNotification({
      recipient: ratedUserId,
      sender: req.user.id,
      type: NOTIFICATION_TYPES.NEW_RATING,
      title: 'New Rating Received',
      message: `You received a ${rating}-star rating from your ${isPassengerRating ? 'passenger' : 'driver'}.`,
      relatedResource: {
        resourceType: 'rating',
        resourceId: newRating._id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: newRating
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get ratings for a user
 * @route   GET /api/v1/ratings/user/:userId
 * @access  Private
 */
exports.getUserRatings = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Get ratings for the user
    const ratings = await Rating.find({ ratedUser: userId })
      .populate({
        path: 'ratedBy',
        select: 'firstName lastName profileImage'
      })
      .populate({
        path: 'booking',
        select: 'ride',
        populate: {
          path: 'ride',
          select: 'source destination departureTime'
        }
      })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await Rating.countDocuments({ ratedUser: userId });

    // Calculate pagination info
    const pagination = {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };

    // Get rating statistics
    const stats = await Rating.aggregate([
      { $match: { ratedUser: userId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
          countByStar: {
            $push: {
              rating: '$rating',
            }
          }
        }
      }
    ]);

    // Format statistics
    let statistics = {
      avgRating: 0,
      totalRatings: 0,
      distribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }
    };

    if (stats.length > 0) {
      statistics.avgRating = parseFloat(stats[0].avgRating.toFixed(1));
      statistics.totalRatings = stats[0].count;

      // Calculate distribution
      stats[0].countByStar.forEach(item => {
        statistics.distribution[item.rating] += 1;
      });
    }

    res.status(200).json({
      success: true,
      statistics,
      pagination,
      data: ratings
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single rating
 * @route   GET /api/v1/ratings/:id
 * @access  Private
 */
exports.getRating = async (req, res, next) => {
  try {
    const rating = await Rating.findById(req.params.id)
      .populate({
        path: 'ratedBy',
        select: 'firstName lastName profileImage'
      })
      .populate({
        path: 'ratedUser',
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

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rating
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a rating
 * @route   PUT /api/v1/ratings/:id
 * @access  Private
 */
exports.updateRating = async (req, res, next) => {
  try {
    const { rating, review, categories } = req.body;

    let existingRating = await Rating.findById(req.params.id);

    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Check if user created the rating
    if (existingRating.ratedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rating'
      });
    }

    // Check if rating is less than 7 days old (optional time limit)
    const ratingDate = new Date(existingRating.createdAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - ratingDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      return res.status(400).json({
        success: false,
        message: 'Ratings can only be updated within 7 days of creation'
      });
    }

    // Update the rating
    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (review !== undefined) updateData.review = review;
    if (categories) updateData.categories = { ...existingRating.categories, ...categories };

    existingRating = await Rating.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Update user's average rating
    const allUserRatings = await Rating.find({ ratedUser: existingRating.ratedUser });
    const totalRating = allUserRatings.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / allUserRatings.length;

    await User.findByIdAndUpdate(existingRating.ratedUser, {
      avgRating: parseFloat(avgRating.toFixed(1))
    });

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: existingRating
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a rating
 * @route   DELETE /api/v1/ratings/:id
 * @access  Private
 */
exports.deleteRating = async (req, res, next) => {
  try {
    const rating = await Rating.findById(req.params.id);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Check if user created the rating or is admin
    if (rating.ratedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this rating'
      });
    }

    // Get the booking and user before deleting
    const ratedUserId = rating.ratedUser;
    const bookingId = rating.booking;
    const isPassengerRating = rating.isPassengerRating;

    // Delete the rating
    await rating.remove();

    // Update booking rating status
    if (isPassengerRating) {
      await Booking.findByIdAndUpdate(bookingId, { isRatedByPassenger: false });
    } else {
      await Booking.findByIdAndUpdate(bookingId, { isRatedByDriver: false });
    }

    // Update user's average rating
    const allUserRatings = await Rating.find({ ratedUser: ratedUserId });
    
    if (allUserRatings.length === 0) {
      await User.findByIdAndUpdate(ratedUserId, {
        avgRating: 0,
        totalRatings: 0
      });
    } else {
      const totalRating = allUserRatings.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / allUserRatings.length;

      await User.findByIdAndUpdate(ratedUserId, {
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: allUserRatings.length
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully',
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get pending ratings for a user
 * @route   GET /api/v1/ratings/pending
 * @access  Private
 */
exports.getPendingRatings = async (req, res, next) => {
  try {
    // Find completed bookings where user hasn't rated yet
    const userId = req.user.id;
    
    // Find bookings as passenger that are completed but not rated
    const pendingPassengerRatings = await Booking.find({
      passenger: userId,
      status: 'completed',
      isRatedByPassenger: false
    })
      .populate({
        path: 'ride',
        select: 'source destination departureTime'
      })
      .populate({
        path: 'driver',
        select: 'firstName lastName profileImage'
      })
      .sort({ updatedAt: -1 });
      
    // Find bookings as driver that are completed but not rated
    const pendingDriverRatings = await Booking.find({
      driver: userId,
      status: 'completed',
      isRatedByDriver: false
    })
      .populate({
        path: 'ride',
        select: 'source destination departureTime'
      })
      .populate({
        path: 'passenger',
        select: 'firstName lastName profileImage'
      })
      .sort({ updatedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: pendingPassengerRatings.length + pendingDriverRatings.length,
      data: {
        asPassenger: pendingPassengerRatings,
        asDriver: pendingDriverRatings
      }
    });
  } catch (err) {
    next(err);
  }
};
