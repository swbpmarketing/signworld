const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const generateToken = require('../utils/generateToken');
const emailService = require('../services/emailService');
const { generateToken: generateVerificationToken, getTokenExpiration, verifyToken, hashToken } = require('../utils/tokenGenerator');

// @desc    Public signup (for new users)
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password',
      });
    }

    // Validate role - only allow 'owner' or 'vendor' for public signup
    const allowedRoles = ['owner', 'vendor'];
    const userRole = role && allowedRoles.includes(role.toLowerCase()) ? role.toLowerCase() : 'owner';

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Get system settings to check auto-approve
    const settings = await SystemSettings.getSettings();

    // Determine if user should be active based on role and auto-approve setting
    let isActive = true;
    if (userRole === 'owner' && !settings.autoApproveOwners) {
      isActive = false; // Requires admin approval
    } else if (userRole === 'vendor') {
      // Vendors typically require admin approval (you can add autoApproveVendors setting if needed)
      // For now, vendors require approval
      isActive = false;
    }

    // Generate verification token
    const { token: verificationTokenPlain, hash: verificationTokenHash } = generateVerificationToken();
    const verificationTokenExpires = getTokenExpiration(60); // 1 hour

    // Create user with verification token
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      company: company || undefined,
      isActive,
      emailVerified: false, // Always require email verification
      verificationToken: verificationTokenHash,
      verificationTokenExpires,
    });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationTokenPlain}`;
    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    }).catch(err => {
      console.error('Failed to send verification email:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Register user (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, company, address, openDate, specialties } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Store plain password for email (before it gets hashed by mongoose)
    const plainPassword = password;

    // Get system settings to check auto-approve
    const settings = await SystemSettings.getSettings();
    const userRole = role || 'owner';

    // Determine if user should be active based on role and settings
    // Admins are always active, owners follow the auto-approve setting
    let isActive = true;
    if (userRole === 'owner' && !settings.autoApproveOwners) {
      isActive = false; // Requires admin approval
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      phone,
      company,
      address,
      openDate,
      specialties,
      isActive,
      emailVerified: true, // Admin-registered users skip email verification
    });

    // Send welcome email with credentials (non-blocking)
    emailService.sendWelcomeEmailWithCredentials({
      to: user.email,
      name: user.name,
      password: plainPassword,
      role: user.role,
    }).catch(err => {
      console.error('Failed to send welcome email:', err);
      // Don't fail the registration if email fails
    });

    // Create token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if email is verified (backward compatible: treat null/undefined as verified for existing users)
    if (user.emailVerified === false) {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email before logging in',
        emailNotVerified: true,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Create token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user.id;
    const user = await User.findById(targetUserId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user.id;

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      company: req.body.company,
      address: req.body.address,
      specialties: req.body.specialties,
      equipment: req.body.equipment,
      socialLinks: req.body.socialLinks,
      mentoring: req.body.mentoring,
    };

    const user = await User.findByIdAndUpdate(targetUserId, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user.id;

    const user = await User.findById(targetUserId).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Password is incorrect',
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Send email verification link
// @route   POST /api/auth/send-verification
// @access  Private
exports.sendVerificationEmail = async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user.id;

    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified',
      });
    }

    // Generate verification token
    const { token, hash } = generateVerificationToken();
    const expiresAt = getTokenExpiration(60); // 1 hour expiration

    // Save token to user
    user.verificationToken = hash;
    user.verificationTokenExpires = expiresAt;
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Verify email with token
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required',
      });
    }

    // Hash the token to compare with stored hash
    const tokenHash = hashToken(token);

    // Find user with matching token
    const user = await User.findOne({ verificationToken: tokenHash });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token',
      });
    }

    // Check if token has expired
    if (user.verificationTokenExpires < Date.now()) {
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();

      return res.status(400).json({
        success: false,
        error: 'Verification token has expired',
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified',
      });
    }

    // Generate new verification token
    const { token, hash } = generateVerificationToken();
    const expiresAt = getTokenExpiration(60); // 1 hour expiration

    user.verificationToken = hash;
    user.verificationTokenExpires = expiresAt;
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security reasons
      return res.status(200).json({
        success: true,
        message: 'If a matching email exists, a password reset link has been sent',
      });
    }

    // Generate password reset token
    const { token, hash } = generateVerificationToken();
    const expiresAt = getTokenExpiration(60); // 1 hour expiration

    user.resetPasswordToken = hash;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken: token,
    });

    // Check if email failed to send
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Still save the token so user can try again
      return res.status(500).json({
        success: false,
        error: 'Failed to send reset email. Please try again later.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'If a matching email exists, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    console.log('Password reset attempt - token length:', token?.length, 'password length:', password?.length);

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and password are required',
      });
    }

    // Hash the token to compare with stored hash
    const tokenHash = hashToken(token);

    // Find user with matching token - MUST include password field
    const user = await User.findOne({ resetPasswordToken: tokenHash }).select('+password');

    if (!user) {
      console.log('No user found with reset token');
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
    }

    console.log('User found:', user.email);

    // Check if token has expired
    if (user.resetPasswordExpires < Date.now()) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(400).json({
        success: false,
        error: 'Reset token has expired',
      });
    }

    console.log('Token valid, updating password');

    // Update password and verify email (if they can reset via email, they have access to it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.emailVerified = true; // Auto-verify email since they accessed the reset link

    console.log('Before save - isModified(password):', user.isModified('password'));
    await user.save();
    console.log('Password saved successfully and email verified');

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};