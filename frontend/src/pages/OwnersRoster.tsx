import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOwners, updateOwnerProfile, getOwnerTerritories, getOwnerSpecialties } from '../services/ownerService';
import type { Owner } from '../services/ownerService';
import { useAuth } from '../context/AuthContext';
import { usePreviewMode } from '../context/PreviewModeContext';
import AddOwnerModal from '../components/AddOwnerModal';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { submitOwnerReview } from '../services/ownerService';

interface OwnerDisplay extends Owner {
  avatar: string;
  location: string;
  joinDate: string;
  rating: number;
  totalRatings: number;
  totalProjects: number;
  territory: string;
  status: 'active' | 'inactive' | 'new';
  awards: number;
  certifications: string[];
  bio: string;
  yearEstablished?: number;
}

// Loading skeleton component
const OwnerSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="ml-4 space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

const staticOwners: OwnerDisplay[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "SJ",
    company: "Arizona Signs & Graphics",
    location: "Phoenix, AZ",
    joinDate: "Jan 2019",
    yearsInBusiness: 5,
    yearEstablished: 2019,
    specialties: ["Vehicle Wraps", "LED Signs", "Monument Signs"],
    rating: 4.9,
    totalRatings: 47,
    totalProjects: 342,
    email: "sarah@arizonasigns.com",
    phone: "(602) 555-0123",
    territory: "Phoenix Metro",
    status: "active",
    awards: 3,
    certifications: ["3M Certified", "OSHA Certified", "Sign Company Elite"],
    bio: "Leading the Arizona market with innovative signage solutions and exceptional customer service."
  },
  {
    id: 2,
    name: "Michael Chen",
    avatar: "MC",
    company: "Pacific Coast Signage",
    location: "Seattle, WA",
    joinDate: "Mar 2018",
    yearsInBusiness: 8,
    yearEstablished: 2016,
    specialties: ["Digital Displays", "Wayfinding", "Corporate Branding"],
    rating: 4.8,
    totalRatings: 89,
    totalProjects: 567,
    email: "mchen@pacificcoastsigns.com",
    phone: "(206) 555-0456",
    territory: "Seattle & Tacoma",
    status: "active",
    awards: 5,
    certifications: ["ISA Certified", "UL Listed", "Sign Company Master"],
    bio: "Specializing in high-tech digital signage solutions for the Pacific Northwest's leading businesses."
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    avatar: "ER",
    company: "Miami Signs International",
    location: "Miami, FL",
    joinDate: "Jun 2020",
    yearsInBusiness: 3,
    yearEstablished: 2021,
    specialties: ["Neon Signs", "Channel Letters", "Window Graphics"],
    rating: 4.7,
    totalRatings: 23,
    totalProjects: 189,
    email: "emily@miamisigns.com",
    phone: "(305) 555-0789",
    territory: "Miami-Dade County",
    status: "new",
    awards: 1,
    certifications: ["3M Certified", "Sign Company Professional"],
    bio: "Bringing vibrant, creative signage to South Florida with a focus on quality and innovation."
  },
  {
    id: 4,
    name: "David Martinez",
    avatar: "DM",
    company: "Texas Premier Signs",
    location: "Austin, TX",
    joinDate: "Sep 2017",
    yearsInBusiness: 10,
    yearEstablished: 2014,
    specialties: ["Monument Signs", "Pylon Signs", "ADA Signage"],
    rating: 5.0,
    totalRatings: 156,
    totalProjects: 892,
    email: "david@texaspremiersigns.com",
    phone: "(512) 555-0234",
    territory: "Central Texas",
    status: "active",
    awards: 7,
    certifications: ["ISA Elite", "OSHA Certified", "Sign Company Master", "LEED AP"],
    bio: "A decade of excellence in commercial signage, serving Austin's fastest-growing businesses."
  }
];

const OwnersRoster = () => {
  const { isAdmin, isVendor, isOwner, user } = useAuth();
  const { isPreviewMode } = usePreviewMode();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = user?._id || user?.id;
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerritory, setSelectedTerritory] = useState('All Territories');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<OwnerDisplay | null>(null);
  const [editForm, setEditForm] = useState({
    company: '',
    phone: '',
    city: '',
    state: '',
    yearsInBusiness: 0,
    specialties: [] as string[],
  });

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingOwner, setReviewingOwner] = useState<OwnerDisplay | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Check if user can see ratings (admin, vendor, or the owner themselves)
  const canSeeRatings = (ownerId: string) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (isVendor) return true;
    // Owners can only see their own ratings
    if (isOwner && currentUserId === ownerId) return true;
    return false;
  };

  // Check if user can submit ratings (vendors only)
  const canRateOwner = () => {
    if (!user) return false;
    return isVendor;
  };

  // Calculate years in business from year established
  const calculateYearsInBusiness = (owner: Owner): number => {
    if (owner.yearsInBusiness && owner.yearsInBusiness > 0) {
      return owner.yearsInBusiness;
    }
    // Try to calculate from openDate (year established)
    if (owner.openDate) {
      const establishedYear = new Date(owner.openDate).getFullYear();
      const currentYear = new Date().getFullYear();
      return currentYear - establishedYear;
    }
    return 0;
  };

  const handleOpenReviewModal = (owner: OwnerDisplay, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReviewingOwner(owner);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewingOwner || reviewRating < 1) return;

    setIsSubmittingReview(true);
    try {
      await submitOwnerReview(reviewingOwner.id, reviewRating, reviewComment || '');
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewingOwner(null);
      setReviewRating(5);
      setReviewComment('');
      // Refresh owner data
      queryClient.invalidateQueries({ queryKey: ['owners'] });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      toast.error(err.response?.data?.error || err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Update owner mutation
  const updateOwnerMutation = useMutation({
    mutationFn: ({ ownerId, updates }: { ownerId: string; updates: Partial<Owner> }) =>
      updateOwnerProfile(ownerId, updates),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      setIsEditModalOpen(false);
      setEditingOwner(null);
      queryClient.invalidateQueries({ queryKey: ['owners'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const handleEditOwner = (owner: OwnerDisplay, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingOwner(owner);
    setEditForm({
      company: owner.company || '',
      phone: owner.phone || '',
      city: owner.address?.city || '',
      state: owner.address?.state || '',
      yearsInBusiness: owner.yearsInBusiness || 0,
      specialties: owner.specialties || [],
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingOwner) return;

    const updates: Partial<Owner> = {
      company: editForm.company,
      phone: editForm.phone,
      address: {
        ...editingOwner.address,
        city: editForm.city,
        state: editForm.state,
      },
      yearsInBusiness: editForm.yearsInBusiness,
      specialties: editForm.specialties,
    };

    updateOwnerMutation.mutate({ ownerId: editingOwner.id, updates });
  };

  const toggleEditSpecialty = (specialty: string) => {
    setEditForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleOpenMessage = (owner: OwnerDisplay) => {
    navigate(`/chat?contact=${owner.id}`);
  };

  // Export owners directory to CSV
  const handleExportDirectory = async () => {
    try {
      toast.loading('Preparing export...', { id: 'export' });

      // Fetch all owners for export (without pagination limit)
      const allOwnersData = await getOwners({ page: 1, limit: 1000 });
      const allOwners = allOwnersData.data || [];

      if (allOwners.length === 0) {
        toast.error('No owners to export', { id: 'export' });
        return;
      }

      // Define CSV headers
      const headers = [
        'Name',
        'Company',
        'Email',
        'Phone',
        'City',
        'State',
        'Zip Code',
        'Years in Business',
        'Specialties',
        'Rating',
        'Join Date'
      ];

      // Convert owners to CSV rows
      const rows = allOwners.map((owner: Owner) => [
        owner.name || '',
        owner.company || '',
        owner.email || '',
        owner.phone || '',
        owner.address?.city || '',
        owner.address?.state || '',
        owner.address?.zipCode || '',
        owner.yearsInBusiness?.toString() || '',
        (owner.specialties || []).join('; '),
        owner.rating?.averageRating?.toString() || owner.stats?.averageRating?.toString() || '0',
        owner.openDate ? new Date(owner.openDate).toLocaleDateString() : ''
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `owners-directory-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allOwners.length} owners to CSV`, { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export directory', { id: 'export' });
    }
  };

  // Fetch territories (states from backend)
  const { data: territoriesData, isLoading: territoriesLoading } = useQuery({
    queryKey: ['ownerTerritories'],
    queryFn: getOwnerTerritories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch specialties
  const { data: specialtiesData, isLoading: specialtiesLoading } = useQuery({
    queryKey: ['ownerSpecialties'],
    queryFn: getOwnerSpecialties,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Map states to regions
  const stateToRegion: { [key: string]: string } = {
    // West Coast
    'WA': 'West Coast', 'Washington': 'West Coast',
    'OR': 'West Coast', 'Oregon': 'West Coast',
    'CA': 'West Coast', 'California': 'West Coast',
    'NV': 'West Coast', 'Nevada': 'West Coast',
    // Southwest
    'AZ': 'Southwest', 'Arizona': 'Southwest',
    'NM': 'Southwest', 'New Mexico': 'Southwest',
    'TX': 'Southwest', 'Texas': 'Southwest',
    'OK': 'Southwest', 'Oklahoma': 'Southwest',
    // Midwest
    'ND': 'Midwest', 'North Dakota': 'Midwest',
    'SD': 'Midwest', 'South Dakota': 'Midwest',
    'NE': 'Midwest', 'Nebraska': 'Midwest',
    'KS': 'Midwest', 'Kansas': 'Midwest',
    'MN': 'Midwest', 'Minnesota': 'Midwest',
    'IA': 'Midwest', 'Iowa': 'Midwest',
    'MO': 'Midwest', 'Missouri': 'Midwest',
    'WI': 'Midwest', 'Wisconsin': 'Midwest',
    'IL': 'Midwest', 'Illinois': 'Midwest',
    'MI': 'Midwest', 'Michigan': 'Midwest',
    'IN': 'Midwest', 'Indiana': 'Midwest',
    'OH': 'Midwest', 'Ohio': 'Midwest',
    // Southeast
    'AR': 'Southeast', 'Arkansas': 'Southeast',
    'LA': 'Southeast', 'Louisiana': 'Southeast',
    'MS': 'Southeast', 'Mississippi': 'Southeast',
    'AL': 'Southeast', 'Alabama': 'Southeast',
    'TN': 'Southeast', 'Tennessee': 'Southeast',
    'KY': 'Southeast', 'Kentucky': 'Southeast',
    'WV': 'Southeast', 'West Virginia': 'Southeast',
    'VA': 'Southeast', 'Virginia': 'Southeast',
    'NC': 'Southeast', 'North Carolina': 'Southeast',
    'SC': 'Southeast', 'South Carolina': 'Southeast',
    'GA': 'Southeast', 'Georgia': 'Southeast',
    'FL': 'Southeast', 'Florida': 'Southeast',
    // Northeast
    'ME': 'Northeast', 'Maine': 'Northeast',
    'NH': 'Northeast', 'New Hampshire': 'Northeast',
    'VT': 'Northeast', 'Vermont': 'Northeast',
    'MA': 'Northeast', 'Massachusetts': 'Northeast',
    'RI': 'Northeast', 'Rhode Island': 'Northeast',
    'CT': 'Northeast', 'Connecticut': 'Northeast',
    'NY': 'Northeast', 'New York': 'Northeast',
    'NJ': 'Northeast', 'New Jersey': 'Northeast',
    'PA': 'Northeast', 'Pennsylvania': 'Northeast',
    'DE': 'Northeast', 'Delaware': 'Northeast',
    'MD': 'Northeast', 'Maryland': 'Northeast',
    'DC': 'Northeast', 'District of Columbia': 'Northeast',
  };

  // Aggregate state counts into region counts
  const aggregateRegions = (statesData: { name: string; count: number }[]) => {
    const regionCounts: { [key: string]: number } = {
      'West Coast': 0,
      'Southwest': 0,
      'Midwest': 0,
      'Southeast': 0,
      'Northeast': 0,
    };

    let totalCount = 0;

    statesData.forEach(state => {
      if (state.name === 'All Territories') {
        totalCount = state.count;
      } else {
        const region = stateToRegion[state.name];
        if (region) {
          regionCounts[region] += state.count;
        }
      }
    });

    return [
      { name: 'All Territories', count: totalCount },
      { name: 'West Coast', count: regionCounts['West Coast'] },
      { name: 'Southwest', count: regionCounts['Southwest'] },
      { name: 'Midwest', count: regionCounts['Midwest'] },
      { name: 'Southeast', count: regionCounts['Southeast'] },
      { name: 'Northeast', count: regionCounts['Northeast'] },
    ];
  };

  // Fallback data if no dynamic data available
  const defaultTerritories = [
    { name: "All Territories", count: 0 },
    { name: "West Coast", count: 0 },
    { name: "Southwest", count: 0 },
    { name: "Midwest", count: 0 },
    { name: "Southeast", count: 0 },
    { name: "Northeast", count: 0 }
  ];

  const defaultSpecialties = [
    "Vehicle Wraps",
    "LED Signs",
    "Monument Signs",
    "Digital Displays",
    "Channel Letters",
    "Wayfinding",
    "Neon Signs",
    "ADA Signage"
  ];

  const territories = territoriesData && territoriesData.length > 1
    ? aggregateRegions(territoriesData)
    : defaultTerritories;
  const specialtyFilters = specialtiesData && specialtiesData.length > 0 ? specialtiesData.map(s => s.name) : defaultSpecialties;

  // Reverse mapping: region to states
  const regionToStates: { [key: string]: string[] } = {
    'West Coast': ['WA', 'Washington', 'OR', 'Oregon', 'CA', 'California', 'NV', 'Nevada'],
    'Southwest': ['AZ', 'Arizona', 'NM', 'New Mexico', 'TX', 'Texas', 'OK', 'Oklahoma'],
    'Midwest': ['ND', 'North Dakota', 'SD', 'South Dakota', 'NE', 'Nebraska', 'KS', 'Kansas', 'MN', 'Minnesota', 'IA', 'Iowa', 'MO', 'Missouri', 'WI', 'Wisconsin', 'IL', 'Illinois', 'MI', 'Michigan', 'IN', 'Indiana', 'OH', 'Ohio'],
    'Southeast': ['AR', 'Arkansas', 'LA', 'Louisiana', 'MS', 'Mississippi', 'AL', 'Alabama', 'TN', 'Tennessee', 'KY', 'Kentucky', 'WV', 'West Virginia', 'VA', 'Virginia', 'NC', 'North Carolina', 'SC', 'South Carolina', 'GA', 'Georgia', 'FL', 'Florida'],
    'Northeast': ['ME', 'Maine', 'NH', 'New Hampshire', 'VT', 'Vermont', 'MA', 'Massachusetts', 'RI', 'Rhode Island', 'CT', 'Connecticut', 'NY', 'New York', 'NJ', 'New Jersey', 'PA', 'Pennsylvania', 'DE', 'Delaware', 'MD', 'Maryland', 'DC', 'District of Columbia'],
  };

  // Fetch owners from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['owners', page, searchQuery, selectedTerritory, selectedSpecialties],
    queryFn: async () => {
      try {
        // Convert region to state if needed
        let stateFilter = undefined;
        if (selectedTerritory !== 'All Territories') {
          // Check if it's a region or an actual state
          if (regionToStates[selectedTerritory]) {
            // It's a region - we'll need to filter on the frontend since backend expects single state
            stateFilter = undefined; // Don't filter by state on backend for regions
          } else {
            // It's an actual state
            stateFilter = selectedTerritory;
          }
        }

        const result = await getOwners({
          page,
          limit: 12,
          search: searchQuery || undefined,
          specialty: selectedSpecialties.length > 0 ? selectedSpecialties[0] : undefined,
          state: stateFilter,
        });

        // If a region is selected, filter results on frontend
        if (selectedTerritory !== 'All Territories' && regionToStates[selectedTerritory]) {
          const statesInRegion = regionToStates[selectedTerritory];
          const filtered = result.data.filter(owner =>
            statesInRegion.includes(owner.address?.state || '')
          );
          return {
            ...result,
            data: filtered,
            count: filtered.length,
          };
        }

        return result;
      } catch (err) {
        console.error('Error in queryFn:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    onError: (err: any) => {
      console.error('Query error:', err);
      console.error('Error stack:', err.stack);
    },
  });

  // Transform API data to display format
  const owners: OwnerDisplay[] = data?.data?.map((owner: Owner) => {
    try {
      const yearsInBusiness = calculateYearsInBusiness(owner);
      const yearEstablished = owner.openDate ? new Date(owner.openDate).getFullYear() : undefined;

      return {
        ...owner,
        id: owner._id || owner.id, // Use _id from MongoDB
        avatar: owner.name ? owner.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'NA',
        location: owner.address ? `${owner.address.city}, ${owner.address.state}` : 'Unknown',
        joinDate: owner.openDate ? new Date(owner.openDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown',
        rating: owner.rating?.averageRating || owner.stats?.averageRating || 0,
        totalRatings: owner.rating?.totalRatings || owner.stats?.totalRatings || 0,
        totalProjects: owner.stats?.projectsCompleted || 0,
        territory: owner.address?.state || 'Unknown',
        status: 'active' as const,
        awards: 0,
        certifications: [],
        bio: owner.name && owner.company && owner.address
          ? `${owner.name} operates ${owner.company} in ${owner.address.city}, ${owner.address.state}.`
          : 'No bio available.',
        yearsInBusiness,
        yearEstablished,
      };
    } catch (err) {
      console.error('Error transforming owner data:', err, owner);
      return null;
    }
  }).filter(Boolean) || [];

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'new':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
    }
  };

  // Show loading state
  if (isLoading && owners.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-6 sm:px-8 sm:py-10">
            <div className="h-8 w-48 bg-white/20 rounded animate-pulse mb-3" />
            <div className="h-5 w-64 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <OwnerSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load owners</h3>
        <p className="text-gray-600 text-center max-w-md">
          {error instanceof Error ? error.message : 'An error occurred while loading the owners roster. Please try again later.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-tour="owners-content">
      {/* Header Section */}
      <div className="bg-blue-50 dark:bg-blue-900 border-blue-100 dark:border-blue-900/30 rounded-lg border p-4 sm:p-6 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 inline-block" />
              Owners Roster
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Connect with Sign Company franchise owners across the country
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            {isAdmin && !isPreviewMode && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1.5 bg-primary-600 text-sm hover:bg-primary-700 text-white rounded-lg transition-colors font-medium inline-flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Owner
              </button>
            )}
            <button
                data-tour="export-owners"
                onClick={handleExportDirectory}
                className="px-2.5 py-1.5 bg-primary-600 text-sm hover:bg-primary-700 text-white rounded-lg transition-colors font-medium inline-flex items-center"
                >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export Directory
            </button>
          </div>
        </div>
      </div>

      {/* Add Owner Modal */}
      <AddOwnerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <UserGroupIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data?.total || 0}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Owners</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <MapPinIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{new Set(owners.map(o => o.territory)).size || 0}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">States Covered</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <StarIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {owners.length > 0 ? (owners.reduce((sum, o) => sum + o.rating, 0) / owners.length).toFixed(1) : '0.0'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Rating</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <BuildingOfficeIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{owners.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Franchises</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  data-tour="owner-search"
                  type="text"
                  placeholder="Search by name, company, or location..."
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
                className="px-2.5 py-1.5 bg-primary-600 text-sm hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 dark:text-gray-300"
              >
                <FunnelIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                Filters
                {showFilters ? (
                  <ChevronUpIcon className="h-4 w-4 ml-1 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 ml-1 text-gray-400" />
                )}
              </button>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors duration-200`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors duration-200`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </form>

          {/* Expandable Filters */}
          {showFilters && (
            <div data-tour="owner-filters" className="border-t dark:border-gray-700 pt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Territory</h4>
                <div className="flex flex-wrap gap-2">
                  {territories.map((territory) => (
                    <button
                      key={territory.name}
                      onClick={() => setSelectedTerritory(territory.name)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedTerritory === territory.name
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {territory.name} ({territory.count})
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {specialtyFilters.map((specialty) => (
                    <button
                      key={specialty}
                      onClick={() => toggleSpecialty(specialty)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedSpecialties.includes(specialty)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Owners Grid/List */}
      {owners.length === 0 && !isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Owners Found</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            {searchQuery || selectedSpecialties.length > 0 
              ? "No owners match your search criteria. Try adjusting your filters."
              : "The owner roster is currently empty. New owners will appear here once they're added to the system."}
          </p>
          {(searchQuery || selectedSpecialties.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialties([]);
                setSelectedTerritory('All Territories');
              }}
              className="inline-flex items-center px-2.5 py-1.5 bg-primary-600 text-sm text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div data-tour="owner-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {owners.map((owner) => (
            <Link
              key={owner.id}
              to={`/owners/${owner.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer block"
            >
              <div className="p-6">
                {/* Owner Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                      {owner.avatar}
                    </div>
                    <div className="ml-4 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{owner.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{owner.company}</p>
                      <div className="flex items-center mt-1">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{owner.location}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(owner.status)}`}>
                    {owner.status}
                  </span>
                </div>

                {/* Owner Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Territory</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{owner.territory}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Years in Business</span>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {owner.yearsInBusiness} {owner.yearsInBusiness === 1 ? 'year' : 'years'}
                        {owner.yearEstablished && (
                          <span className="text-gray-400 ml-1">(Est. {owner.yearEstablished})</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Projects</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{owner.totalProjects}</span>
                  </div>
                  {canSeeRatings(owner.id) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Rating</span>
                      <div className="flex items-center">
                        <StarSolidIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {owner.rating > 0 ? owner.rating.toFixed(1) : 'No ratings'}
                        </span>
                        {owner.totalRatings > 0 && (
                          <span className="text-gray-400 ml-1">({owner.totalRatings})</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Specialties */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-1">
                    {owner.specialties.slice(0, 3).map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col sm:flex-row gap-2">
                  {/* Edit button - only for the current user's own card */}
                  {currentUserId === owner.id && (
                    <button
                      onClick={(e) => handleEditOwner(owner, e)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-amber-500 text-xs sm:text-sm font-medium rounded-lg text-white hover:bg-amber-600 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1.5" />
                      Edit Profile
                    </button>
                  )}
                  {currentUserId !== owner.id && (
                    <>
                      {/* Rate Owner button - only for vendors */}
                      {canRateOwner() && (
                        <button
                          onClick={(e) => handleOpenReviewModal(owner, e)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-yellow-300 dark:border-yellow-600 text-xs sm:text-sm font-medium rounded-lg text-yellow-700 dark:text-yellow-400 bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                        >
                          <StarIcon className="h-4 w-4 mr-1.5" />
                          Rate Owner
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (owner.email) {
                            window.location.href = `mailto:${owner.email}`;
                          }
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <EnvelopeIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        Email
                      </button>
                      <button
                        data-tour="contact-owner"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenMessage(owner);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-primary-600 text-xs sm:text-sm font-medium rounded-lg text-white hover:bg-primary-700 transition-colors">
                        <ChatBubbleLeftIcon className="h-4 w-4 mr-1.5" />
                        Message
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Years in Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Specialties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[180px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                          {owner.avatar}
                        </div>
                        <div className="ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{owner.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{owner.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">{owner.location}</div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{owner.territory}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs sm:text-sm">
                        <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {owner.yearsInBusiness} {owner.yearsInBusiness === 1 ? 'yr' : 'yrs'}
                        </span>
                      </div>
                      {owner.yearEstablished && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Est. {owner.yearEstablished}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {owner.specialties.slice(0, 3).map((specialty) => (
                          <span
                            key={specialty}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            {specialty}
                          </span>
                        ))}
                        {owner.specialties.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400">
                            +{owner.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <div className="text-xs sm:text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Projects: </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{owner.totalProjects}</span>
                        </div>
                        {canSeeRatings(owner.id) && (
                          <div className="flex items-center text-xs sm:text-sm">
                            <StarSolidIcon className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {owner.rating > 0 ? owner.rating.toFixed(1) : '-'}
                            </span>
                            {owner.totalRatings > 0 && (
                              <span className="text-gray-400 ml-1">({owner.totalRatings})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(owner.status)}`}>
                        {owner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[180px]">
                      <div className="flex flex-row gap-2 justify-end">
                        <Link to={`/owners/${owner.id}`} className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 text-xs sm:text-sm">
                          View
                        </Link>
                        {currentUserId === owner.id ? (
                          <button
                            onClick={(e) => handleEditOwner(owner, e)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 text-xs sm:text-sm font-medium"
                          >
                            Edit
                          </button>
                        ) : (
                          <>
                            {canRateOwner() && (
                              <button
                                onClick={(e) => handleOpenReviewModal(owner, e)}
                                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 text-xs sm:text-sm font-medium"
                              >
                                Rate
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenMessage(owner)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-xs sm:text-sm"
                            >
                              Message
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Load More */}
      {data?.pagination?.hasNext && (
        <div className="text-center">
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Load More Owners'}
          </button>
        </div>
      )}

      {/* Edit Owner Modal */}
      {isEditModalOpen && editingOwner && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setIsEditModalOpen(false)}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Your Profile
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Enter company name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="(555) 555-5555"
                  />
                </div>

                {/* City and State */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="State"
                    />
                  </div>
                </div>

                {/* Years in Business */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Years in Business
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.yearsInBusiness}
                    onChange={(e) => setEditForm(prev => ({ ...prev, yearsInBusiness: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* Specialties */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Specialties
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {specialtyFilters.map((specialty) => (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => toggleEditSpecialty(specialty)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          editForm.specialties.includes(specialty)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateOwnerMutation.isPending}
                  className="px-2.5 py-1.5 bg-primary-600 text-sm text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updateOwnerMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewingOwner && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="review-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowReviewModal(false)}
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <StarSolidIcon className="h-6 w-6 mr-2" />
                    Rate Owner
                  </h3>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="text-white hover:text-yellow-200 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-yellow-100 text-sm mt-1">
                  Share your experience with {reviewingOwner.name}
                </p>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Owner Info */}
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                    {reviewingOwner.avatar}
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{reviewingOwner.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{reviewingOwner.company}</div>
                  </div>
                </div>

                {/* Rating Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <StarSolidIcon
                          className={`h-10 w-10 transition-colors ${
                            star <= (hoverRating || reviewRating)
                              ? 'text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {reviewRating}/5
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {reviewRating === 5 && 'Excellent!'}
                    {reviewRating === 4 && 'Great!'}
                    {reviewRating === 3 && 'Good'}
                    {reviewRating === 2 && 'Fair'}
                    {reviewRating === 1 && 'Poor'}
                  </p>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Review (Optional)
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Share your experience working with this owner..."
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Your review will be visible to admins, vendors, and this owner.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview || reviewRating < 1}
                  className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReview ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <StarSolidIcon className="h-5 w-5 mr-2" />
                      Submit Review
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

export default OwnersRoster;