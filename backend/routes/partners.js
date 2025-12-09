const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Partner = require('../models/Partner');
const upload = require('../middleware/upload');

// @route   GET /api/partners/stats
router.get('/stats', async (req, res) => {
  try {
    const totalPartners = await Partner.countDocuments({ isActive: true });
    const featuredPartners = await Partner.countDocuments({ isActive: true, isFeatured: true });
    const verifiedPartners = await Partner.countDocuments({ isActive: true, isVerified: true });
    const ratingAgg = await Partner.aggregate([
      { $match: { isActive: true, rating: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = ratingAgg.length > 0 ? Math.round(ratingAgg[0].avgRating * 10) / 10 : 0;
    const partnersWithDiscounts = await Partner.find({ isActive: true, discount: { $ne: '' } });
    const annualSavings = partnersWithDiscounts.length * 50000;
    res.json({
      success: true,
      data: { totalPartners, featuredPartners, verifiedPartners, avgRating, annualSavings,
        verifiedPercent: totalPartners > 0 ? Math.round((verifiedPartners / totalPartners) * 100) : 0 }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @route   GET /api/partners/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Partner.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0);
    const result = [{ name: 'All Partners', count: totalCount }, ...categories.map(cat => ({ name: cat._id, count: cat.count }))];
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @route   GET /api/partners
router.get('/', async (req, res) => {
  try {
    const { category, country, featured, search, sort = 'featured', page = 1, limit = 20 } = req.query;
    let query = { isActive: true };
    if (category && category !== 'All Partners') query.category = category;
    if (country && country !== 'all') query.country = country;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { specialties: { $regex: search, $options: 'i' } }
      ];
    }
    let sortOption = {};
    switch (sort) {
      case 'featured': sortOption = { isFeatured: -1, sortOrder: 1, rating: -1 }; break;
      case 'rating': sortOption = { rating: -1, reviewCount: -1 }; break;
      case 'name': sortOption = { name: 1 }; break;
      case 'name-desc': sortOption = { name: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      case 'oldest': sortOption = { createdAt: 1 }; break;
      default: sortOption = { isFeatured: -1, sortOrder: 1 };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [partners, total] = await Promise.all([
      Partner.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)),
      Partner.countDocuments(query)
    ]);
    res.json({ success: true, count: partners.length, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), data: partners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @route   GET /api/partners/vendor-stats
// @desc    Get vendor's own statistics for reports
// @access  Private (Vendor)
router.get('/vendor-stats', protect, authorize('vendor', 'admin'), async (req, res) => {
  try {
    // Get vendor's partner profile
    const partner = await Partner.findOne({ vendorId: req.user.id });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner profile not found',
      });
    }

    // Calculate view change percentage (compare last 7 days to previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let recentViews = 0;
    let previousViews = 0;

    if (partner.viewHistory && partner.viewHistory.length > 0) {
      partner.viewHistory.forEach(view => {
        const viewDate = new Date(view.date);
        if (viewDate >= sevenDaysAgo) {
          recentViews += view.count;
        } else if (viewDate >= fourteenDaysAgo && viewDate < sevenDaysAgo) {
          previousViews += view.count;
        }
      });
    }

    const viewsChange = previousViews > 0
      ? Math.round(((recentViews - previousViews) / previousViews) * 100)
      : recentViews > 0 ? 100 : 0;

    // Calculate profile stats
    const profileStats = {
      rating: partner.rating || 0,
      reviewCount: partner.reviewCount || 0,
      isVerified: partner.isVerified || false,
      isFeatured: partner.isFeatured || false,
      specialtiesCount: partner.specialties?.length || 0,
      benefitsCount: partner.benefits?.length || 0,
      documentsCount: partner.documents?.length || 0,
      activeOffersCount: partner.specialOffers?.filter(o => !o.validUntil || new Date(o.validUntil) > new Date()).length || 0,
      expiredOffersCount: partner.specialOffers?.filter(o => o.validUntil && new Date(o.validUntil) <= new Date()).length || 0,
      profileViews: partner.profileViews || 0,
      viewsChange: viewsChange,
    };

    // Get reviews breakdown
    const reviewsBreakdown = {
      total: partner.reviews?.length || 0,
      ratings: {
        5: partner.reviews?.filter(r => r.rating === 5).length || 0,
        4: partner.reviews?.filter(r => r.rating === 4).length || 0,
        3: partner.reviews?.filter(r => r.rating === 3).length || 0,
        2: partner.reviews?.filter(r => r.rating === 2).length || 0,
        1: partner.reviews?.filter(r => r.rating === 1).length || 0,
      },
      recentReviews: partner.reviews?.slice(-5).reverse() || [],
    };

    // Get special offers data
    const specialOffers = partner.specialOffers?.map(offer => ({
      title: offer.title,
      description: offer.description,
      validUntil: offer.validUntil,
      discountPercent: offer.discountPercent,
      isActive: !offer.validUntil || new Date(offer.validUntil) > new Date(),
    })) || [];

    res.json({
      success: true,
      data: {
        profile: {
          name: partner.name,
          category: partner.category,
          country: partner.country,
          createdAt: partner.createdAt,
        },
        profileStats,
        reviewsBreakdown,
        specialOffers,
      },
    });
  } catch (err) {
    console.error('Error fetching vendor stats:', err);
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

// @route   POST /api/partners/:id/view
// @desc    Track partner profile view
// @access  Public
router.post('/:id/view', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    // Increment total views
    partner.profileViews = (partner.profileViews || 0) + 1;

    // Track view history by day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!partner.viewHistory) {
      partner.viewHistory = [];
    }

    const todayEntry = partner.viewHistory.find(v => {
      const viewDate = new Date(v.date);
      viewDate.setHours(0, 0, 0, 0);
      return viewDate.getTime() === today.getTime();
    });

    if (todayEntry) {
      todayEntry.count += 1;
    } else {
      partner.viewHistory.push({ date: today, count: 1 });
      // Keep only last 90 days of history
      if (partner.viewHistory.length > 90) {
        partner.viewHistory = partner.viewHistory.slice(-90);
      }
    }

    await partner.save();

    res.json({ success: true, data: { views: partner.profileViews } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @route   GET /api/partners/:id
// @desc    Get single partner
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id).populate('reviews.user', 'firstName lastName');
    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }
    res.json({ success: true, data: partner });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
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

// @route   POST /api/partners/upload-logo
// @desc    Upload partner logo image
// @access  Private (Vendor)
router.post('/upload-logo', protect, authorize('vendor', 'admin'), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No logo file uploaded',
      });
    }

    const logoUrl = req.file.s3Url || req.file.location;

    res.json({
      success: true,
      data: {
        logoUrl: logoUrl,
      },
    });
  } catch (err) {
    console.error('Logo upload error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to upload logo',
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

// @route   POST /api/partners/:id/reviews
// @desc    Add review to partner
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Please provide a rating between 1 and 5' });
    }
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }
    const alreadyReviewed = partner.reviews.find(r => r.user.toString() === req.user.id);
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, error: 'You have already reviewed this partner' });
    }
    partner.reviews.push({ user: req.user.id, rating: Number(rating), comment: comment || '' });
    await partner.save();
    res.status(201).json({ success: true, data: partner });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
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
