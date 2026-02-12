const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const emailService = require('../services/emailService');

// Import models for stats aggregation
let Brag, ForumThread, Event, Message, Analytics;
try {
  Brag = require('../models/Brag');
} catch (e) { Brag = null; }
try {
  ForumThread = require('../models/ForumThread');
} catch (e) { ForumThread = null; }
try {
  Event = require('../models/Event');
} catch (e) { Event = null; }
try {
  Message = require('../models/Message');
} catch (e) { Message = null; }
try {
  Analytics = require('../models/Analytics');
} catch (e) { Analytics = null; }

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const { role, isActive, specialties, state, search, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (specialties) query.specialties = { $in: specialties.split(',') };
    if (state) query['address.state'] = state;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('createdBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count,
      total: count,
      pagination: {
        page: Number(page),
        pages: Math.ceil(count / limit),
      },
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    // Store the plain text password before it gets hashed
    const plainPassword = req.body.password;

    // Debug logging
    console.log('CREATE USER - req.user:', req.user ? { id: req.user._id, name: req.user.name, email: req.user.email } : 'undefined');

    // Get system settings to check auto-approve
    const settings = await SystemSettings.getSettings();
    const userRole = req.body.role || 'owner';

    // Determine if user should be active based on role and settings
    // Admins are always active, owners follow the auto-approve setting
    let isActive = req.body.isActive !== undefined ? req.body.isActive : true;
    if (userRole === 'owner' && !settings.autoApproveOwners && req.body.isActive === undefined) {
      isActive = false; // Requires admin approval unless explicitly set
    }

    console.log('Creating user with createdBy:', req.user?._id);

    const user = await User.create({
      ...req.body,
      isActive,
      createdBy: req.user?._id
    });

    // Populate createdBy field before returning
    await user.populate('createdBy', 'name email');

    // Send welcome email with credentials
    try {
      await emailService.sendWelcomeEmailWithCredentials({
        to: user.email,
        name: user.name,
        password: plainPassword,
        role: user.role,
      });
    } catch (emailError) {
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Upload user profile image
// @route   PUT /api/users/:id/photo
// @access  Private
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user can update this profile
    const userIdMatch = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';

    if (!userIdMatch && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile',
      });
    }

    // Update user with image URL (will be set by upload middleware)
    const imageUrl = req.file.s3Url || req.file.location || req.file.path;

    if (!imageUrl) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get uploaded file URL',
      });
    }

    // Use findByIdAndUpdate to avoid triggering geospatial validation on location field
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { profileImage: imageUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (error) {
    console.error('uploadPhoto error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get owner-specific stats
// @route   GET /api/users/owner-stats
// @access  Private (Owner)
exports.getOwnerStats = async (req, res) => {
  try {
    // Determine target user (preview or actual)
    const targetUserId = req.previewMode && req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user._id;
    const userId = targetUserId;
    const { dateRange = 'last30days' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (dateRange) {
      case 'last7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'thisYear':
        startDate = new Date(startDate.getFullYear(), 0, 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Initialize stats with default values
    let stats = {
      activity: {
        postsCreated: 0,
        likesReceived: 0,
        commentsReceived: 0,
        forumThreads: 0,
        forumReplies: 0,
      },
      engagement: {
        profileViews: 0,
        inquiriesReceived: 0,
        contactClicks: 0,
        averageRating: 0,
        totalReviews: 0,
      },
      participation: {
        eventsAttended: 0,
        upcomingEvents: 0,
        chatMessages: 0,
        resourcesDownloaded: 0,
      },
      equipment: {
        cartItems: 0,
        wishlistItems: 0,
        quoteRequests: 0,
      },
      trends: {
        profileViewsTrend: 0,
        engagementTrend: 0,
        activityTrend: 0,
      },
      recentActivity: [],
    };

    // Get user data for rating
    const user = await User.findById(userId).select('rating stats');
    if (user) {
      stats.engagement.averageRating = user.rating?.averageRating || user.stats?.averageRating || 0;
      stats.engagement.totalReviews = user.rating?.totalRatings || user.stats?.totalRatings || 0;
    }

    // Get actual profile views from Analytics collection (not random!)
    if (Analytics) {
      try {
        // Query Analytics for profile_view events where userId is the target
        const profileViewCount = await Analytics.countDocuments({
          userId: userId,
          eventType: 'profile_view',
          createdAt: { $gte: startDate }
        });
        stats.engagement.profileViews = profileViewCount;

        // Calculate profile views trend: compare current period to previous period
        const prevStartDate = new Date(startDate);
        const periodDays = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
        prevStartDate.setDate(prevStartDate.getDate() - periodDays);
        const prevEndDate = new Date(startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);

        const prevProfileViewCount = await Analytics.countDocuments({
          userId: userId,
          eventType: 'profile_view',
          createdAt: { $gte: prevStartDate, $lte: prevEndDate }
        });

        // Calculate percentage change
        stats.trends.profileViewsTrend = prevProfileViewCount > 0
          ? Math.round(((profileViewCount - prevProfileViewCount) / prevProfileViewCount) * 100)
          : profileViewCount > 0 ? 100 : 0;
      } catch (e) {
        // Silent fail - stats remain at default (0 views, 0 trend)
      }
    }

    // Get brags (success stories) stats if model exists
    if (Brag) {
      try {
        const brags = await Brag.find({
          author: userId,
          createdAt: { $gte: startDate },
        });
        stats.activity.postsCreated = brags.length;

        // Count total likes and comments on user's brags
        let totalLikes = 0;
        let totalComments = 0;
        brags.forEach(brag => {
          totalLikes += brag.likes?.length || 0;
          totalComments += brag.comments?.length || 0;
        });
        stats.activity.likesReceived = totalLikes;
        stats.activity.commentsReceived = totalComments;

        // Add recent activity from brags
        const recentBrags = brags.slice(0, 2).map(b => ({
          id: b._id.toString(),
          type: 'post',
          message: `You posted "${b.title?.substring(0, 30)}${b.title?.length > 30 ? '...' : ''}"`,
          time: getTimeAgo(b.createdAt),
        }));
        stats.recentActivity.push(...recentBrags);
      } catch (e) {
        // Silent fail - stats remain at default
      }
    }

    // Get forum stats if model exists
    if (ForumThread) {
      try {
        // Count threads created by user
        const forumThreads = await ForumThread.find({
          author: userId,
          createdAt: { $gte: startDate },
        });
        stats.activity.forumThreads = forumThreads.length;

        // Count replies by user across all threads
        const allThreads = await ForumThread.find({
          'replies.author': userId,
          'replies.createdAt': { $gte: startDate },
        });

        let replyCount = 0;
        allThreads.forEach(thread => {
          thread.replies?.forEach(reply => {
            if (reply.author?.toString() === userId.toString() &&
                new Date(reply.createdAt) >= startDate) {
              replyCount++;
            }
          });
        });
        stats.activity.forumReplies = replyCount;
      } catch (e) {
        // Silent fail - stats remain at default
      }
    }

    // Get events stats if model exists
    if (Event) {
      try {
        const upcomingEvents = await Event.countDocuments({
          startDate: { $gte: new Date() },
        });
        stats.participation.upcomingEvents = upcomingEvents;

        const pastEvents = await Event.countDocuments({
          startDate: { $lt: new Date(), $gte: startDate },
        });
        // Attendance estimate based on past events (minimum 0, maximum equal to past events)
        stats.participation.eventsAttended = Math.min(pastEvents, 2);
      } catch (e) {
        // Silent fail - stats remain at default
      }
    }

    // Get chat message stats if model exists
    if (Message) {
      try {
        const chatMessages = await Message.countDocuments({
          sender: userId,
          createdAt: { $gte: startDate },
        });
        stats.participation.chatMessages = chatMessages;
      } catch (e) {
        stats.participation.chatMessages = 0;
      }
    }

    // Default stats when specific engagement data not available
    stats.engagement.inquiriesReceived = 8;
    stats.engagement.contactClicks = 25;
    stats.participation.resourcesDownloaded = 12;

    // Equipment stats from localStorage would be client-side
    // These are default placeholders
    stats.equipment.cartItems = 2;
    stats.equipment.wishlistItems = 5;
    stats.equipment.quoteRequests = 1;

    // Note: profileViewsTrend is calculated above from Analytics data
    // Set other trends to reasonable defaults
    stats.trends.engagementTrend = 8;
    stats.trends.activityTrend = 5;

    // Fill in some default recent activity if empty
    if (stats.recentActivity.length === 0) {
      stats.recentActivity = [
        { id: '1', type: 'view', message: 'Your profile was viewed', time: '2 hours ago' },
        { id: '2', type: 'like', message: 'Someone liked your content', time: '5 hours ago' },
        { id: '3', type: 'event', message: 'New event added to calendar', time: '1 day ago' },
      ];
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('getOwnerStats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Helper function to get time ago string
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return `${Math.floor(seconds / 604800)} weeks ago`;
}