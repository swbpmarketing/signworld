import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReportsOverview } from '../../services/dashboardService';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

interface DashboardOverviewProps {
  dateRange: string;
  filters: any;
  onFiltersChange: (filters: any) => void;
}

const DashboardOverview = ({ dateRange, filters, onFiltersChange }: DashboardOverviewProps) => {
  // Fetch reports overview data
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports-overview', dateRange, filters],
    queryFn: getReportsOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const kpiData = data?.kpiData || {
    totalRevenue: { value: 0, change: 0, trend: 'up' as const },
    activeProjects: { value: 0, change: 0, trend: 'up' as const },
    customerSatisfaction: { value: 0, change: 0, trend: 'up' as const },
    avgProjectTime: { value: 0, change: 0, trend: 'down' as const },
    newCustomers: { value: 0, change: 0, trend: 'up' as const },
    equipmentUtilization: { value: 0, change: 0, trend: 'down' as const },
  };

  const revenueOverTime = data?.revenueOverTime || [];
  const projectsByCategory = data?.projectsByCategory || [];
  const performanceMetrics = data?.performanceMetrics || [];

  const exportToPDF = () => {
    // Implementation for PDF export
    console.log('Exporting to PDF...');
  };

  const exportToExcel = () => {
    // Implementation for Excel export
    console.log('Exporting to Excel...');
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Unable to load reports data</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            {error instanceof Error ? error.message : 'An error occurred while loading the reports. Please try again later.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Executive Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Real-time business metrics and performance indicators
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportToPDF}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
              PDF
            </button>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
              Excel
            </button>
            <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <PrinterIcon className="h-4 w-4 mr-1.5" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(kpiData).map(([key, data]) => {
          const labels = {
            totalRevenue: 'Total Revenue',
            activeProjects: 'Active Projects',
            customerSatisfaction: 'Customer Satisfaction',
            avgProjectTime: 'Avg Project Time (days)',
            newCustomers: 'New Customers',
            equipmentUtilization: 'Equipment Utilization',
          };
          
          const formats = {
            totalRevenue: '$',
            customerSatisfaction: '%',
            equipmentUtilization: '%',
          };

          return (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{labels[key]}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formats[key] === '$' && '$'}
                    {formats[key] === '$' ? data.value.toLocaleString() : data.value}
                    {formats[key] === '%' && '%'}
                  </p>
                  <div className="mt-3 flex items-center">
                    {data.trend === 'up' ? (
                      <ArrowUpIcon className="h-4 w-4 text-green-500 dark:text-green-400 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 text-red-500 dark:text-red-400 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${data.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {Math.abs(data.change)}%
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last period</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${data.trend === 'up' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                  {data.trend === 'up' ? (
                    <ArrowTrendingUpIcon className={`h-6 w-6 ${data.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                  ) : (
                    <ArrowTrendingDownIcon className={`h-6 w-6 ${data.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue & Profit Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueOverTime}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e8e8e8', borderRadius: '8px' }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#1890ff" fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" stroke="#52c41a" fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Projects by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e8e8e8', borderRadius: '8px' }}
                  formatter={(value, name, props) => [
                    `${value} projects`,
                    `Revenue: $${props.payload.revenue.toLocaleString()}`
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance vs Targets</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceMetrics} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="metric" type="category" tick={{ fontSize: 12 }} width={120} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e8e8e8', borderRadius: '8px' }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Bar dataKey="current" fill="#1890ff" name="Current" />
              <Bar dataKey="target" fill="#52c41a" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;