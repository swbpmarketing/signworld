import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import usePermissions from '../hooks/usePermissions';
import {
  UsersIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  StarIcon,
  ShieldCheckIcon,
  TruckIcon,
  CpuChipIcon,
  SwatchIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  XMarkIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, CheckBadgeIcon as CheckBadgeSolidIcon } from '@heroicons/react/24/solid';
import CustomSelect from '../components/CustomSelect';
import {
  getPartners,
  getPartnerStats,
  getPartnerCategories,
  getPartner,
  createPartner,
  updatePartner,
  deletePartner,
} from '../services/partnerService';
import type { Partner, PartnerCategory, PartnerStats } from '../services/partnerService';

// Icon mapping for categories
const categoryIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'All Partners': BuildingOfficeIcon,
  'Materials & Supplies': SwatchIcon,
  'Equipment': CpuChipIcon,
  'Distributor': TruckIcon,
  'Services': WrenchScrewdriverIcon,
};

const CATEGORY_OPTIONS = [
  'Materials & Supplies',
  'Equipment',
  'Distributor',
  'Services',
  'Software',
  'Financing',
  'Insurance',
  'Other',
];

const initialFormData = {
  name: '',
  description: '',
  category: 'Materials & Supplies',
  country: 'USA',
  discount: '',
  yearEstablished: '',
  locations: '1',
  specialties: '',
  benefits: '',
  contactPerson: '',
  email: '',
  phone: '',
  website: '',
  address: '',
};

const Partners = () => {
  const { user } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('All Partners');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showPreferredOnly, setShowPreferredOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch partners with filters
  const { data: partnersData, isLoading: partnersLoading, error: partnersError } = useQuery({
    queryKey: ['partners', selectedCategory, searchQuery, showFeaturedOnly, sortBy],
    queryFn: () => getPartners({
      category: selectedCategory,
      search: searchQuery,
      featured: showFeaturedOnly || undefined,
      sort: sortBy as 'rating' | 'name' | 'name-desc' | 'newest' | 'oldest',
    }),
  });

  // Fetch partner stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['partnerStats'],
    queryFn: getPartnerStats,
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['partnerCategories'],
    queryFn: getPartnerCategories,
  });

  // Filter partners - preferred partners are those without a vendor account
  // By default, hide preferred partners (show only vendors with accounts)
  // When "Preferred" filter is active, show only preferred partners
  const allPartners = partnersData?.data || [];
  const partners = showPreferredOnly
    ? allPartners.filter(p => !p.vendorId)  // Show only preferred (no account)
    : allPartners.filter(p => p.vendorId);   // Show only vendors (with account)
  const stats: PartnerStats = statsData?.data || {
    totalPartners: 0,
    featuredPartners: 0,
    verifiedPartners: 0,
    avgRating: 0,
    annualSavings: 0,
    verifiedPercent: 0,
  };

  // Build categories list with "All Partners" at the top
  const categories: (PartnerCategory & { icon: React.ComponentType<React.SVGProps<SVGSVGElement>> })[] = [
    { name: 'All Partners', count: stats.totalPartners, icon: BuildingOfficeIcon },
    ...(categoriesData?.data || [])
      .filter((cat) => cat.name !== 'All Partners') // Filter out duplicate from backend
      .map((cat) => ({
        ...cat,
        icon: categoryIcons[cat.name] || BuildingOfficeIcon,
      })),
  ];

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleViewDetails = async (partner: Partner) => {
    try {
      const response = await getPartner(partner._id);
      setSelectedPartner(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to fetch partner details:', error);
      // Fallback to using the partner data we already have
      setSelectedPartner(partner);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPartner(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const partnerData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        country: formData.country,
        discount: formData.discount,
        yearEstablished: formData.yearEstablished ? parseInt(formData.yearEstablished) : undefined,
        locations: parseInt(formData.locations) || 1,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
        benefits: formData.benefits.split(',').map(s => s.trim()).filter(Boolean),
        contact: {
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          address: formData.address,
        },
      };

      await createPartner(partnerData);

      // Reset form and close modal
      setFormData(initialFormData);
      setShowAddModal(false);

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partnerStats'] });
      queryClient.invalidateQueries({ queryKey: ['partnerCategories'] });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      setSubmitError(err.response?.data?.error || err.message || 'Failed to create partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      description: partner.description,
      category: partner.category,
      country: partner.country,
      discount: partner.discount || '',
      yearEstablished: partner.yearEstablished?.toString() || '',
      locations: partner.locations?.toString() || '1',
      specialties: partner.specialties?.join(', ') || '',
      benefits: partner.benefits?.join(', ') || '',
      contactPerson: partner.contact?.contactPerson || '',
      email: partner.contact?.email || '',
      phone: partner.contact?.phone || '',
      website: partner.contact?.website || '',
      address: partner.contact?.address || '',
    });
    setShowEditModal(true);
    setShowModal(false);
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const partnerData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        country: formData.country,
        discount: formData.discount,
        yearEstablished: formData.yearEstablished ? parseInt(formData.yearEstablished) : undefined,
        locations: parseInt(formData.locations) || 1,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
        benefits: formData.benefits.split(',').map(s => s.trim()).filter(Boolean),
        contact: {
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          address: formData.address,
        },
      };

      await updatePartner(editingPartner._id, partnerData);

      // Reset form and close modal
      setFormData(initialFormData);
      setShowEditModal(false);
      setEditingPartner(null);

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partnerStats'] });
      queryClient.invalidateQueries({ queryKey: ['partnerCategories'] });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      setSubmitError(err.response?.data?.error || err.message || 'Failed to update partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (partner: Partner) => {
    setPartnerToDelete(partner);
    setShowDeleteConfirm(true);
    setShowModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!partnerToDelete) return;

    setIsDeleting(true);
    try {
      await deletePartner(partnerToDelete._id);

      setShowDeleteConfirm(false);
      setPartnerToDelete(null);

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partnerStats'] });
      queryClient.invalidateQueries({ queryKey: ['partnerCategories'] });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      toast.error(err.response?.data?.error || err.message || 'Failed to delete partner');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <UsersIcon className="h-8 w-8 mr-3" />
                Partners
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Connect with our trusted vendor network and preferred partners
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
              {canCreate('partners') && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Partner
                </button>
              )}
              <button
                onClick={() => navigate('/chat?support=true')}
                className="inline-flex items-center px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors duration-200 border border-white/30"
              >
                <PhoneIcon className="h-5 w-5 mr-2" />
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <BuildingOfficeIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
          {statsLoading ? (
            <div className="animate-pulse h-9 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-1"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPartners}</p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">Partner Companies</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <BanknotesIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          {statsLoading ? (
            <div className="animate-pulse h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto mb-1"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.annualSavings)}</p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">Annual Savings</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          {statsLoading ? (
            <div className="animate-pulse h-9 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-1"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.verifiedPercent}%</p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">Verified Partners</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <StarIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          {statsLoading ? (
            <div className="animate-pulse h-9 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.avgRating.toFixed(1)}</p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Partner Rating</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search partners by name or service..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPreferredOnly(!showPreferredOnly)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                showPreferredOnly
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10'
              }`}
            >
              <ShieldCheckIcon className={`h-4 w-4 ${showPreferredOnly ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
              Preferred
            </button>
            <button
              type="button"
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                showFeaturedOnly
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-2 border-amber-300 dark:border-amber-600 shadow-sm'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10'
              }`}
            >
              <StarSolidIcon className={`h-4 w-4 ${showFeaturedOnly ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`} />
              Featured
            </button>
            <div className="w-40">
              <CustomSelect
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                options={[
                  { value: 'rating', label: 'Top Rated' },
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'name', label: 'Name A-Z' },
                  { value: 'name-desc', label: 'Name Z-A' },
                ]}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
            {categoriesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-200 group ${
                      selectedCategory === category.name
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <category.icon className={`h-5 w-5 mr-3 ${
                        selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`} />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className={`text-sm ${
                      selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Partners Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Loading State */}
          {partnersLoading && (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-16 w-16 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                        <div className="ml-4">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {partnersError && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Failed to load partners. Please try again later.</p>
            </div>
          )}

          {/* Partners List */}
          {!partnersLoading && !partnersError && (
            <div className="grid grid-cols-1 gap-6">
              {partners.map((partner) => (
                <div
                  key={partner._id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                    partner.isFeatured ? 'border-yellow-200 dark:border-yellow-700' : 'border-gray-100 dark:border-gray-700'
                  } overflow-hidden hover:shadow-lg transition-all duration-300`}
                >
                  {partner.isFeatured && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-1 text-xs font-medium text-white">
                      FEATURED PARTNER
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300 overflow-hidden">
                          {partner.logoUrl ? (
                            <img src={partner.logoUrl} alt={partner.name} className="h-full w-full object-cover" />
                          ) : (
                            partner.logo || partner.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{partner.name}</h3>
                            {partner.isVerified && (
                              <CheckBadgeSolidIcon className="h-5 w-5 text-blue-500 ml-2" title="Verified Partner" />
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {partner.category}
                            {partner.yearEstablished && ` - Est. ${partner.yearEstablished}`}
                          </p>
                          <div className="flex items-center mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <StarSolidIcon
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(partner.rating) ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {partner.rating.toFixed(1)} ({partner.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          {partner.discount}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center sm:text-right">{partner.locations} locations</p>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">{partner.description}</p>

                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialties</h4>
                        <div className="flex flex-wrap gap-1">
                          {partner.specialties.map((specialty) => (
                            <span
                              key={specialty}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member Benefits</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {partner.benefits.slice(0, 2).map((benefit, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-1">ok</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t dark:border-gray-700 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                        {partner.contact?.phone && (
                          <a href={`tel:${partner.contact.phone}`} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {partner.contact.phone}
                          </a>
                        )}
                        {partner.contact?.website && (
                          <a href={partner.contact.website.startsWith('http') ? partner.contact.website : `https://${partner.contact.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            <GlobeAltIcon className="h-4 w-4 mr-1" />
                            Website
                          </a>
                        )}
                        {partner.contact?.email && (
                          <a href={`mailto:${partner.contact.email}`} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            <EnvelopeIcon className="h-4 w-4 mr-1" />
                            Email
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleViewDetails(partner)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        View Details
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!partnersLoading && !partnersError && partners.length === 0 && (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No partners found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Partner Details Modal */}
      {showModal && selectedPartner && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-14 w-14 rounded-lg bg-white flex items-center justify-center text-xl font-bold text-gray-700 overflow-hidden">
                      {selectedPartner.logoUrl ? (
                        <img src={selectedPartner.logoUrl} alt={selectedPartner.name} className="h-full w-full object-cover" />
                      ) : (
                        selectedPartner.logo || selectedPartner.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white flex items-center" id="modal-title">
                        {selectedPartner.name}
                        {selectedPartner.isVerified && (
                          <CheckBadgeSolidIcon className="h-5 w-5 text-blue-300 ml-2" title="Verified Partner" />
                        )}
                      </h3>
                      <p className="text-primary-100 text-sm">{selectedPartner.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-primary-200 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                {/* Rating and Discount */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarSolidIcon
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(selectedPartner.rating) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {selectedPartner.rating.toFixed(1)} ({selectedPartner.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    {selectedPartner.discount}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">About</h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedPartner.description}</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {selectedPartner.yearEstablished && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                      <ClockIcon className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedPartner.yearEstablished}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Established</p>
                    </div>
                  )}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <MapPinIcon className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedPartner.locations}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Locations</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <GlobeAltIcon className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedPartner.country || 'USA'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Country</p>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPartner.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Member Benefits</h4>
                  <ul className="space-y-2">
                    {selectedPartner.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start text-gray-600 dark:text-gray-400">
                        <span className="text-green-500 mr-2 mt-0.5">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Special Offers */}
                {selectedPartner.specialOffers && selectedPartner.specialOffers.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Special Offers</h4>
                    <div className="space-y-3">
                      {selectedPartner.specialOffers.map((offer, index) => (
                        <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100">{offer.title}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{offer.description}</p>
                            </div>
                            {offer.code && (
                              <span className="inline-flex items-center px-3 py-1 rounded bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm font-mono font-bold">
                                {offer.code}
                              </span>
                            )}
                          </div>
                          {offer.validUntil && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Valid until: {new Date(offer.validUntil).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact Information</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    {selectedPartner.contact?.contactPerson && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <UsersIcon className="h-5 w-5 mr-3 text-gray-400" />
                        <span>{selectedPartner.contact.contactPerson}</span>
                      </div>
                    )}
                    {selectedPartner.contact?.phone && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <PhoneIcon className="h-5 w-5 mr-3 text-gray-400" />
                        <a href={`tel:${selectedPartner.contact.phone}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                          {selectedPartner.contact.phone}
                        </a>
                      </div>
                    )}
                    {selectedPartner.contact?.email && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <EnvelopeIcon className="h-5 w-5 mr-3 text-gray-400" />
                        <a href={`mailto:${selectedPartner.contact.email}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                          {selectedPartner.contact.email}
                        </a>
                      </div>
                    )}
                    {selectedPartner.contact?.website && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <GlobeAltIcon className="h-5 w-5 mr-3 text-gray-400" />
                        <a
                          href={selectedPartner.contact.website.startsWith('http') ? selectedPartner.contact.website : `https://${selectedPartner.contact.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {selectedPartner.contact.website}
                        </a>
                      </div>
                    )}
                    {selectedPartner.contact?.address && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPinIcon className="h-5 w-5 mr-3 text-gray-400" />
                        <span>{selectedPartner.contact.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between">
                <div className="flex gap-2">
                  {canEdit('partners') && (
                    <button
                      onClick={() => handleEditPartner(selectedPartner)}
                      className="inline-flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  )}
                  {canDelete('partners') && (
                    <button
                      onClick={() => handleDeleteClick(selectedPartner)}
                      className="inline-flex items-center px-3 py-2 text-red-600 dark:text-red-400 font-medium rounded-lg border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  {selectedPartner.vendorId ? (
                    <button
                      onClick={() => {
                        closeModal();
                        navigate(`/chat?contact=${selectedPartner.vendorId}`);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                      Message
                    </button>
                  ) : (
                    selectedPartner.contact?.website && (
                      <a
                        href={selectedPartner.contact.website.startsWith('http') ? selectedPartner.contact.website : `https://${selectedPartner.contact.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <GlobeAltIcon className="h-5 w-5 mr-2" />
                        Visit Website
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="add-partner-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowAddModal(false)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <PlusIcon className="h-6 w-6 mr-2" />
                    Add New Partner
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-white hover:text-primary-200 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleAddPartner}>
                <div className="px-6 py-6 max-h-[60vh] overflow-y-auto space-y-6">
                  {submitError && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                      {submitError}
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 pb-2">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Partner Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Company name"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          required
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Brief description of the partner"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category *
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Country
                        </label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option value="USA">USA</option>
                          <option value="Canada">Canada</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Discount
                        </label>
                        <input
                          type="text"
                          name="discount"
                          value={formData.discount}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="e.g., 15% Off"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Year Established
                        </label>
                        <input
                          type="number"
                          name="yearEstablished"
                          value={formData.yearEstablished}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="e.g., 1995"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Locations
                        </label>
                        <input
                          type="number"
                          name="locations"
                          value={formData.locations}
                          onChange={handleFormChange}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specialties & Benefits */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 pb-2">
                      Specialties & Benefits
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Specialties (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="specialties"
                        value={formData.specialties}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="e.g., Vinyl, Wraps, Channel Letters"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Member Benefits (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="benefits"
                        value={formData.benefits}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="e.g., Free shipping, Extended warranty"
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 pb-2">
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="partner@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Website
                        </label>
                        <input
                          type="text"
                          name="website"
                          value={formData.website}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="www.example.com"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="123 Main St, City, State 12345"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData(initialFormData);
                      setSubmitError('');
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Partner
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {showEditModal && editingPartner && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="edit-partner-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => {
                setShowEditModal(false);
                setEditingPartner(null);
                setFormData(initialFormData);
                setSubmitError('');
              }}
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <PencilIcon className="h-6 w-6 mr-2" />
                    Edit Partner
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPartner(null);
                      setFormData(initialFormData);
                      setSubmitError('');
                    }}
                    className="text-white hover:text-primary-200 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdatePartner}>
                <div className="px-6 py-6 max-h-[60vh] overflow-y-auto space-y-6">
                  {submitError && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                      {submitError}
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 pb-2">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Partner Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          required
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category *
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Country
                        </label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option value="USA">USA</option>
                          <option value="Canada">Canada</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Discount
                        </label>
                        <input
                          type="text"
                          name="discount"
                          value={formData.discount}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="e.g., 15% Off"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Year Established
                        </label>
                        <input
                          type="number"
                          name="yearEstablished"
                          value={formData.yearEstablished}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Locations
                        </label>
                        <input
                          type="number"
                          name="locations"
                          value={formData.locations}
                          onChange={handleFormChange}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specialties & Benefits */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 pb-2">
                      Specialties & Benefits
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Specialties (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="specialties"
                        value={formData.specialties}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Member Benefits (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="benefits"
                        value={formData.benefits}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 pb-2">
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Website
                        </label>
                        <input
                          type="text"
                          name="website"
                          value={formData.website}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPartner(null);
                      setFormData(initialFormData);
                      setSubmitError('');
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <PencilIcon className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && partnerToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="delete-confirm-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => {
                setShowDeleteConfirm(false);
                setPartnerToDelete(null);
              }}
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-6 py-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                    <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Delete Partner
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Are you sure you want to delete <span className="font-semibold">{partnerToDelete.name}</span>? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPartnerToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-5 w-5 mr-2" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
