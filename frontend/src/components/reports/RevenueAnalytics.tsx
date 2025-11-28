import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpIcon, ArrowDownIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getRevenueAnalytics } from '../../services/dashboardService';
import type { RevenueAnalyticsData } from '../../services/dashboardService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface RevenueAnalyticsProps {
  dateRange: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ dateRange, filters, onFiltersChange }) => {
  const { data, isLoading, error } = useQuery<RevenueAnalyticsData>({
    queryKey: ['revenueAnalytics', dateRange],
    queryFn: () => getRevenueAnalytics(dateRange),
  });

  const COLORS = ['#1890ff', '#096dd9', '#0050b3', '#003a8c', '#002766'];

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.text('Revenue Analytics Report', pageWidth / 2, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

    // Summary Stats
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, 40);

    const statsData = data.stats.map(stat => [stat.label, stat.value, stat.change]);
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value', 'Change']],
      body: statsData,
      theme: 'striped',
    });

    // Revenue Trend
    const finalY1 = (doc as any).lastAutoTable.finalY || 70;
    doc.setFontSize(14);
    doc.text('Monthly Revenue Trend', 14, finalY1 + 15);

    const revenueTableData = data.revenueData.map(item => [
      item.month,
      `$${item.revenue.toLocaleString()}`,
      `$${item.lastYear.toLocaleString()}`,
    ]);
    autoTable(doc, {
      startY: finalY1 + 20,
      head: [['Month', 'This Year', 'Last Year']],
      body: revenueTableData,
      theme: 'striped',
    });

    // Category Breakdown
    const finalY2 = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(14);
    doc.text('Revenue by Category', 14, finalY2 + 15);

    const categoryTableData = data.categoryData.map(item => [
      item.name,
      `${item.value}%`,
      `$${item.revenue.toLocaleString()}`,
    ]);
    autoTable(doc, {
      startY: finalY2 + 20,
      head: [['Category', 'Percentage', 'Revenue']],
      body: categoryTableData,
      theme: 'striped',
    });

    doc.save('revenue-analytics-report.pdf');
  };

  const exportToExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = data.stats.map(stat => ({
      Metric: stat.label,
      Value: stat.value,
      Change: stat.change,
    }));
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Revenue Trend sheet
    const trendData = data.revenueData.map(item => ({
      Month: item.month,
      'This Year Revenue': item.revenue,
      'Last Year Revenue': item.lastYear,
    }));
    const trendWs = XLSX.utils.json_to_sheet(trendData);
    XLSX.utils.book_append_sheet(wb, trendWs, 'Revenue Trend');

    // Category sheet
    const categorySheetData = data.categoryData.map(item => ({
      Category: item.name,
      Percentage: `${item.value}%`,
      Revenue: item.revenue,
    }));
    const categoryWs = XLSX.utils.json_to_sheet(categorySheetData);
    XLSX.utils.book_append_sheet(wb, categoryWs, 'By Category');

    XLSX.writeFile(wb, 'revenue-analytics-report.xlsx');
  };

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
        Failed to load revenue analytics data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={exportToPDF}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Export PDF
        </button>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Export Excel
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.stats.map((stat, index) => (
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
            <LineChart data={data.revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  data={data.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.categoryData.map((entry, index) => (
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
            {data.categoryData.map((category, index) => (
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
