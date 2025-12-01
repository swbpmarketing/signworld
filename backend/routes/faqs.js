const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get FAQ statistics
// @route   GET /api/faqs/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalFAQs = await FAQ.countDocuments({ isActive: true });

    // Get category counts
    const categoryCounts = await FAQ.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoryCountsObj = {};
    categoryCounts.forEach(cat => {
      categoryCountsObj[cat._id] = cat.count;
    });

    // Get popular searches (most viewed FAQs)
    const popularFAQs = await FAQ.find({ isActive: true })
      .sort({ views: -1 })
      .limit(6)
      .select('question');

    const popularSearches = popularFAQs.map(faq => {
      // Extract key phrase from question
      const question = faq.question.toLowerCase();
      if (question.includes('troubleshoot')) return 'printer troubleshooting';
      if (question.includes('financ')) return 'financing options';
      if (question.includes('insurance')) return 'insurance requirements';
      if (question.includes('training')) return 'training videos';
      if (question.includes('vendor')) return 'vendor discounts';
      if (question.includes('install')) return 'installation guides';
      // Default: first 3 words
      return question.split(' ').slice(0, 3).join(' ');
    });

    res.json({
      success: true,
      data: {
        totalFAQs,
        categoryCounts: categoryCountsObj,
        popularSearches: [...new Set(popularSearches)].slice(0, 6)
      }
    });
  } catch (error) {
    console.error('Error fetching FAQ stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching FAQ statistics'
    });
  }
});

// @desc    Get all FAQs
// @route   GET /api/faqs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      limit = 50,
      page = 1,
      sort = 'order'
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (category && category !== 'all' && category !== 'All Topics') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort options
    let sortOption = { order: 1, createdAt: -1 };
    switch (sort) {
      case 'views':
        sortOption = { views: -1 };
        break;
      case 'helpful':
        sortOption = { 'helpful.length': -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'order':
      default:
        sortOption = { order: 1, createdAt: -1 };
    }

    // Execute query with pagination
    const faqs = await FAQ.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    // Get total count for pagination
    const count = await FAQ.countDocuments(query);

    // Transform the data to match frontend expectations
    const transformedFAQs = faqs.map(faq => {
      const helpfulCount = faq.helpful.filter(h => h.isHelpful).length;
      const notHelpfulCount = faq.helpful.filter(h => !h.isHelpful).length;

      return {
        _id: faq._id,
        id: faq._id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        tags: faq.tags,
        views: faq.views,
        helpful: helpfulCount,
        notHelpful: notHelpfulCount,
        order: faq.order,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt
      };
    });

    res.json({
      success: true,
      data: transformedFAQs,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching FAQs'
    });
  }
});

// @desc    Get single FAQ
// @route   GET /api/faqs/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate('relatedFAQs', 'question category');

    if (!faq) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
    }

    // Transform response
    const helpfulCount = faq.helpful.filter(h => h.isHelpful).length;
    const notHelpfulCount = faq.helpful.filter(h => !h.isHelpful).length;

    res.json({
      success: true,
      data: {
        _id: faq._id,
        id: faq._id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        tags: faq.tags,
        views: faq.views,
        helpful: helpfulCount,
        notHelpful: notHelpfulCount,
        relatedFAQs: faq.relatedFAQs,
        order: faq.order,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching FAQ'
    });
  }
});

// @desc    Increment FAQ view count
// @route   POST /api/faqs/:id/view
// @access  Public
router.post('/:id/view', async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
    }

    res.json({
      success: true,
      data: { views: faq.views }
    });
  } catch (error) {
    console.error('Error updating FAQ views:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating FAQ views'
    });
  }
});

// @desc    Vote on FAQ helpfulness
// @route   POST /api/faqs/:id/helpful
// @access  Public
router.post('/:id/helpful', async (req, res) => {
  try {
    const { isHelpful, visitorId } = req.body;

    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Please provide isHelpful as boolean'
      });
    }

    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
    }

    // Use visitorId or IP as unique identifier for anonymous votes
    const uniqueId = visitorId || req.ip;

    // Check if this visitor already voted
    const existingVoteIndex = faq.helpful.findIndex(
      h => h.visitorId === uniqueId
    );

    if (existingVoteIndex !== -1) {
      // Update existing vote
      faq.helpful[existingVoteIndex].isHelpful = isHelpful;
    } else {
      // Add new vote
      faq.helpful.push({
        visitorId: uniqueId,
        isHelpful,
        createdAt: new Date()
      });
    }

    await faq.save();

    const helpfulCount = faq.helpful.filter(h => h.isHelpful).length;
    const notHelpfulCount = faq.helpful.filter(h => !h.isHelpful).length;

    res.json({
      success: true,
      data: {
        helpful: helpfulCount,
        notHelpful: notHelpfulCount
      }
    });
  } catch (error) {
    console.error('Error voting on FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Error voting on FAQ'
    });
  }
});

// @desc    Create new FAQ
// @route   POST /api/faqs
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const faqData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Parse tags if string
    if (typeof faqData.tags === 'string') {
      faqData.tags = faqData.tags.split(',').map(tag => tag.trim());
    }

    const faq = await FAQ.create(faqData);

    res.status(201).json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Update FAQ
// @route   PUT /api/faqs/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Parse tags if string
    if (typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
    }

    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Delete FAQ
// @route   DELETE /api/faqs/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
    }

    await FAQ.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting FAQ'
    });
  }
});

module.exports = router;
