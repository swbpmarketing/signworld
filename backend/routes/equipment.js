const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get equipment statistics
// @route   GET /api/equipment/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalEquipment = await Equipment.countDocuments({ isActive: true });

    // Get category counts
    const categoryCounts = await Equipment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoryCountsObj = {};
    categoryCounts.forEach(cat => {
      categoryCountsObj[cat._id] = cat.count;
    });

    // Get brand counts
    const brandCounts = await Equipment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$brand', count: { $sum: 1 } } }
    ]);

    const brandCountsObj = {};
    brandCounts.forEach(brand => {
      brandCountsObj[brand._id] = brand.count;
    });

    // Get unique brands
    const brands = await Equipment.distinct('brand', { isActive: true });

    res.json({
      success: true,
      data: {
        totalEquipment,
        categoryCounts: categoryCountsObj,
        brandCounts: brandCountsObj,
        brands: brands.sort(),
      }
    });
  } catch (error) {
    console.error('Error fetching equipment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching equipment statistics'
    });
  }
});

// @desc    Get vendor's own equipment listings
// @route   GET /api/equipment/my-listings
// @access  Private/Vendor
router.get('/my-listings', protect, authorize('vendor', 'admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { vendorId: req.user.id };

    const equipment = await Equipment.find(query)
      .sort({ createdAt: -1 })
      .select('-__v -inquiries');

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Error fetching vendor equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching equipment listings'
    });
  }
});

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      featured,
      inStock,
      limit = 20,
      page = 1,
      sort = 'featured'
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (brand) {
      // Support multiple brands (comma separated)
      const brands = brand.split(',').map(b => b.trim());
      query.brand = { $in: brands };
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (inStock === 'true') {
      query.availability = 'in-stock';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort options
    let sortOption = { isFeatured: -1, sortOrder: 1, createdAt: -1 };
    switch (sort) {
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'featured':
      default:
        sortOption = { isFeatured: -1, sortOrder: 1, createdAt: -1 };
    }

    // Execute query with pagination
    const equipment = await Equipment.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v -inquiries');

    // Get total count for pagination
    const count = await Equipment.countDocuments(query);

    res.json({
      success: true,
      data: equipment,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching equipment'
    });
  }
});

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('relatedProducts', 'name image price brand category');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching equipment'
    });
  }
});

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private/Admin or Vendor
router.post('/', protect, authorize('admin', 'vendor'), async (req, res) => {
  try {
    const equipmentData = { ...req.body };

    // If vendor is creating, set vendorId to their user ID
    if (req.user.role === 'vendor') {
      equipmentData.vendorId = req.user.id;
      // Vendors can't set featured status
      delete equipmentData.isFeatured;
      delete equipmentData.sortOrder;
    }

    // Parse specifications if string
    if (typeof equipmentData.specifications === 'string') {
      equipmentData.specifications = JSON.parse(equipmentData.specifications);
    }

    // Parse features if string
    if (typeof equipmentData.features === 'string') {
      equipmentData.features = JSON.parse(equipmentData.features);
    }

    const equipment = await Equipment.create(equipmentData);

    res.status(201).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private/Admin or Vendor (own equipment only)
router.put('/:id', protect, authorize('admin', 'vendor'), async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    // Vendors can only update their own equipment
    if (req.user.role === 'vendor' && equipment.vendorId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this equipment'
      });
    }

    const updateData = { ...req.body };

    // Vendors can't change certain fields
    if (req.user.role === 'vendor') {
      delete updateData.vendorId;
      delete updateData.isFeatured;
      delete updateData.sortOrder;
    }

    // Parse specifications if string
    if (typeof updateData.specifications === 'string') {
      updateData.specifications = JSON.parse(updateData.specifications);
    }

    // Parse features if string
    if (typeof updateData.features === 'string') {
      updateData.features = JSON.parse(updateData.features);
    }

    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedEquipment
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private/Admin or Vendor (own equipment only)
router.delete('/:id', protect, authorize('admin', 'vendor'), async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    // Vendors can only delete their own equipment
    if (req.user.role === 'vendor' && equipment.vendorId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this equipment'
      });
    }

    await Equipment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting equipment'
    });
  }
});

// @desc    Submit inquiry for equipment
// @route   POST /api/equipment/:id/inquiry
// @access  Public (but user info captured if logged in)
router.post('/:id/inquiry', async (req, res) => {
  try {
    const { name, email, company, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and message'
      });
    }

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    const inquiry = {
      name,
      email,
      company,
      phone,
      message,
      status: 'new',
      createdAt: new Date()
    };

    // Add user ID if authenticated
    if (req.user) {
      inquiry.user = req.user.id;
    }

    equipment.inquiries.push(inquiry);
    await equipment.save();

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({
      success: false,
      error: 'Error submitting inquiry'
    });
  }
});

module.exports = router;
