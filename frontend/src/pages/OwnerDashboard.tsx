import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getRecentActivity } from '../services/dashboardService';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  VideoCameraIcon,
  ChartBarIcon,
  BellIcon,
  FolderIcon,
  ChatBubbleLeftIcon,
  MapIcon,
  NewspaperIcon,
  ShoppingBagIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recent activity
  const { data: activities = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => getRecentActivity(6),
    staleTime: 2 * 60 * 1000,
  });

  // Owner-specific stats
  const stats = statsData ? [
    {
      name: 'Upcoming Events',
      value: statsData.events.total.toString(),
      icon: CalendarIcon,
      change: statsData.events.change,
      changeType: statsData.events.changeType,
      href: '/calendar',
    },
    {
      name: 'Network Members',
      value: statsData.owners.total.toString(),
      icon: UserGroupIcon,
      change: statsData.owners.change,
      changeType: statsData.owners.changeType,
      href: '/owners',
    },
    {
      name: 'Resources Available',
      value: statsData.library.total.toString(),
      icon: DocumentDuplicateIcon,
      change: statsData.library.change,
      changeType: statsData.library.changeType,
      href: '/library',
    },
    {
      name: 'Video Lessons',
      value: statsData.videos.total.toString(),
      icon: VideoCameraIcon,
      change: statsData.videos.change,
      changeType: statsData.videos.changeType,
      href: '/videos',
    },
  ] : [];

  // Owner-specific quick actions
  const quickActions = [
    {
      icon: CalendarIcon,
      label: 'View Upcoming Events',
      description: 'Check your calendar',
      path: '/calendar',
      color: 'bg-blue-500',
    },
    {
      icon: NewspaperIcon,
      label: 'Share a Success Story',
      description: 'Post your achievements',
      path: '/brags',
      color: 'bg-green-500',
    },
    {
      icon: UserGroupIcon,
      label: 'Find an Owner',
      description: 'Search the roster',
      path: '/owners',
      color: 'bg-purple-500',
    },
    {
      icon: MapIcon,
      label: 'Explore the Map',
      description: 'Find nearby members',
      path: '/map',
      color: 'bg-orange-500',
    },
    {
      icon: FolderIcon,
      label: 'Browse Resources',
      description: 'Download files',
      path: '/library',
      color: 'bg-indigo-500',
    },
    {
      icon: ChatBubbleLeftIcon,
      label: 'Start a Conversation',
      description: 'Chat with members',
      path: '/chat',
      color: 'bg-pink-500',
    },
  ];

  // Featured sections for owners
  const featuredSections = [
    {
      title: 'Convention',
      description: 'View upcoming convention schedules and events',
      icon: BuildingOffice2Icon,
      href: '/convention',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Equipment Marketplace',
      description: 'Browse equipment, create wishlists, and inquire',
      icon: ShoppingBagIcon,
      href: '/equipment',
      color: 'from-green-600 to-teal-600',
    },
    {
      title: 'Partner Directory',
      description: 'Find trusted vendors and service providers',
      icon: UserGroupIcon,
      href: '/partners',
      color: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Welcome back, {user?.name}!
              </h1>
              <p className="mt-2 text-lg text-primary-100">
                Here's what's happening in your Sign Company network.
              </p>
              {user?.company && (
                <p className="mt-1 text-sm text-primary-200">
                  {user.company}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Link
                to="/profile"
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
              >
                View Profile
              </Link>
              <Link
                to="/reports"
                className="inline-flex items-center px-4 py-2 bg-white text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                My Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
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
            <Link
              key={stat.name}
              to={stat.href}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200 group"
            >
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
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                      <stat.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Featured Sections */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {featuredSections.map((section) => (
          <Link
            key={section.title}
            to={section.href}
            className="relative overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
            <div className="relative p-6 text-white">
              <section.icon className="h-10 w-10 mb-4 opacity-80" />
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <p className="mt-1 text-sm text-white/80">{section.description}</p>
              <div className="mt-4 flex items-center text-sm font-medium">
                <span>Explore</span>
                <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Quick Actions
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 group text-center"
                >
                  <div className={`${action.color} p-3 rounded-lg mb-3`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{action.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default OwnerDashboard;
