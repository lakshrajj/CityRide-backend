const admin = require('firebase-admin');
const logger = require('../utils/logger');
require('dotenv').config();

// Initialize Firebase Admin
try {
  // Check if Firebase credentials are provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Parse service account JSON from environment variable
    // In production, it's better to use Firebase Admin service account credentials file
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    
    logger.info('Firebase Admin initialized successfully');
  } else {
    logger.warn('Firebase Admin not initialized: Missing service account credentials');
  }
} catch (err) {
  logger.error('Error initializing Firebase Admin:', err);
}

/**
 * Send push notification to a device
 * @param {string} token - FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 */
exports.sendPushNotification = async (token, title, body, data = {}) => {
  try {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin not initialized');
    }
    
    // Check if token is provided
    if (!token) {
      throw new Error('FCM token is required');
    }
    
    // Prepare notification message
    const message = {
      notification: {
        title,
        body
      },
      data: {},
      token
    };
    
    // Add additional data if provided
    if (data && Object.keys(data).length > 0) {
      // Convert all data values to strings (FCM requirement)
      Object.keys(data).forEach(key => {
        message.data[key] = String(data[key]);
      });
    }
    
    // Send notification
    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent: ${response}`);
    return response;
  } catch (err) {
    logger.error('Error sending push notification:', err);
    throw err;
  }
};

/**
 * Send push notification to multiple devices
 * @param {Array} tokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 */
exports.sendMulticastPushNotification = async (tokens, title, body, data = {}) => {
  try {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin not initialized');
    }
    
    // Check if tokens are provided
    if (!tokens || !tokens.length) {
      throw new Error('FCM tokens are required');
    }
    
    // Prepare notification message
    const message = {
      notification: {
        title,
        body
      },
      data: {},
      tokens
    };
    
    // Add additional data if provided
    if (data && Object.keys(data).length > 0) {
      // Convert all data values to strings (FCM requirement)
      Object.keys(data).forEach(key => {
        message.data[key] = String(data[key]);
      });
    }
    
    // Send multicast notification
    const response = await admin.messaging().sendMulticast(message);
    logger.info(`Multicast push notification sent: ${response.successCount} successful, ${response.failureCount} failed`);
    return response;
  } catch (err) {
    logger.error('Error sending multicast push notification:', err);
    throw err;
  }
};

/**
 * Send push notification to a topic
 * @param {string} topic - Topic name
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 */
exports.sendTopicPushNotification = async (topic, title, body, data = {}) => {
  try {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin not initialized');
    }
    
    // Check if topic is provided
    if (!topic) {
      throw new Error('Topic is required');
    }
    
    // Prepare notification message
    const message = {
      notification: {
        title,
        body
      },
      data: {},
      topic
    };
    
    // Add additional data if provided
    if (data && Object.keys(data).length > 0) {
      // Convert all data values to strings (FCM requirement)
      Object.keys(data).forEach(key => {
        message.data[key] = String(data[key]);
      });
    }
    
    // Send topic notification
    const response = await admin.messaging().send(message);
    logger.info(`Topic push notification sent: ${response}`);
    return response;
  } catch (err) {
    logger.error('Error sending topic push notification:', err);
    throw err;
  }
};

/**
 * Subscribe a device to a topic
 * @param {string|Array} tokens - FCM token or array of tokens
 * @param {string} topic - Topic name
 */
exports.subscribeToTopic = async (tokens, topic) => {
  try {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin not initialized');
    }
    
    // Check if tokens and topic are provided
    if (!tokens) {
      throw new Error('FCM tokens are required');
    }
    
    if (!topic) {
      throw new Error('Topic is required');
    }
    
    // Ensure tokens is an array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    
    // Subscribe to topic
    const response = await admin.messaging().subscribeToTopic(tokenArray, topic);
    logger.info(`Topic subscription: ${response.successCount} successful, ${response.failureCount} failed`);
    return response;
  } catch (err) {
    logger.error('Error subscribing to topic:', err);
    throw err;
  }
};

/**
 * Unsubscribe a device from a topic
 * @param {string|Array} tokens - FCM token or array of tokens
 * @param {string} topic - Topic name
 */
exports.unsubscribeFromTopic = async (tokens, topic) => {
  try {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin not initialized');
    }
    
    // Check if tokens and topic are provided
    if (!tokens) {
      throw new Error('FCM tokens are required');
    }
    
    if (!topic) {
      throw new Error('Topic is required');
    }
    
    // Ensure tokens is an array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    
    // Unsubscribe from topic
    const response = await admin.messaging().unsubscribeFromTopic(tokenArray, topic);
    logger.info(`Topic unsubscription: ${response.successCount} successful, ${response.failureCount} failed`);
    return response;
  } catch (err) {
    logger.error('Error unsubscribing from topic:', err);
    throw err;
  }
};
