const Notification = require('../models/notification');
const User = require('../models/user');
const emailService = require('../services/emailService');
const firebaseService = require('../services/firebaseService');
const logger = require('../utils/logger');
const { getPaginationOptions, createPaginationResult } = require('../utils/helpers');

/**
 * @desc    Create a notification
 * @access  Internal
 */
exports.createNotification = async (notificationData) => {
  try {
    const { recipient, sender, type, title, message, relatedResource, deliveryMethod = 'in_app' } = notificationData;

    // Create notification in database
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedResource,
      deliveryMethod
    });

    // Get recipient user
    const user = await User.findById(recipient);

    if (!user) {
      logger.error(`Failed to find recipient user ${recipient} for notification`);
      return notification;
    }

    // Send via email if requested
    if (deliveryMethod === 'email' || deliveryMethod === 'all') {
      try {
        await emailService.sendNotificationEmail(
          user.email,
          user.firstName,
          title,
          message
        );
        
        // Mark as delivered via email
        notification.isDelivered = true;
        await notification.save();
      } catch (err) {
        logger.error(`Failed to send email notification to ${user.email}:`, err);
      }
    }

    // Send via push notification if requested and FCM token exists
    if ((deliveryMethod === 'push' || deliveryMethod === 'all') && user.fcmToken) {
      try {
        await firebaseService.sendPushNotification(
          user.fcmToken,
          title,
          message,
          {
            type,
            resourceType: relatedResource?.resourceType,
            resourceId: relatedResource?.resourceId?.toString()
          }
        );
        
        // Mark as delivered via push
        notification.isDelivered = true;
        await notification.save();
      } catch (err) {
        logger.error(`Failed to send push notification to user ${recipient}:`, err);
      }
    }

    return notification;
  } catch (err) {
    logger.error('Error creating notification:', err);
    throw err;
  }
};

/**
 * @desc    Get user's notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getUserNotifications = async (req, res, next) => {
  try {
    const { read } = req.query;
    const paginationOptions = getPaginationOptions(req.query);
    const { startIndex, limit } = paginationOptions;

    // Build query based on filters
    const query = { recipient: req.user.id };
    
    if (read === 'true') {
      query.isRead = true;
    } else if (read === 'false') {
      query.isRead = false;
    }

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .populate({
        path: 'sender',
        select: 'firstName lastName profileImage'
      })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await Notification.countDocuments(query);
    const pagination = createPaginationResult(paginationOptions, total);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      pagination,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this notification'
      });
    }

    // Update notification
    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    // Update all unread notifications for this user
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    // Delete notification
    await notification.remove();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get notification count
 * @route   GET /api/v1/notifications/count
 * @access  Private
 */
exports.getNotificationCount = async (req, res, next) => {
  try {
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    // Get total count
    const totalCount = await Notification.countDocuments({
      recipient: req.user.id
    });

    res.status(200).json({
      success: true,
      data: {
        unread: unreadCount,
        total: totalCount
      }
    });
  } catch (err) {
    next(err);
  }
};
