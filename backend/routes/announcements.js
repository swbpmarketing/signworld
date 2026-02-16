const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/announcements
// @desc    Get active announcements (all authenticated users)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ priority: -1, createdAt: -1 })
      .populate('createdBy', 'name');

    res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/announcements/all
// @desc    Get all announcements including inactive (admin only)
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');

    res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST /api/announcements
// @desc    Create announcement
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, message, type, priority, targetRoles } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      type: type || 'info',
      priority: priority || 0,
      targetRoles: targetRoles || ['admin', 'owner', 'vendor'],
      createdBy: req.user._id
    });

    await announcement.populate('createdBy', 'name');

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update announcement
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, message, type, isActive, priority, targetRoles } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    if (title !== undefined) announcement.title = title;
    if (message !== undefined) announcement.message = message;
    if (type !== undefined) announcement.type = type;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (priority !== undefined) announcement.priority = priority;
    if (targetRoles !== undefined) announcement.targetRoles = targetRoles;

    await announcement.save();
    await announcement.populate('createdBy', 'name');

    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    await announcement.deleteOne();

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
