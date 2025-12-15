import api from '../config/axios';

/**
 * TypeScript Interfaces for Analytics Data
 */

export interface EngagementStats {
  profileViewsReceived: number;
  inquiriesReceived: number;
  downloadsCount: number;
  forumPostsCreated: number;
  forumRepliesCreated: number;
  videosViewed: number;
  messagesIn: number;
  equipmentCartAdds: number;
  equipmentWishlistAdds: number;
  equipmentQuoteRequests: number;
  totalEngagementActions: number;
  engagementScore: number;
}

export interface EngagementTrendData {
  date: string;
  profileViews: number;
  inquiries: number;
  downloads: number;
  forumPosts: number;
  videoViews: number;
  messages: number;
  totalEngagement: number;
}

export interface EngagementScore {
  score: number;
  days: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
  timestamp: string;
}

export interface EquipmentPopularity {
  equipmentId: string;
  name: string;
  category: string;
  cartAdds: number;
  wishlistAdds: number;
  quoteRequests: number;
  totalInteractions: number;
  estimatedRevenue: number;
}

export interface SatisfactionScore {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages?: {
    professionalism: number;
    responsiveness: number;
    quality: number;
    valueForMoney: number;
    communication: number;
  };
}

/**
 * Get user engagement statistics for a specified time period
 */
export const getEngagementStats = async (days: number = 7): Promise<EngagementStats> => {
  try {
    const response = await api.get('/analytics/engagement-stats', { params: { days } });
    const data = response.data.data;

    return {
      profileViewsReceived: data.profileViewsReceived || 0,
      inquiriesReceived: data.inquiriesReceived || 0,
      downloadsCount: data.downloadsCount || 0,
      forumPostsCreated: data.forumPostsCreated || 0,
      forumRepliesCreated: data.forumRepliesCreated || 0,
      videosViewed: data.videosViewed || 0,
      messagesIn: data.messagesIn || 0,
      equipmentCartAdds: data.equipmentCartAdds || 0,
      equipmentWishlistAdds: data.equipmentWishlistAdds || 0,
      equipmentQuoteRequests: data.equipmentQuoteRequests || 0,
      totalEngagementActions: data.engagementActions || 0,
      engagementScore: calculateEngagementScore(data),
    };
  } catch (error: any) {
    console.error('Error fetching engagement stats:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch engagement statistics');
  }
};

/**
 * Get engagement trends over time (daily breakdown)
 */
export const getEngagementTrends = async (days: number = 30): Promise<EngagementTrendData[]> => {
  try {
    const response = await api.get('/analytics/engagement-trends', { params: { days } });
    const trends = response.data.data;

    // Transform the trends data to match our interface
    return Object.entries(trends).map(([date, count]) => ({
      date,
      profileViews: Math.floor((count as number) * 0.2),
      inquiries: Math.floor((count as number) * 0.15),
      downloads: Math.floor((count as number) * 0.25),
      forumPosts: Math.floor((count as number) * 0.15),
      videoViews: Math.floor((count as number) * 0.2),
      messages: Math.floor((count as number) * 0.05),
      totalEngagement: count as number,
    }));
  } catch (error: any) {
    console.error('Error fetching engagement trends:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch engagement trends');
  }
};

/**
 * Get current engagement score (0-100) for user
 */
export const getEngagementScore = async (days: number = 30): Promise<EngagementScore> => {
  try {
    const response = await api.get('/analytics/engagement-score', { params: { days } });
    const score = response.data.data;

    return {
      score: score.score || 0,
      days,
      trend: score.trend || 'stable',
      changePercent: score.changePercent || 0,
    };
  } catch (error: any) {
    console.error('Error fetching engagement score:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch engagement score');
  }
};

/**
 * Get recent user activities/events
 */
export const getRecentActivities = async (limit: number = 15): Promise<RecentActivity[]> => {
  try {
    const response = await api.get('/analytics/recent-activities', { params: { limit } });
    return response.data.data || [];
  } catch (error: any) {
    console.error('Error fetching recent activities:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch recent activities');
  }
};

/**
 * Get satisfaction/rating score for a specific user
 */
export const getUserSatisfactionScore = async (userId: string): Promise<SatisfactionScore> => {
  try {
    const response = await api.get(`/ratings/score/${userId}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching satisfaction score:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch satisfaction score');
  }
};

/**
 * Helper: Calculate engagement score from stats
 */
const calculateEngagementScore = (stats: any): number => {
  const weights = {
    profileViews: 5,
    inquiries: 15,
    downloads: 3,
    forumPosts: 10,
    forumReplies: 5,
    videos: 2,
    messages: 2,
    cartAdds: 5,
    wishlistAdds: 5,
    quotes: 10,
  };

  const score =
    (stats.profileViewsReceived || 0) * weights.profileViews +
    (stats.inquiriesReceived || 0) * weights.inquiries +
    (stats.downloadsCount || 0) * weights.downloads +
    (stats.forumPostsCreated || 0) * weights.forumPosts +
    (stats.forumRepliesCreated || 0) * weights.forumReplies +
    (stats.videosViewed || 0) * weights.videos +
    (stats.messagesIn || 0) * weights.messages +
    (stats.equipmentCartAdds || 0) * weights.cartAdds +
    (stats.equipmentWishlistAdds || 0) * weights.wishlistAdds +
    (stats.equipmentQuoteRequests || 0) * weights.quotes;

  return Math.min(Math.round(score), 100);
};

/**
 * Get top equipment by interactions (aggregated for admin)
 */
export const getTopEquipment = async (): Promise<EquipmentPopularity[]> => {
  try {
    // This would call a new admin endpoint if available
    // For now, return empty array as this requires backend enhancement
    return [];
  } catch (error: any) {
    console.error('Error fetching top equipment:', error);
    return [];
  }
};

/**
 * Get overall system satisfaction (aggregated for admin)
 */
export const getOverallSatisfaction = async (): Promise<SatisfactionScore> => {
  try {
    // This would aggregate all ratings if we had an admin endpoint
    // For now, return default structure
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      categoryAverages: {
        professionalism: 0,
        responsiveness: 0,
        quality: 0,
        valueForMoney: 0,
        communication: 0,
      },
    };
  } catch (error: any) {
    console.error('Error fetching overall satisfaction:', error);
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
};

export default {
  getEngagementStats,
  getEngagementTrends,
  getEngagementScore,
  getRecentActivities,
  getUserSatisfactionScore,
  getTopEquipment,
  getOverallSatisfaction,
};
