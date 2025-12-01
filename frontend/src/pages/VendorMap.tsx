import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ListBulletIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  BuildingStorefrontIcon,
  TagIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import MapView from '../components/MapView';
import CustomSelect from '../components/CustomSelect';
import { getPartners, getPartnerCategories } from '../services/partnerService';

interface Partner {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  logoUrl?: string;
  category: string;
  country: string;
  contact: {
    contactPerson?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  specialties?: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  location?: {
    type: string;
    coordinates: [number, number];
  };
}

interface Location {
  id: string;
  name: string;
  owner: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  rating: number;
  reviews: number;
  distance: number | null;
  services: string[];
  hours: {
    open: string;
    close: string;
  };
  isOpen: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Convert Partner to Location format for MapView
const partnerToLocation = (partner: Partner): Location => {
  // Parse address if available
  const addressParts = partner.contact?.address?.split(',') || [];
  const city = addressParts[1]?.trim() || '';
  const stateZip = addressParts[2]?.trim().split(' ') || [];
  const state = stateZip[0] || '';
  const zipCode = stateZip[1] || '';

  return {
    id: partner._id,
    name: partner.name,
    owner: partner.contact?.contactPerson || partner.name,
    address: addressParts[0]?.trim() || partner.contact?.address || '',
    city,
    state,
    zipCode,
    phone: partner.contact?.phone || '',
    email: partner.contact?.email || '',
    rating: partner.rating || 0,
    reviews: partner.reviewCount || 0,
    distance: null,
    services: partner.specialties || [],
    hours: { open: '9:00 AM', close: '5:00 PM' },
    isOpen: true, // Partners don't have hours, assume always open
    coordinates: {
      lat: partner.location?.coordinates?.[1] || 39.8283, // Default to US center
      lng: partner.location?.coordinates?.[0] || -98.5795,
    },
  };
};

const VendorMap = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [showList, setShowList] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);

  // Fetch partners
  const { data: partnersData, isLoading: isLoadingPartners } = useQuery({
    queryKey: ['partners', selectedCategory, selectedCountry, searchQuery],
    queryFn: () => getPartners({
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      country: selectedCountry !== 'all' ? selectedCountry : undefined,
      search: searchQuery || undefined,
      limit: 100,
    }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['partnerCategories'],
    queryFn: getPartnerCategories,
  });

  const partners = partnersData?.data || [];
  const categories = categoriesData?.data || [];

  // Convert partners to locations for map
  const locations = partners.map(partnerToLocation);

  // Find selected location for map
  const selectedLocation = selectedPartner ? partnerToLocation(selectedPartner) : null;

  // Select first partner when data loads
  useEffect(() => {
    if (partners.length > 0 && !selectedPartner) {
      setSelectedPartner(partners[0]);
    }
  }, [partners, selectedPartner]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleLocationSelect = (location: Location) => {
    const partner = partners.find(p => p._id === location.id);
    if (partner) {
      setSelectedPartner(partner);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <MapIcon className="h-8 w-8 mr-3" />
                Partner Locator
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Find and connect with verified partners across our network
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur text-white font-medium rounded-lg">
                <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
                {partners.length} Partners
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search partners by name or service..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            <div className="flex items-center gap-4">
              <div className="w-44">
                <CustomSelect
                  value={selectedCategory}
                  onChange={(value) => setSelectedCategory(value)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map((cat: { _id: string; count: number }) => ({
                      value: cat._id,
                      label: `${cat._id} (${cat.count})`,
                    })),
                  ]}
                />
              </div>
              <div className="w-36">
                <CustomSelect
                  value={selectedCountry}
                  onChange={(value) => setSelectedCountry(value)}
                  options={[
                    { value: 'all', label: 'All Countries' },
                    { value: 'USA', label: 'USA' },
                    { value: 'Canada', label: 'Canada' },
                    { value: 'Both', label: 'USA & Canada' },
                  ]}
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingPartners && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading partners...</p>
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoadingPartners && partners.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <BuildingStorefrontIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No partners found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Map and List View */}
      {!isLoadingPartners && partners.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <div className={`${mapExpanded ? 'lg:col-span-3' : 'lg:col-span-2'} relative`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Partner Map</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowList(!showList)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ListBulletIcon className="h-4 w-4 mr-1.5" />
                    {showList ? 'Hide' : 'Show'} List
                  </button>
                  <button
                    onClick={() => setMapExpanded(!mapExpanded)}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {mapExpanded ? (
                      <ArrowsPointingInIcon className="h-5 w-5" />
                    ) : (
                      <ArrowsPointingOutIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Interactive Map */}
              <MapView
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                className="h-[500px]"
              />

              {/* Map Legend */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-primary-600 rounded-full mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Partner</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Featured</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-blue-600 rounded-full mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Selected</span>
                    </div>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">{partners.length} partners found</span>
                </div>
              </div>
            </div>
          </div>

          {/* Partner List */}
          {showList && !mapExpanded && (
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Partners</h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  {partners.map((partner) => (
                    <div
                      key={partner._id}
                      onClick={() => setSelectedPartner(partner)}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        selectedPartner?._id === partner._id ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Partner Header */}
                        <div className="flex items-start gap-3">
                          {(partner.logo || partner.logoUrl) ? (
                            <img
                              src={partner.logo || partner.logoUrl}
                              alt={partner.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <BuildingStorefrontIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{partner.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{partner.category}</p>
                          </div>
                          {partner.isFeatured && (
                            <StarSolidIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                          )}
                        </div>

                        {/* Rating */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                              {partner.rating?.toFixed(1) || '0.0'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              ({partner.reviewCount || 0})
                            </span>
                          </div>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {partner.country}
                          </span>
                        </div>

                        {/* Services Preview */}
                        {partner.specialties && partner.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {partner.specialties.slice(0, 2).map((service, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                              >
                                {service}
                              </span>
                            ))}
                            {partner.specialties.length > 2 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{partner.specialties.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Partner Details */}
      {selectedPartner && !isLoadingPartners && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Partner Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-start gap-4">
                {(selectedPartner.logo || selectedPartner.logoUrl) ? (
                  <img
                    src={selectedPartner.logo || selectedPartner.logoUrl}
                    alt={selectedPartner.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <BuildingStorefrontIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedPartner.name}</h3>
                    {selectedPartner.isVerified && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs font-medium">
                        Verified
                      </span>
                    )}
                    {selectedPartner.isFeatured && (
                      <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded text-xs font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {selectedPartner.category}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300">{selectedPartner.description}</p>

              {selectedPartner.specialties && selectedPartner.specialties.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Services Offered</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPartner.specialties.map((service, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Actions */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <StarSolidIcon className="h-5 w-5 text-yellow-400" />
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100 ml-1">
                      {selectedPartner.rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPartner.reviewCount || 0} reviews
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedPartner.contact?.phone && (
                    <a
                      href={`tel:${selectedPartner.contact.phone}`}
                      className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      {selectedPartner.contact.phone}
                    </a>
                  )}
                  {selectedPartner.contact?.email && (
                    <a
                      href={`mailto:${selectedPartner.contact.email}`}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <EnvelopeIcon className="h-5 w-5 mr-2" />
                      Send Email
                    </a>
                  )}
                  {selectedPartner.contact?.website && (
                    <a
                      href={selectedPartner.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <GlobeAltIcon className="h-5 w-5 mr-2" />
                      Visit Website
                    </a>
                  )}
                  {selectedPartner.contact?.address && (
                    <div className="pt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-start">
                        <MapPinIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{selectedPartner.contact.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMap;
