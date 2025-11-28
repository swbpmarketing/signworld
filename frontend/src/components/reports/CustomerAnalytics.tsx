import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserGroupIcon, UserPlusIcon, StarIcon, ArrowTrendingUpIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, ComposedChart } from 'recharts';
import { getCustomerAnalytics } from '../../services/dashboardService';
import type { CustomerAnalyticsData } from '../../services/dashboardService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface CustomerAnalyticsProps {
  dateRange: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({ dateRange }) => {
  const { data, isLoading, error } = useQuery<CustomerAnalyticsData>({
    queryKey: ['customerAnalytics', dateRange],
    queryFn: getCustomerAnalytics,
  });

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d'];

  const getStatIcon = (iconName: string) => {
    switch (iconName) {
      case 'UserGroupIcon':
        return UserGroupIcon;
      case 'UserPlusIcon':
        return UserPlusIcon;
      case 'StarIcon':
        return StarIcon;
      case 'ArrowTrendingUpIcon':
        return ArrowTrendingUpIcon;
      default:
        return UserGroupIcon;
    }
  };

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.text('Customer Analytics Report', pageWidth / 2, 20, { align: 'center' });

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

    // Customer Growth
    const finalY1 = (doc as any).lastAutoTable.finalY || 70;
    doc.setFontSize(14);
    doc.text('Customer Growth Trend', 14, finalY1 + 15);

    const growthData = data.customerGrowthData.map(item => [
      item.month,
      item.new.toString(),
      item.total.toString(),
    ]);
    autoTable(doc, {
      startY: finalY1 + 20,
      head: [['Month', 'New Customers', 'Total Customers']],
      body: growthData,
      theme: 'striped',
    });

    // Customer Distribution
    const finalY2 = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(14);
    doc.text('Customer Distribution', 14, finalY2 + 15);

    const distributionData = data.customerTypeData.map(item => [
      item.name,
      `${item.value}%`,
      item.count.toString(),
    ]);
    autoTable(doc, {
      startY: finalY2 + 20,
      head: [['Type', 'Percentage', 'Count']],
      body: distributionData,
      theme: 'striped',
    });

    // Satisfaction Data
    const finalY3 = (doc as any).lastAutoTable.finalY || 170;
    doc.setFontSize(14);
    doc.text('Customer Satisfaction', 14, finalY3 + 15);

    const satisfactionTableData = data.satisfactionData.map(item => [
      item.rating,
      item.count.toString(),
      `${item.percentage}%`,
    ]);
    autoTable(doc, {
      startY: finalY3 + 20,
      head: [['Rating', 'Count', 'Percentage']],
      body: satisfactionTableData,
      theme: 'striped',
    });

    doc.save('customer-analytics-report.pdf');
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

    // Growth Trend sheet
    const growthSheetData = data.customerGrowthData.map(item => ({
      Month: item.month,
      'New Customers': item.new,
      'Total Customers': item.total,
    }));
    const growthWs = XLSX.utils.json_to_sheet(growthSheetData);
    XLSX.utils.book_append_sheet(wb, growthWs, 'Growth Trend');

    // Distribution sheet
    const distributionSheetData = data.customerTypeData.map(item => ({
      Type: item.name,
      Percentage: `${item.value}%`,
      Count: item.count,
    }));
    const distributionWs = XLSX.utils.json_to_sheet(distributionSheetData);
    XLSX.utils.book_append_sheet(wb, distributionWs, 'Distribution');

    // Satisfaction sheet
    const satisfactionSheetData = data.satisfactionData.map(item => ({
      Rating: item.rating,
      Count: item.count,
      Percentage: `${item.percentage}%`,
    }));
    const satisfactionWs = XLSX.utils.json_to_sheet(satisfactionSheetData);
    XLSX.utils.book_append_sheet(wb, satisfactionWs, 'Satisfaction');

    XLSX.writeFile(wb, 'customer-analytics-report.xlsx');
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
        Failed to load customer analytics data. Please try again later.
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
        {data.stats.map((stat, index) => {
          const IconComponent = getStatIcon(stat.icon);
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">{stat.change}</p>
                </div>
                <div className="p-3 rounded-lg bg-opacity-20 dark:bg-opacity-20" style={{ backgroundColor: `${stat.color}20` }}>
                  <IconComponent className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Growth Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Customer Growth</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.customerGrowthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            </ComposedChart>
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
                  data={data.customerTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.customerTypeData.map((_, index) => (
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
            {data.customerTypeData.map((type, index) => (
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
            {data.satisfactionData.map((rating, index) => (
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
                <span className="font-semibold">{data.retentionRate}%</span> customer retention rate
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;
