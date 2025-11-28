import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BanknotesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getFinancialAnalytics } from '../../services/dashboardService';
import type { FinancialAnalyticsData } from '../../services/dashboardService';

interface FinancialReportsProps {
  dateRange: string;
  filters: Record<string, unknown>;
  onFiltersChange: (filters: Record<string, unknown>) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
};

const FinancialReports: React.FC<FinancialReportsProps> = ({ dateRange }) => {
  const { data, isLoading, error } = useQuery<FinancialAnalyticsData>({
    queryKey: ['financialAnalytics', dateRange],
    queryFn: getFinancialAnalytics,
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
        Failed to load engagement analytics data. Please try again later.
      </div>
    );
  }

  // Map stats with icons
  const stats = data.stats.map((stat) => {
    const IconComponent = iconMap[stat.icon] || BanknotesIcon;
    return { ...stat, icon: IconComponent };
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-8 w-8 ${stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              <span className={`text-sm font-medium ${stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Engagement Flow Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Engagement Flow Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.cashFlowData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="New Activity" />
              <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Baseline" />
              <Line type="monotone" dataKey="netCash" stroke="#3b82f6" strokeWidth={3} name="Net Growth" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Engagement Breakdown</h3>
          <div className="space-y-4">
            {data.expenseBreakdown.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.category}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {item.amount.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Engagement</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {data.expenseBreakdown.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Margins Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Growth Margins Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.profitMargins} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                <Line type="monotone" dataKey="gross" stroke="#10b981" strokeWidth={2} name="Gross Growth %" />
                <Line type="monotone" dataKey="operating" stroke="#3b82f6" strokeWidth={2} name="Operating Growth %" />
                <Line type="monotone" dataKey="net" stroke="#8b5cf6" strokeWidth={2} name="Net Growth %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Engagement Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Activity Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Engagement</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.financialSummary.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Baseline Activity</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">-{data.financialSummary.totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Growth</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{data.financialSummary.grossProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Engagement</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">{data.financialSummary.netIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Key Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Score</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.financialSummary.ebitda.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Member Ratio</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.financialSummary.currentRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Growth Rate</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {data.financialSummary.totalRevenue > 0
                    ? `${((data.financialSummary.netIncome / data.financialSummary.totalRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Efficiency</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {data.financialSummary.totalRevenue > 0
                    ? `${((data.financialSummary.grossProfit / data.financialSummary.totalRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors">
                Download Engagement Report
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors">
                Export Activity Summary
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors">
                Generate Growth Report
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors">
                View Activity History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
