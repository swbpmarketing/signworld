import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WrenchScrewdriverIcon, TruckIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/solid';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getEquipmentAnalytics } from '../../services/dashboardService';
import type { EquipmentAnalyticsData } from '../../services/dashboardService';

interface EquipmentROIProps {
  dateRange: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  WrenchScrewdriverIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TruckIcon,
};

const EquipmentROI: React.FC<EquipmentROIProps> = ({ dateRange, filters, onFiltersChange }) => {
  const { data, isLoading, error } = useQuery<EquipmentAnalyticsData>({
    queryKey: ['equipmentAnalytics', dateRange],
    queryFn: getEquipmentAnalytics,
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
        Failed to load resource analytics data. Please try again later.
      </div>
    );
  }

  // Map stats with icons
  const stats = data.stats.map((stat, index) => {
    const IconComponent = iconMap[stat.icon] || WrenchScrewdriverIcon;
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

      {/* Resource Utilization */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Resource Performance</h3>
        <div className="space-y-4">
          {data.equipmentUtilization.map((equipment, index) => (
            <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{equipment.name}</h4>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {equipment.revenue > 0 ? `${equipment.revenue} views/downloads` : 'No activity'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Utilization</p>
                  <div className="flex items-center mt-1">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(equipment.utilization, 100)}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{equipment.utilization}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Engagement</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{equipment.revenue}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Items</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{equipment.maintenance}</p>
                </div>
              </div>
            </div>
          ))}
          {data.equipmentUtilization.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No resource data available</p>
          )}
        </div>
      </div>

      {/* ROI Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Content Growth & Utilization Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.roiTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
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
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="roi"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Growth Score"
                dot={{ fill: '#3b82f6' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="utilization"
                stroke="#10b981"
                strokeWidth={2}
                name="Utilization %"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Content</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Review Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.maintenanceSchedule.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.equipment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.lastService}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.nextService}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${
                      item.status === 'Overdue' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                      item.status === 'Due Soon' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                      item.status === 'Scheduled' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {data.maintenanceSchedule.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No recent content available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EquipmentROI;
