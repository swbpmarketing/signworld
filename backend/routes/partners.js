const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Partner = require('../models/Partner');

// @route   GET /api/partners
// @desc    Get all partners
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, country, featured } = req.query;

    let query = { isActive: true };

    if (category) query.category = category;
    if (country) query.country = country;
    if (featured === 'true') query.isFeatured = true;

    const partners = await Partner.find(query).sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      count: partners.length,
      data: partners,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Server Error',
    });
  }
});

// @route   GET /api/partners/my-profile
// @desc    Get vendor's own partner profile
// @access  Private (Vendor)
router.get('/my-profile', protect, authorize('vendor'), async (req, res) => {
  try {
    const partner = await Partner.findOne({ vendorId: req.user.id });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner profile not found',
      });
    }

    res.json({
      success: true,
      data: partner,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Server Error',
    });
  }
});

// @route   GET /api/partners/:id
// @desc    Get single partner
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found',
      });
    }

    res.json({
      success: true,
      data: partner,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Server Error',
    });
  }
});

// @route   POST /api/partners
// @desc    Create new partner
// @access  Private (Admin or Vendor)
router.post('/', protect, authorize('admin', 'vendor'), async (req, res) => {
  try {
    // If vendor, automatically set vendorId to current user
    if (req.user.role === 'vendor') {
      // Check if vendor already has a partner profile
      const existingPartner = await Partner.findOne({ vendorId: req.user.id });
      if (existingPartner) {
        return res.status(400).json({
          success: false,
          error: 'You already have a partner profile',
        });
      }
      req.body.vendorId = req.user.id;
    }

    const partner = await Partner.create(req.body);

    res.status(201).json({
      success: true,
      data: partner,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message || 'Bad Request',
    });
  }
});

// @route   PUT /api/partners/:id
// @desc    Update partner
// @access  Private (Admin or Vendor owns it)
router.put('/:id', protect, async (req, res) => {
  try {
    let partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found',
      });
    }

    // Check if user is admin or owns this partner profile
    if (req.user.role !== 'admin' && partner.vendorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this partner',
      });
    }

    // Vendors cannot change vendorId, isActive, isFeatured, or sortOrder
    if (req.user.role === 'vendor') {
      delete req.body.vendorId;
      delete req.body.isActive;
      delete req.body.isFeatured;
      delete req.body.sortOrder;
    }

    partner = await Partner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: partner,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message || 'Bad Request',
    });
  }
});

// @route   DELETE /api/partners/:id
// @desc    Delete partner
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found',
      });
    }

    await partner.deleteOne();

    res.json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Server Error',
    });
  }
});

module.exports = router;
