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
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
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
import CustomSelect from '../components/CustomSelect';

const reportSections = [
  {
    id: 'overview',
    name: 'Dashboard Overview',
    shortName: 'Overview',
    icon: ChartBarIcon,
    component: DashboardOverview,
    description: 'Key metrics and KPIs at a glance',
  },
  {
    id: 'revenue',
    name: 'Revenue Analytics',
    shortName: 'Revenue',
    icon: CurrencyDollarIcon,
    component: RevenueAnalytics,
    description: 'Sales trends, revenue by category, comparisons',
  },
  {
    id: 'projects',
    name: 'Project Analytics',
    shortName: 'Projects',
    icon: ClipboardDocumentCheckIcon,
    component: ProjectAnalytics,
    description: 'Project completion rates, timelines, status',
  },
  {
    id: 'customers',
    name: 'Customer Analytics',
    shortName: 'Customers',
    icon: UserGroupIcon,
    component: CustomerAnalytics,
    description: 'Customer acquisition, retention, satisfaction',
  },
  {
    id: 'equipment',
    name: 'Equipment ROI',
    shortName: 'Equipment',
    icon: WrenchScrewdriverIcon,
    component: EquipmentROI,
    description: 'Equipment utilization, maintenance, ROI',
  },
  {
    id: 'team',
    name: 'Team Performance',
    shortName: 'Team',
    icon: UsersIcon,
    component: TeamPerformance,
    description: 'Employee productivity, assignments, efficiency',
  },
  {
    id: 'geographic',
    name: 'Geographic Analytics',
    shortName: 'Geographic',
    icon: GlobeAmericasIcon,
    component: GeographicAnalytics,
    description: 'Revenue by location, market penetration',
  },
  {
    id: 'financial',
    name: 'Financial Reports',
    shortName: 'Financial',
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
    <div className="space-y-5 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-900/30 p-4 sm:p-6 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Business Intelligence Reports
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Comprehensive analytics and insights for your sign business
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleExportAll}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded-lg text-sm font-medium text-white transition-colors w-full sm:w-auto shadow-sm"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              <span>Export All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 w-full max-w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="w-full sm:w-52">
            <CustomSelect
              value={dateRange}
              onChange={handleDateRangeChange}
              options={dateRangeOptions}
            />
          </div>
          <button
            onClick={() => setShowFiltersModal(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors shadow-sm"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {Object.keys(filters).length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-right">
          Last updated: <span className="font-medium text-gray-700 dark:text-gray-300">{getTimeAgo(lastUpdated)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4 w-full max-w-full">
        {/* Mobile Report Navigation */}
        <div className="lg:hidden w-full">
          <nav className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full">
            {reportSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedReport(section.id)}
                className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 sm:px-3 sm:py-3 text-xs font-medium rounded-lg transition-all duration-200 w-full min-h-[4rem] sm:min-h-[4.5rem] ${
                  selectedReport === section.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-md border-2 border-primary-200 dark:border-primary-700'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:scale-95'
                }`}
              >
                <section.icon className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${
                  selectedReport === section.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                }`} />
                <span className="text-center text-xs leading-tight">{section.shortName}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-w-0 w-full max-w-full">
          {/* Desktop Report Navigation - Sidebar */}
          <div className="hidden lg:block lg:col-span-1 min-w-0">
            <div className="sticky top-4">
              <nav className="space-y-2">
                {reportSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedReport(section.id)}
                    className={`w-full group flex items-start px-4 py-3.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      selectedReport === section.id
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm border border-primary-200 dark:border-primary-700'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100 border border-transparent'
                    }`}
                  >
                    <section.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors mt-0.5 ${
                        selectedReport === section.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                      }`}
                    />
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium">{section.name}</div>
                      <div className={`text-xs mt-1 line-clamp-2 ${
                        selectedReport === section.id ? 'text-primary-600/80 dark:text-primary-400/80' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {section.description}
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3 min-w-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedReport}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="min-w-0"
              >
                <ActiveComponent
                  dateRange={dateRange}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </motion.div>
            </AnimatePresence>
          </div>
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
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4 sm:translate-y-0"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4 sm:translate-y-0"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-5">
                    <Dialog.Title className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Report Filters
                    </Dialog.Title>
                    <button
                      onClick={() => setShowFiltersModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base">
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
                      <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base">
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
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Min"
                          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setFilters({});
                        toast.success('Filters cleared');
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-500 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => {
                        setShowFiltersModal(false);
                        toast.success('Filters applied');
                      }}
                      className="flex-1 px-4 py-3 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm"
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