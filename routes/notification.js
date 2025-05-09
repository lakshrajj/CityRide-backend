const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');
const { idParamValidator } = require('../middlewares/validator');
const { validate } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by read status
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
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/', protect, notificationController.getUserNotifications);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       403:
 *         description: Not authorized to access this notification
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read', protect, idParamValidator, validate, notificationController.markAsRead);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Not authenticated
 */
router.put('/read-all', protect, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       403:
 *         description: Not authorized to delete this notification
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', protect, idParamValidator, validate, notificationController.deleteNotification);

/**
 * @swagger
 * /api/v1/notifications/count:
 *   get:
 *     summary: Get notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification count retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/count', protect, notificationController.getNotificationCount);

module.exports = router;
