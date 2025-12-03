const express = require('express');
const router = express.Router();
const Brag = require('../models/Brag');
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const { bragFiles } = require('../middleware/upload');

// @desc    Get all success stories with pagination and filtering
// @route   GET /api/brags
// @access  Public (only published stories) / Admin can see all
router.get('/', optionalProtect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      sort = '-createdAt',
      search,
      tag,
      author,
      status = 'published'
    } = req.query;

    // Build query - only show published stories for non-admins
    const query = {};

    // If user is admin, they can see all statuses
    if (req.query.status && req.user && req.user.role === 'admin') {
      if (status === 'all') {
        query.isPublished = { $in: [true, false] };
      } else if (status === 'pending') {
        query.status = 'pending';
        query.isPublished = false;
      } else if (status === 'approved') {
        query.status = 'approved';
      } else if (status === 'rejected') {
        query.status = 'rejected';
      } else {
        query.isPublished = true;
      }
    } else {
      // Non-admins only see published stories
      query.isPublished = true;
      query.status = 'approved';
    }

    // Filter by tags
    if (tag) {
      query.tags = tag;
    }

    // Filter by author
    if (author) {
      query.author = author;
    }

    // Search in title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort order
    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { views: -1, likes: -1 };
        break;
      case 'likes':
        sortOption = { likes: -1 };
        break;
      case 'views':
        sortOption = { views: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get stories with pagination
    const brags = await Brag.find(query)
      .populate('author', 'name email role location company')
      .populate('moderatedBy', 'name email')
      .populate('likes', 'name')
      .populate('comments.user', 'name email')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Brag.countDocuments(query);

    // Format brags with calculated fields
    const formattedBrags = brags.map(brag => ({
      ...brag,
      likesCount: brag.likes?.length || 0,
      commentsCount: brag.comments?.length || 0,
      isLiked: false, // Will be set on frontend based on current user
    }));

    res.status(200).json({
      success: true,
      data: formattedBrags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching brags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch success stories'
    });
  }
});

// @desc    Get public success stories statistics
// @route   GET /api/brags/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const publishedStories = await Brag.countDocuments({ isPublished: true, status: 'approved' });

    // Get total views, likes, and comments for published stories only
    const stats = await Brag.aggregate([
      { $match: { isPublished: true, status: 'approved' } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: { $size: '$likes' } },
          totalComments: { $sum: { $size: '$comments' } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        publishedStories,
        totalViews: stats[0]?.totalViews || 0,
        totalLikes: stats[0]?.totalLikes || 0,
        totalComments: stats[0]?.totalComments || 0
      }
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// @desc    Get success stories statistics (detailed)
// @route   GET /api/brags/admin/stats
// @access  Private (admin only)
router.get('/admin/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalStories = await Brag.countDocuments();
    const publishedStories = await Brag.countDocuments({ isPublished: true });
    const pendingStories = await Brag.countDocuments({ status: 'pending' });
    const rejectedStories = await Brag.countDocuments({ status: 'rejected' });

    // Get total views and likes
    const stats = await Brag.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: { $size: '$likes' } },
          totalComments: { $sum: { $size: '$comments' } }
        }
      }
    ]);

    // Get top contributors
    const topContributors = await Brag.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$author', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'author' } },
      { $unwind: '$author' },
      { $project: { name: '$author.name', email: '$author.email', count: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStories,
        publishedStories,
        pendingStories,
        rejectedStories,
        totalViews: stats[0]?.totalViews || 0,
        totalLikes: stats[0]?.totalLikes || 0,
        totalComments: stats[0]?.totalComments || 0,
        topContributors
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// @desc    Get user's own success stories
// @route   GET /api/brags/user/my-stories
// @access  Private
router.get('/user/my-stories', protect, async (req, res) => {
  try {
    const brags = await Brag.find({ author: req.user.id })
      .populate('moderatedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: brags
    });
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your stories'
    });
  }
});

// @desc    Get user's own success stories statistics
// @route   GET /api/brags/user/my-stats
// @access  Private
router.get('/user/my-stats', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Count user's stories (published only)
    const publishedStories = await Brag.countDocuments({
      author: userId,
      isPublished: true,
      status: 'approved'
    });

    // Get total views, likes, and comments for user's stories
    const stats = await Brag.aggregate([
      { $match: { author: userId, isPublished: true, status: 'approved' } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: { $size: '$likes' } },
          totalComments: { $sum: { $size: '$comments' } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        publishedStories,
        totalViews: stats[0]?.totalViews || 0,
        totalLikes: stats[0]?.totalLikes || 0,
        totalComments: stats[0]?.totalComments || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your statistics'
    });
  }
});

// @desc    Get single success story by ID
// @route   GET /api/brags/:id
// @access  Public (only published stories) / Admin can see all
router.get('/:id', optionalProtect, async (req, res) => {
  try {
    const brag = await Brag.findById(req.params.id)
      .populate('author', 'name email role location company')
      .populate('moderatedBy', 'name email')
      .populate('likes', 'name')
      .populate('comments.user', 'name email');

    if (!brag) {
      return res.status(404).json({
        success: false,
        error: 'Success story not found'
      });
    }

    // Check if user can view unpublished stories
    if (!brag.isPublished && (!req.user || (req.user.role !== 'admin' && req.user.id !== brag.author._id.toString()))) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this story'
      });
    }

    // Increment view count (only for published stories)
    if (brag.isPublished) {
      brag.views += 1;
      await brag.save();
    }

    res.status(200).json({
      success: true,
      data: {
        ...brag.toObject(),
        likesCount: brag.likes?.length || 0,
        commentsCount: brag.comments?.length || 0,
        isLiked: req.user ? brag.likes.some(like => like._id.toString() === req.user.id) : false
      }
    });
  } catch (error) {
    console.error('Error fetching brag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch success story'
    });
  }
});

// @desc    Create new success story
// @route   POST /api/brags
// @access  Private (authenticated users)
router.post('/', protect, bragFiles, async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title and content'
      });
    }

    // Handle image uploads
    let featuredImage = null;
    let images = [];

    if (req.files) {
      if (req.files.featuredImage && req.files.featuredImage[0]) {
        featuredImage = req.files.featuredImage[0].s3Url || req.files.featuredImage[0].location;
      }

      if (req.files.images) {
        images = req.files.images.map(file => ({
          url: file.s3Url || file.location,
          caption: file.originalname
        }));
      }
    }

    // Create brag
    const brag = await Brag.create({
      title,
      content,
      author: req.user.id,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      featuredImage,
      images,
      status: 'pending', // New stories need approval
      isPublished: false
    });

    // Populate author information
    await brag.populate('author', 'name email role location company');

    res.status(201).json({
      success: true,
      data: brag,
      message: 'Success story submitted for review'
    });
  } catch (error) {
    console.error('Error creating brag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create success story'
    });
  }
});

// @desc    Update success story
// @route   PUT /api/brags/:id
// @access  Private (author or admin)
router.put('/:id', protect, bragFiles, async (req, res) => {
  try {
    let brag = await Brag.findById(req.params.id);

    if (!brag) {
      return res.status(404).json({
        success: false,
        error: 'Success story not found'
      });
    }

    // Check if user is author or admin
    if (brag.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this story'
      });
    }

    const { title, content, tags } = req.body;

    // Update fields
    if (title) brag.title = title;
    if (content) brag.content = content;
    if (tags) brag.tags = Array.isArray(tags) ? tags : [tags];

    // Handle image uploads
    if (req.files) {
      if (req.files.featuredImage && req.files.featuredImage[0]) {
        brag.featuredImage = req.files.featuredImage[0].s3Url || req.files.featuredImage[0].location;
      }

      if (req.files.images) {
        const newImages = req.files.images.map(file => ({
          url: file.s3Url || file.location,
          caption: file.originalname
        }));
        brag.images = [...brag.images, ...newImages];
      }
    }

    // If author edits, reset to pending for re-approval
    if (brag.author.toString() === req.user.id && req.user.role !== 'admin') {
      brag.status = 'pending';
      brag.isPublished = false;
    }

    await brag.save();
    await brag.populate('author', 'name email role location company');

    res.status(200).json({
      success: true,
      data: brag,
      message: 'Success story updated successfully'
    });
  } catch (error) {
    console.error('Error updating brag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update success story'
    });
  }
});

// @desc    Delete success story
// @route   DELETE /api/brags/:id
// @access  Private (author or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const brag = await Brag.findById(req.params.id);

    if (!brag) {
      return res.status(404).json({
        success: false,
        error: 'Success story not found'
      });
    }

    // Check if user is author or admin
    if (brag.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this story'
      });
    }

    await brag.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Success story deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete success story'
    });
  }
});

// @desc    Like/Unlike success story
// @route   POST /api/brags/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const brag = await Brag.findById(req.params.id);

    if (!brag) {
      return res.status(404).json({
        success: false,
        error: 'Success story not found'
      });
    }

    // Check if already liked
    const likeIndex = brag.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      // Unlike
      brag.likes.splice(likeIndex, 1);
    } else {
      // Like
      brag.likes.push(req.user.id);
    }

    await brag.save();

    // Emit real-time like update
    const io = req.app.get('io');
    if (io) {
      io.to('brags').emit('brag:like', {
        storyId: brag._id,
        likesCount: brag.likes.length,
        userId: req.user.id,
        isLiked: likeIndex === -1
      });
    }

    res.status(200).json({
      success: true,
      data: {
        likes: brag.likes.length,
        isLiked: likeIndex === -1
      },
      message: likeIndex > -1 ? 'Story unliked' : 'Story liked'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
});

// @desc    Add comment to success story
// @route   POST /api/brags/:id/comment
// @access  Private
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }

    const brag = await Brag.findById(req.params.id);

    if (!brag) {
      return res.status(404).json({
        success: false,
        error: 'Success story not found'
      });
    }

    // Add comment
    brag.comments.push({
      user: req.user.id,
      text: text.trim(),
      createdAt: Date.now()
    });

    await brag.save();
    await brag.populate('comments.user', 'name email');

    // Get the newly added comment
    const newComment = brag.comments[brag.comments.length - 1];

    // Emit real-time comment update
    const io = req.app.get('io');
    if (io) {
      io.to('brags').emit('brag:comment', {
        storyId: brag._id,
        comment: newComment,
        commentsCount: brag.comments.length
      });
    }

    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// @desc    Delete comment from success story
// @route   DELETE /api/brags/:id/comment/:commentId
// @access  Private (comment author or admin)
router.delete('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const brag = await Brag.findById(req.params.id);

    if (!brag) {
      return res.status(404).json({
        success: false,
        error: 'Success story not found'
      });
    }

    // Find comment
    const comment = brag.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user is comment author or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    // Remove comment
    comment.deleteOne();
    await brag.save();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

// @desc    Moderate success story (approve/reject)
// @route   PUT /api/brags/:id/moderate
// @access  Private (admin only)
router.put('/:id/moderate', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, moderatorNotes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status (approved or rejected) is required'
      });
    }

    const brag = await Brag.findById(req.params.id);

    if (!brag) {
      return res.status(404).json({
        success: false,
        error: 'Success story not found'
      });
    }

    // Update moderation fields
    brag.status = status;
    brag.isPublished = status === 'approved';
    brag.moderatorNotes = moderatorNotes || '';
    brag.moderatedBy = req.user.id;
    brag.moderatedAt = Date.now();

    if (status === 'approved') {
      brag.publishedAt = Date.now();
    }

    await brag.save();
    await brag.populate('author', 'name email role location company');
    await brag.populate('moderatedBy', 'name email');
    await brag.populate('likes', 'name');
    await brag.populate('comments.user', 'name email');

    // Emit real-time update when story is approved (new story for everyone)
    const io = req.app.get('io');
    if (io && status === 'approved') {
      io.to('brags').emit('brag:new', {
        story: {
          ...brag.toObject(),
          likesCount: brag.likes?.length || 0,
          commentsCount: brag.comments?.length || 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: brag,
      message: `Success story ${status}`
    });
  } catch (error) {
    console.error('Error moderating brag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to moderate success story'
    });
  }
});

module.exports = router;
