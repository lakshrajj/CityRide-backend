const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { protect } = require('../middlewares/auth');
const { createRatingValidator, idParamValidator } = require('../middlewares/validator');
const { validate } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/ratings:
 *   post:
 *     summary: Create a new rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking
 *               - rating
 *             properties:
 *               booking:
 *                 type: string
 *                 description: Booking ID
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *               categories:
 *                 type: object
 *                 properties:
 *                   punctuality:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   cleanliness:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   communication:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   driving:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   courtesy:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *     responses:
 *       201:
 *         description: Rating created successfully
 *       400:
 *         description: Invalid input or already rated
 *       403:
 *         description: Not authorized to rate this booking
 *       404:
 *         description: Booking not found
 */
router.post('/', protect, createRatingValidator, validate, ratingController.createRating);

/**
 * @swagger
 * /api/v1/ratings/user/{userId}:
 *   get:
 *     summary: Get ratings for a user
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
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
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', protect, idParamValidator, validate, ratingController.getUserRatings);

/**
 * @swagger
 * /api/v1/ratings/{id}:
 *   get:
 *     summary: Get a single rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Rating ID
 *     responses:
 *       200:
 *         description: Rating retrieved successfully
 *       404:
 *         description: Rating not found
 */
router.get('/:id', protect, idParamValidator, validate, ratingController.getRating);

/**
 * @swagger
 * /api/v1/ratings/{id}:
 *   put:
 *     summary: Update a rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Rating ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *               categories:
 *                 type: object
 *                 properties:
 *                   punctuality:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   cleanliness:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   communication:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   driving:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   courtesy:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *       400:
 *         description: Invalid input or rating too old to update
 *       403:
 *         description: Not authorized to update this rating
 *       404:
 *         description: Rating not found
 */
router.put('/:id', protect, idParamValidator, validate, ratingController.updateRating);

/**
 * @swagger
 * /api/v1/ratings/{id}:
 *   delete:
 *     summary: Delete a rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Rating ID
 *     responses:
 *       200:
 *         description: Rating deleted successfully
 *       403:
 *         description: Not authorized to delete this rating
 *       404:
 *         description: Rating not found
 */
router.delete('/:id', protect, idParamValidator, validate, ratingController.deleteRating);

/**
 * @swagger
 * /api/v1/ratings/pending:
 *   get:
 *     summary: Get pending ratings for current user
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending ratings retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/pending', protect, ratingController.getPendingRatings);

module.exports = router;
