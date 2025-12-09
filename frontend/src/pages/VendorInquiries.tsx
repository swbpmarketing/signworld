import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  InboxIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ShoppingBagIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

interface Inquiry {
  _id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentPrice: number;
  equipmentImage?: string;
  user: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  status: 'new' | 'contacted' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

interface InquiryStats {
  total: number;
  new: number;
  contacted: number;
  completed: number;
  cancelled: number;
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusIcons = {
  new: InboxIcon,
  contacted: ChatBubbleLeftRightIcon,
  completed: CheckCircleIcon,
  cancelled: XCircleIcon,
};

const VendorInquiries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats>({ total: 0, new: 0, contacted: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/equipment/vendor-inquiries');
      const data = response.data?.data;
      if (data) {
        setInquiries(data.inquiries || []);
        setStats(data.stats || { total: 0, new: 0, contacted: 0, completed: 0, cancelled: 0 });
      } else {
        setInquiries([]);
        setStats({ total: 0, new: 0, contacted: 0, completed: 0, cancelled: 0 });
      }
    } catch (error: any) {
      console.error('Error fetching inquiries:', error);
      // Don't show error toast if it's just no data
      if (error.response?.status !== 404) {
        toast.error('Failed to load inquiries');
      }
      setInquiries([]);
      setStats({ total: 0, new: 0, contacted: 0, completed: 0, cancelled: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateInquiryStatus = async (inquiryId: string, equipmentId: string, newStatus: string) => {
    try {
      setUpdatingStatus(inquiryId);
      await api.put(`/equipment/${equipmentId}/inquiry/${inquiryId}`, { status: newStatus });

      // Update local state
      setInquiries(prev => prev.map(inq =>
        inq._id === inquiryId ? { ...inq, status: newStatus as Inquiry['status'] } : inq
      ));

      // Update stats
      const oldInquiry = inquiries.find(i => i._id === inquiryId);
      if (oldInquiry) {
        setStats(prev => ({
          ...prev,
          [oldInquiry.status]: prev[oldInquiry.status as keyof InquiryStats] - 1,
          [newStatus]: prev[newStatus as keyof InquiryStats] + 1,
        }));
      }

      toast.success(`Inquiry marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      toast.error('Failed to update inquiry status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle reply - mark as contacted if new, then navigate to chat
  const handleReply = async (inquiry: Inquiry) => {
    // If inquiry is new, mark it as contacted first
    if (inquiry.status === 'new') {
      try {
        await api.put(`/equipment/${inquiry.equipmentId}/inquiry/${inquiry._id}`, { status: 'contacted' });
        // Update local state
        setInquiries(prev => prev.map(inq =>
          inq._id === inquiry._id ? { ...inq, status: 'contacted' } : inq
        ));
        setStats(prev => ({
          ...prev,
          new: prev.new - 1,
          contacted: prev.contacted + 1,
        }));
      } catch (error) {
        console.error('Error updating inquiry status:', error);
        // Continue to chat even if status update fails
      }
    }
    // Navigate to chat with the inquiry user
    navigate(`/chat?contact=${inquiry.user}`);
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesFilter = filter === 'all' || inquiry.status === filter;
    const matchesSearch = searchQuery === '' ||
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.company?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipment Inquiries</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage and respond to inquiries from potential buyers
          </p>
        </div>
        <button
          onClick={fetchInquiries}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-gray-500', key: 'all' },
          { label: 'New', value: stats.new, color: 'bg-blue-500', key: 'new' },
          { label: 'Contacted', value: stats.contacted, color: 'bg-yellow-500', key: 'contacted' },
          { label: 'Completed', value: stats.completed, color: 'bg-green-500', key: 'completed' },
          { label: 'Cancelled', value: stats.cancelled, color: 'bg-red-500', key: 'cancelled' },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setFilter(stat.key)}
            className={`p-4 rounded-xl border transition-all ${
              filter === stat.key
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-left">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, company, or equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <InboxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No inquiries found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter !== 'all'
              ? `No ${filter} inquiries at the moment.`
              : 'When someone sends an inquiry about your equipment, it will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => {
            const StatusIcon = statusIcons[inquiry.status];
            return (
              <div
                key={inquiry._id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Equipment Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {inquiry.equipmentImage ? (
                          <img
                            src={inquiry.equipmentImage}
                            alt={inquiry.equipmentName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBagIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {inquiry.equipmentName}
                            </h3>
                            <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                              {formatPrice(inquiry.equipmentPrice)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[inquiry.status]}`}>
                            <StatusIcon className="h-3.5 w-3.5 mr-1" />
                            {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-gray-900 dark:text-white mr-2">{inquiry.name}</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <EnvelopeIcon className="h-4 w-4 mr-1.5" />
                            <a href={`mailto:${inquiry.email}`} className="hover:text-primary-600 dark:hover:text-primary-400 truncate">
                              {inquiry.email}
                            </a>
                          </div>
                          {inquiry.phone && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <PhoneIcon className="h-4 w-4 mr-1.5" />
                              <a href={`tel:${inquiry.phone}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                                {inquiry.phone}
                              </a>
                            </div>
                          )}
                          {inquiry.company && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <BuildingOfficeIcon className="h-4 w-4 mr-1.5" />
                              <span className="truncate">{inquiry.company}</span>
                            </div>
                          )}
                        </div>

                        {/* Message Preview */}
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {inquiry.message}
                          </p>
                        </div>

                        {/* Timestamp and Actions */}
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                            <span className="mx-2">•</span>
                            {format(new Date(inquiry.createdAt), 'MMM d, yyyy h:mm a')}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Reply button - primary action */}
                            <button
                              onClick={() => handleReply(inquiry)}
                              className="inline-flex items-center px-4 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
                            >
                              <ChatBubbleLeftIcon className="h-4 w-4 mr-1.5" />
                              Reply
                            </button>

                            {/* Status action buttons */}
                            {inquiry.status === 'contacted' && (
                              <button
                                onClick={() => updateInquiryStatus(inquiry._id, inquiry.equipmentId, 'completed')}
                                disabled={updatingStatus === inquiry._id}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                              >
                                <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                                Mark Complete
                              </button>
                            )}

                            {(inquiry.status === 'new' || inquiry.status === 'contacted') && (
                              <button
                                onClick={() => updateInquiryStatus(inquiry._id, inquiry.equipmentId, 'cancelled')}
                                disabled={updatingStatus === inquiry._id}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                              >
                                <XCircleIcon className="h-3.5 w-3.5 mr-1" />
                                Cancel
                              </button>
                            )}

                            {/* View equipment link */}
                            <Link
                              to={`/equipment?view=${inquiry.equipmentId}&from=inquiries`}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <EyeIcon className="h-3.5 w-3.5 mr-1" />
                              View Equipment
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorInquiries;
