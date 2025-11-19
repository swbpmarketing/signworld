import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  StarIcon,
  ChartBarIcon,
  PencilSquareIcon,
  PhotoIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

interface Partner {
  _id: string;
  name: string;
  description: string;
  logo: string;
  category: string;
  country: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    website: string;
  };
  services: string[];
  specialOffers: Array<{
    title: string;
    description: string;
    validUntil: Date;
    code: string;
  }>;
  documents: Array<{
    title: string;
    fileUrl: string;
    fileType: string;
  }>;
  isActive: boolean;
  isFeatured: boolean;
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPartnerProfile();
  }, []);

  const fetchPartnerProfile = async () => {
    try {
      const response = await axios.get('/partners/my-profile');
      setPartner(response.data.data);
      setError('');
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No partner profile found. Please contact support to create your profile.');
      } else {
        setError(err.response?.data?.error || 'Failed to load partner profile');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your partner profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <BuildingStorefrontIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Profile Not Found</h3>
              <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  const stats = [
    { name: 'Profile Views', value: '1,234', icon: ChartBarIcon, change: '+12%', changeType: 'positive' },
    { name: 'Average Rating', value: '4.8', icon: StarIcon, change: '127 reviews', changeType: 'neutral' },
    { name: 'Active Offers', value: partner.specialOffers?.length || '0', icon: DocumentTextIcon, change: 'View all', changeType: 'neutral' },
    { name: 'Documents', value: partner.documents?.length || '0', icon: PhotoIcon, change: 'Manage', changeType: 'neutral' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Welcome back, {user?.name}!
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Manage your partner profile and connect with sign company owners.
              </p>
            </div>
            <div className="flex-shrink-0">
              <button className="inline-flex items-center px-4 py-2 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <span
                      className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        stat.changeType === 'positive'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                    <stat.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
            Partner Profile
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            partner.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
          }`}>
            {partner.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-start space-x-6">
            <img
              src={partner.logo}
              alt={partner.name}
              className="h-24 w-24 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{partner.name}</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{partner.description}</p>
              <div className="mt-4 flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400">
                  {partner.category}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                  {partner.country}
                </span>
                {partner.isFeatured && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                    <StarIcon className="h-4 w-4 mr-1" />
                    Featured
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partner.contact.name && (
                <div className="flex items-center text-sm">
                  <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{partner.contact.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact Person</p>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">{partner.contact.name}</p>
                  </div>
                </div>
              )}
              {partner.contact.email && (
                <div className="flex items-center text-sm">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <a href={`mailto:${partner.contact.email}`} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      {partner.contact.email}
                    </a>
                  </div>
                </div>
              )}
              {partner.contact.phone && (
                <div className="flex items-center text-sm">
                  <PhoneIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <a href={`tel:${partner.contact.phone}`} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      {partner.contact.phone}
                    </a>
                  </div>
                </div>
              )}
              {partner.contact.website && (
                <div className="flex items-center text-sm">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                    <a href={partner.contact.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      Visit Website
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          {partner.services && partner.services.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Services Offered</h4>
              <div className="flex flex-wrap gap-2">
                {partner.services.map((service, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Special Offers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
            Special Offers
          </h3>
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
            Add Offer
          </button>
        </div>
        <div className="p-6">
          {partner.specialOffers && partner.specialOffers.length > 0 ? (
            <div className="space-y-4">
              {partner.specialOffers.map((offer, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{offer.title}</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{offer.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    {offer.code && (
                      <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-sm font-mono font-medium">
                        {offer.code}
                      </span>
                    )}
                    {offer.validUntil && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Valid until {new Date(offer.validUntil).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No special offers yet. Add your first offer to attract more customers!</p>
          )}
        </div>
      </div>

      {/* Documents & Collateral */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <PhotoIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
            Documents & Collateral
          </h3>
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
            Upload Document
          </button>
        </div>
        <div className="p-6">
          {partner.documents && partner.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partner.documents.map((doc, index) => (
                <div key={index} className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                  <div className="flex-shrink-0 h-10 w-10 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{doc.fileType?.toUpperCase()}</p>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No documents uploaded yet. Upload brochures, catalogs, or certification documents.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
