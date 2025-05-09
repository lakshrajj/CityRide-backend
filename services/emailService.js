const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
require('dotenv').config();

// Create reusable transporter
let transporter;

// Initialize the transporter based on environment
if (process.env.NODE_ENV === 'production') {
  // Production email service (e.g., SendGrid, AWS SES, etc.)
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // Development email - can use services like Mailtrap for testing
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

/**
 * Send verification email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} verificationLink - Email verification link
 */
exports.sendVerificationEmail = async (to, name, verificationLink) => {
  try {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Verify Your Email Address',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a6ee0;">Welcome to CityRide</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p>Hello ${name},</p>
            <p>Thank you for registering with CityRide, your local carpooling solution. To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #4a6ee0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            <p style="word-break: break-all;">${verificationLink}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you did not create an account, you can safely ignore this email.</p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CityRide. All rights reserved.</p>
            <p>123 Main Street, Anytown, AN 12345</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${to}`);
  } catch (err) {
    logger.error(`Error sending verification email to ${to}:`, err);
    throw err;
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetLink - Password reset link
 */
exports.sendPasswordResetEmail = async (to, name, resetLink) => {
  try {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Reset Your Password',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a6ee0;">CityRide Password Reset</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p>Hello ${name},</p>
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4a6ee0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            <p style="word-break: break-all;">${resetLink}</p>
            <p>This password reset link will expire in 10 minutes.</p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CityRide. All rights reserved.</p>
            <p>123 Main Street, Anytown, AN 12345</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${to}`);
  } catch (err) {
    logger.error(`Error sending password reset email to ${to}:`, err);
    throw err;
  }
};

/**
 * Send password change confirmation email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 */
exports.sendPasswordChangeConfirmation = async (to, name) => {
  try {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Your Password Has Been Changed',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a6ee0;">CityRide Security Alert</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p>Hello ${name},</p>
            <p>We're letting you know that your CityRide account password was recently changed.</p>
            <p>If you made this change, you can safely ignore this email.</p>
            <p>If you didn't change your password, please contact our support team immediately at support@cityride.com or secure your account by resetting your password.</p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CityRide. All rights reserved.</p>
            <p>123 Main Street, Anytown, AN 12345</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password change confirmation email sent to ${to}`);
  } catch (err) {
    logger.error(`Error sending password change confirmation to ${to}:`, err);
    throw err;
  }
};

/**
 * Send booking confirmation email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {Object} booking - Booking details
 * @param {Object} ride - Ride details
 */
exports.sendBookingConfirmationEmail = async (to, name, booking, ride) => {
  try {
    const departureTime = new Date(ride.departureTime).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Your Ride Booking Confirmation',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a6ee0;">CityRide Booking Confirmation</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p>Hello ${name},</p>
            <p>Your ride booking has been confirmed!</p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #4a6ee0;">Ride Details</h3>
              <p><strong>From:</strong> ${ride.source.address}</p>
              <p><strong>To:</strong> ${ride.destination.address}</p>
              <p><strong>Date & Time:</strong> ${departureTime}</p>
              <p><strong>Seats Booked:</strong> ${booking.seatsBooked}</p>
              <p><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</p>
            </div>
            <p>You can view and manage your booking in the CityRide app or website.</p>
            <p>Safe travels!</p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CityRide. All rights reserved.</p>
            <p>123 Main Street, Anytown, AN 12345</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Booking confirmation email sent to ${to}`);
  } catch (err) {
    logger.error(`Error sending booking confirmation email to ${to}:`, err);
    throw err;
  }
};

/**
 * Send ride reminder email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {Object} booking - Booking details
 * @param {Object} ride - Ride details
 */
exports.sendRideReminderEmail = async (to, name, booking, ride) => {
  try {
    const departureTime = new Date(ride.departureTime).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Reminder: Your Upcoming Ride',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a6ee0;">CityRide Ride Reminder</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p>Hello ${name},</p>
            <p>This is a friendly reminder about your upcoming ride:</p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #4a6ee0;">Ride Details</h3>
              <p><strong>From:</strong> ${ride.source.address}</p>
              <p><strong>To:</strong> ${ride.destination.address}</p>
              <p><strong>Date & Time:</strong> ${departureTime}</p>
              <p><strong>Seats:</strong> ${booking.seatsBooked}</p>
            </div>
            <p>Please be at the pickup location a few minutes before the scheduled time.</p>
            <p>Safe travels!</p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CityRide. All rights reserved.</p>
            <p>123 Main Street, Anytown, AN 12345</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Ride reminder email sent to ${to}`);
  } catch (err) {
    logger.error(`Error sending ride reminder email to ${to}:`, err);
    throw err;
  }
};

/**
 * Send ride cancellation email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {Object} booking - Booking details
 * @param {Object} ride - Ride details
 * @param {string} reason - Cancellation reason
 */
exports.sendRideCancellationEmail = async (to, name, booking, ride, reason) => {
  try {
    const departureTime = new Date(ride.departureTime).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Your Ride Has Been Cancelled',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a6ee0;">CityRide Cancellation Notice</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p>Hello ${name},</p>
            <p>We're sorry to inform you that your scheduled ride has been cancelled.</p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #4a6ee0;">Cancelled Ride Details</h3>
              <p><strong>From:</strong> ${ride.source.address}</p>
              <p><strong>To:</strong> ${ride.destination.address}</p>
              <p><strong>Scheduled Time:</strong> ${departureTime}</p>
              ${reason ? `<p><strong>Reason for cancellation:</strong> ${reason}</p>` : ''}
            </div>
            <p>You can book another ride through the CityRide app or website.</p>
            <p>We apologize for any inconvenience this may have caused.</p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CityRide. All rights reserved.</p>
            <p>123 Main Street, Anytown, AN 12345</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Cancellation email sent to ${to}`);
  } catch (err) {
    logger.error(`Error sending cancellation email to ${to}:`, err);
    throw err;
  }
};

/**
 * Send notification email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
exports.sendNotificationEmail = async (to, name, title, message) => {
  try {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject: title,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4a6ee0;">CityRide Notification</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p>Hello ${name},</p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #4a6ee0;">${title}</h3>
              <p>${message}</p>
            </div>
            <p>You can view all your notifications in the CityRide app or website.</p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
            <p>© ${new Date().getFullYear()} CityRide. All rights reserved.</p>
            <p>123 Main Street, Anytown, AN 12345</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Notification email sent to ${to}`);
  } catch (err) {
    logger.error(`Error sending notification email to ${to}:`, err);
    throw err;
  }
};
