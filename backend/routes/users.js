const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadPhoto,
  getOwnerStats,
} = require('../controllers/userController');
const { protect, authorize, handlePreviewMode } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Owner stats route (must be before /:id route) - restricted to admin and owner roles
router.get('/owner-stats', authorize('admin', 'owner'), handlePreviewMode, getOwnerStats);

// Search users for preview modal (must be before /:id route)
router.get('/search/preview', authorize('admin'), async (req, res) => {
  try {
    const { search, role, limit = 20 } = req.query;
    const query = { isActive: true };

    // Exclude admins from preview
    if (role && role !== 'admin') {
      query.role = role;
    } else {
      query.role = { $in: ['owner', 'vendor'] };
    }

    // Apply search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const User = require('../models/User');
    const users = await User.find(query)
      .select('name email role company profileImage')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Server error searching users',
    });
  }
});

router
  .route('/')
  .get(getUsers)
  .post(authorize('admin'), createUser);

router
  .route('/:id')
  .get(getUser)
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

router.put('/:id/photo', ...upload.single('file'), uploadPhoto);

module.exports = router;