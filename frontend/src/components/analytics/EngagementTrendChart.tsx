import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parse } from 'date-fns';
import { getEngagementTrends } from '../../services/analyticsService';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface EngagementTrendChartProps {
  days?: number;
  className?: string;
  height?: number;
}

const EngagementTrendChart: React.FC<EngagementTrendChartProps> = ({
  days = 30,
  className = '',
  height = 300,
}) => {
  const { data: trends = [], isLoading, error } = useQuery({
    queryKey: ['engagement-trends', days],
    queryFn: () => getEngagementTrends(days),
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return [];

    return trends.map((item) => ({
      ...item,
      date: format(parse(item.date, 'yyyy-MM-dd', new Date()), 'MMM dd'),
      originalDate: item.date,
    }));
  }, [trends]);

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div
            style={{ height: height + 'px' }}
            className="w-full bg-gray-200 dark:bg-gray-700 rounded"
          />
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
          Failed to load engagement trends
        </p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center ${className}`}
      >
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No trend data available</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}
    >
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
        <ChartBarIcon className="h-4 w-4" />
        Engagement Trends (Last {days} Days)
      </h3>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorProfileViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorInquiries" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorForumPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorVideoViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            className="dark:fill-gray-400"
          />

          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            className="dark:fill-gray-400"
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            className="dark:bg-gray-800 dark:text-gray-100"
            formatter={(value) => value.toLocaleString()}
          />

          <Legend
            wrapperStyle={{
              paddingTop: '16px',
              fontSize: '12px',
              color: '#6b7280',
            }}
            className="dark:text-gray-400"
          />

          <Area
            type="monotone"
            dataKey="profileViews"
            stroke="#3b82f6"
            fill="url(#colorProfileViews)"
            name="Profile Views"
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="inquiries"
            stroke="#10b981"
            fill="url(#colorInquiries)"
            name="Inquiries"
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="downloads"
            stroke="#8b5cf6"
            fill="url(#colorDownloads)"
            name="Downloads"
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="forumPosts"
            stroke="#f59e0b"
            fill="url(#colorForumPosts)"
            name="Forum Posts"
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="videoViews"
            stroke="#ef4444"
            fill="url(#colorVideoViews)"
            name="Video Views"
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="totalEngagement"
            stroke="#6b7280"
            strokeDasharray="5 5"
            fill="none"
            name="Total Engagement"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EngagementTrendChart;
