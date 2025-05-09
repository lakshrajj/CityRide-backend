const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const { protect, authorize } = require('../middlewares/auth');
const { isRideOwner, isVerifiedDriver } = require('../middlewares/roleAccess');
const { createRideValidator, updateRideValidator, searchRideValidator, idParamValidator } = require('../middlewares/validator');
const { validate } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/rides:
 *   post:
 *     summary: Create a new ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - source
 *               - destination
 *               - departureTime
 *               - seatsAvailable
 *               - pricePerSeat
 *             properties:
 *               source:
 *                 type: object
 *                 required:
 *                   - address
 *                   - location
 *                 properties:
 *                   address:
 *                     type: string
 *                   location:
 *                     type: object
 *                     required:
 *                       - coordinates
 *                     properties:
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                         minItems: 2
 *                         maxItems: 2
 *               destination:
 *                 type: object
 *                 required:
 *                   - address
 *                   - location
 *                 properties:
 *                   address:
 *                     type: string
 *                   location:
 *                     type: object
 *                     required:
 *                       - coordinates
 *                     properties:
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                         minItems: 2
 *                         maxItems: 2
 *               intermediateStops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     location:
 *                       type: object
 *                       properties:
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 *                           minItems: 2
 *                           maxItems: 2
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *               seatsAvailable:
 *                 type: integer
 *                 minimum: 1
 *               pricePerSeat:
 *                 type: number
 *                 minimum: 0
 *               preferences:
 *                 type: object
 *                 properties:
 *                   smoking:
 *                     type: boolean
 *                   pets:
 *                     type: boolean
 *                   music:
 *                     type: boolean
 *                   luggage:
 *                     type: boolean
 *               additionalNotes:
 *                 type: string
 *               isRecurring:
 *                 type: boolean
 *               recurringDetails:
 *                 type: object
 *                 properties:
 *                   frequency:
 *                     type: string
 *                     enum: [daily, weekly, weekdays, weekends, custom]
 *                   days:
 *                     type: array
 *                     items:
 *                       type: number
 *                   endDate:
 *                     type: string
 *                     format: date
 *     responses:
 *       201:
 *         description: Ride created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Only verified drivers can create rides
 */
router.post('/', protect, authorize('driver'), isVerifiedDriver, createRideValidator, validate, rideController.createRide);

/**
 * @swagger
 * /api/v1/rides:
 *   get:
 *     summary: Get all rides with filters
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sourceAddress
 *         schema:
 *           type: string
 *         description: Source address
 *       - in: query
 *         name: destinationAddress
 *         schema:
 *           type: string
 *         description: Destination address
 *       - in: query
 *         name: departureDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Departure date (YYYY-MM-DD)
 *       - in: query
 *         name: seats
 *         schema:
 *           type: integer
 *         description: Minimum available seats
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per seat
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in-progress, completed, cancelled]
 *         description: Ride status
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
 *         description: Rides retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/', protect, searchRideValidator, validate, rideController.getRides);

/**
 * @swagger
 * /api/v1/rides/{id}:
 *   get:
 *     summary: Get a single ride by ID
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Ride ID
 *     responses:
 *       200:
 *         description: Ride retrieved successfully
 *       404:
 *         description: Ride not found
 */
router.get('/:id', protect, idParamValidator, validate, rideController.getRide);

/**
 * @swagger
 * /api/v1/rides/{id}:
 *   put:
 *     summary: Update a ride (driver only)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Ride ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *               seatsAvailable:
 *                 type: integer
 *                 minimum: 0
 *               pricePerSeat:
 *                 type: number
 *                 minimum: 0
 *               preferences:
 *                 type: object
 *                 properties:
 *                   smoking:
 *                     type: boolean
 *                   pets:
 *                     type: boolean
 *                   music:
 *                     type: boolean
 *                   luggage:
 *                     type: boolean
 *               additionalNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ride updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized to update this ride
 *       404:
 *         description: Ride not found
 */
router.put('/:id', protect, isRideOwner, updateRideValidator, validate, rideController.updateRide);

/**
 * @swagger
 * /api/v1/rides/{id}/cancel:
 *   put:
 *     summary: Cancel a ride (driver only)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Ride ID
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
 *         description: Ride cancelled successfully
 *       403:
 *         description: Not authorized to cancel this ride
 *       404:
 *         description: Ride not found
 */
router.put('/:id/cancel', protect, isRideOwner, rideController.cancelRide);

/**
 * @swagger
 * /api/v1/rides/{id}/start:
 *   put:
 *     summary: Start a ride (driver only)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Ride ID
 *     responses:
 *       200:
 *         description: Ride started successfully
 *       403:
 *         description: Not authorized to start this ride
 *       404:
 *         description: Ride not found
 */
router.put('/:id/start', protect, isRideOwner, rideController.startRide);

/**
 * @swagger
 * /api/v1/rides/{id}/complete:
 *   put:
 *     summary: Complete a ride (driver only)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Ride ID
 *     responses:
 *       200:
 *         description: Ride completed successfully
 *       403:
 *         description: Not authorized to complete this ride
 *       404:
 *         description: Ride not found
 */
router.put('/:id/complete', protect, isRideOwner, rideController.completeRide);

/**
 * @swagger
 * /api/v1/rides/search:
 *   post:
 *     summary: Advanced search for rides
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceCoordinates:
 *                 type: array
 *                 items:
 *                   type: number
 *                 minItems: 2
 *                 maxItems: 2
 *               destinationCoordinates:
 *                 type: array
 *                 items:
 *                   type: number
 *                 minItems: 2
 *                 maxItems: 2
 *               departureDate:
 *                 type: string
 *                 format: date
 *               returnDate:
 *                 type: string
 *                 format: date
 *               seats:
 *                 type: integer
 *                 minimum: 1
 *               maxPrice:
 *                 type: number
 *                 minimum: 0
 *               preferences:
 *                 type: object
 *                 properties:
 *                   smoking:
 *                     type: boolean
 *                   pets:
 *                     type: boolean
 *                   music:
 *                     type: boolean
 *                   luggage:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Invalid input
 */
router.post('/search', protect, rideController.searchRides);

module.exports = router;
