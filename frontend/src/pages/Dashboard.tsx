import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getRecentActivity } from '../services/dashboardService';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  VideoCameraIcon,
  ChartBarIcon,
  BellIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch recent activity
  const { data: activities = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => getRecentActivity(8),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Map stats data to display format
  const stats = statsData ? [
    {
      name: 'Total Owners',
      value: statsData.owners.total.toString(),
      icon: UserGroupIcon,
      change: statsData.owners.change,
      changeType: statsData.owners.changeType
    },
    {
      name: 'Upcoming Events',
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

  const quickActions = [
    {
      icon: CalendarIcon,
      label: 'View Upcoming Events',
      path: '/events'
    },
    {
      icon: VideoCameraIcon,
      label: 'Browse Video Library',
      path: '/videos'
    },
    {
      icon: UserGroupIcon,
      label: 'Search Owner Directory',
      path: '/owners'
    },
    {
      icon: FolderIcon,
      label: 'Download Resources',
      path: '/library'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-3 text-lg text-primary-100">
            Here's what's happening in your Sign Company network today.
          </p>
        </div>
      </div>

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
              <ChartBarIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Quick Actions
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 group"
                >
                  <span className="flex items-center">
                    <action.icon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.label}</span>
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