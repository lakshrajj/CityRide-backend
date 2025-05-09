const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./auth');
const userRoutes = require('./user');
const rideRoutes = require('./ride');
const bookingRoutes = require('./booking');
const ratingRoutes = require('./rating');
const notificationRoutes = require('./notification');
const adminRoutes = require('./admin');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rides', rideRoutes);
router.use('/bookings', bookingRoutes);
router.use('/ratings', ratingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Base route
router.get('/', (req, res) => {
  res.send({
    success: true,
    message: 'CityRide API v1.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
