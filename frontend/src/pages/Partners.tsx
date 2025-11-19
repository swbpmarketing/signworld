import { useState } from 'react';
import {
  UsersIcon,
  BuildingOfficeIcon,
  TagIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  StarIcon,
  ShieldCheckIcon,
  TruckIcon,
  CpuChipIcon,
  SwatchIcon,
  WrenchScrewdriverIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, CheckBadgeIcon as CheckBadgeSolidIcon } from '@heroicons/react/24/solid';

interface Partner {
  id: number;
  name: string;
  logo: string;
  category: string;
  description: string;
  specialties: string[];
  discount: string;
  rating: number;
  reviews: number;
  yearEstablished: number;
  locations: number;
  isVerified: boolean;
  isFeatured: boolean;
  contact: {
    phone: string;
    email: string;
    website: string;
    contactPerson: string;
  };
  benefits: string[];
}

const partners: Partner[] = [
  {
    id: 1,
    name: "3M Commercial Graphics",
    logo: "3M",
    category: "Materials & Supplies",
    description: "Industry-leading vinyl films, overlaminates, and adhesives for vehicle wraps and signage.",
    specialties: ["Vinyl Films", "Overlaminates", "Reflective Materials", "Window Films"],
    discount: "15-25% off",
    rating: 4.9,
    reviews: 234,
    yearEstablished: 1902,
    locations: 200,
    isVerified: true,
    isFeatured: true,
    contact: {
      phone: "1-800-328-3908",
      email: "partners@3m.com",
      website: "www.3m.com/graphics",
      contactPerson: "John Smith - Partner Relations"
    },
    benefits: [
      "Exclusive Sign Company pricing",
      "Free technical support",
      "Same-day shipping on most orders",
      "Extended warranty programs"
    ]
  },
  {
    id: 2,
    name: "Roland DGA",
    logo: "RD",
    category: "Equipment",
    description: "Premium wide-format printers, cutters, and engravers for professional sign making.",
    specialties: ["Wide-Format Printers", "Vinyl Cutters", "UV Printers", "Engravers"],
    discount: "Special Financing",
    rating: 4.8,
    reviews: 189,
    yearEstablished: 1981,
    locations: 50,
    isVerified: true,
    isFeatured: true,
    contact: {
      phone: "1-800-542-2307",
      email: "signworld@rolanddga.com",
      website: "www.rolanddga.com",
      contactPerson: "Maria Garcia - Account Manager"
    },
    benefits: [
      "0% financing for 48 months",
      "Free installation and training",
      "Lifetime technical support",
      "Trade-in programs available"
    ]
  },
  {
    id: 3,
    name: "Grimco",
    logo: "GR",
    category: "Distributor",
    description: "One-stop shop for sign supplies, equipment, and digital media with nationwide distribution.",
    specialties: ["Sign Supplies", "Digital Media", "Equipment", "Installation Tools"],
    discount: "10-20% off",
    rating: 4.7,
    reviews: 156,
    yearEstablished: 1875,
    locations: 60,
    isVerified: true,
    isFeatured: false,
    contact: {
      phone: "1-800-542-9941",
      email: "signworld@grimco.com",
      website: "www.grimco.com",
      contactPerson: "David Lee - Partner Specialist"
    },
    benefits: [
      "Next-day delivery available",
      "Online ordering portal",
      "Dedicated account manager",
      "Volume discounts"
    ]
  },
  {
    id: 4,
    name: "Avery Dennison",
    logo: "AD",
    category: "Materials & Supplies",
    description: "High-performance vinyl films and wrapping solutions for vehicles and architectural applications.",
    specialties: ["Vehicle Wraps", "Architectural Films", "Color Change Wraps", "Protection Films"],
    discount: "20% off",
    rating: 4.8,
    reviews: 201,
    yearEstablished: 1935,
    locations: 180,
    isVerified: true,
    isFeatured: false,
    contact: {
      phone: "1-800-282-8379",
      email: "graphics@averydennison.com",
      website: "www.averydennison.com",
      contactPerson: "Susan Park - Regional Manager"
    },
    benefits: [
      "Warranty support program",
      "Free sample kits",
      "Online training academy",
      "Marketing co-op funds"
    ]
  }
];

const categories = [
  { name: "All Partners", icon: BuildingOfficeIcon, count: 45 },
  { name: "Materials & Supplies", icon: SwatchIcon, count: 18 },
  { name: "Equipment", icon: CpuChipIcon, count: 12 },
  { name: "Distributor", icon: TruckIcon, count: 8 },
  { name: "Services", icon: WrenchScrewdriverIcon, count: 7 }
];

const Partners = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Partners');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const filteredPartners = partners.filter(partner => {
    if (selectedCategory !== 'All Partners' && partner.category !== selectedCategory) return false;
    if (showFeaturedOnly && !partner.isFeatured) return false;
    if (searchQuery && !partner.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !partner.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <UsersIcon className="h-8 w-8 mr-3" />
                Preferred Partners
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Exclusive discounts and benefits from our trusted vendor network
              </p>
            </div>
            <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200">
              <PhoneIcon className="h-5 w-5 mr-2" />
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <BuildingOfficeIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">45</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Partner Companies</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <TagIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">$2.5M</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Annual Savings</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">100%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Verified Partners</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <StarIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">4.8</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Partner Rating</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search partners by name or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Featured Only</span>
            </label>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 dark:text-gray-300">
              <FunnelIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
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
          </div>
        </div>

        {/* Partners Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Featured Partners Banner */}
          {selectedCategory === 'All Partners' && !searchQuery && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-center">
                <StarSolidIcon className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Featured Partners</h3>
                  <p className="text-sm text-gray-600">Top-rated vendors with exclusive Sign Company benefits</p>
                </div>
              </div>
            </div>
          )}

          {/* Partners List */}
          <div className="grid grid-cols-1 gap-6">
            {filteredPartners.map((partner) => (
              <div
                key={partner.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                  partner.isFeatured ? 'border-yellow-200 dark:border-yellow-700' : 'border-gray-100 dark:border-gray-700'
                } overflow-hidden hover:shadow-lg transition-all duration-300`}
              >
                {partner.isFeatured && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-1 text-xs font-medium text-white">
                    ⭐ FEATURED PARTNER
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {partner.logo}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{partner.name}</h3>
                          {partner.isVerified && (
                            <CheckBadgeSolidIcon className="h-5 w-5 text-blue-500 ml-2" title="Verified Partner" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{partner.category} • Est. {partner.yearEstablished}</p>
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
                            {partner.rating} ({partner.reviews} reviews)
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
                            <span className="text-green-500 mr-1">✓</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t dark:border-gray-700 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                      <button className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {partner.contact.phone}
                      </button>
                      <button className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <GlobeAltIcon className="h-4 w-4 mr-1" />
                        Website
                      </button>
                      <button className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        Email
                      </button>
                    </div>
                    <button className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                      View Details
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPartners.length === 0 && (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No partners found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Partners;