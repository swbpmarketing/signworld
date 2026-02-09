import { useAuth } from '../context/AuthContext';
import { usePreviewMode } from '../context/PreviewModeContext';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getDashboardStats, getRecentActivity } from '../services/dashboardService';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';
import {
  CalendarIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  VideoCameraIcon,
  ChartBarIcon,
  BellIcon,
  FolderIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  NewspaperIcon,
  BugAntIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import EngagementMetricsWidget from '../components/analytics/EngagementMetricsWidget';
import EngagementTrendChart from '../components/analytics/EngagementTrendChart';
import ActivityTimeline from '../components/analytics/ActivityTimeline';
import EquipmentPopularityWidget from '../components/analytics/EquipmentPopularityWidget';
import SatisfactionOverview from '../components/analytics/SatisfactionOverview';
import { useWidgetSizes } from '../hooks/useWidgetSizes';
import DashboardGrid from '../components/dashboard/DashboardGrid';
import ResizableWidget from '../components/dashboard/ResizableWidget';

const Dashboard = () => {
  const { user } = useAuth();
  const { getEffectiveRole, getPreviewedUser, isPreviewMode, previewState } = usePreviewMode();
  const navigate = useNavigate();
  const effectiveRole = getEffectiveRole();
  const isActualAdmin = user?.role === 'admin';
  const isAdmin = isActualAdmin && !isPreviewMode;

  const { sizes, setWidgetSize } = useWidgetSizes('admin', {
    'engagement-metrics': 'md',
    'engagement-trend': 'md',
    'activity-timeline': 'md',
    'equipment-popularity': 'md',
    'satisfaction-overview': 'md',
    'recent-activity': 'md',
    'quick-actions': 'md',
  });

  // Get previewed user - this will be called fresh on each render
  const previewedUser = isPreviewMode && previewState.type === 'user'
    ? {
        id: previewState.userId || '',
        name: previewState.userName || '',
        email: previewState.userEmail || '',
        role: previewState.userRole || 'owner' as const,
      }
    : null;


  // Fetch dashboard stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats', previewedUser?.id],
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch recent activity
  const { data: activities = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ['dashboard-activity', previewedUser?.id],
    queryFn: () => getRecentActivity(8),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Admin-specific: Fetch platform-wide statistics
  const { data: adminStats, isLoading: isLoadingAdminStats } = useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: async () => {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      try {
        const [
          eventsRes,
          forumRes,
          libraryRes,
          equipmentRes,
          bragsRes,
          pendingLibraryRes,
          bugReportsRes,
          activityRes
        ] = await Promise.allSettled([
          api.get('/events'),
          api.get('/forum'),
          api.get('/library', { params: { status: 'approved', limit: 1000 } }),
          api.get('/equipment'),
          api.get('/brags'),
          api.get('/library/pending', { params: { limit: 1 } }),
          api.get('/bug-reports'),
          api.get('/activity', { params: { limit: 1000 } }),
        ]);

        // Safely extract data from each response
        const events = eventsRes.status === 'fulfilled'
          ? (Array.isArray(eventsRes.value.data) ? eventsRes.value.data : eventsRes.value.data?.data || [])
          : [];

        const threads = forumRes.status === 'fulfilled'
          ? (Array.isArray(forumRes.value.data) ? forumRes.value.data : forumRes.value.data?.threads || forumRes.value.data?.data || [])
          : [];

        const library = libraryRes.status === 'fulfilled'
          ? (libraryRes.value.data?.data || libraryRes.value.data?.files || (Array.isArray(libraryRes.value.data) ? libraryRes.value.data : []))
          : [];

        const equipment = equipmentRes.status === 'fulfilled'
          ? (equipmentRes.value.data?.data || (Array.isArray(equipmentRes.value.data) ? equipmentRes.value.data : []))
          : [];

        const brags = bragsRes.status === 'fulfilled'
          ? (Array.isArray(bragsRes.value.data) ? bragsRes.value.data : bragsRes.value.data?.data || bragsRes.value.data?.brags || [])
          : [];

        const bugReports = bugReportsRes.status === 'fulfilled'
          ? (Array.isArray(bugReportsRes.value.data) ? bugReportsRes.value.data : bugReportsRes.value.data?.data || [])
          : [];

        const activity = activityRes.status === 'fulfilled'
          ? (Array.isArray(activityRes.value.data) ? activityRes.value.data : activityRes.value.data?.data || activityRes.value.data?.activities || [])
          : [];

        const pendingCount = pendingLibraryRes.status === 'fulfilled'
          ? (pendingLibraryRes.value.data?.total || pendingLibraryRes.value.data?.count || (Array.isArray(pendingLibraryRes.value.data) ? pendingLibraryRes.value.data.length : 0))
          : 0;

        // Calculate statistics
        const totalEvents = events.filter((e: any) => {
          const eventDate = new Date(e.startDate || e.date || e.start);
          return eventDate >= now;
        }).length;

        const forumThreads = threads.filter((t: any) => {
          const threadDate = new Date(t.createdAt);
          return threadDate >= monthAgo;
        }).length;

        const equipmentListings = equipment.filter((e: any) =>
          e.availability !== 'discontinued' && e.isActive !== false
        ).length;

        const recentActivity = activity.filter((a: any) => {
          const activityDate = new Date(a.createdAt || a.timestamp);
          return activityDate >= dayAgo;
        }).length;

        const successStories = brags.filter((b: any) =>
          b.isPublished !== false && b.status !== 'draft'
        ).length;

        const systemAlerts = bugReports.filter((b: any) =>
          b.status === 'pending' || b.status === 'bug/feature'
        ).length;

        return {
          totalEvents,
          forumThreads,
          libraryResources: Array.isArray(library) ? library.length : 0,
          equipmentListings,
          recentActivity,
          successStories,
          pendingReviews: pendingCount,
          systemAlerts,
        };
      } catch (error) {
        console.error('Error fetching platform stats:', error);
        // Return zeros if there's an error
        return {
          totalEvents: 0,
          forumThreads: 0,
          libraryResources: 0,
          equipmentListings: 0,
          recentActivity: 0,
          successStories: 0,
          pendingReviews: 0,
          systemAlerts: 0,
        };
      }
    },
    enabled: isAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Map stats data to display format with navigation paths
  // For regular users and preview mode, show user-specific events instead of total owners
  const stats = statsData ? [
    {
      name: isAdmin ? 'Total Owners' : 'My Events',
      value: isAdmin ? statsData.owners.total.toString() : (statsData.myRsvps?.total || 0).toString(),
      icon: isAdmin ? UserGroupIcon : CalendarIcon,
      change: isAdmin ? statsData.owners.change : (statsData.myRsvps?.change || '0'),
      changeType: isAdmin ? statsData.owners.changeType : (statsData.myRsvps?.changeType || 'neutral'),
      path: isAdmin ? '/owners' : '/calendar',
      description: isAdmin ? 'View all registered owners' : 'View your registered events'
    },
    {
      name: isAdmin ? 'Upcoming Events' : 'Available Events',
      value: statsData.events.total.toString(),
      icon: CalendarIcon,
      change: statsData.events.change,
      changeType: statsData.events.changeType,
      path: '/calendar',
      description: 'Browse and manage events'
    },
    {
      name: 'Library Files',
      value: statsData.library.total.toString(),
      icon: DocumentDuplicateIcon,
      change: statsData.library.change,
      changeType: statsData.library.changeType,
      path: '/library',
      description: 'Access downloadable resources'
    },
    {
      name: 'Video Lessons',
      value: statsData.videos.total.toString(),
      icon: VideoCameraIcon,
      change: statsData.videos.change,
      changeType: statsData.videos.changeType,
      path: '/videos',
      description: 'Watch training videos'
    },
  ] : [];

  // Quick actions based on role
  const quickActions = isAdmin ? [
    {
      icon: UsersIcon,
      label: 'Manage Users',
      path: '/users',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
    },
    {
      icon: DocumentCheckIcon,
      label: 'Review Pending Content',
      path: '/pending-approval',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      badge: adminStats?.pendingApprovals || 0,
    },
    {
      icon: BuildingStorefrontIcon,
      label: 'Manage Partners',
      path: '/partners',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      icon: Cog6ToothIcon,
      label: 'System Settings',
      path: '/settings',
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-700',
    },
  ] : [
    {
      icon: CalendarIcon,
      label: 'View Upcoming Events',
      path: '/calendar',
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/30',
    },
    {
      icon: VideoCameraIcon,
      label: 'Browse Video Library',
      path: '/videos',
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/30',
    },
    {
      icon: UserGroupIcon,
      label: 'Search Owner Directory',
      path: '/owners',
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/30',
    },
    {
      icon: FolderIcon,
      label: 'Download Resources',
      path: '/library',
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/30',
    }
  ];

  return (
    <div className="space-y-8" data-tour="dashboard-content">
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-900 border-blue-100 dark:border-blue-900/30 rounded-lg border p-4 sm:p-6 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {isAdmin && !isPreviewMode
                ? 'Admin Dashboard'
                : isPreviewMode
                ? `Welcome, ${previewedUser?.name || 'User'}!`
                : `Welcome back, ${user?.name}!`}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {isAdmin && !isPreviewMode
                ? `Hello ${user?.name}! Here's your system overview.`
                : isPreviewMode && previewedUser
                ? `Previewing as: ${previewedUser.role === 'owner' ? 'Owner' : 'Vendor'} • ${previewedUser.email}`
                : "Here's what's happening in your Sign Company network today."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Platform Overview Stats */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            onClick={() => !isLoadingAdminStats && navigate('/calendar')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover-lift">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                {isLoadingAdminStats ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.totalEvents || 0}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming Events</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => !isLoadingAdminStats && navigate('/forum')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover-lift">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                {isLoadingAdminStats ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.forumThreads || 0}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">Forum Threads (30d)</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => !isLoadingAdminStats && navigate('/library')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover-lift">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FolderIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                {isLoadingAdminStats ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.libraryResources || 0}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">Library Resources</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => !isLoadingAdminStats && navigate('/equipment')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover-lift">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ShoppingBagIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                {isLoadingAdminStats ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.equipmentListings || 0}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">Equipment Listings</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <SparklesIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                {isLoadingAdminStats ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.recentActivity || 0}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">Recent Activity (24h)</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => !isLoadingAdminStats && navigate('/brags')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover-lift">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <NewspaperIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                {isLoadingAdminStats ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.successStories || 0}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">Success Stories</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => !isLoadingAdminStats && navigate('/pending-approval')}
            className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 shadow-sm cursor-pointer hover-lift ${
              !isLoadingAdminStats && (adminStats?.pendingReviews || 0) > 0
                ? 'border-amber-400 dark:border-amber-500'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${!isLoadingAdminStats && (adminStats?.pendingReviews || 0) > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <DocumentCheckIcon className={`h-5 w-5 ${!isLoadingAdminStats && (adminStats?.pendingReviews || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                {isLoadingAdminStats ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.pendingReviews || 0}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending Reviews</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => !isLoadingAdminStats && navigate('/bug-reports')}
            className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 shadow-sm cursor-pointer hover-lift ${
              !isLoadingAdminStats && (adminStats?.systemAlerts || 0) > 0
                ? 'border-red-400 dark:border-red-500'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${!isLoadingAdminStats && (adminStats?.systemAlerts || 0) > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <BugAntIcon className={`h-5 w-5 ${!isLoadingAdminStats && (adminStats?.systemAlerts || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                {isLoadingAdminStats ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-shimmer"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats?.systemAlerts || 0}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">System Alerts</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard Widgets - Admin Only */}
      {isAdmin && (
        <div data-tour="dashboard-charts" className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h2>

          <DashboardGrid>
            <ResizableWidget widgetId="engagement-metrics" size={sizes['engagement-metrics']} onSizeChange={setWidgetSize}>
              <EngagementMetricsWidget className="h-full" />
            </ResizableWidget>
            <ResizableWidget widgetId="engagement-trend" size={sizes['engagement-trend']} onSizeChange={setWidgetSize}>
              <EngagementTrendChart height={320} />
            </ResizableWidget>
            <ResizableWidget widgetId="activity-timeline" size={sizes['activity-timeline']} onSizeChange={setWidgetSize}>
              <ActivityTimeline />
            </ResizableWidget>
            <ResizableWidget widgetId="equipment-popularity" size={sizes['equipment-popularity']} onSizeChange={setWidgetSize}>
              <EquipmentPopularityWidget />
            </ResizableWidget>
            <ResizableWidget widgetId="satisfaction-overview" size={sizes['satisfaction-overview']} onSizeChange={setWidgetSize}>
              <SatisfactionOverview />
            </ResizableWidget>
          </DashboardGrid>
        </div>
      )}

      {/* Stats Grid */}
      <div data-tour="dashboard-stats-cards" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          // Loading skeleton with shimmer
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-24 rounded animate-shimmer" />
                    <div className="h-8 w-16 rounded animate-shimmer" />
                  </div>
                  <div className="h-12 w-12 rounded-lg animate-shimmer" />
                </div>
              </div>
            </div>
          ))
        ) : (
          stats.map((stat) => (
            <button
              key={stat.name}
              onClick={() => navigate(stat.path)}
              className="w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover-lift cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 focus-ring group"
              title={stat.description}
              aria-label={`${stat.name}: ${stat.value}. ${stat.description}`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {stat.name}
                    </p>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stat.changeType === 'positive'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : stat.changeType === 'negative'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                        aria-label={`${stat.changeType === 'positive' ? 'Increased' : stat.changeType === 'negative' ? 'Decreased' : 'No change'} by ${stat.change}`}
                      >
                        {stat.changeType === 'positive' && <ArrowUpIcon className="h-3 w-3" aria-hidden="true" />}
                        {stat.changeType === 'negative' && <ArrowDownIcon className="h-3 w-3" aria-hidden="true" />}
                        {stat.changeType === 'neutral' && <MinusIcon className="h-3 w-3" aria-hidden="true" />}
                        <span>{stat.change}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                      <stat.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <DashboardGrid>
        {/* Recent Activity */}
        <ResizableWidget widgetId="recent-activity" size={sizes['recent-activity']} onSizeChange={setWidgetSize}>
        <div data-tour="dashboard-recent-activity" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Recent Activity
            </h3>
          </div>
          <div className="p-6">
            {isLoadingActivity ? (
              // Loading skeleton with shimmer
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="h-10 w-10 rounded-full animate-shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded animate-shimmer" />
                      <div className="h-3 w-1/4 rounded animate-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {activities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== activities.length - 1 ? (
                          <span
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                              <div className="h-2 w-2 bg-primary-600 dark:bg-primary-400 rounded-full" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.message}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        </ResizableWidget>

        {/* Quick Actions */}
        <ResizableWidget widgetId="quick-actions" size={sizes['quick-actions']} onSizeChange={setWidgetSize}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <ChartBarIcon className={`h-5 w-5 mr-2 ${isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-primary-600 dark:text-primary-400'}`} />
              {isAdmin ? 'Admin Actions' : 'Quick Actions'}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${action.bg || 'bg-gray-50 dark:bg-gray-700/50'} rounded-lg transition-all duration-200 group hover-scale`}
                >
                  <span className="flex items-center">
                    <action.icon className={`h-5 w-5 mr-3 ${action.color || 'text-primary-600 dark:text-primary-400'}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.label}</span>
                    {'badge' in action && action.badge > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-amber-500 rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </span>
                  <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
        </ResizableWidget>
      </DashboardGrid>
    </div>
  );
};

export default Dashboard;