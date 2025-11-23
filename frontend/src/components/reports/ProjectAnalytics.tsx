import React from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProjectAnalyticsProps {
  dateRange: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ dateRange, filters, onFiltersChange }) => {
  // Mock data
  const projectStatusData = [
    { status: 'Completed', count: 45, percentage: 56 },
    { status: 'In Progress', count: 28, percentage: 35 },
    { status: 'Pending', count: 7, percentage: 9 },
  ];

  const completionTrendData = [
    { week: 'W1', completed: 8, started: 12 },
    { week: 'W2', completed: 10, started: 15 },
    { week: 'W3', completed: 12, started: 11 },
    { week: 'W4', completed: 9, started: 14 },
    { week: 'W5', completed: 15, started: 10 },
    { week: 'W6', completed: 11, started: 13 },
  ];

  const projectTypeData = [
    { type: 'New Installation', avgDays: 7, count: 32 },
    { type: 'Maintenance', avgDays: 2, count: 25 },
    { type: 'Repair', avgDays: 3, count: 18 },
    { type: 'Removal', avgDays: 1, count: 5 },
  ];

  const stats = [
    { 
      label: 'Active Projects', 
      value: '28', 
      icon: ClockIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      label: 'Completed This Month', 
      value: '45', 
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      label: 'Overdue', 
      value: '3', 
      icon: ExclamationCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    { 
      label: 'Avg. Completion Time', 
      value: '4.5 days', 
      icon: ClockIcon,
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
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor} dark:bg-opacity-20`}>
                <stat.icon className={`h-6 w-6 ${stat.color} dark:opacity-90`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Status Overview</h3>
        <div className="space-y-4">
          {projectStatusData.map((status, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{status.status}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{status.count} projects</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    status.status === 'Completed' ? 'bg-green-600 dark:bg-green-500' :
                    status.status === 'In Progress' ? 'bg-blue-600 dark:bg-blue-500' :
                    'bg-yellow-600 dark:bg-yellow-500'
                  }`}
                  style={{ width: `${status.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Completion Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Completion Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="week" className="text-gray-600 dark:text-gray-400" />
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
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="started" fill="#3b82f6" name="Started" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Types and Duration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Average Project Duration by Type</h3>
        <div className="space-y-4">
          {projectTypeData.map((type, index) => (
            <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{type.type}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{type.count} projects</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{type.avgDays} days</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">avg. duration</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;