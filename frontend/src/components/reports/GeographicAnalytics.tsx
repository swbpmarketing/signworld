import React from 'react';
import { GlobeAmericasIcon, MapPinIcon, BuildingStorefrontIcon, TruckIcon } from '@heroicons/react/24/solid';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GeographicAnalyticsProps {
  dateRange: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

const GeographicAnalytics: React.FC<GeographicAnalyticsProps> = ({ dateRange, filters, onFiltersChange }) => {
  // Mock data
  const regionData = [
    { region: 'Northeast', revenue: 125000, stores: 45, growth: 12.5 },
    { region: 'Southeast', revenue: 98000, stores: 38, growth: 8.2 },
    { region: 'Midwest', revenue: 87000, stores: 32, growth: 15.3 },
    { region: 'Southwest', revenue: 92000, stores: 35, growth: 10.1 },
    { region: 'West', revenue: 110000, stores: 42, growth: 18.7 },
  ];

  const cityPerformance = [
    { city: 'New York', revenue: 45000, projects: 23, distance: 0 },
    { city: 'Los Angeles', revenue: 38000, projects: 18, distance: 2790 },
    { city: 'Chicago', revenue: 32000, projects: 15, distance: 790 },
    { city: 'Houston', revenue: 28000, projects: 12, distance: 1420 },
    { city: 'Phoenix', revenue: 25000, projects: 10, distance: 2140 },
    { city: 'Philadelphia', revenue: 22000, projects: 9, distance: 95 },
    { city: 'San Antonio', revenue: 20000, projects: 8, distance: 1520 },
    { city: 'San Diego', revenue: 18000, projects: 7, distance: 2740 },
  ];

  const serviceAreaData = [
    { range: '0-50 miles', percentage: 45, projects: 156 },
    { range: '50-100 miles', percentage: 30, projects: 104 },
    { range: '100-200 miles', percentage: 18, projects: 62 },
    { range: '200+ miles', percentage: 7, projects: 24 },
  ];

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

  const stats = [
    { 
      label: 'Service Regions', 
      value: '5', 
      icon: GlobeAmericasIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      label: 'Active Locations', 
      value: '192', 
      icon: MapPinIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      label: 'Partner Stores', 
      value: '85', 
      icon: BuildingStorefrontIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    { 
      label: 'Avg. Service Radius', 
      value: '75 mi', 
      icon: TruckIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
  ];

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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue by Region</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
              <Bar dataKey="stores" fill="#10b981" name="Store Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-4">
          {regionData.map((region, index) => (
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Performing Cities</h3>
          <div className="space-y-3">
            {cityPerformance.slice(0, 6).map((city, index) => (
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">{city.projects} projects</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">${(city.revenue / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{city.distance} mi</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Area Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Service Area Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceAreaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {serviceAreaData.map((entry, index) => (
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
            {serviceAreaData.map((area, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{area.range}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{area.projects} projects</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Penetration Map Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Market Coverage Map</h3>
        <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPinIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Interactive map showing service coverage</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Integration with mapping service required</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicAnalytics;