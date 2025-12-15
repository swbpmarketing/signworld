const Analytics = require('../models/Analytics');

/**
 * Log an analytics event
 */
const logEvent = async (eventData) => {
  try {
    const event = new Analytics({
      userId: eventData.userId,
      eventType: eventData.eventType,
      resourceType: eventData.resourceType,
      resourceId: eventData.resourceId,
      relatedUserId: eventData.relatedUserId,
      metadata: eventData.metadata || {},
      isEngagement: eventData.isEngagement || false,
      description: eventData.description,
    });

    await event.save();
    return event;
  } catch (error) {
    console.error('Error logging analytics event:', error);
    // Don't throw - analytics failure shouldn't break the app
    return null;
  }
};

/**
 * Get user engagement stats for a specific time period
 */
const getUserEngagementStats = async (userId, days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await Analytics.find({
      userId,
      createdAt: { $gte: startDate },
    });

    const stats = {
      profileViewsReceived: 0,
      inquiriesSent: 0,
      inquiriesReceived: 0,
      contactClicks: 0,
      downloadsCount: 0,
      equipmentCartAdds: 0,
      equipmentWishlistAdds: 0,
      equipmentQuoteRequests: 0,
      forumPostsCreated: 0,
      forumRepliesCreated: 0,
      videosViewed: 0,
      messagesIn: 0,
      engagementActions: 0,
      totalEvents: events.length,
    };

    events.forEach((event) => {
      switch (event.eventType) {
        case 'profile_view':
          stats.profileViewsReceived++;
          break;
        case 'inquiry_sent':
          stats.inquiriesSent++;
          break;
        case 'inquiry_received':
          stats.inquiriesReceived++;
          stats.engagementActions++;
          break;
        case 'contact_click':
          stats.contactClicks++;
          stats.engagementActions++;
          break;
        case 'resource_download':
          stats.downloadsCount++;
          stats.engagementActions++;
          break;
        case 'equipment_cart_add':
          stats.equipmentCartAdds++;
          stats.engagementActions++;
          break;
        case 'equipment_wishlist_add':
          stats.equipmentWishlistAdds++;
          stats.engagementActions++;
          break;
        case 'equipment_quote_request':
          stats.equipmentQuoteRequests++;
          stats.engagementActions++;
          break;
        case 'forum_post_created':
          stats.forumPostsCreated++;
          stats.engagementActions++;
          break;
        case 'forum_reply_created':
          stats.forumRepliesCreated++;
          stats.engagementActions++;
          break;
        case 'video_viewed':
          stats.videosViewed++;
          break;
        case 'chat_message_sent':
          stats.messagesIn++;
          break;
        default:
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting user engagement stats:', error);
    return null;
  }
};

/**
 * Get engagement trends (daily breakdown)
 */
const getEngagementTrends = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await Analytics.find({
      userId,
      createdAt: { $gte: startDate },
      isEngagement: true,
    }).sort({ createdAt: 1 });

    // Group by day
    const trends = {};
    events.forEach((event) => {
      const date = event.createdAt.toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });

    return trends;
  } catch (error) {
    console.error('Error getting engagement trends:', error);
    return {};
  }
};

/**
 * Get resource-specific engagement (for resource pages)
 */
const getResourceEngagement = async (resourceId, resourceType) => {
  try {
    const events = await Analytics.find({
      resourceId,
      resourceType,
    });

    return {
      totalViews: events.filter((e) => e.eventType.includes('viewed')).length,
      totalEngagements: events.filter((e) => e.isEngagement).length,
      uniqueUsers: new Set(events.map((e) => e.userId.toString())).size,
      eventBreakdown: events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {}),
    };
  } catch (error) {
    console.error('Error getting resource engagement:', error);
    return null;
  }
};

/**
 * Calculate engagement score (0-100)
 */
const calculateEngagementScore = async (userId, days = 30) => {
  try {
    const stats = await getUserEngagementStats(userId, days);

    if (!stats) return 0;

    const score =
      stats.profileViewsReceived * 5 +
      stats.inquiriesReceived * 15 +
      stats.contactClicks * 2 +
      stats.downloadsCount * 3 +
      stats.equipmentCartAdds * 5 +
      stats.equipmentWishlistAdds * 5 +
      stats.equipmentQuoteRequests * 10 +
      stats.forumPostsCreated * 10 +
      stats.forumRepliesCreated * 5 +
      stats.messagesIn * 2;

    // Cap score at 100
    return Math.min(Math.round(score), 100);
  } catch (error) {
    console.error('Error calculating engagement score:', error);
    return 0;
  }
};

/**
 * Get recent user activities
 */
const getRecentActivities = async (userId, limit = 5) => {
  try {
    const events = await Analytics.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('resourceId')
      .populate('relatedUserId', 'name');

    return events.map((event) => ({
      id: event._id.toString(),
      type: event.eventType.replace(/_/g, ' '),
      description: event.description || getEventDescription(event),
      time: getTimeAgo(event.createdAt),
      timestamp: event.createdAt,
    }));
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
};

/**
 * Helper function to generate event description
 */
const getEventDescription = (event) => {
  const descriptions = {
    profile_view: 'Your profile was viewed',
    inquiry_sent: 'You sent an inquiry',
    inquiry_received: 'You received an inquiry',
    contact_click: 'Someone clicked your contact',
    resource_download: 'Someone downloaded your resource',
    equipment_cart_add: 'Added equipment to cart',
    equipment_wishlist_add: 'Added equipment to wishlist',
    equipment_quote_request: 'Requested a quote',
    forum_post_created: 'You created a forum post',
    forum_reply_created: 'You replied to a forum post',
    video_viewed: 'You watched a video',
    chat_message_sent: 'You sent a message',
  };
  return descriptions[event.eventType] || 'Activity recorded';
};

/**
 * Helper function to format time ago
 */
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [name, seconds_in_interval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / seconds_in_interval);
    if (interval >= 1) {
      return interval === 1 ? `${interval} ${name} ago` : `${interval} ${name}s ago`;
    }
  }
  return 'Just now';
};

module.exports = {
  logEvent,
  getUserEngagementStats,
  getEngagementTrends,
  getResourceEngagement,
  calculateEngagementScore,
  getRecentActivities,
};
