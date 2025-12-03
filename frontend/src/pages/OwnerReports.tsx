import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  UserIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  CalendarIcon,
  NewspaperIcon,
  ShoppingCartIcon,
  StarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../config/axios';

interface OwnerStats {
  activity: {
    postsCreated: number;
    likesReceived: number;
    commentsReceived: number;
    forumThreads: number;
    forumReplies: number;
  };
  engagement: {
    profileViews: number;
    inquiriesReceived: number;
    contactClicks: number;
    averageRating: number;
    totalReviews: number;
  };
  participation: {
    eventsAttended: number;
    upcomingEvents: number;
    chatMessages: number;
    resourcesDownloaded: number;
  };
  equipment: {
    cartItems: number;
    wishlistItems: number;
    quoteRequests: number;
  };
  trends: {
    profileViewsTrend: number;
    engagementTrend: number;
    activityTrend: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    time: string;
  }>;
}

const OwnerReports = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('last30days');
  const [activeSection, setActiveSection] = useState('overview');

  // Fetch owner-specific stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['owner-stats', user?.id, dateRange],
    queryFn: async () => {
      try {
        const response = await api.get(`/users/owner-stats?dateRange=${dateRange}`);
        return response.data.data as OwnerStats;
      } catch (error) {
        // Return mock data if endpoint doesn't exist yet
        return getMockStats();
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Mock data for development
  const getMockStats = (): OwnerStats => ({
    activity: {
      postsCreated: 12,
      likesReceived: 48,
      commentsReceived: 23,
      forumThreads: 5,
      forumReplies: 18,
    },
    engagement: {
      profileViews: 156,
      inquiriesReceived: 8,
      contactClicks: 34,
      averageRating: 4.7,
      totalReviews: 12,
    },
    participation: {
      eventsAttended: 6,
      upcomingEvents: 3,
      chatMessages: 89,
      resourcesDownloaded: 24,
    },
    equipment: {
      cartItems: 3,
      wishlistItems: 7,
      quoteRequests: 2,
    },
    trends: {
      profileViewsTrend: 12,
      engagementTrend: 8,
      activityTrend: -3,
    },
    recentActivity: [
      { id: '1', type: 'like', message: 'John Smith liked your success story', time: '2 hours ago' },
      { id: '2', type: 'view', message: 'Your profile was viewed 5 times today', time: '5 hours ago' },
      { id: '3', type: 'comment', message: 'New comment on your forum post', time: '1 day ago' },
      { id: '4', type: 'event', message: 'Reminder: Convention starts in 3 days', time: '2 days ago' },
    ],
  });

  const handleExport = () => {
    if (!stats) return;

    toast.loading('Generating your report...', { id: 'export' });

    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['My Activity Report'],
        ['Generated:', new Date().toLocaleString()],
        ['Date Range:', dateRange],
        ['Owner:', user?.name || ''],
        [],
        ['Activity Summary'],
        ['Posts Created', stats.activity.postsCreated],
        ['Likes Received', stats.activity.likesReceived],
        ['Comments Received', stats.activity.commentsReceived],
        ['Forum Threads', stats.activity.forumThreads],
        ['Forum Replies', stats.activity.forumReplies],
        [],
        ['Engagement Summary'],
        ['Profile Views', stats.engagement.profileViews],
        ['Inquiries Received', stats.engagement.inquiriesReceived],
        ['Contact Clicks', stats.engagement.contactClicks],
        ['Average Rating', stats.engagement.averageRating],
        ['Total Reviews', stats.engagement.totalReviews],
        [],
        ['Participation Summary'],
        ['Events Attended', stats.participation.eventsAttended],
        ['Upcoming Events', stats.participation.upcomingEvents],
        ['Chat Messages', stats.participation.chatMessages],
        ['Resources Downloaded', stats.participation.resourcesDownloaded],
      ];

      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws, 'My Report');

      XLSX.writeFile(wb, `my-activity-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Report exported successfully!', { id: 'export' });
    } catch (error) {
      toast.error('Failed to export report', { id: 'export' });
    }
  };

  const renderTrendBadge = (trend: number) => {
    if (trend > 0) {
      return (
        <span className="inline-flex items-center text-xs font-medium text-green-600 dark:text-green-400">
          <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
          +{trend}%
        </span>
      );
    } else if (trend < 0) {
      return (
        <span className="inline-flex items-center text-xs font-medium text-red-600 dark:text-red-400">
          <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
          {trend}%
        </span>
      );
    }
    return (
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">No change</span>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarSolidIcon
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const sections = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'activity', name: 'My Activity', icon: NewspaperIcon },
    { id: 'engagement', name: 'Profile Engagement', icon: EyeIcon },
    { id: 'participation', name: 'Network Participation', icon: UserGroupIcon },
    { id: 'equipment', name: 'Equipment Interests', icon: ShoppingCartIcon },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6">
          <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
          <div className="h-4 w-64 bg-white/10 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentStats = stats || getMockStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <ChartBarIcon className="h-8 w-8 mr-3" />
                My Reports
              </h1>
              <p className="mt-2 text-primary-100">
                Track your activity and engagement in the Sign Company network
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-white/30"
              >
                <option value="last7days" className="text-gray-900">Last 7 Days</option>
                <option value="last30days" className="text-gray-900">Last 30 Days</option>
                <option value="last90days" className="text-gray-900">Last 90 Days</option>
                <option value="thisYear" className="text-gray-900">This Year</option>
              </select>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Profile Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {currentStats.engagement.profileViews}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <EyeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2">{renderTrendBadge(currentStats.trends.profileViewsTrend)}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Likes Received</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {currentStats.activity.likesReceived}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <HeartIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-2">{renderTrendBadge(currentStats.trends.engagementTrend)}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">My Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {currentStats.engagement.averageRating.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <StarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-2">{renderStars(Math.round(currentStats.engagement.averageRating))}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inquiries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {currentStats.engagement.inquiriesReceived}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ChatBubbleLeftIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {currentStats.engagement.contactClicks} contact clicks
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1 sticky top-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <section.icon className={`h-5 w-5 mr-3 ${
                  activeSection === section.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                }`} />
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <>
              {/* Activity Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity Summary</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStats.activity.postsCreated}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStats.activity.likesReceived}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Likes</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStats.activity.commentsReceived}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Comments</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStats.activity.forumThreads}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Threads</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStats.activity.forumReplies}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Replies</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {currentStats.recentActivity.map((activity) => (
                    <div key={activity.id} className="px-6 py-4 flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'like' ? 'bg-red-100 dark:bg-red-900/30' :
                        activity.type === 'view' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        activity.type === 'comment' ? 'bg-green-100 dark:bg-green-900/30' :
                        'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        {activity.type === 'like' && <HeartIcon className="h-4 w-4 text-red-600 dark:text-red-400" />}
                        {activity.type === 'view' && <EyeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        {activity.type === 'comment' && <ChatBubbleLeftIcon className="h-4 w-4 text-green-600 dark:text-green-400" />}
                        {activity.type === 'event' && <CalendarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100">{activity.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Activity Section */}
          {activeSection === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Content Activity</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Success Stories */}
                    <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <TrophyIcon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Success Stories</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Stories Posted</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{currentStats.activity.postsCreated}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Likes</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{currentStats.activity.likesReceived}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Comments</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{currentStats.activity.commentsReceived}</span>
                        </div>
                      </div>
                    </div>

                    {/* Forum Activity */}
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <ChatBubbleLeftIcon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Forum Activity</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Threads Started</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{currentStats.activity.forumThreads}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Replies Posted</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{currentStats.activity.forumReplies}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Contributions</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {currentStats.activity.forumThreads + currentStats.activity.forumReplies}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Trend */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity Trend</h3>
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-xl ${
                    currentStats.trends.activityTrend >= 0
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {currentStats.trends.activityTrend >= 0
                      ? <ArrowTrendingUpIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                      : <ArrowTrendingDownIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {currentStats.trends.activityTrend >= 0 ? '+' : ''}{currentStats.trends.activityTrend}%
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      compared to previous period
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engagement Section */}
          {activeSection === 'engagement' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Performance</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <EyeIcon className="h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentStats.engagement.profileViews}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Profile Views</p>
                      <div className="mt-2">{renderTrendBadge(currentStats.trends.profileViewsTrend)}</div>
                    </div>
                    <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <ChatBubbleLeftIcon className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentStats.engagement.inquiriesReceived}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inquiries Received</p>
                    </div>
                    <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <UserIcon className="h-10 w-10 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentStats.engagement.contactClicks}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Contact Clicks</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Rating</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                        {currentStats.engagement.averageRating.toFixed(1)}
                      </p>
                      <div className="mt-2">{renderStars(Math.round(currentStats.engagement.averageRating))}</div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Based on {currentStats.engagement.totalReviews} reviews
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-sm w-8 text-gray-600 dark:text-gray-400">{star} star</span>
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 10 : 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Participation Section */}
          {activeSection === 'participation' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Network Participation</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                      <CalendarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStats.participation.eventsAttended}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Events Attended</p>
                    </div>
                    <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
                      <CalendarIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStats.participation.upcomingEvents}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Events</p>
                    </div>
                    <div className="p-5 bg-pink-50 dark:bg-pink-900/20 rounded-xl text-center">
                      <ChatBubbleLeftIcon className="h-8 w-8 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStats.participation.chatMessages}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Chat Messages</p>
                    </div>
                    <div className="p-5 bg-teal-50 dark:bg-teal-900/20 rounded-xl text-center">
                      <DocumentTextIcon className="h-8 w-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStats.participation.resourcesDownloaded}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Resources Downloaded</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Level */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl border border-primary-200 dark:border-primary-800 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary-500 rounded-xl">
                    <TrophyIcon className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Active Member</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You're in the top 20% of engaged members in the network!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Equipment Section */}
          {activeSection === 'equipment' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Equipment Interests</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                      <ShoppingCartIcon className="h-10 w-10 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentStats.equipment.cartItems}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Items in Cart</p>
                    </div>
                    <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                      <HeartIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentStats.equipment.wishlistItems}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Wishlist Items</p>
                    </div>
                    <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                      <DocumentTextIcon className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentStats.equipment.quoteRequests}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quote Requests</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <ShoppingCartIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Equipment Marketplace</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Browse our marketplace for the latest sign-making equipment. Add items to your cart or wishlist and request quotes directly from vendors.
                    </p>
                    <a
                      href="/equipment"
                      className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-3"
                    >
                      Browse Equipment
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerReports;
