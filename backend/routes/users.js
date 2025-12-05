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
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Owner stats route (must be before /:id route) - restricted to admin and owner roles
router.get('/owner-stats', authorize('admin', 'owner'), getOwnerStats);

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