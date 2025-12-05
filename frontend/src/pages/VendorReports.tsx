import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  ShoppingBagIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  StarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CubeIcon,
  ExclamationCircleIcon,
  BuildingStorefrontIcon,
  GiftIcon,
  CheckBadgeIcon,
  SparklesIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../config/axios';

interface PartnerStats {
  profile: {
    name: string;
    category: string;
    country: string;
    createdAt: string;
  };
  profileStats: {
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    isFeatured: boolean;
    specialtiesCount: number;
    benefitsCount: number;
    documentsCount: number;
    activeOffersCount: number;
    expiredOffersCount: number;
  };
  reviewsBreakdown: {
    total: number;
    ratings: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    recentReviews: Array<{
      rating: number;
      comment: string;
      createdAt: string;
    }>;
  };
  specialOffers: Array<{
    title: string;
    description: string;
    validUntil: string;
    discountPercent: number;
    isActive: boolean;
  }>;
}

interface EquipmentStats {
  overview: {
    totalListings: number;
    activeListings: number;
    inactiveListings: number;
    featuredListings: number;
  };
  categoryBreakdown: Record<string, number>;
  availabilityBreakdown: {
    'in-stock': number;
    'out-of-stock': number;
    'pre-order': number;
    'discontinued': number;
  };
  inquiryStats: {
    total: number;
    new: number;
    contacted: number;
    completed: number;
    cancelled: number;
  };
  recentInquiries: Array<{
    equipmentId: string;
    equipmentName: string;
    equipmentPrice?: number;
    name: string;
    email: string;
    company: string;
    message: string;
    status: string;
    createdAt: string;
  }>;
  topEquipment: Array<{
    _id: string;
    name: string;
    category: string;
    inquiryCount: number;
    isActive: boolean;
  }>;
  salesStats?: {
    totalSales: number;
    estimatedRevenue: number;
    conversionRate: number;
    monthlySales: Array<{
      month: string;
      year: number;
      count: number;
      revenue: number;
    }>;
    topSellingEquipment: Array<{
      _id: string;
      name: string;
      category: string;
      price: number;
      salesCount: number;
      revenue: number;
    }>;
    recentSales: Array<{
      equipmentId: string;
      equipmentName: string;
      equipmentPrice: number;
      name: string;
      email: string;
      company: string;
      status: string;
      createdAt: string;
    }>;
  };
}

const categoryLabels: Record<string, string> = {
  'large-format-printers': 'Large Format Printers',
  'vinyl-cutters': 'Vinyl Cutters',
  'cnc-routers': 'CNC Routers',
  'channel-letter': 'Channel Letter',
  'welding': 'Welding',
  'vehicles': 'Vehicles',
  'heat-transfer': 'Heat Transfer',
  'laminators': 'Laminators',
  'led-lighting': 'LED Lighting',
  'digital-displays': 'Digital Displays',
  'hand-tools': 'Hand Tools',
  'safety-equipment': 'Safety Equipment',
  'software': 'Software',
  'materials': 'Materials',
  'other': 'Other',
};

const VendorReports = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

  // Fetch partner profile stats
  const { data: partnerStats, isLoading: loadingPartner } = useQuery({
    queryKey: ['vendor-partner-stats', user?.id],
    queryFn: async () => {
      const response = await api.get('/partners/vendor-stats');
      return response.data.data as PartnerStats;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch equipment stats
  const { data: equipmentStats, isLoading: loadingEquipment } = useQuery({
    queryKey: ['vendor-equipment-stats', user?.id],
    queryFn: async () => {
      const response = await api.get('/equipment/vendor-stats');
      return response.data.data as EquipmentStats;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingPartner || loadingEquipment;

  const handleExport = () => {
    if (!partnerStats || !equipmentStats) return;

    toast.loading('Generating your report...', { id: 'export' });

    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Vendor Performance Report'],
        ['Generated:', new Date().toLocaleString()],
        ['Vendor:', partnerStats.profile.name || user?.name || ''],
        ['Category:', partnerStats.profile.category || ''],
        [],
        ['Equipment Listings'],
        ['Total Listings', equipmentStats.overview.totalListings],
        ['Active Listings', equipmentStats.overview.activeListings],
        ['Featured Listings', equipmentStats.overview.featuredListings],
        [],
        ['Inquiry Summary'],
        ['Total Inquiries', equipmentStats.inquiryStats.total],
        ['New Inquiries', equipmentStats.inquiryStats.new],
        ['Contacted', equipmentStats.inquiryStats.contacted],
        ['Completed', equipmentStats.inquiryStats.completed],
        [],
        ['Profile Stats'],
        ['Rating', partnerStats.profileStats.rating],
        ['Total Reviews', partnerStats.reviewsBreakdown.total],
        ['Active Offers', partnerStats.profileStats.activeOffersCount],
        ['Documents', partnerStats.profileStats.documentsCount],
      ];

      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');

      // Equipment breakdown sheet
      const equipmentData = [
        ['Equipment by Category'],
        ['Category', 'Count'],
        ...Object.entries(equipmentStats.categoryBreakdown).map(([cat, count]) => [
          categoryLabels[cat] || cat,
          count,
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(equipmentData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Equipment Breakdown');

      // Recent inquiries sheet
      if (equipmentStats.recentInquiries.length > 0) {
        const inquiryData = [
          ['Recent Inquiries'],
          ['Equipment', 'Name', 'Email', 'Company', 'Status', 'Date'],
          ...equipmentStats.recentInquiries.map((inq) => [
            inq.equipmentName,
            inq.name,
            inq.email,
            inq.company || '-',
            inq.status,
            new Date(inq.createdAt).toLocaleDateString(),
          ]),
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(inquiryData);
        XLSX.utils.book_append_sheet(wb, ws3, 'Inquiries');
      }

      XLSX.writeFile(wb, `vendor-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Report exported successfully!', { id: 'export' });
    } catch (error) {
      toast.error('Failed to export report', { id: 'export' });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarSolidIcon
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const sections = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'sales', name: 'Sales Statistics', icon: BanknotesIcon },
    { id: 'equipment', name: 'Equipment Listings', icon: ShoppingBagIcon },
    { id: 'inquiries', name: 'Inquiries', icon: EnvelopeIcon },
    { id: 'profile', name: 'Profile & Reviews', icon: BuildingStorefrontIcon },
    { id: 'offers', name: 'Special Offers', icon: GiftIcon },
  ];

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6">
          <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
          <div className="h-4 w-64 bg-white/10 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <ChartBarIcon className="h-8 w-8 mr-3" />
                Vendor Reports
              </h1>
              <p className="mt-2 text-purple-100">
                Track your equipment listings, inquiries, and profile performance
              </p>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Equipment Listings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {equipmentStats?.overview.totalListings || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ShoppingBagIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {equipmentStats?.overview.activeListings || 0} active
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {equipmentStats?.inquiryStats.total || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <EnvelopeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
            {equipmentStats?.inquiryStats.new || 0} new
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {partnerStats?.profileStats.rating?.toFixed(1) || '0.0'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <StarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-2">{renderStars(Math.round(partnerStats?.profileStats.rating || 0))}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Est. Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(equipmentStats?.salesStats?.estimatedRevenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
            {equipmentStats?.salesStats?.totalSales || 0} completed sales
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1 sticky top-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <section.icon className={`h-5 w-5 mr-3 ${
                  activeSection === section.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
                }`} />
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <>
              {/* Equipment Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Equipment Summary</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {equipmentStats?.overview.totalListings || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {equipmentStats?.overview.activeListings || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {equipmentStats?.overview.inactiveListings || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Inactive</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {equipmentStats?.overview.featuredListings || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Featured</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiry Status */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Inquiry Status</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <ExclamationCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {equipmentStats?.inquiryStats.new || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">New</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="p-2 bg-yellow-500 rounded-lg">
                        <ClockIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {equipmentStats?.inquiryStats.contacted || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Contacted</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {equipmentStats?.inquiryStats.completed || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="p-2 bg-red-500 rounded-lg">
                        <XCircleIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {equipmentStats?.inquiryStats.cancelled || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cancelled</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performing Equipment */}
              {equipmentStats?.topEquipment && equipmentStats.topEquipment.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Performing Equipment</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {equipmentStats.topEquipment.map((item, index) => (
                      <div key={item._id} className="px-6 py-4 flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                          'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {categoryLabels[item.category] || item.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {item.inquiryCount}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">inquiries</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sales Statistics Section */}
          {activeSection === 'sales' && (
            <div className="space-y-6">
              {/* Sales Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {equipmentStats?.salesStats?.totalSales || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Completed inquiries converted to sales
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Revenue</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {formatCurrency(equipmentStats?.salesStats?.estimatedRevenue || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <BanknotesIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Based on completed inquiry equipment prices
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                        {equipmentStats?.salesStats?.conversionRate || 0}%
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Inquiries converted to completed sales
                  </p>
                </div>
              </div>

              {/* Monthly Sales Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sales Trend (Last 6 Months)</h3>
                </div>
                <div className="p-6">
                  {equipmentStats?.salesStats?.monthlySales && equipmentStats.salesStats.monthlySales.length > 0 ? (
                    <div className="space-y-4">
                      {/* Simple bar chart representation */}
                      <div className="flex items-end justify-between gap-2 h-48">
                        {equipmentStats.salesStats.monthlySales.map((month, index) => {
                          const maxRevenue = Math.max(...equipmentStats.salesStats!.monthlySales.map(m => m.revenue), 1);
                          const heightPercent = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full flex flex-col items-center justify-end h-40">
                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  {month.count > 0 ? formatCurrency(month.revenue) : '-'}
                                </span>
                                <div
                                  className={`w-full rounded-t-lg transition-all ${
                                    month.count > 0
                                      ? 'bg-gradient-to-t from-green-500 to-green-400'
                                      : 'bg-gray-200 dark:bg-gray-700'
                                  }`}
                                  style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{month.month}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{month.count} sales</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BanknotesIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No sales data available yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Selling Equipment */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Selling Equipment</h3>
                </div>
                {equipmentStats?.salesStats?.topSellingEquipment && equipmentStats.salesStats.topSellingEquipment.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {equipmentStats.salesStats.topSellingEquipment.map((item, index) => (
                      <div key={item._id} className="px-6 py-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                          'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {categoryLabels[item.category] || item.category} • {formatCurrency(item.price)} each
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(item.revenue)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.salesCount} sales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <ShoppingBagIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No completed sales yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Sales are tracked when inquiries are marked as completed
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Sales */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Sales</h3>
                </div>
                {equipmentStats?.salesStats?.recentSales && equipmentStats.salesStats.recentSales.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {equipmentStats.salesStats.recentSales.map((sale, index) => (
                      <div key={index} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-gray-100">{sale.name}</p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Completed
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{sale.email}</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                              {sale.equipmentName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(sale.equipmentPrice)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <CheckCircleIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No recent sales to display</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Equipment Section */}
          {activeSection === 'equipment' && (
            <div className="space-y-6">
              {/* Availability Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Availability Status</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                      <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {equipmentStats?.availabilityBreakdown['in-stock'] || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">In Stock</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                      <XCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {equipmentStats?.availabilityBreakdown['out-of-stock'] || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                      <ClockIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {equipmentStats?.availabilityBreakdown['pre-order'] || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pre-Order</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                      <CubeIcon className="h-8 w-8 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {equipmentStats?.availabilityBreakdown['discontinued'] || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Discontinued</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Equipment by Category</h3>
                </div>
                <div className="p-6">
                  {equipmentStats?.categoryBreakdown && Object.keys(equipmentStats.categoryBreakdown).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(equipmentStats.categoryBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, count]) => {
                          const total = equipmentStats.overview.totalListings || 1;
                          const percentage = Math.round((count / total) * 100);
                          return (
                            <div key={category}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {categoryLabels[category] || category}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {count} ({percentage}%)
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No equipment listings yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Inquiries Section */}
          {activeSection === 'inquiries' && (
            <div className="space-y-6">
              {/* Inquiry Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Inquiry Overview</h3>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                      {equipmentStats?.inquiryStats.total || 0}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Inquiries Received</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'New', value: equipmentStats?.inquiryStats.new || 0, color: 'blue' },
                      { label: 'Contacted', value: equipmentStats?.inquiryStats.contacted || 0, color: 'yellow' },
                      { label: 'Completed', value: equipmentStats?.inquiryStats.completed || 0, color: 'green' },
                      { label: 'Cancelled', value: equipmentStats?.inquiryStats.cancelled || 0, color: 'red' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <p className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Inquiries */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Inquiries</h3>
                </div>
                {equipmentStats?.recentInquiries && equipmentStats.recentInquiries.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {equipmentStats.recentInquiries.map((inquiry, index) => (
                      <div key={index} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{inquiry.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{inquiry.email}</p>
                            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                              Re: {inquiry.equipmentName}
                            </p>
                            {inquiry.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                "{inquiry.message}"
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              inquiry.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              inquiry.status === 'contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              inquiry.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {inquiry.status}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(inquiry.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <EnvelopeIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No inquiries received yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile & Reviews Section */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              {/* Profile Status */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Status</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl text-center ${
                      partnerStats?.profileStats.isVerified
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}>
                      <CheckBadgeIcon className={`h-8 w-8 mx-auto mb-2 ${
                        partnerStats?.profileStats.isVerified
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {partnerStats?.profileStats.isVerified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl text-center ${
                      partnerStats?.profileStats.isFeatured
                        ? 'bg-yellow-50 dark:bg-yellow-900/20'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}>
                      <SparklesIcon className={`h-8 w-8 mx-auto mb-2 ${
                        partnerStats?.profileStats.isFeatured
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {partnerStats?.profileStats.isFeatured ? 'Featured' : 'Not Featured'}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                      <TagIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {partnerStats?.profileStats.specialtiesCount || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Specialties</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                      <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {partnerStats?.profileStats.documentsCount || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Documents</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reviews & Rating</h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                        {partnerStats?.profileStats.rating?.toFixed(1) || '0.0'}
                      </p>
                      <div className="mt-2">{renderStars(Math.round(partnerStats?.profileStats.rating || 0))}</div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Based on {partnerStats?.reviewsBreakdown.total || 0} reviews
                      </p>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = partnerStats?.reviewsBreakdown.ratings[star as keyof typeof partnerStats.reviewsBreakdown.ratings] || 0;
                          const total = partnerStats?.reviewsBreakdown.total || 1;
                          const percentage = Math.round((count / total) * 100) || 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-sm w-16 text-gray-600 dark:text-gray-400">{star} stars</span>
                              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-400 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm w-8 text-gray-500 dark:text-gray-400">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Reviews */}
              {partnerStats?.reviewsBreakdown.recentReviews && partnerStats.reviewsBreakdown.recentReviews.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Reviews</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {partnerStats.reviewsBreakdown.recentReviews.map((review, index) => (
                      <div key={index} className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {renderStars(review.rating)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment || 'No comment'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Special Offers Section */}
          {activeSection === 'offers' && (
            <div className="space-y-6">
              {/* Offers Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Special Offers Overview</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                      <GiftIcon className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {partnerStats?.profileStats.activeOffersCount || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Offers</p>
                    </div>
                    <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                      <ClockIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {partnerStats?.profileStats.expiredOffersCount || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Expired Offers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offers List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Offers</h3>
                </div>
                {partnerStats?.specialOffers && partnerStats.specialOffers.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {partnerStats.specialOffers.map((offer, index) => (
                      <div key={index} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-gray-100">{offer.title}</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                offer.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {offer.isActive ? 'Active' : 'Expired'}
                              </span>
                            </div>
                            {offer.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{offer.description}</p>
                            )}
                            {offer.discountPercent && (
                              <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                                {offer.discountPercent}% off
                              </p>
                            )}
                          </div>
                          {offer.validUntil && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {offer.isActive ? 'Expires' : 'Expired'}
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {new Date(offer.validUntil).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <GiftIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No special offers created yet</p>
                    <a
                      href="/vendor-profile"
                      className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mt-3"
                    >
                      Add Special Offer
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorReports;
