import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueAnalyticsProps {
  dateRange: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ dateRange, filters, onFiltersChange }) => {
  // Mock data
  const revenueData = [
    { month: 'Jan', revenue: 45000, lastYear: 38000 },
    { month: 'Feb', revenue: 52000, lastYear: 42000 },
    { month: 'Mar', revenue: 48000, lastYear: 45000 },
    { month: 'Apr', revenue: 61000, lastYear: 50000 },
    { month: 'May', revenue: 55000, lastYear: 48000 },
    { month: 'Jun', revenue: 67000, lastYear: 52000 },
  ];

  const categoryData = [
    { name: 'Channel Letters', value: 35, revenue: 125000 },
    { name: 'Monument Signs', value: 25, revenue: 89000 },
    { name: 'Digital Displays', value: 20, revenue: 71000 },
    { name: 'Vehicle Wraps', value: 15, revenue: 53000 },
    { name: 'Other', value: 5, revenue: 18000 },
  ];

  const COLORS = ['#1890ff', '#096dd9', '#0050b3', '#003a8c', '#002766'];

  const stats = [
    { label: 'Total Revenue', value: '$356,000', change: '+12.5%', positive: true },
    { label: 'Avg. Order Value', value: '$4,250', change: '+8.3%', positive: true },
    { label: 'Revenue/Employee', value: '$28,500', change: '-2.1%', positive: false },
    { label: 'YoY Growth', value: '18.5%', change: '+3.2%', positive: true },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
            <div className="mt-2 flex items-center text-sm">
              {stat.positive ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500 dark:text-green-400 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500 dark:text-red-400 mr-1" />
              )}
              <span className={stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {stat.change}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
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
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                name="This Year"
                dot={{ fill: '#3b82f6' }}
              />
              <Line
                type="monotone"
                dataKey="lastYear"
                stroke="#9ca3af"
                strokeWidth={2}
                name="Last Year"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
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
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Revenue Categories</h3>
          <div className="space-y-4">
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    ${(category.revenue / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{category.value}% of total</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;