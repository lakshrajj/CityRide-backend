const User = require('../models/user');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { filterUserData } = require('../utils/helpers');
const emailService = require('../services/emailService');
const otpService = require('../services/otpService');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create user with validated role
    const validRole = role === 'driver' ? role : 'passenger';
    
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: validRole
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    
    // Generate OTP for phone verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification data (in a real app, store these securely)
    // For this example, just log them
    logger.info(`Verification token for ${email}: ${verificationToken}`);
    logger.info(`OTP for ${phone}: ${otp}`);
    
    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        email,
        firstName,
        `${process.env.BASE_URL}/api/v1/auth/verify-email/${verificationToken}`
      );
    } catch (err) {
      logger.error('Error sending verification email:', err);
      // Continue registration even if email fails
    }
    
    // Send OTP via SMS
    try {
      await otpService.sendOTP(phone, otp);
    } catch (err) {
      logger.error('Error sending OTP:', err);
      // Continue registration even if SMS fails
    }

    // Create token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: filterUserData(user.toObject())
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Create token
    const token = user.getSignedJwtToken();

    // Update FCM token if provided
    if (req.body.fcmToken) {
      user.fcmToken = req.body.fcmToken;
      await user.save();
    }

    res.status(200).json({
      success: true,
      token,
      user: filterUserData(user.toObject())
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: filterUserData(user.toObject())
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify email address
 * @route   GET /api/v1/auth/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // In a real app, find the user with this token from a verification model
    // For now, just simulate success
    
    // Normally: const user = await EmailVerification.findOne({ token });
    
    // Update user's email verification status
    // Placeholder: await User.findByIdAndUpdate(user.userId, { isEmailVerified: true });
    
    // For demo, just return success
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify phone with OTP
 * @route   POST /api/v1/auth/verify-phone
 * @access  Private
 */
exports.verifyPhone = async (req, res, next) => {
  try {
    const { otp } = req.body;

    // In a real app, verify the OTP from a database/cache
    // For now, just simulate success
    
    // Mark phone as verified
    await User.findByIdAndUpdate(req.user.id, { isPhoneVerified: true });
    
    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();

    // Save the reset token and expiry to the user
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        user.firstName,
        resetUrl
      );

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (err) {
      // If email sending fails, clear the reset token and expiry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      logger.error('Error sending password reset email:', err);
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reset password
 * @route   PUT /api/v1/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    try {
      await emailService.sendPasswordChangeConfirmation(
        user.email,
        user.firstName
      );
    } catch (err) {
      logger.error('Error sending password change confirmation:', err);
      // Continue anyway
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send confirmation email
    try {
      await emailService.sendPasswordChangeConfirmation(
        user.email,
        user.firstName
      );
    } catch (err) {
      logger.error('Error sending password change confirmation:', err);
      // Continue anyway
    }

    // Return new token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Logout - clear cookies (if using cookie-based auth)
 * @route   GET /api/v1/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    // If using FCM tokens, clear the token
    if (req.user.fcmToken) {
      await User.findByIdAndUpdate(req.user.id, { fcmToken: null });
    }

    // If using cookies, clear them
    // res.clearCookie('token');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
};
