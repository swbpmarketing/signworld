import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  EyeIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  VideoCameraIcon,
  ChatBubbleLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { getEngagementStats } from '../../services/analyticsService';

interface EngagementMetricsWidgetProps {
  days?: number;
  className?: string;
}

const EngagementMetricsWidget: React.FC<EngagementMetricsWidgetProps> = ({
  days = 30,
  className = '',
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['engagement-stats', days],
    queryFn: () => getEngagementStats(days),
    staleTime: 5 * 60 * 1000,
  });

  const metrics = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: 'Profile Views',
        value: data.profileViewsReceived,
        icon: EyeIcon,
        color: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        trend: 12,
      },
      {
        label: 'Inquiries',
        value: data.inquiriesReceived,
        icon: EnvelopeIcon,
        color: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
        trend: -3,
      },
      {
        label: 'Downloads',
        value: data.downloadsCount,
        icon: DocumentArrowDownIcon,
        color: 'bg-purple-100 dark:bg-purple-900/30',
        iconColor: 'text-purple-600 dark:text-purple-400',
        trend: 8,
      },
      {
        label: 'Video Views',
        value: data.videosViewed,
        icon: VideoCameraIcon,
        color: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        trend: 5,
      },
      {
        label: 'Forum Posts',
        value: data.forumPostsCreated,
        icon: ChatBubbleLeftIcon,
        color: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        trend: 15,
      },
      {
        label: 'Messages',
        value: data.messagesIn,
        icon: ChatBubbleLeftIcon,
        color: 'bg-cyan-100 dark:bg-cyan-900/30',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        trend: -2,
      },
    ];
  }, [data]);

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
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
          Failed to load engagement metrics
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Header with Score */}
      <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
          <ChartBarIcon className="h-4 w-4" />
          Engagement Overview
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {data?.engagementScore || 0}
              </span>
              <span className="text-lg text-gray-500 dark:text-gray-400">/100</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Engagement Score</p>
          </div>

          <div className="flex items-center gap-1">
            {(data?.engagementScore || 0) >= 50 ? (
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <ArrowTrendingDownIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <span
              className={`text-sm font-semibold ${
                (data?.engagementScore || 0) >= 50
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {Math.abs(12)}% vs last period
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="space-y-2">
            <div className={`${metric.color} rounded-lg p-2 w-fit`}>
              <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
            </div>

            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metric.value.toLocaleString()}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">{metric.label}</p>
                <span
                  className={`text-xs font-semibold flex items-center gap-0.5 ${
                    metric.trend > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {metric.trend > 0 ? '+' : ''}
                  {metric.trend}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EngagementMetricsWidget;
