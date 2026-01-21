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
} from '@heroicons/react/24/outline';
import EngagementMetricsWidget from '../components/analytics/EngagementMetricsWidget';
import EngagementTrendChart from '../components/analytics/EngagementTrendChart';
import ActivityTimeline from '../components/analytics/ActivityTimeline';
import EquipmentPopularityWidget from '../components/analytics/EquipmentPopularityWidget';
import SatisfactionOverview from '../components/analytics/SatisfactionOverview';

const Dashboard = () => {
  const { user } = useAuth();
  const { getEffectiveRole, getPreviewedUser, isPreviewMode, previewState } = usePreviewMode();
  const navigate = useNavigate();
  const effectiveRole = getEffectiveRole();
  const isActualAdmin = user?.role === 'admin';
  const isAdmin = isActualAdmin && !isPreviewMode;

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

  // Admin-specific: Fetch user statistics
  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, pendingRes] = await Promise.all([
        api.get('/users', { params: { limit: 1000 } }),
        api.get('/library/pending', { params: { limit: 1 } }).catch(() => ({ data: { total: 0 } })),
      ]);

      const users = usersRes.data?.data || [];
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      return {
        totalUsers: users.length,
        admins: users.filter((u: any) => u.role === 'admin').length,
        owners: users.filter((u: any) => u.role === 'owner').length,
        vendors: users.filter((u: any) => u.role === 'vendor').length,
        activeUsers: users.filter((u: any) => u.isActive).length,
        inactiveUsers: users.filter((u: any) => !u.isActive).length,
        newUsersThisWeek: users.filter((u: any) => new Date(u.createdAt) >= weekAgo).length,
        pendingApprovals: pendingRes.data?.total || 0,
      };
    },
    enabled: isAdmin,
    staleTime: 60 * 1000, // 1 minute
  });

  // Map stats data to display format
  // For regular users and preview mode, show user-specific events instead of total owners
  const stats = statsData ? [
    {
      name: isAdmin ? 'Total Owners' : 'My Events',
      value: isAdmin ? statsData.owners.total.toString() : (statsData.myRsvps?.total || 0).toString(),
      icon: isAdmin ? UserGroupIcon : CalendarIcon,
      change: isAdmin ? statsData.owners.change : (statsData.myRsvps?.change || '0'),
      changeType: isAdmin ? statsData.owners.changeType : (statsData.myRsvps?.changeType || 'neutral')
    },
    {
      name: isAdmin ? 'Upcoming Events' : 'Available Events',
      value: statsData.events.total.toString(),
      icon: CalendarIcon,
      change: statsData.events.change,
      changeType: statsData.events.changeType
    },
    {
      name: 'Library Files',
      value: statsData.library.total.toString(),
      icon: DocumentDuplicateIcon,
      change: statsData.library.change,
      changeType: statsData.library.changeType
    },
    {
      name: 'Video Lessons',
      value: statsData.videos.total.toString(),
      icon: VideoCameraIcon,
      change: statsData.videos.change,
      changeType: statsData.videos.changeType
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
      {/* Welcome Section */}
      <div className={`bg-gradient-to-r ${isAdmin && !isPreviewMode ? 'from-purple-600 to-purple-700' : 'from-primary-600 to-primary-700'} rounded-xl shadow-lg overflow-hidden`}>
        <div className="px-4 py-6 sm:px-8 sm:py-10">
          <div className="flex items-center gap-3">
            {isAdmin && !isPreviewMode && <ShieldCheckIcon className="h-8 w-8 text-white/80" />}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {isAdmin && !isPreviewMode
                  ? 'Admin Dashboard'
                  : isPreviewMode
                  ? `Welcome, ${previewedUser?.name || 'User'}!`
                  : `Welcome back, ${user?.name}!`}
              </h1>
              <p className="mt-2 text-lg text-white/80">
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
      </div>

      {/* Admin System Stats */}
      {isAdmin && adminStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          <div
            onClick={() => navigate('/users')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <UsersIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats.totalUsers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/users?role=admin')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ShieldCheckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats.admins}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admins</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/owners')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats.owners}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Owners</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/users?role=vendor')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BuildingStorefrontIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats.vendors}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vendors</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/users?status=active')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats.activeUsers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/users?status=inactive')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats.inactiveUsers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Inactive</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/new-users')}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <ClockIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats.newUsersThisWeek}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">New (7d)</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/pending-approval')}
            className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              adminStats.pendingApprovals > 0
                ? 'border-amber-400 dark:border-amber-500'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${adminStats.pendingApprovals > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <DocumentCheckIcon className={`h-5 w-5 ${adminStats.pendingApprovals > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminStats.pendingApprovals}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard Widgets - Admin Only */}
      {isAdmin && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h2>

          {/* Row 1: Engagement Metrics + Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <EngagementMetricsWidget className="h-full" />
            <div className="lg:col-span-2">
              <EngagementTrendChart height={320} />
            </div>
          </div>

          {/* Row 2: Activity Timeline + Equipment Popularity + Satisfaction */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ActivityTimeline />
            <EquipmentPopularityWidget />
            <SatisfactionOverview />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          // Loading skeleton
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : (
          stats.map((stat) => (
            <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                      <span
                        className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stat.changeType === 'positive'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : stat.changeType === 'negative'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                      <stat.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Recent Activity
            </h3>
          </div>
          <div className="p-6">
            {isLoadingActivity ? (
              // Loading skeleton
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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

        {/* Quick Actions */}
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
                  className={`w-full flex items-center justify-between px-4 py-3 ${action.bg || 'bg-gray-50 dark:bg-gray-700/50'} hover:opacity-80 rounded-lg transition-all duration-200 group`}
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
      </div>
    </div>
  );
};

export default Dashboard;