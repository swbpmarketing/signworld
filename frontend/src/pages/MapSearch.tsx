import { useState } from 'react';
import {
  MapIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  ListBulletIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  UserIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import MapView from '../components/MapView';
import CustomSelect from '../components/CustomSelect';

interface Location {
  id: number;
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
  distance: number;
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

const locations: Location[] = [
  {
    id: 1,
    name: "Arizona Signs & Graphics",
    owner: "Sarah Johnson",
    address: "1234 E Camelback Rd",
    city: "Phoenix",
    state: "AZ",
    zipCode: "85014",
    phone: "(602) 555-0123",
    email: "phoenix@signworld.com",
    rating: 4.9,
    reviews: 127,
    distance: 2.3,
    services: ["Vehicle Wraps", "LED Signs", "Monument Signs", "Channel Letters"],
    hours: { open: "8:00 AM", close: "6:00 PM" },
    isOpen: true,
    coordinates: { lat: 33.5093, lng: -112.0746 }
  },
  {
    id: 2,
    name: "Desert View Signage",
    owner: "Mark Thompson",
    address: "5678 N Scottsdale Rd",
    city: "Scottsdale",
    state: "AZ",
    zipCode: "85250",
    phone: "(480) 555-0456",
    email: "scottsdale@signworld.com",
    rating: 4.8,
    reviews: 89,
    distance: 5.7,
    services: ["Digital Displays", "Wayfinding", "Window Graphics"],
    hours: { open: "9:00 AM", close: "5:00 PM" },
    isOpen: true,
    coordinates: { lat: 33.4942, lng: -111.9261 }
  },
  {
    id: 3,
    name: "Valley Signs Express",
    owner: "Lisa Chen",
    address: "9012 W Bell Rd",
    city: "Glendale",
    state: "AZ",
    zipCode: "85308",
    phone: "(623) 555-0789",
    email: "glendale@signworld.com",
    rating: 4.7,
    reviews: 56,
    distance: 8.2,
    services: ["Banners", "Trade Show Displays", "Vehicle Graphics"],
    hours: { open: "8:30 AM", close: "5:30 PM" },
    isOpen: false,
    coordinates: { lat: 33.6403, lng: -112.0738 }
  },
  {
    id: 4,
    name: "Mesa Creative Signs",
    owner: "Robert Martinez",
    address: "3456 S Power Rd",
    city: "Mesa",
    state: "AZ",
    zipCode: "85212",
    phone: "(480) 555-0234",
    email: "mesa@signworld.com",
    rating: 4.9,
    reviews: 112,
    distance: 12.1,
    services: ["LED Signs", "Channel Letters", "Digital Displays", "Monument Signs"],
    hours: { open: "8:00 AM", close: "6:00 PM" },
    isOpen: true,
    coordinates: { lat: 33.3528, lng: -111.6890 }
  },
  {
    id: 5,
    name: "Tempe Sign Solutions",
    owner: "Jennifer Davis",
    address: "789 W University Dr",
    city: "Tempe",
    state: "AZ",
    zipCode: "85281",
    phone: "(480) 555-0567",
    email: "tempe@signworld.com",
    rating: 4.6,
    reviews: 78,
    distance: 7.3,
    services: ["Window Graphics", "Vehicle Wraps", "Banners", "Wayfinding"],
    hours: { open: "9:00 AM", close: "5:30 PM" },
    isOpen: true,
    coordinates: { lat: 33.4242, lng: -111.9281 }
  },
  {
    id: 6,
    name: "Chandler Sign Works",
    owner: "Michael Brown",
    address: "2345 N Arizona Ave",
    city: "Chandler",
    state: "AZ",
    zipCode: "85225",
    phone: "(480) 555-0890",
    email: "chandler@signworld.com",
    rating: 4.8,
    reviews: 95,
    distance: 15.4,
    services: ["Trade Show Displays", "LED Signs", "Vehicle Graphics", "Monument Signs"],
    hours: { open: "8:30 AM", close: "5:00 PM" },
    isOpen: false,
    coordinates: { lat: 33.3362, lng: -111.8413 }
  }
];

const serviceFilters = [
  "Vehicle Wraps",
  "LED Signs",
  "Monument Signs",
  "Digital Displays",
  "Channel Letters",
  "Wayfinding",
  "Window Graphics",
  "Banners"
];

const MapSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showList, setShowList] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(locations[0]);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [radius, setRadius] = useState('10');

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
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
                Location Finder
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Find Sign Company locations and franchise owners near you
              </p>
            </div>
            <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200">
              <UserIcon className="h-5 w-5 mr-2" />
              View My Location
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by city, state, or ZIP code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Radius:</label>
                <div className="w-36">
                  <CustomSelect
                    value={radius}
                    onChange={setRadius}
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
              <button className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200">
                Search
              </button>
            </div>
          </div>

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

      {/* Map and List View */}
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
              locations={locations}
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              className="h-[600px]"
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
                <span className="text-gray-500 dark:text-gray-400">{locations.length} locations found</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location List */}
        {showList && !mapExpanded && (
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nearby Locations</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {locations.map((location) => (
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
                          <p className="text-base sm:text-lg font-semibold text-primary-600 dark:text-primary-400">{location.distance} mi</p>
                          <div className="flex items-center mt-1">
                            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{location.rating}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({location.reviews})</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                        <button className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          Call
                        </button>
                        <button className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          Email
                        </button>
                        <button className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Hours
                        </button>
                      </div>

                      {/* Services Preview */}
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Details */}
      {selectedLocation && (
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
                    Monday - Friday: {selectedLocation.hours.open} - {selectedLocation.hours.close}<br />
                    Saturday - Sunday: Closed
                  </p>
                </div>
              </div>

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
            </div>

            {/* Contact Actions */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <StarSolidIcon className="h-5 w-5 text-yellow-400" />
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100 ml-1">{selectedLocation.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{selectedLocation.reviews} reviews</span>
                </div>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base">
                    <PhoneIcon className="h-5 w-5 mr-2" />
                    {selectedLocation.phone}
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base">
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    Send Email
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base">
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