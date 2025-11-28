const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getOwners,
  getOwner,
  getOwnerReviews,
  createOwnerReview,
  createOwner,
  updateOwner,
  deleteOwner,
  getOwnerStats,
  getMapOwners,
  getNearbyOwners
} = require('../controllers/ownerController');

// Public routes
router.get('/', getOwners);
router.get('/map', getMapOwners);
router.get('/nearby', getNearbyOwners);
router.get('/:id', getOwner);
router.get('/:id/reviews', getOwnerReviews);
router.get('/:id/stats', getOwnerStats);

// Protected routes
router.post('/:id/reviews', protect, createOwnerReview);
router.put('/:id', protect, updateOwner);

// Admin only routes
router.post('/', protect, authorize('admin'), createOwner);
router.delete('/:id', protect, authorize('admin'), deleteOwner);

module.exports = router;
