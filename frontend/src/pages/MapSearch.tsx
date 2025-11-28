import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  ListBulletIcon,
  UserIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import MapView from '../components/MapView';
import CustomSelect from '../components/CustomSelect';
import { getNearbyOwners, getMapOwners, isBusinessOpen, formatAddress } from '../services/ownerService';
import type { MapOwner, BusinessHours } from '../services/ownerService';

// Map owner data to Location interface for MapView compatibility
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

// Convert MapOwner to Location format
const mapOwnerToLocation = (owner: MapOwner): Location => {
  const todayHours = getTodayHours(owner.businessHours);
  return {
    id: owner._id || owner.id,
    name: owner.company || owner.name,
    owner: owner.name,
    address: owner.address?.street || '',
    city: owner.address?.city || '',
    state: owner.address?.state || '',
    zipCode: owner.address?.zipCode || '',
    phone: owner.phone || '',
    email: owner.email || '',
    rating: owner.rating?.averageRating || 0,
    reviews: owner.rating?.totalRatings || 0,
    distance: owner.distance ?? null,
    services: owner.specialties || [],
    hours: todayHours,
    isOpen: isBusinessOpen(owner.businessHours),
    coordinates: {
      lat: owner.location?.coordinates?.[1] || 0,
      lng: owner.location?.coordinates?.[0] || 0,
    },
  };
};

// Get today's business hours
const getTodayHours = (businessHours?: BusinessHours): { open: string; close: string } => {
  if (!businessHours) return { open: '9:00 AM', close: '5:00 PM' };

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()] as keyof BusinessHours;
  const todayHours = businessHours[today];

  if (!todayHours || todayHours.closed) {
    return { open: 'Closed', close: 'Closed' };
  }

  return {
    open: todayHours.open || '9:00 AM',
    close: todayHours.close || '5:00 PM',
  };
};

const serviceFilters = [
  "Vehicle Wraps",
  "LED Signs",
  "Monument Signs",
  "Digital Displays",
  "Channel Letters",
  "Wayfinding",
  "Window Graphics",
  "Banners",
  "Trade Show",
  "ADA Signs"
];

const MapSearch = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showList, setShowList] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [radius, setRadius] = useState('50');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Fetch owners based on user location or all map owners
  const { data: nearbyData, isLoading: isLoadingNearby, error: nearbyError, refetch: refetchNearby } = useQuery({
    queryKey: ['nearbyOwners', userLocation?.lat, userLocation?.lng, radius, selectedServices[0]],
    queryFn: () => getNearbyOwners({
      lat: userLocation!.lat,
      lng: userLocation!.lng,
      radius: parseInt(radius),
      specialty: selectedServices.length > 0 ? selectedServices[0] : undefined,
      limit: 50,
    }),
    enabled: !!userLocation,
  });

  // Fallback: fetch all map owners if no user location
  const { data: allOwnersData, isLoading: isLoadingAll, error: allError } = useQuery({
    queryKey: ['mapOwners'],
    queryFn: getMapOwners,
    enabled: !userLocation,
  });

  // Convert owners to Location format
  const locations: Location[] = userLocation
    ? (nearbyData?.data || []).map(mapOwnerToLocation)
    : (allOwnersData?.data || []).map(mapOwnerToLocation);

  // Filter by selected services (client-side filtering for multiple services)
  const filteredLocations = selectedServices.length > 0
    ? locations.filter(loc =>
        selectedServices.some(service =>
          loc.services.some(s => s.toLowerCase().includes(service.toLowerCase()))
        )
      )
    : locations;

  // Filter by search query
  const searchedLocations = searchQuery
    ? filteredLocations.filter(loc =>
        loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.zipCode.includes(searchQuery) ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.owner.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredLocations;

  // Select first location when data loads
  useEffect(() => {
    if (searchedLocations.length > 0 && !selectedLocation) {
      setSelectedLocation(searchedLocations[0]);
    }
  }, [searchedLocations, selectedLocation]);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleGetDirections = (location: Location) => {
    const destination = encodeURIComponent(`${location.address}, ${location.city}, ${location.state} ${location.zipCode}`);
    const origin = userLocation
      ? `${userLocation.lat},${userLocation.lng}`
      : '';
    const url = origin
      ? `https://www.google.com/maps/dir/${origin}/${destination}`
      : `https://www.google.com/maps/search/?api=1&query=${destination}`;
    window.open(url, '_blank');
  };

  const isLoading = userLocation ? isLoadingNearby : isLoadingAll;
  const error = userLocation ? nearbyError : allError;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <MapIcon className="h-8 w-8 mr-3" />
                Location Finder
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Find Sign Company locations and franchise owners near you
              </p>
            </div>
            <button
              onClick={getUserLocation}
              disabled={isGettingLocation}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200 disabled:opacity-50"
            >
              {isGettingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-2"></div>
                  Getting Location...
                </>
              ) : (
                <>
                  <UserIcon className="h-5 w-5 mr-2" />
                  {userLocation ? 'Update Location' : 'Use My Location'}
                </>
              )}
            </button>
          </div>
          {locationError && (
            <div className="mt-4 flex items-center text-red-200 bg-red-500/20 rounded-lg px-4 py-2">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              {locationError}
            </div>
          )}
          {userLocation && (
            <div className="mt-4 flex items-center text-primary-100">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Showing locations within {radius} miles of your location
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by city, state, or ZIP code..."
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
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Radius:</label>
                <div className="w-36">
                  <CustomSelect
                    value={radius}
                    onChange={(value) => {
                      setRadius(value);
                      if (userLocation) {
                        refetchNearby();
                      }
                    }}
                    options={[
                      { value: '5', label: '5 miles' },
                      { value: '10', label: '10 miles' },
                      { value: '25', label: '25 miles' },
                      { value: '50', label: '50 miles' },
                      { value: '100', label: '100 miles' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Service Filters */}
          <div className="border-t dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Services</h4>
              <button
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                onClick={() => setSelectedServices([])}
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {serviceFilters.map((service) => (
                <button
                  key={service}
                  onClick={() => toggleService(service)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedServices.includes(service)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading locations...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            Failed to load locations. Please try again later.
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && searchedLocations.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No locations found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {userLocation
              ? `No franchise owners found within ${radius} miles of your location.`
              : 'Click "Use My Location" to find nearby franchise owners.'}
          </p>
          {!userLocation && (
            <button
              onClick={getUserLocation}
              className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <MapPinIcon className="h-5 w-5 mr-2" />
              Use My Location
            </button>
          )}
        </div>
      )}

      {/* Map and List View */}
      {!isLoading && !error && searchedLocations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <div className={`${mapExpanded ? 'lg:col-span-3' : 'lg:col-span-2'} relative`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Map View</h3>
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
                locations={searchedLocations}
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                className="h-[600px]"
                userLocation={userLocation}
              />

              {/* Map Legend */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Open Now</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Closed</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-primary-600 rounded-full mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Selected</span>
                    </div>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">{searchedLocations.length} locations found</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location List */}
          {showList && !mapExpanded && (
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {userLocation ? 'Nearby Locations' : 'All Locations'}
                  </h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {searchedLocations.map((location) => (
                    <div
                      key={location.id}
                      onClick={() => setSelectedLocation(location)}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        selectedLocation?.id === location.id ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Location Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{location.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{location.owner}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            location.isOpen ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          }`}>
                            {location.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>

                        {/* Address and Distance */}
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-0">
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <p>{location.address}</p>
                            <p>{location.city}, {location.state} {location.zipCode}</p>
                          </div>
                          <div className="text-right sm:text-left">
                            {location.distance !== null && (
                              <p className="text-base sm:text-lg font-semibold text-primary-600 dark:text-primary-400">{location.distance} mi</p>
                            )}
                            <div className="flex items-center mt-1">
                              <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{location.rating.toFixed(1)}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({location.reviews})</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                          {location.phone && (
                            <a href={`tel:${location.phone}`} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              Call
                            </a>
                          )}
                          {location.email && (
                            <a href={`mailto:${location.email}`} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              Email
                            </a>
                          )}
                          <span className="flex items-center text-gray-600 dark:text-gray-400">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {location.hours.open === 'Closed' ? 'Closed Today' : `${location.hours.open} - ${location.hours.close}`}
                          </span>
                        </div>

                        {/* Services Preview */}
                        {location.services.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {location.services.slice(0, 3).map((service) => (
                              <span
                                key={service}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              >
                                {service}
                              </span>
                            ))}
                            {location.services.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-500 dark:text-gray-400">
                                +{location.services.length - 3} more
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

      {/* Selected Location Details */}
      {selectedLocation && !isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Location Info */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{selectedLocation.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">Owned by {selectedLocation.owner}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedLocation.address}<br />
                    {selectedLocation.city}, {selectedLocation.state} {selectedLocation.zipCode}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hours</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Today: {selectedLocation.hours.open === 'Closed' ? 'Closed' : `${selectedLocation.hours.open} - ${selectedLocation.hours.close}`}
                  </p>
                </div>
              </div>

              {selectedLocation.services.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Services Offered</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation.services.map((service) => (
                      <span
                        key={service}
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
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100 ml-1">{selectedLocation.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{selectedLocation.reviews} reviews</span>
                </div>
                <div className="space-y-2">
                  {selectedLocation.phone && (
                    <a
                      href={`tel:${selectedLocation.phone}`}
                      className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
                    >
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      {selectedLocation.phone}
                    </a>
                  )}
                  {selectedLocation.email && (
                    <a
                      href={`mailto:${selectedLocation.email}`}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
                    >
                      <EnvelopeIcon className="h-5 w-5 mr-2" />
                      Send Email
                    </a>
                  )}
                  <button
                    onClick={() => handleGetDirections(selectedLocation)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
                  >
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSearch;
