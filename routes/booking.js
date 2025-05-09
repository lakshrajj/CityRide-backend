const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/auth');
const { isBookingParticipant, isBookingDriver, isBookingPassenger } = require('../middlewares/roleAccess');
const { createBookingValidator, idParamValidator } = require('../middlewares/validator');
const { validate } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ride
 *               - seatsBooked
 *             properties:
 *               ride:
 *                 type: string
 *                 description: Ride ID
 *               seatsBooked:
 *                 type: integer
 *                 minimum: 1
 *               pickupPoint:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   location:
 *                     type: object
 *                     properties:
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                         minItems: 2
 *                         maxItems: 2
 *               dropoffPoint:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   location:
 *                     type: object
 *                     properties:
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                         minItems: 2
 *                         maxItems: 2
 *               passengerNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid input or not enough seats available
 *       404:
 *         description: Ride not found
 */
router.post('/', protect, createBookingValidator, validate, bookingController.createBooking);

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get all bookings for current user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled, completed]
 *         description: Filter by booking status
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date (from)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date (to)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/', protect, bookingController.getBookings);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get a single booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       403:
 *         description: Not authorized to access this booking
 *       404:
 *         description: Booking not found
 */
router.get('/:id', protect, idParamValidator, validate, isBookingParticipant, bookingController.getBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}/approve:
 *   put:
 *     summary: Approve a booking (driver only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driverNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking approved successfully
 *       400:
 *         description: Cannot approve booking or not enough seats
 *       403:
 *         description: Not authorized to approve this booking
 *       404:
 *         description: Booking not found
 */
router.put('/:id/approve', protect, authorize('driver'), idParamValidator, validate, isBookingDriver, bookingController.approveBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}/reject:
 *   put:
 *     summary: Reject a booking (driver only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driverNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking rejected successfully
 *       400:
 *         description: Cannot reject booking
 *       403:
 *         description: Not authorized to reject this booking
 *       404:
 *         description: Booking not found
 */
router.put('/:id/reject', protect, authorize('driver'), idParamValidator, validate, isBookingDriver, bookingController.rejectBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booking ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Cannot cancel booking
 *       403:
 *         description: Not authorized to cancel this booking
 *       404:
 *         description: Booking not found
 */
router.put('/:id/cancel', protect, idParamValidator, validate, isBookingParticipant, bookingController.cancelBooking);

/**
 * @swagger
 * /api/v1/bookings/requests:
 *   get:
 *     summary: Get all pending booking requests (driver only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Booking requests retrieved successfully
 *       403:
 *         description: Only drivers can access booking requests
 */
router.get('/requests', protect, authorize('driver'), bookingController.getBookingRequests);

/**
 * @swagger
 * /api/v1/bookings/upcoming:
 *   get:
 *     summary: Get all upcoming bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Upcoming bookings retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/upcoming', protect, bookingController.getUpcomingBookings);

module.exports = router;
