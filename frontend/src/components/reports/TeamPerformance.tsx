import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UsersIcon, TrophyIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTeamAnalytics } from '../../services/dashboardService';
import type { TeamAnalyticsData } from '../../services/dashboardService';

interface TeamPerformanceProps {
  dateRange: string;
  filters: Record<string, unknown>;
  onFiltersChange: (filters: Record<string, unknown>) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
};

const TeamPerformance: React.FC<TeamPerformanceProps> = ({ dateRange }) => {
  const { data, isLoading, error } = useQuery<TeamAnalyticsData>({
    queryKey: ['teamAnalytics', dateRange],
    queryFn: getTeamAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
        Failed to load community performance data. Please try again later.
      </div>
    );
  }

  // Map stats with icons
  const stats = data.stats.map((stat) => {
    const IconComponent = iconMap[stat.icon] || UsersIcon;
    return { ...stat, icon: IconComponent };
  });

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor} dark:bg-opacity-20`}>
                <stat.icon className={`h-6 w-6 ${stat.color} dark:opacity-90`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Community Leaderboard */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Community Contributors</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Discussions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.teamProductivity.map((member, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {member.projects}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {member.revenue} pts
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 max-w-[100px]">
                        <div
                          className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                          style={{ width: `${member.efficiency}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{member.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.satisfaction}</span>
                      <svg className="ml-1 w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
              {data.teamProductivity.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No contributor data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Weekly Activity Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.performanceTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="week" className="text-gray-600 dark:text-gray-400" />
              <YAxis yAxisId="left" className="text-gray-600 dark:text-gray-400" />
              <YAxis yAxisId="right" orientation="right" className="text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '0.5rem',
                  color: 'var(--tooltip-text, #111827)'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="completed" fill="#3b82f6" name="Discussions Started" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="efficiency"
                stroke="#10b981"
                strokeWidth={3}
                name="Engagement %"
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Discussion Categories</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data.skillsData}>
              <PolarGrid className="stroke-gray-300 dark:stroke-gray-600" />
              <PolarAngleAxis dataKey="skill" className="text-gray-600 dark:text-gray-400" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-gray-600 dark:text-gray-400" />
              <Radar name="Community Average" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Radar name="Top Performers" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Legend />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '0.5rem',
                  color: 'var(--tooltip-text, #111827)'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformance;
