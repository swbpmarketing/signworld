import { useState, Fragment } from 'react';
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
  const [dateRange, setDateRange] = useState('last30days');
  const [filters, setFilters] = useState({});
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const ActiveComponent = reportSections.find(section => section.id === selectedReport)?.component || DashboardOverview;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Business Intelligence Reports
              </h1>
              <p className="mt-2 text-lg text-primary-100">
                Comprehensive analytics and insights for your sign business
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handleExportAll}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors duration-200"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-lg"
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: <span className="font-medium text-gray-900 dark:text-gray-100">Just now</span>
          </div>
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