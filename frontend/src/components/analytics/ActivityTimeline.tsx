import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  EyeIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  VideoCameraIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { getRecentActivities } from '../../services/analyticsService';

interface ActivityTimelineProps {
  limit?: number;
  className?: string;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ limit = 15, className = '' }) => {
  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => getRecentActivities(limit),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const getActivityIcon = (type: string) => {
    const iconMap: Record<
      string,
      { Icon: React.ComponentType<any>; color: string; bg: string }
    > = {
      profile_view: {
        Icon: EyeIcon,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
      },
      inquiry_received: {
        Icon: EnvelopeIcon,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
      },
      inquiry_sent: {
        Icon: EnvelopeIcon,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-900/30',
      },
      resource_download: {
        Icon: DocumentArrowDownIcon,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-100 dark:bg-purple-900/30',
      },
      video_viewed: {
        Icon: VideoCameraIcon,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-900/30',
      },
      forum_post_created: {
        Icon: ChatBubbleLeftIcon,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
      },
      forum_reply_created: {
        Icon: ChatBubbleLeftIcon,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
      },
      chat_message_sent: {
        Icon: ChatBubbleLeftIcon,
        color: 'text-cyan-600 dark:text-cyan-400',
        bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      },
      contact_click: {
        Icon: EnvelopeIcon,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      },
    };

    return iconMap[type] || iconMap.profile_view;
  };

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 ${className}`}
      >
        <p className="text-red-700 dark:text-red-400 text-sm">
          Failed to load activity timeline
        </p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center ${className}`}
      >
        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
    >
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
        <ClockIcon className="h-4 w-4" />
        Recent Activity
      </h3>

      <div className="space-y-4">
        {activities.slice(0, 10).map((activity, idx) => {
          const { Icon, color, bg } = getActivityIcon(activity.type);
          return (
            <div key={activity.id || idx} className="flex gap-3 relative">
              {/* Timeline line */}
              {idx < activities.length - 1 && (
                <div className="absolute left-5 top-11 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-700" />
              )}

              {/* Icon */}
              <div className={`${bg} rounded-lg p-2 w-fit flex-shrink-0 relative z-10`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
