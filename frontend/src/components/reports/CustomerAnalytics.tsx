import React from 'react';
import { UserGroupIcon, UserPlusIcon, StarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CustomerAnalyticsProps {
  dateRange: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({ dateRange, filters, onFiltersChange }) => {
  // Mock data
  const customerGrowthData = [
    { month: 'Jan', new: 12, total: 145 },
    { month: 'Feb', new: 18, total: 163 },
    { month: 'Mar', new: 15, total: 178 },
    { month: 'Apr', new: 22, total: 200 },
    { month: 'May', new: 19, total: 219 },
    { month: 'Jun', new: 25, total: 244 },
  ];

  const customerTypeData = [
    { name: 'Enterprise', value: 15, count: 37 },
    { name: 'Small Business', value: 45, count: 110 },
    { name: 'Franchise', value: 25, count: 61 },
    { name: 'Individual', value: 15, count: 36 },
  ];

  const satisfactionData = [
    { rating: '5 Stars', count: 156, percentage: 64 },
    { rating: '4 Stars', count: 61, percentage: 25 },
    { rating: '3 Stars', count: 20, percentage: 8 },
    { rating: '2 Stars', count: 5, percentage: 2 },
    { rating: '1 Star', count: 2, percentage: 1 },
  ];

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d'];

  const stats = [
    { 
      label: 'Total Customers', 
      value: '244', 
      change: '+11.4%',
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      label: 'New This Month', 
      value: '25', 
      change: '+31.6%',
      icon: UserPlusIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      label: 'Avg. Satisfaction', 
      value: '4.5/5', 
      change: '+0.2',
      icon: StarIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    { 
      label: 'Retention Rate', 
      value: '92%', 
      change: '+3%',
      icon: ArrowTrendingUpIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
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
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor} dark:bg-opacity-20`}>
                <stat.icon className={`h-6 w-6 ${stat.color} dark:opacity-90`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Growth Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Customer Growth</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={customerGrowthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Total Customers"
                dot={{ fill: '#3b82f6' }}
              />
              <Bar dataKey="new" fill="#10b981" name="New Customers" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Types */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Customer Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerTypeData.map((entry, index) => (
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
            {customerTypeData.map((type, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{type.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{type.count} customers</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Customer Satisfaction</h3>
          <div className="space-y-4">
            {satisfactionData.map((rating, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating.rating}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({rating.count})</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{rating.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      index === 0 ? 'bg-green-600 dark:bg-green-500' :
                      index === 1 ? 'bg-green-500 dark:bg-green-400' :
                      index === 2 ? 'bg-yellow-500 dark:bg-yellow-400' :
                      index === 3 ? 'bg-orange-500 dark:bg-orange-400' :
                      'bg-red-500 dark:bg-red-400'
                    }`}
                    style={{ width: `${rating.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-400">
                <span className="font-semibold">89%</span> of customers would recommend Sign Company
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;