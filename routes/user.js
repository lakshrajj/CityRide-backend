const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { idParamValidator } = require('../middlewares/validator');
const { validate } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', protect, userController.getUserProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               profileImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 */
router.put('/profile', protect, userController.updateUserProfile);

/**
 * @swagger
 * /api/v1/users/driver-details:
 *   put:
 *     summary: Update driver details (driver only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licenseNumber:
 *                 type: string
 *               licenseExpiry:
 *                 type: string
 *                 format: date
 *               vehicleModel:
 *                 type: string
 *               vehicleColor:
 *                 type: string
 *               vehicleYear:
 *                 type: number
 *               licensePlate:
 *                 type: string
 *               seatingCapacity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Driver details updated successfully
 *       403:
 *         description: Only drivers can update driver details
 */
router.put('/driver-details', protect, authorize('driver'), userController.updateDriverDetails);

/**
 * @swagger
 * /api/v1/users/rides/passenger:
 *   get:
 *     summary: Get user's ride history as passenger
 *     tags: [Users]
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
 *         description: Ride history retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/rides/passenger', protect, userController.getPassengerRideHistory);

/**
 * @swagger
 * /api/v1/users/rides/driver:
 *   get:
 *     summary: Get user's ride history as driver (driver only)
 *     tags: [Users]
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
 *         description: Ride history retrieved successfully
 *       403:
 *         description: Only drivers can access this endpoint
 */
router.get('/rides/driver', protect, authorize('driver'), userController.getDriverRideHistory);

/**
 * @swagger
 * /api/v1/users/ratings:
 *   get:
 *     summary: Get user's ratings
 *     tags: [Users]
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
 *         description: Ratings retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/ratings', protect, userController.getUserRatings);

/**
 * @swagger
 * /api/v1/users/deactivate:
 *   put:
 *     summary: Deactivate user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *       401:
 *         description: Not authenticated
 */
router.put('/deactivate', protect, userController.deactivateAccount);

/**
 * @swagger
 * /api/v1/users/{id}/profile:
 *   get:
 *     summary: Get public profile of a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id/profile', protect, idParamValidator, validate, userController.getPublicUserProfile);

module.exports = router;
