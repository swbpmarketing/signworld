const User = require('../models/User');
const { sendWelcomeEmail } = require('../utils/emailService');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const { role, isActive, specialties, state, search, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (specialties) query.specialties = { $in: specialties.split(',') };
    if (state) query['address.state'] = state;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      total: count,
      pagination: {
        page: Number(page),
        pages: Math.ceil(count / limit),
      },
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

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

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    // Store the plain text password before it gets hashed
    const plainPassword = req.body.password;

    const user = await User.create(req.body);

    // Send welcome email with credentials
    try {
      await sendWelcomeEmail({
        name: user.name,
        email: user.email,
        password: plainPassword,
        role: user.role,
      });
      console.log('Welcome email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
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

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

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

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Upload user profile image
// @route   PUT /api/users/:id/photo
// @access  Private
exports.uploadPhoto = async (req, res) => {
  try {
    console.log('uploadPhoto controller called');
    console.log('req.file:', req.file ? { s3Url: req.file.s3Url, location: req.file.location } : 'none');
    console.log('req.params.id:', req.params.id);
    console.log('req.user:', req.user ? { _id: req.user._id, role: req.user.role } : 'none');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file',
      });
    }

    const user = await User.findById(req.params.id);
    console.log('User found:', user ? user._id : 'not found');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user can update this profile
    const userIdMatch = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';
    console.log('Auth check:', { userIdMatch, isAdmin, reqUserId: req.user._id.toString(), paramId: req.params.id });

    if (!userIdMatch && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile',
      });
    }

    // Update user with image URL (will be set by upload middleware)
    const imageUrl = req.file.s3Url || req.file.location || req.file.path;
    console.log('Image URL:', imageUrl);

    if (!imageUrl) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get uploaded file URL',
      });
    }

    // Use findByIdAndUpdate to avoid triggering geospatial validation on location field
    console.log('Updating user with profileImage...');
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { profileImage: imageUrl },
      { new: true }
    );
    console.log('User updated successfully');

    res.status(200).json({
      success: true,
      data: {
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (error) {
    console.error('uploadPhoto error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};