const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const generateToken = require('../utils/generateToken');
const { sendWelcomeEmail } = require('../utils/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (Admin only can register new users)
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
    });

    // Send welcome email with credentials (non-blocking)
    sendWelcomeEmail({
      name: user.name,
      email: user.email,
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