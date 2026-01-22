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
router.get('/territories', async (req, res) => {
  try {
    const User = require('../models/User');
    const territories = await User.aggregate([
      { $match: { role: 'owner', 'address.state': { $exists: true } } },
      { $group: { _id: '$address.state', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const totalCount = territories.reduce((sum, t) => sum + t.count, 0);
    const result = [
      { name: 'All Territories', count: totalCount },
      ...territories.map(t => ({ name: t._id, count: t.count }))
    ];
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});
router.get('/specialties', async (req, res) => {
  try {
    const User = require('../models/User');
    const specialties = await User.aggregate([
      { $match: { role: 'owner', specialties: { $exists: true, $ne: [] } } },
      { $unwind: '$specialties' },
      { $group: { _id: '$specialties', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: specialties.map(s => ({ name: s._id, count: s.count })) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});
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
