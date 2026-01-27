const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { deleteFromS3 } = require('../utils/s3');
const { getYouTubeDuration, getVideoDuration, downloadAndUploadThumbnail } = require('../utils/videoDuration');

// @desc    Get video statistics
// @route   GET /api/videos/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalVideos = await Video.countDocuments({ isActive: true });
    const totalViews = await Video.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    // Get category counts
    const categoryCounts = await Video.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoryCountsObj = {};
    categoryCounts.forEach(cat => {
      categoryCountsObj[cat._id] = cat.count;
    });

    // Calculate total duration from all videos
    const videos = await Video.find({ isActive: true }, 'duration');
    let totalMinutes = 0;
    videos.forEach(video => {
      if (video.duration) {
        // Duration format could be "5:30" or "1:20:45"
        const parts = video.duration.split(':').map(p => parseInt(p) || 0);
        if (parts.length === 2) {
          // mm:ss format
          totalMinutes += parts[0] + (parts[1] / 60);
        } else if (parts.length === 3) {
          // hh:mm:ss format
          totalMinutes += (parts[0] * 60) + parts[1] + (parts[2] / 60);
        }
      }
    });

    // Format total duration
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.floor(totalMinutes % 60);
    const totalDuration = totalHours > 0
      ? `${totalHours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`
      : `${remainingMinutes}m`;

    // Calculate average rating based on likes
    const ratingStats = await Video.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          viewsCount: { $ifNull: ['$views', 0] }
        }
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likesCount' },
          totalViews: { $sum: '$viewsCount' },
          videoCount: { $sum: 1 }
        }
      }
    ]);

    // Calculate rating: (likes / views) * 5, or based on engagement
    let avgRating = 0;
    if (ratingStats.length > 0 && ratingStats[0].totalViews > 0) {
      // Calculate as percentage of likes to views, scaled to 5
      const likeRatio = ratingStats[0].totalLikes / ratingStats[0].totalViews;
      avgRating = Math.min(5, likeRatio * 10); // Scale and cap at 5
    }
    // Round to 1 decimal place
    avgRating = Math.round(avgRating * 10) / 10;

    res.json({
      success: true,
      data: {
        totalVideos,
        totalViews: totalViews[0]?.total || 0,
        totalDuration,
        avgRating,
        categoryCounts: categoryCountsObj
      }
    });
  } catch (error) {
    console.error('Error fetching video stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching video statistics'
    });
  }
});

// @desc    Get all videos
// @route   GET /api/videos
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 20, page = 1, sort = 'newest' } = req.query;

    // Build query
    const query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort options
    let sortOption = { isFeatured: -1, publishedAt: -1 };
    switch (sort) {
      case 'oldest':
        sortOption = { publishedAt: 1 };
        break;
      case 'popular':
        sortOption = { views: -1 };
        break;
      case 'rating':
        sortOption = { 'likes.length': -1 };
        break;
      case 'newest':
      default:
        sortOption = { isFeatured: -1, publishedAt: -1 };
    }

    // Execute query with pagination
    const videos = await Video.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('uploadedBy', 'name role')
      .select('-__v');

    // Get total count for pagination
    const count = await Video.countDocuments(query);

    res.json({
      success: true,
      data: videos,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching videos'
    });
  }
});

// @desc    Get single video
// @route   GET /api/videos/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching video'
    });
  }
});

// @desc    Increment video view count
// @route   POST /api/videos/:id/view
// @access  Public
router.post('/:id/view', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error incrementing view:', error);
    res.status(500).json({
      success: false,
      error: 'Error incrementing view count'
    });
  }
});

// @desc    Create new video (YouTube link)
// @route   POST /api/videos
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const videoData = {
      ...req.body,
      uploadedBy: req.user.id
    };

    // Parse tags if string
    if (typeof videoData.tags === 'string') {
      videoData.tags = JSON.parse(videoData.tags);
    }

    // Parse presenter if string
    if (typeof videoData.presenter === 'string') {
      videoData.presenter = JSON.parse(videoData.presenter);
    }

    // Extract YouTube ID for auto-fetching metadata
    let youtubeId = null;
    if (videoData.youtubeUrl) {
      const match = videoData.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        youtubeId = match[1];
      }
    }

    // Auto-fetch YouTube duration if not provided
    if (youtubeId && !videoData.duration) {
      const duration = await getYouTubeDuration(youtubeId);
      if (duration) {
        videoData.duration = duration;
      }
    }

    // Auto-download and upload YouTube thumbnail to S3
    if (youtubeId && !videoData.thumbnail && !videoData.thumbnailUrl) {
      const s3ThumbnailUrl = await downloadAndUploadThumbnail(youtubeId);
      if (s3ThumbnailUrl) {
        videoData.thumbnailUrl = s3ThumbnailUrl;
      }
    }

    const video = await Video.create(videoData);

    // Create notifications for all users about new video
    const io = req.app.get('io');
    try {
      const allUsers = await User.find({
        _id: { $ne: req.user.id },
        isActive: true,
        role: { $in: ['admin', 'owner'] } // Only notify admins and owners
      }).select('_id');

      for (const user of allUsers) {
        await Notification.createAndEmit(io, {
          recipient: user._id,
          sender: req.user.id,
          type: 'new_video',
          title: 'New Video Posted',
          message: `A new video has been posted: "${video.title}"`,
          referenceType: 'Video',
          referenceId: video._id,
          link: `/videos/${video._id}`,
        });
      }
    } catch (notifError) {
      console.error('Error creating video notifications:', notifError);
    }

    res.status(201).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Upload video file
// @route   POST /api/videos/upload
// @access  Private/Admin
router.post('/upload', protect, authorize('admin'), upload.videoFiles, async (req, res) => {
  try {
    // Get uploaded files
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a video file'
      });
    }

    const videoData = {
      title: req.body.title,
      description: req.body.description,
      videoUrl: videoFile.s3Url,
      videoSize: videoFile.size,
      category: req.body.category || 'other',
      duration: req.body.duration,
      topic: req.body.topic,
      uploadedBy: req.user.id,
      isFeatured: req.body.isFeatured === 'true'
    };

    // Add thumbnail if uploaded
    if (thumbnailFile) {
      videoData.thumbnailUrl = thumbnailFile.s3Url;
    }

    // Parse tags if string
    if (req.body.tags) {
      videoData.tags = typeof req.body.tags === 'string'
        ? JSON.parse(req.body.tags)
        : req.body.tags;
    }

    // Parse presenter if string
    if (req.body.presenter) {
      videoData.presenter = typeof req.body.presenter === 'string'
        ? JSON.parse(req.body.presenter)
        : req.body.presenter;
    }

    const video = await Video.create(videoData);

    // Create notifications for all users about new video
    const io = req.app.get('io');
    try {
      const allUsers = await User.find({
        _id: { $ne: req.user.id },
        isActive: true,
        role: { $in: ['admin', 'owner'] } // Only notify admins and owners
      }).select('_id');

      for (const user of allUsers) {
        await Notification.createAndEmit(io, {
          recipient: user._id,
          sender: req.user.id,
          type: 'new_video',
          title: 'New Video Posted',
          message: `A new video has been posted: "${video.title}"`,
          referenceType: 'Video',
          referenceId: video._id,
          link: `/videos/${video._id}`,
        });
      }
    } catch (notifError) {
      console.error('Error creating video upload notifications:', notifError);
    }

    res.status(201).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Update video
// @route   PUT /api/videos/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Parse tags if string
    if (typeof updateData.tags === 'string') {
      updateData.tags = JSON.parse(updateData.tags);
    }

    // Parse presenter if string
    if (typeof updateData.presenter === 'string') {
      updateData.presenter = JSON.parse(updateData.presenter);
    }

    // Extract YouTube ID if URL is being updated
    let youtubeId = null;
    if (updateData.youtubeUrl) {
      const match = updateData.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        youtubeId = match[1];
      }
    }

    // Auto-fetch YouTube duration if URL is being updated and duration is not provided
    if (youtubeId && !updateData.duration) {
      const duration = await getYouTubeDuration(youtubeId);
      if (duration) {
        updateData.duration = duration;
      }
    }

    // Auto-download and upload YouTube thumbnail to S3 if URL changed
    if (youtubeId && updateData.youtubeUrl) {
      // Get the existing video to check if URL has changed
      const existingVideo = await Video.findById(req.params.id);
      if (existingVideo && existingVideo.youtubeUrl !== updateData.youtubeUrl) {
        const s3ThumbnailUrl = await downloadAndUploadThumbnail(youtubeId);
        if (s3ThumbnailUrl) {
          updateData.thumbnailUrl = s3ThumbnailUrl;
        }
      }
    }

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Delete video file from S3 if it was uploaded
    if (video.videoUrl) {
      try {
        await deleteFromS3(video.videoUrl);
      } catch (s3Error) {
        console.error('Error deleting video from S3:', s3Error);
      }
    }

    // Delete thumbnail from S3 if it was uploaded
    if (video.thumbnailUrl) {
      try {
        await deleteFromS3(video.thumbnailUrl);
      } catch (s3Error) {
        console.error('Error deleting thumbnail from S3:', s3Error);
      }
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting video'
    });
  }
});

// @desc    Toggle video like
// @route   POST /api/videos/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    const userId = req.user.id;
    const likeIndex = video.likes.indexOf(userId);

    if (likeIndex > -1) {
      video.likes.splice(likeIndex, 1);
    } else {
      video.likes.push(userId);
    }

    await video.save();

    res.json({
      success: true,
      data: {
        likes: video.likes.length,
        isLiked: likeIndex === -1
      }
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      error: 'Error toggling like'
    });
  }
});

module.exports = router;
