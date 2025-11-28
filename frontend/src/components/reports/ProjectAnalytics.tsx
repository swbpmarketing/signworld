import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getProjectAnalytics } from '../../services/dashboardService';
import type { ProjectAnalyticsData } from '../../services/dashboardService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ProjectAnalyticsProps {
  dateRange: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ dateRange }) => {
  const { data, isLoading, error } = useQuery<ProjectAnalyticsData>({
    queryKey: ['projectAnalytics', dateRange],
    queryFn: getProjectAnalytics,
  });

  const getStatIcon = (iconName: string) => {
    switch (iconName) {
      case 'ClockIcon':
        return ClockIcon;
      case 'CheckCircleIcon':
        return CheckCircleIcon;
      case 'ExclamationCircleIcon':
        return ExclamationCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.text('Project Analytics Report', pageWidth / 2, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

    // Summary Stats
    doc.setFontSize(14);
    doc.text('Summary Statistics', 14, 40);

    const statsData = data.stats.map(stat => [stat.label, stat.value]);
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: statsData,
      theme: 'striped',
    });

    // Project Status
    const finalY1 = (doc as any).lastAutoTable.finalY || 70;
    doc.setFontSize(14);
    doc.text('Project Status Overview', 14, finalY1 + 15);

    const statusData = data.projectStatusData.map(item => [
      item.status,
      item.count.toString(),
      `${item.percentage}%`,
    ]);
    autoTable(doc, {
      startY: finalY1 + 20,
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      theme: 'striped',
    });

    // Completion Trend
    const finalY2 = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(14);
    doc.text('Weekly Completion Trend', 14, finalY2 + 15);

    const trendData = data.completionTrendData.map(item => [
      item.week,
      item.completed.toString(),
      item.started.toString(),
    ]);
    autoTable(doc, {
      startY: finalY2 + 20,
      head: [['Week', 'Completed', 'Started']],
      body: trendData,
      theme: 'striped',
    });

    // Project Types
    const finalY3 = (doc as any).lastAutoTable.finalY || 170;
    doc.setFontSize(14);
    doc.text('Project Duration by Type', 14, finalY3 + 15);

    const typeData = data.projectTypeData.map(item => [
      item.type,
      `${item.avgDays} days`,
      item.count.toString(),
    ]);
    autoTable(doc, {
      startY: finalY3 + 20,
      head: [['Type', 'Avg. Duration', 'Count']],
      body: typeData,
      theme: 'striped',
    });

    doc.save('project-analytics-report.pdf');
  };

  const exportToExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = data.stats.map(stat => ({
      Metric: stat.label,
      Value: stat.value,
    }));
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Status sheet
    const statusSheetData = data.projectStatusData.map(item => ({
      Status: item.status,
      Count: item.count,
      Percentage: `${item.percentage}%`,
    }));
    const statusWs = XLSX.utils.json_to_sheet(statusSheetData);
    XLSX.utils.book_append_sheet(wb, statusWs, 'Project Status');

    // Completion Trend sheet
    const trendSheetData = data.completionTrendData.map(item => ({
      Week: item.week,
      Completed: item.completed,
      Started: item.started,
    }));
    const trendWs = XLSX.utils.json_to_sheet(trendSheetData);
    XLSX.utils.book_append_sheet(wb, trendWs, 'Completion Trend');

    // Project Types sheet
    const typeSheetData = data.projectTypeData.map(item => ({
      Type: item.type,
      'Avg. Duration (days)': item.avgDays,
      Count: item.count,
    }));
    const typeWs = XLSX.utils.json_to_sheet(typeSheetData);
    XLSX.utils.book_append_sheet(wb, typeWs, 'By Type');

    XLSX.writeFile(wb, 'project-analytics-report.xlsx');
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
        Failed to load project analytics data. Please try again later.
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
              <div className="flex items-center">
                <div className={`p-3 rounded-lg bg-opacity-20 dark:bg-opacity-20`} style={{ backgroundColor: `${stat.color}20` }}>
                  <IconComponent className="h-6 w-6" style={{ color: stat.color }} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Status Overview</h3>
        <div className="space-y-4">
          {data.projectStatusData.map((status, index) => (
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
            <BarChart data={data.completionTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          {data.projectTypeData.map((type, index) => (
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
