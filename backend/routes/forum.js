const express = require('express');
const router = express.Router();
const ForumThread = require('../models/ForumThread');
const { protect } = require('../middleware/auth');
const { forumFiles } = require('../middleware/upload');

// @desc    Get all forum threads with pagination and filtering
// @route   GET /api/forum
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      sort = '-createdAt',
      search,
      tag,
      status = 'active'
    } = req.query;

    // Build query
    const query = { status };

    // Filter by category
    if (category && category !== 'All Categories') {
      query.category = category.toLowerCase();
    }

    // Filter by tag
    if (tag) {
      query.tags = tag;
    }

    // Search in title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get threads with pagination
    const threads = await ForumThread.find(query)
      .populate('author', 'name email role')
      .populate('lastReplyBy', 'name email')
      .populate('replies.author', 'name email role')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await ForumThread.countDocuments(query);

    // Calculate reply count and format threads
    const formattedThreads = threads.map(thread => ({
      ...thread,
      replyCount: thread.replies?.length || 0,
      lastReply: thread.replies?.length > 0 ? {
        author: thread.lastReplyBy?.name,
        time: thread.lastReplyAt
      } : null
    }));

    res.status(200).json({
      success: true,
      data: formattedThreads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching forum threads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forum threads'
    });
  }
});

// @desc    Get user's own forum threads
// @route   GET /api/forum/my-threads
// @access  Private
router.get('/my-threads', protect, async (req, res) => {
  try {
    const threads = await ForumThread.find({ author: req.user._id })
      .populate('author', 'name email role')
      .populate('lastReplyBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: threads.map(thread => ({
        ...thread.toObject(),
        replyCount: thread.replies?.length || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching user threads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your threads'
    });
  }
});

// @desc    Get single thread by ID
// @route   GET /api/forum/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id)
      .populate('author', 'name email role')
      .populate('lastReplyBy', 'name email')
      .populate('replies.author', 'name email role')
      .populate('subscribers', 'name email');

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }

    // Session-based view tracking
    // Get viewer identifier (user ID if authenticated, IP address otherwise)
    const viewerIdentifier = req.user ? req.user._id.toString() : req.ip;

    // Check if this viewer has viewed recently (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hasViewedRecently = thread.recentViewers?.some(
      viewer => viewer.identifier === viewerIdentifier && viewer.viewedAt > oneHourAgo
    );

    if (!hasViewedRecently) {
      // Increment view count
      thread.views += 1;

      // Add viewer to recent viewers
      if (!thread.recentViewers) {
        thread.recentViewers = [];
      }
      thread.recentViewers.push({
        identifier: viewerIdentifier,
        viewedAt: Date.now()
      });

      // Clean up old viewer records (older than 1 hour) to keep array manageable
      thread.recentViewers = thread.recentViewers.filter(
        viewer => viewer.viewedAt > oneHourAgo
      );

      await thread.save();
    }

    res.status(200).json({
      success: true,
      data: thread
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch thread'
    });
  }
});

// @desc    Create new thread
// @route   POST /api/forum
// @access  Private
router.post('/', protect, ...forumFiles, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title and content'
      });
    }

    // Parse tags if sent as JSON string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags ? [tags] : [];
      }
    }

    // Get image URLs from uploaded files
    const images = req.files?.images?.map(file => file.s3Url || file.location) || [];

    const thread = await ForumThread.create({
      title,
      content,
      category: category || 'general',
      tags: parsedTags || [],
      images,
      author: req.user._id
    });

    // Populate author info
    await thread.populate('author', 'name email role');

    // Emit real-time event for new thread
    const io = req.app.get('io');
    if (io) {
      io.to('forum').emit('thread:new', {
        thread: {
          ...thread.toObject(),
          replyCount: 0
        }
      });
    }

    res.status(201).json({
      success: true,
      data: thread
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create thread'
    });
  }
});

// @desc    Update thread
// @route   PUT /api/forum/:id
// @access  Private (Author or Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }

    // Check if user is author or admin
    if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this thread'
      });
    }

    const { title, content, category, tags, isPinned, isLocked, status } = req.body;

    // Update fields
    if (title) thread.title = title;
    if (content) thread.content = content;
    if (category) thread.category = category;
    if (tags) thread.tags = tags;

    // Only admins can pin, lock, or change status
    if (req.user.role === 'admin') {
      if (isPinned !== undefined) thread.isPinned = isPinned;
      if (isLocked !== undefined) thread.isLocked = isLocked;
      if (status) thread.status = status;
    }

    await thread.save();
    await thread.populate('author', 'name email role');

    res.status(200).json({
      success: true,
      data: thread
    });
  } catch (error) {
    console.error('Error updating thread:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update thread'
    });
  }
});

// @desc    Delete thread
// @route   DELETE /api/forum/:id
// @access  Private (Author or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }

    // Check if user is author or admin
    if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this thread'
      });
    }

    await thread.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete thread'
    });
  }
});

// @desc    Add reply to thread
// @route   POST /api/forum/:id/replies
// @access  Private
router.post('/:id/replies', protect, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }

    // Check if thread is locked
    if (thread.isLocked && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'This thread is locked'
      });
    }

    const { content, parentReplyId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide reply content'
      });
    }

    const reply = {
      content,
      author: req.user._id,
      parentReplyId: parentReplyId || null,
      createdAt: Date.now()
    };

    thread.replies.push(reply);
    thread.lastReplyAt = Date.now();
    thread.lastReplyBy = req.user._id;

    await thread.save();
    await thread.populate('replies.author', 'name email role');

    const newReply = thread.replies[thread.replies.length - 1];

    // Emit real-time event for new reply
    const io = req.app.get('io');
    if (io) {
      // Emit to thread room for real-time update
      io.to(`thread:${req.params.id}`).emit('thread:reply', {
        threadId: req.params.id,
        reply: newReply,
        replyCount: thread.replies.length
      });
      // Also emit to forum room to update reply count in thread list and stats
      io.to('forum').emit('thread:update', {
        threadId: req.params.id,
        replyCount: thread.replies.length,
        lastReplyAt: thread.lastReplyAt,
        newReplyAdded: true // Flag for stats update
      });
    }

    res.status(201).json({
      success: true,
      data: newReply
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reply'
    });
  }
});

// @desc    Update reply
// @route   PUT /api/forum/:threadId/replies/:replyId
// @access  Private (Author or Admin)
router.put('/:threadId/replies/:replyId', protect, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }

    const reply = thread.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        error: 'Reply not found'
      });
    }

    // Check if user is reply author or admin
    if (reply.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this reply'
      });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Please provide reply content'
      });
    }

    reply.content = content;
    reply.updatedAt = Date.now();
    reply.isEdited = true;

    await thread.save();
    await thread.populate('replies.author', 'name email role');

    res.status(200).json({
      success: true,
      data: reply
    });
  } catch (error) {
    console.error('Error updating reply:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reply'
    });
  }
});

// @desc    Delete reply
// @route   DELETE /api/forum/:threadId/replies/:replyId
// @access  Private (Author or Admin)
router.delete('/:threadId/replies/:replyId', protect, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }

    const reply = thread.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        error: 'Reply not found'
      });
    }

    // Check if user is reply author or admin
    if (reply.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this reply'
      });
      }

    reply.deleteOne();
    await thread.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete reply'
    });
  }
});

// @desc    Like/Unlike thread
// @route   POST /api/forum/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }

    // Check if thread has a likes array (add if missing)
    if (!thread.likes) {
      thread.likes = [];
    }

    const likeIndex = thread.likes.indexOf(req.user._id);

    if (likeIndex > -1) {
      // Unlike - remove user from likes
      thread.likes.splice(likeIndex, 1);
    } else {
      // Like - add user to likes
      thread.likes.push(req.user._id);
    }

    await thread.save();

    // Emit real-time event for thread like
    const io = req.app.get('io');
    if (io) {
      const likeData = {
        threadId: req.params.id,
        likesCount: thread.likes.length,
        userId: req.user._id.toString(),
        isLiked: likeIndex === -1
      };
      // Emit to thread room for detail page
      io.to(`thread:${req.params.id}`).emit('thread:like', likeData);
      // Also emit to forum room for listing page
      io.to('forum').emit('thread:like', likeData);
    }

    res.status(200).json({
      success: true,
      data: {
        likes: thread.likes.length,
        isLiked: likeIndex === -1
      }
    });
  } catch (error) {
    console.error('Error liking thread:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like thread'
    });
  }
});

// @desc    Like/Unlike reply
// @route   POST /api/forum/:threadId/replies/:replyId/like
// @access  Private
router.post('/:threadId/replies/:replyId/like', protect, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }

    const reply = thread.replies.id(req.params.replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        error: 'Reply not found'
      });
    }

    const likeIndex = reply.likes.indexOf(req.user._id);

    if (likeIndex > -1) {
      // Unlike
      reply.likes.splice(likeIndex, 1);
    } else {
      // Like
      reply.likes.push(req.user._id);
    }

    await thread.save();

    // Emit real-time event for reply like
    const io = req.app.get('io');
    if (io) {
      io.to(`thread:${req.params.threadId}`).emit('reply:like', {
        threadId: req.params.threadId,
        replyId: req.params.replyId,
        likesCount: reply.likes.length,
        userId: req.user._id.toString(),
        isLiked: likeIndex === -1
      });
    }

    res.status(200).json({
      success: true,
      data: {
        likes: reply.likes.length,
        isLiked: likeIndex === -1
      }
    });
  } catch (error) {
    console.error('Error liking reply:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like reply'
    });
  }
});

// @desc    Subscribe/Unsubscribe to thread
// @route   POST /api/forum/:id/subscribe
// @access  Private
router.post('/:id/subscribe', protect, async (req, res) => {
  try {
    const thread = await ForumThread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }

    const subscriberIndex = thread.subscribers.indexOf(req.user._id);

    if (subscriberIndex > -1) {
      // Unsubscribe
      thread.subscribers.splice(subscriberIndex, 1);
    } else {
      // Subscribe
      thread.subscribers.push(req.user._id);
    }

    await thread.save();

    res.status(200).json({
      success: true,
      data: {
        isSubscribed: subscriberIndex === -1
      }
    });
  } catch (error) {
    console.error('Error subscribing to thread:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to thread'
    });
  }
});

// @desc    Get forum statistics
// @route   GET /api/forum/stats/overview
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const totalThreads = await ForumThread.countDocuments({ status: 'active' });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayThreads = await ForumThread.countDocuments({
      status: 'active',
      createdAt: { $gte: todayStart }
    });

    // Get total replies
    const threadsWithReplies = await ForumThread.find({ status: 'active' }).select('replies');
    const totalReplies = threadsWithReplies.reduce((sum, thread) => sum + thread.replies.length, 0);

    // Get trending tags
    const allThreads = await ForumThread.find({ status: 'active' }).select('tags');
    const tagCounts = {};
    allThreads.forEach(thread => {
      thread.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const trendingTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        totalThreads,
        todayThreads,
        totalReplies,
        trendingTags
      }
    });
  } catch (error) {
    console.error('Error fetching forum stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forum statistics'
    });
  }
});

module.exports = router;
