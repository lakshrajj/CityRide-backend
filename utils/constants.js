// User roles
exports.USER_ROLES = {
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  ADMIN: 'admin'
};

// Ride status
exports.RIDE_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Booking status
exports.BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

// Payment status
exports.PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed'
};

// Payment methods
exports.PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  WALLET: 'wallet',
  OTHER: 'other'
};

// Notification types
exports.NOTIFICATION_TYPES = {
  BOOKING_REQUEST: 'booking_request',
  BOOKING_APPROVED: 'booking_approved',
  BOOKING_REJECTED: 'booking_rejected',
  BOOKING_CANCELLED: 'booking_cancelled',
  RIDE_REMINDER: 'ride_reminder',
  RIDE_STARTED: 'ride_started',
  RIDE_COMPLETED: 'ride_completed',
  NEW_RATING: 'new_rating',
  SYSTEM_NOTIFICATION: 'system_notification'
};

// Notification delivery methods
exports.NOTIFICATION_DELIVERY = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms',
  ALL: 'all'
};

// Booking time thresholds
exports.BOOKING_THRESHOLDS = {
  MIN_TIME_BEFORE_DEPARTURE: 15, // minutes
  CANCELLATION_PENALTY_THRESHOLD: 60 // minutes before departure
};

// Default search radius in kilometers
exports.DEFAULT_SEARCH_RADIUS = 5;

// Default rating if user has no ratings
exports.DEFAULT_RATING = 3;

// Password reset token expiry time (in minutes)
exports.PASSWORD_RESET_EXPIRY = 10;

// Email verification token expiry time (in hours)
exports.EMAIL_VERIFICATION_EXPIRY = 24;

// OTP expiry time (in minutes)
exports.OTP_EXPIRY = 5;

// Admin dashboard settings
exports.ADMIN_DASHBOARD = {
  RECENT_ACTIVITIES_LIMIT: 10,
  CHART_DATA_DAYS: 30
};
