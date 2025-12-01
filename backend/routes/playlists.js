const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all playlists
// @route   GET /api/playlists
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, limit = 10, page = 1 } = req.query;

    // Build query
    const query = { isActive: true, isPublic: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const playlists = await Playlist.find(query)
      .populate({
        path: 'videos',
        select: 'title duration thumbnail thumbnailUrl',
        match: { isActive: true },
      })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    // Calculate duration for each playlist
    const playlistsWithDuration = playlists.map(playlist => {
      const playlistObj = playlist.toObject();

      // Calculate total duration
      let totalMinutes = 0;
      if (playlistObj.videos && playlistObj.videos.length > 0) {
        playlistObj.videos.forEach(video => {
          if (video.duration) {
            const parts = video.duration.split(':').map(Number);
            if (parts.length === 2) {
              totalMinutes += parts[0] + parts[1] / 60;
            } else if (parts.length === 3) {
              totalMinutes += parts[0] * 60 + parts[1] + parts[2] / 60;
            }
          }
        });
      }

      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      playlistObj.duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      playlistObj.videoCount = playlistObj.videos ? playlistObj.videos.length : 0;

      return playlistObj;
    });

    // Get total count for pagination
    const count = await Playlist.countDocuments(query);

    res.json({
      success: true,
      data: playlistsWithDuration,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching playlists',
    });
  }
});

// @desc    Get single playlist with videos
// @route   GET /api/playlists/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate({
        path: 'videos',
        match: { isActive: true },
        select: '-__v',
      })
      .populate('createdBy', 'firstName lastName');

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found',
      });
    }

    res.json({
      success: true,
      data: playlist,
    });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching playlist',
    });
  }
});

// @desc    Create new playlist
// @route   POST /api/playlists
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const playlistData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const playlist = await Playlist.create(playlistData);

    res.status(201).json({
      success: true,
      data: playlist,
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Update playlist
// @route   PUT /api/playlists/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found',
      });
    }

    res.json({
      success: true,
      data: playlist,
    });
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Delete playlist
// @route   DELETE /api/playlists/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found',
      });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting playlist',
    });
  }
});

// @desc    Add video to playlist
// @route   POST /api/playlists/:id/videos
// @access  Private/Admin
router.post('/:id/videos', protect, authorize('admin'), async (req, res) => {
  try {
    const { videoId } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found',
      });
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found',
      });
    }

    // Check if video already in playlist
    if (playlist.videos.includes(videoId)) {
      return res.status(400).json({
        success: false,
        error: 'Video already in playlist',
      });
    }

    playlist.videos.push(videoId);
    await playlist.save();

    res.json({
      success: true,
      data: playlist,
    });
  } catch (error) {
    console.error('Error adding video to playlist:', error);
    res.status(500).json({
      success: false,
      error: 'Error adding video to playlist',
    });
  }
});

// @desc    Remove video from playlist
// @route   DELETE /api/playlists/:id/videos/:videoId
// @access  Private/Admin
router.delete('/:id/videos/:videoId', protect, authorize('admin'), async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found',
      });
    }

    const videoIndex = playlist.videos.indexOf(req.params.videoId);
    if (videoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Video not in playlist',
      });
    }

    playlist.videos.splice(videoIndex, 1);
    await playlist.save();

    res.json({
      success: true,
      data: playlist,
    });
  } catch (error) {
    console.error('Error removing video from playlist:', error);
    res.status(500).json({
      success: false,
      error: 'Error removing video from playlist',
    });
  }
});

module.exports = router;
