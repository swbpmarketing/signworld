import { useState, useEffect, Fragment } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
  GlobeAmericasIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import DashboardOverview from '../components/reports/DashboardOverview';
import RevenueAnalytics from '../components/reports/RevenueAnalytics';
import ProjectAnalytics from '../components/reports/ProjectAnalytics';
import CustomerAnalytics from '../components/reports/CustomerAnalytics';
import EquipmentROI from '../components/reports/EquipmentROI';
import TeamPerformance from '../components/reports/TeamPerformance';
import GeographicAnalytics from '../components/reports/GeographicAnalytics';
import FinancialReports from '../components/reports/FinancialReports';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const reportSections = [
  {
    id: 'overview',
    name: 'Dashboard Overview',
    icon: ChartBarIcon,
    component: DashboardOverview,
    description: 'Key metrics and KPIs at a glance',
  },
  {
    id: 'revenue',
    name: 'Revenue Analytics',
    icon: CurrencyDollarIcon,
    component: RevenueAnalytics,
    description: 'Sales trends, revenue by category, comparisons',
  },
  {
    id: 'projects',
    name: 'Project Analytics',
    icon: ClipboardDocumentCheckIcon,
    component: ProjectAnalytics,
    description: 'Project completion rates, timelines, status',
  },
  {
    id: 'customers',
    name: 'Customer Analytics',
    icon: UserGroupIcon,
    component: CustomerAnalytics,
    description: 'Customer acquisition, retention, satisfaction',
  },
  {
    id: 'equipment',
    name: 'Equipment ROI',
    icon: WrenchScrewdriverIcon,
    component: EquipmentROI,
    description: 'Equipment utilization, maintenance, ROI',
  },
  {
    id: 'team',
    name: 'Team Performance',
    icon: UsersIcon,
    component: TeamPerformance,
    description: 'Employee productivity, assignments, efficiency',
  },
  {
    id: 'geographic',
    name: 'Geographic Analytics',
    icon: GlobeAmericasIcon,
    component: GeographicAnalytics,
    description: 'Revenue by location, market penetration',
  },
  {
    id: 'financial',
    name: 'Financial Reports',
    icon: BanknotesIcon,
    component: FinancialReports,
    description: 'P&L statements, cash flow, expenses',
  },
];

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('last7days');
  const [filters, setFilters] = useState({});
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Update timestamp whenever dateRange or filters change
  useEffect(() => {
    setLastUpdated(new Date());
  }, [dateRange, filters, selectedReport]);

  // Format the last updated time
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds} seconds ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    return date.toLocaleString();
  };

  // Force re-render every 10 seconds to update "time ago" display
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const ActiveComponent = reportSections.find(section => section.id === selectedReport)?.component || DashboardOverview;

  const handleDateRangeChange = (newDateRange: string) => {
    setDateRange(newDateRange);
    const label = dateRangeOptions.find(opt => opt.value === newDateRange)?.label || newDateRange;
    toast.success(`Date range updated to: ${label}`);
  };

  const handleExportAll = () => {
    toast.loading('Generating complete report...', { id: 'export-all' });

    try {
      const wb = XLSX.utils.book_new();

      // Add a summary sheet
      const summaryData = [
        ['Business Intelligence Reports'],
        ['Generated:', new Date().toLocaleString()],
        ['Date Range:', dateRange],
        [],
        ['Report Sections:'],
        ...reportSections.map(section => [section.name, section.description])
      ];

      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');

      // Save file
      XLSX.writeFile(wb, `complete-business-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Complete report exported successfully!', { id: 'export-all' });
    } catch (error) {
      console.error('Export all error:', error);
      toast.error('Failed to export complete report', { id: 'export-all' });
    }
  };

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'last12months', label: 'Last 12 Months' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-900/30 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Business Intelligence Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comprehensive analytics and insights for your sign business
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleExportAll}
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium text-white transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export All
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <CalendarDaysIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="text-sm border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowFiltersModal(true)}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {Object.keys(filters).length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: <span className="font-medium text-gray-700 dark:text-gray-300">{getTimeAgo(lastUpdated)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {reportSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedReport(section.id)}
                className={`w-full group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedReport === section.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <section.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                    selectedReport === section.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                  }`}
                />
                <div className="text-left min-w-0">
                  <div className="truncate">{section.name}</div>
                  <div className={`text-xs mt-0.5 line-clamp-2 ${
                    selectedReport === section.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {section.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3">
          <ActiveComponent
            dateRange={dateRange}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>

      {/* Filters Modal */}
      <Transition appear show={showFiltersModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowFiltersModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Report Filters
                    </Dialog.Title>
                    <button
                      onClick={() => setShowFiltersModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option value="">All Categories</option>
                        <option value="indoor">Indoor Signs</option>
                        <option value="outdoor">Outdoor Signs</option>
                        <option value="vehicle">Vehicle Graphics</option>
                        <option value="digital">Digital Signage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Revenue Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => {
                        setFilters({});
                        toast.success('Filters cleared');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => {
                        setShowFiltersModal(false);
                        toast.success('Filters applied');
                      }}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Apply Filters
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Reports;