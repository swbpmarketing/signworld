import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOwners } from '../services/ownerService';
import type { Owner } from '../services/ownerService';
import { useAuth } from '../context/AuthContext';
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
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface OwnerDisplay extends Owner {
  avatar: string;
  location: string;
  joinDate: string;
  rating: number;
  totalProjects: number;
  territory: string;
  status: 'active' | 'inactive' | 'new';
  awards: number;
  certifications: string[];
  bio: string;
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
    specialties: ["Vehicle Wraps", "LED Signs", "Monument Signs"],
    rating: 4.9,
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
    specialties: ["Digital Displays", "Wayfinding", "Corporate Branding"],
    rating: 4.8,
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
    specialties: ["Neon Signs", "Channel Letters", "Window Graphics"],
    rating: 4.7,
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
    specialties: ["Monument Signs", "Pylon Signs", "ADA Signage"],
    rating: 5.0,
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

const territories = [
  { name: "All Territories", count: 127 },
  { name: "West Coast", count: 34 },
  { name: "Southwest", count: 28 },
  { name: "Midwest", count: 22 },
  { name: "Southeast", count: 25 },
  { name: "Northeast", count: 18 }
];

const specialtyFilters = [
  "Vehicle Wraps",
  "LED Signs",
  "Monument Signs",
  "Digital Displays",
  "Channel Letters",
  "Wayfinding",
  "Neon Signs",
  "ADA Signage"
];

const OwnersRoster = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
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

  // Fetch owners from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['owners', page, searchQuery, selectedTerritory, selectedSpecialties],
    queryFn: async () => {
      try {
        const result = await getOwners({
          page,
          limit: 12,
          search: searchQuery || undefined,
          specialty: selectedSpecialties.length > 0 ? selectedSpecialties[0] : undefined,
          state: selectedTerritory !== 'All Territories' ? selectedTerritory : undefined,
        });
        console.log('Owners API response:', result);
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
      return {
        ...owner,
        id: owner._id || owner.id, // Use _id from MongoDB
        avatar: owner.name ? owner.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'NA',
        location: owner.address ? `${owner.address.city}, ${owner.address.state}` : 'Unknown',
        joinDate: owner.openDate ? new Date(owner.openDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown',
        rating: owner.rating?.averageRating || owner.stats?.averageRating || 0,
        totalProjects: owner.stats?.projectsCompleted || 0,
        territory: owner.address?.state || 'Unknown',
        status: 'active' as const,
        awards: 0,
        certifications: [],
        bio: owner.name && owner.company && owner.address 
          ? `${owner.name} operates ${owner.company} in ${owner.address.city}, ${owner.address.state}.`
          : 'No bio available.',
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
          <div className="px-6 py-8 sm:px-8 sm:py-10">
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <UserGroupIcon className="h-8 w-8 mr-3" />
                Owners Roster
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Connect with Sign Company franchise owners across the country
              </p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              {isAdmin && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Owner
                </button>
              )}
              <button
                  onClick={handleExportDirectory}
                  className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Export Directory
                </button>
            </div>
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
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
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
            <div className="border-t dark:border-gray-700 pt-4 space-y-4">
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
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <span className="font-medium text-gray-900 dark:text-gray-100">{owner.yearsInBusiness}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Projects</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{owner.totalProjects}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Rating</span>
                    <div className="flex items-center">
                      <StarSolidIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{owner.rating}</span>
                    </div>
                  </div>
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
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle email action
                    }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <EnvelopeIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    Email
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenMessage(owner);
                    }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-primary-600 text-xs sm:text-sm font-medium rounded-lg text-white hover:bg-primary-700 transition-colors">
                    <ChatBubbleLeftIcon className="h-4 w-4 mr-1.5" />
                    Message
                  </button>
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
                    Specialties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {owner.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <div className="text-xs sm:text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Projects: </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{owner.totalProjects}</span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm">
                          <StarSolidIcon className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{owner.rating}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(owner.status)}`}>
                        {owner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link to={`/owners/${owner.id}`} className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 text-xs sm:text-sm">
                          View Profile
                        </Link>
                        <button
                          onClick={() => handleOpenMessage(owner)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-xs sm:text-sm"
                        >
                          Message
                        </button>
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
    </div>
  );
};

export default OwnersRoster;