const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'booking_request',
      'booking_approved',
      'booking_rejected',
      'booking_cancelled',
      'ride_reminder',
      'ride_started',
      'ride_completed',
      'new_rating',
      'system_notification'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedResource: {
    resourceType: {
      type: String,
      enum: ['booking', 'ride', 'rating', 'user']
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveryMethod: {
    type: String,
    enum: ['in_app', 'email', 'push', 'sms', 'all'],
    default: 'in_app'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for faster queries
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
