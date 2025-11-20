import { useQuery } from '@tanstack/react-query';
import { getReportsOverview } from '../../services/dashboardService';
import {
  ArrowDownTrayIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

interface DashboardOverviewProps {
  dateRange: string;
  filters: any;
  onFiltersChange: (filters: any) => void;
}

const DashboardOverview = ({ dateRange, filters }: DashboardOverviewProps) => {
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

  const exportToPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(24, 144, 255);
      pdf.text('Executive Dashboard Report', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
      pdf.text(`Date Range: ${dateRange}`, pageWidth / 2, 34, { align: 'center' });

      // Add KPI Data
      const kpiTableData = Object.entries(kpiData).map(([key, data]) => {
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

        return [
          labels[key],
          `${formats[key] === '$' ? '$' : ''}${data.value}${formats[key] === '%' ? '%' : ''}`,
          `${data.change > 0 ? '+' : ''}${data.change}%`,
          data.trend === 'up' ? '↑' : '↓'
        ];
      });

      autoTable(pdf, {
        startY: 42,
        head: [['Metric', 'Value', 'Change', 'Trend']],
        body: kpiTableData,
        theme: 'grid',
        headStyles: { fillColor: [24, 144, 255] },
      });

      // Add Revenue Data
      if (revenueOverTime.length > 0) {
        const finalY = (pdf as any).lastAutoTable.finalY || 42;

        pdf.setFontSize(14);
        pdf.setTextColor(0);
        pdf.text('Revenue Over Time', 14, finalY + 15);

        const revenueTableData = revenueOverTime.map(item => [
          item.month,
          `$${item.revenue.toLocaleString()}`,
          `$${item.profit.toLocaleString()}`
        ]);

        autoTable(pdf, {
          startY: finalY + 20,
          head: [['Month', 'Revenue', 'Profit']],
          body: revenueTableData,
          theme: 'striped',
          headStyles: { fillColor: [24, 144, 255] },
        });
      }

      // Save PDF
      pdf.save(`dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully!', { id: 'pdf-export' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF', { id: 'pdf-export' });
    }
  };

  const exportToExcel = () => {
    try {
      toast.loading('Generating Excel file...', { id: 'excel-export' });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // KPI Data Sheet
      const kpiSheetData = Object.entries(kpiData).map(([key, data]) => {
        const labels = {
          totalRevenue: 'Total Revenue',
          activeProjects: 'Active Projects',
          customerSatisfaction: 'Customer Satisfaction',
          avgProjectTime: 'Avg Project Time (days)',
          newCustomers: 'New Customers',
          equipmentUtilization: 'Equipment Utilization',
        };

        return {
          Metric: labels[key],
          Value: data.value,
          Change: `${data.change}%`,
          Trend: data.trend
        };
      });

      const ws1 = XLSX.utils.json_to_sheet(kpiSheetData);
      XLSX.utils.book_append_sheet(wb, ws1, 'KPIs');

      // Revenue Data Sheet
      if (revenueOverTime.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(revenueOverTime);
        XLSX.utils.book_append_sheet(wb, ws2, 'Revenue Over Time');
      }

      // Projects by Category Sheet
      if (projectsByCategory.length > 0) {
        const ws3 = XLSX.utils.json_to_sheet(projectsByCategory);
        XLSX.utils.book_append_sheet(wb, ws3, 'Projects by Category');
      }

      // Performance Metrics Sheet
      if (performanceMetrics.length > 0) {
        const ws4 = XLSX.utils.json_to_sheet(performanceMetrics);
        XLSX.utils.book_append_sheet(wb, ws4, 'Performance Metrics');
      }

      // Save file
      XLSX.writeFile(wb, `dashboard-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file exported successfully!', { id: 'excel-export' });
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel file', { id: 'excel-export' });
    }
  };

  const handlePrint = () => {
    window.print();
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
    <div className="space-y-5">
      {/* Header with Export Options */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Executive Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time business metrics and performance indicators
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
            PDF
          </button>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
            Excel
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <PrinterIcon className="h-4 w-4 mr-1.5" />
            Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(kpiData).map(([key, data]) => {
          const labels = {
            totalRevenue: 'Total Revenue',
            activeProjects: 'Active Projects',
            customerSatisfaction: 'Customer Satisfaction',
            avgProjectTime: 'Avg Project Time',
            newCustomers: 'New Customers',
            equipmentUtilization: 'Equipment Utilization',
          };

          const formats = {
            totalRevenue: '$',
            customerSatisfaction: '%',
            equipmentUtilization: '%',
          };

          return (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{labels[key]}</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  data.trend === 'up' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {data.trend === 'up' ? '↑' : '↓'} {Math.abs(data.change)}%
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-auto">
                {formats[key] === '$' && '$'}
                {formats[key] === '$' ? data.value.toLocaleString() : data.value}
                {formats[key] === '%' && '%'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend Chart - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Revenue & Profit Trend</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Revenue</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Profit</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueOverTime}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Projects by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectsByCategory}
                  cx="50%"
                  cy="38%"
                  labelLine={false}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectsByCategory.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, _name, props) => {
                    const numValue = Number(value);
                    const total = projectsByCategory.reduce((sum, item) => sum + item.value, 0);
                    const percentage = total > 0 ? ((numValue / total) * 100).toFixed(0) : '0';
                    return [
                      `${numValue} projects (${percentage}%)`,
                      `Revenue: $${props.payload.revenue?.toLocaleString() || '0'}`
                    ];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="left"
                  height={70}
                  formatter={(value) => <span style={{ fontSize: '10px' }} className="text-gray-700 dark:text-gray-300">{value}</span>}
                  wrapperStyle={{ fontSize: '10px', paddingTop: '15px', paddingLeft: '20px' }}
                  iconSize={8}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Performance vs Targets</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">Current</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">Target</span>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceMetrics} layout="horizontal" barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="metric"
                type="category"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                width={150}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => `${value}%`}
              />
              <Bar dataKey="current" fill="#3b82f6" name="Current" radius={[0, 4, 4, 0]} barSize={20} />
              <Bar dataKey="target" fill="#10b981" name="Target" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;