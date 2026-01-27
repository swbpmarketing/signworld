const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/auth');

// Models
const ForumThread = require('../models/ForumThread');
const Brag = require('../models/Brag');
const LibraryFile = require('../models/LibraryFile');
const Event = require('../models/Event');
const Video = require('../models/Video');

// @desc    Get aggregated activity feed
// @route   GET /api/activity
// @access  Public (with optional auth)
router.get('/', optionalProtect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch recent items from various sources in parallel
    const [threads, brags, libraryFiles, events, videos] = await Promise.allSettled([
      // Recent forum threads
      ForumThread.find({
        createdAt: { $gte: dayAgo },
        status: 'active'
      })
        .select('title author createdAt category')
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      // Recent brags
      Brag.find({
        createdAt: { $gte: dayAgo },
        status: 'approved'
      })
        .select('title author createdAt')
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      // Recent library uploads
      LibraryFile.find({
        createdAt: { $gte: dayAgo },
        status: 'approved',
        deletedAt: null
      })
        .select('title uploadedBy createdAt')
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      // Recent events created
      Event.find({
        createdAt: { $gte: dayAgo }
      })
        .select('title createdBy createdAt')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Recent videos
      Video.find({
        createdAt: { $gte: dayAgo }
      })
        .select('title uploadedBy createdAt')
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Aggregate all activities
    const activities = [];

    // Process forum threads
    if (threads.status === 'fulfilled' && threads.value) {
      threads.value.forEach(thread => {
        activities.push({
          id: thread._id,
          type: 'forum',
          message: `${thread.author?.name || 'Someone'} started a discussion: "${thread.title}"`,
          user: thread.author?.name || 'Anonymous',
          timestamp: thread.createdAt,
          createdAt: thread.createdAt,
        });
      });
    }

    // Process brags
    if (brags.status === 'fulfilled' && brags.value) {
      brags.value.forEach(brag => {
        activities.push({
          id: brag._id,
          type: 'brag',
          message: `${brag.author?.name || 'Someone'} shared a success story: "${brag.title}"`,
          user: brag.author?.name || 'Anonymous',
          timestamp: brag.createdAt,
          createdAt: brag.createdAt,
        });
      });
    }

    // Process library uploads
    if (libraryFiles.status === 'fulfilled' && libraryFiles.value) {
      libraryFiles.value.forEach(file => {
        activities.push({
          id: file._id,
          type: 'library',
          message: `${file.uploadedBy?.name || 'Someone'} uploaded a file: "${file.title}"`,
          user: file.uploadedBy?.name || 'Anonymous',
          timestamp: file.createdAt,
          createdAt: file.createdAt,
        });
      });
    }

    // Process events
    if (events.status === 'fulfilled' && events.value) {
      events.value.forEach(event => {
        activities.push({
          id: event._id,
          type: 'event',
          message: `New event created: "${event.title}"`,
          user: event.createdBy?.name || 'System',
          timestamp: event.createdAt,
          createdAt: event.createdAt,
        });
      });
    }

    // Process videos
    if (videos.status === 'fulfilled' && videos.value) {
      videos.value.forEach(video => {
        activities.push({
          id: video._id,
          type: 'video',
          message: `${video.uploadedBy?.name || 'Someone'} uploaded a video: "${video.title}"`,
          user: video.uploadedBy?.name || 'Anonymous',
          timestamp: video.createdAt,
          createdAt: video.createdAt,
        });
      });
    }

    // Sort by timestamp (newest first) and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.status(200).json({
      success: true,
      count: limitedActivities.length,
      data: limitedActivities,
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed',
    });
  }
});

module.exports = router;
