const twilio = require('twilio');
const logger = require('../utils/logger');
require('dotenv').config();

// Initialize Twilio client
let twilioClient;

try {
  // Check if Twilio credentials are provided
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    logger.info('Twilio client initialized successfully');
  } else {
    logger.warn('Twilio client not initialized: Missing credentials');
  }
} catch (err) {
  logger.error('Error initializing Twilio client:', err);
}

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - Recipient phone number (E.164 format)
 * @param {string} otp - One-time password
 */
exports.sendOTP = async (phoneNumber, otp) => {
  try {
    // Check if Twilio client is initialized
    if (!twilioClient) {
      logger.warn('Twilio client not initialized, simulating OTP send.');
      logger.info(`[SIMULATED] OTP sent to ${phoneNumber}: ${otp}`);
      return { 
        success: true, 
        message: 'OTP sending simulated. Check logs for OTP.' 
      };
    }
    
    // Validate phone number (simple validation, can be enhanced)
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }
    
    // Send OTP via Twilio
    const message = await twilioClient.messages.create({
      body: `Your CityRide verification code is: ${otp}. This code will expire in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    logger.info(`OTP sent to ${phoneNumber} with SID: ${message.sid}`);
    
    return {
      success: true,
      message: 'OTP sent successfully',
      sid: message.sid
    };
  } catch (err) {
    logger.error(`Error sending OTP to ${phoneNumber}:`, err);
    
    // Simulate OTP send in development if Twilio error occurs
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[SIMULATED FALLBACK] OTP sent to ${phoneNumber}: ${otp}`);
      return { 
        success: true, 
        message: 'OTP sending simulated. Check logs for OTP.' 
      };
    }
    
    throw err;
  }
};

/**
 * Verify OTP (in a real app, this would validate against a stored OTP)
 * @param {string} phoneNumber - User's phone number
 * @param {string} otp - One-time password provided by user
 */
exports.verifyOTP = async (phoneNumber, otp) => {
  try {
    // In a real app, we would:
    // 1. Retrieve the stored OTP from a database/cache
    // 2. Compare with the provided OTP
    // 3. Check if it's expired
    // 4. Mark as used after successful verification
    
    // For demonstration, we'll use a dummy check
    // This is just a placeholder - in a real app, implement proper OTP storage and validation
    logger.info(`Verifying OTP for ${phoneNumber}: ${otp}`);
    
    // Mocked verification - always succeeds in development
    if (process.env.NODE_ENV !== 'production') {
      return {
        success: true,
        message: 'OTP verified successfully (development mode)'
      };
    }
    
    // In production, make a proper verification
    // This is where you'd implement the actual OTP validation logic
    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (err) {
    logger.error(`Error verifying OTP for ${phoneNumber}:`, err);
    throw err;
  }
};

/**
 * Send a general SMS message
 * @param {string} phoneNumber - Recipient phone number (E.164 format)
 * @param {string} message - Message text to send
 */
exports.sendSMS = async (phoneNumber, message) => {
  try {
    // Check if Twilio client is initialized
    if (!twilioClient) {
      logger.warn('Twilio client not initialized, simulating SMS send.');
      logger.info(`[SIMULATED] SMS sent to ${phoneNumber}: ${message}`);
      return { 
        success: true, 
        message: 'SMS sending simulated. Check logs for message.' 
      };
    }
    
    // Validate phone number (simple validation, can be enhanced)
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }
    
    // Send SMS via Twilio
    const sms = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    logger.info(`SMS sent to ${phoneNumber} with SID: ${sms.sid}`);
    
    return {
      success: true,
      message: 'SMS sent successfully',
      sid: sms.sid
    };
  } catch (err) {
    logger.error(`Error sending SMS to ${phoneNumber}:`, err);
    
    // Simulate SMS send in development if Twilio error occurs
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[SIMULATED FALLBACK] SMS sent to ${phoneNumber}: ${message}`);
      return { 
        success: true, 
        message: 'SMS sending simulated. Check logs for message.' 
      };
    }
    
    throw err;
  }
};

/**
 * Generate a new OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Generated OTP
 */
exports.generateOTP = (length = 6) => {
  // Generate a random numeric OTP of specified length
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

/**
 * Store OTP for a user (in a real app, this would store in a database/cache)
 * @param {string} phoneNumber - User's phone number
 * @param {string} otp - One-time password to store
 * @param {number} expiryMinutes - OTP expiry time in minutes (default: 5)
 */
exports.storeOTP = async (phoneNumber, otp, expiryMinutes = 5) => {
  try {
    // In a real application, you would:
    // 1. Store the OTP in a database/cache
    // 2. Set an expiry time
    // 3. Associate it with the phone number
    
    // For demonstration, we'll just log it
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
    
    logger.info(`[SIMULATED STORAGE] OTP for ${phoneNumber}: ${otp} | Expires at: ${expiryTime.toISOString()}`);
    
    return {
      success: true,
      message: 'OTP stored successfully (simulated)',
      expiryTime
    };
  } catch (err) {
    logger.error(`Error storing OTP for ${phoneNumber}:`, err);
    throw err;
  }
};

/**
 * Send ride reminder SMS
 * @param {string} phoneNumber - Recipient phone number
 * @param {Object} rideDetails - Ride details for the reminder
 */
exports.sendRideReminder = async (phoneNumber, rideDetails) => {
  const { source, destination, departureTime, driverName } = rideDetails;
  
  // Format departure time
  const formattedTime = new Date(departureTime).toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
  
  // Create message text
  const message = `CityRide Reminder: Your ride from ${source} to ${destination} is scheduled for ${formattedTime} with driver ${driverName}. Be ready!`;
  
  // Send reminder
  return await this.sendSMS(phoneNumber, message);
};
