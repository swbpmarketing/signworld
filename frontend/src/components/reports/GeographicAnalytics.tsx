import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlobeAmericasIcon, MapPinIcon, BuildingStorefrontIcon, TruckIcon } from '@heroicons/react/24/solid';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getGeographicAnalytics } from '../../services/dashboardService';
import type { GeographicAnalyticsData } from '../../services/dashboardService';

interface GeographicAnalyticsProps {
  dateRange: string;
  filters: Record<string, unknown>;
  onFiltersChange: (filters: Record<string, unknown>) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GlobeAmericasIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  TruckIcon,
};

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

const GeographicAnalytics: React.FC<GeographicAnalyticsProps> = ({ dateRange }) => {
  const { data, isLoading, error } = useQuery<GeographicAnalyticsData>({
    queryKey: ['geographicAnalytics', dateRange],
    queryFn: getGeographicAnalytics,
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
        Failed to load geographic analytics data. Please try again later.
      </div>
    );
  }

  // Map stats with icons
  const stats = data.stats.map((stat) => {
    const IconComponent = iconMap[stat.icon] || GlobeAmericasIcon;
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

      {/* Regional Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Members by Region</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.regionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="region" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '0.5rem',
                  color: 'var(--tooltip-text, #111827)'
                }}
              />
              <Legend />
              <Bar dataKey="stores" fill="#3b82f6" name="Members" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-4">
          {data.regionData.map((region, index) => (
            <div key={index} className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">{region.region}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {region.growth > 0 ? '+' : ''}{region.growth}% YoY
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cities */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Member Locations</h3>
          <div className="space-y-3">
            {data.cityPerformance.slice(0, 6).map((city, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' :
                    'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{city.city}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{city.projects} members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{city.projects}</p>
                </div>
              </div>
            ))}
            {data.cityPerformance.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No location data available</p>
            )}
          </div>
        </div>

        {/* Member Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Member Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.serviceAreaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {data.serviceAreaData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid var(--tooltip-border, #e5e7eb)',
                    borderRadius: '0.5rem',
                    color: 'var(--tooltip-text, #111827)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {data.serviceAreaData.map((area, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{area.range}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{area.projects} members</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Member Coverage Map</h3>
        <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPinIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Interactive map showing member locations</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Integration with mapping service available</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicAnalytics;
