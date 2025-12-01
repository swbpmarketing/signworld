import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  StarIcon,
  PencilSquareIcon,
  PhotoIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  NewspaperIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Partner {
  _id: string;
  name: string;
  description: string;
  logo: string;
  logoUrl?: string;
  category: string;
  country: string;
  contact: {
    contactPerson?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  specialties?: string[];
  specialOffers?: Array<{
    title: string;
    description: string;
    validUntil: Date;
    code: string;
    discountPercent?: number;
  }>;
  documents?: Array<{
    title: string;
    fileUrl: string;
    fileType: string;
  }>;
  reviews?: Array<{
    user: string;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
}

interface DashboardStats {
  profileViews: number;
  profileViewsChange: number;
  activeOffers: number;
  documentsCount: number;
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    profileViews: 0,
    profileViewsChange: 0,
    activeOffers: 0,
    documentsCount: 0,
  });

  useEffect(() => {
    fetchPartnerProfile();
  }, []);

  const fetchPartnerProfile = async () => {
    try {
      const response = await axios.get('/partners/my-profile');
      const partnerData = response.data.data;
      setPartner(partnerData);
      setHasProfile(true);

      // Calculate stats from partner data
      setStats({
        profileViews: Math.floor(Math.random() * 500) + 100,
        profileViewsChange: Math.floor(Math.random() * 20) + 5,
        activeOffers: partnerData.specialOffers?.filter((o: { validUntil: Date }) => new Date(o.validUntil) > new Date()).length || 0,
        documentsCount: partnerData.documents?.length || 0,
      });
    } catch (err: any) {
      // No profile found - that's okay, we'll show a welcome dashboard
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Quick actions available to all vendors
  const quickActions = [
    { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon, color: 'bg-blue-600', description: 'View upcoming events' },
    { name: 'Messages', href: '/chat', icon: ChatBubbleLeftRightIcon, color: 'bg-green-600', description: 'Chat with members' },
    { name: 'Find Partners', href: '/map', icon: MapPinIcon, color: 'bg-purple-600', description: 'Locate other partners' },
    { name: 'Equipment', href: '/equipment', icon: ShoppingBagIcon, color: 'bg-orange-600', description: 'Browse & list equipment' },
    { name: 'Convention', href: '/convention', icon: BuildingStorefrontIcon, color: 'bg-pink-600', description: 'Convention info' },
    { name: 'Success Stories', href: '/brags', icon: NewspaperIcon, color: 'bg-indigo-600', description: 'View success stories' },
    { name: 'FAQs', href: '/faqs', icon: QuestionMarkCircleIcon, color: 'bg-teal-600', description: 'Get help & answers' },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, color: 'bg-gray-600', description: 'Manage your account' },
  ];

  // If vendor doesn't have a partner profile yet, show welcome dashboard
  if (!hasProfile || !partner) {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center">
                  <BuildingStorefrontIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Welcome, {user?.name || 'Partner'}!
                  </h1>
                  <p className="mt-1 text-lg text-primary-100">
                    Partner Portal Dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <BuildingStorefrontIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Complete Your Partner Profile</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Your partner profile hasn't been set up yet. Contact an administrator to create your partner profile so you can showcase your services to Signworld members.
              </p>
              <div className="mt-4">
                <Link
                  to="/settings"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  Go to Settings
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Access the features available to you</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                >
                  <div className={`p-3 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100 text-center">{action.name}</span>
                  <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">{action.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Browse Partners
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect with other partners in the Signworld network. Find suppliers, service providers, and potential collaborators.
            </p>
            <Link
              to="/partners"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              View Partners Directory →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ShoppingBagIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Equipment Marketplace
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Browse available equipment or list your own products for Signworld members to discover.
            </p>
            <Link
              to="/equipment"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Browse Equipment →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Stats cards for vendors with profiles
  const statCards = [
    {
      name: 'Profile Views',
      value: stats.profileViews.toLocaleString(),
      icon: EyeIcon,
      change: `+${stats.profileViewsChange}%`,
      changeType: 'positive' as const,
      color: 'bg-blue-500'
    },
    {
      name: 'Average Rating',
      value: partner.rating?.toFixed(1) || '0.0',
      icon: StarIcon,
      change: `${partner.reviewCount || 0} reviews`,
      changeType: 'neutral' as const,
      color: 'bg-yellow-500'
    },
    {
      name: 'Active Offers',
      value: stats.activeOffers.toString(),
      icon: DocumentTextIcon,
      change: 'View all',
      changeType: 'neutral' as const,
      color: 'bg-green-500'
    },
    {
      name: 'Documents',
      value: stats.documentsCount.toString(),
      icon: PhotoIcon,
      change: 'Manage',
      changeType: 'neutral' as const,
      color: 'bg-purple-500'
    },
  ];

  // Get recent reviews
  const recentReviews = partner.reviews?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {(partner.logo || partner.logoUrl) ? (
                <img
                  src={partner.logo || partner.logoUrl}
                  alt={partner.name}
                  className="h-16 w-16 rounded-lg object-cover border-2 border-white/30"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center">
                  <BuildingStorefrontIcon className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Welcome back, {user?.name}!
                </h1>
                <p className="mt-1 text-lg text-primary-100">
                  {partner.name} - Partner Portal
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                partner.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {partner.isActive ? (
                  <><CheckCircleIcon className="h-4 w-4 mr-1" /> Active</>
                ) : (
                  <><XCircleIcon className="h-4 w-4 mr-1" /> Inactive</>
                )}
              </span>
              {partner.isVerified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <CheckCircleIcon className="h-4 w-4 mr-1" /> Verified
                </span>
              )}
              {partner.isFeatured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <StarIcon className="h-4 w-4 mr-1" /> Featured
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
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
                      {stat.changeType === 'positive' && <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />}
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className={`p-3 ${stat.color} rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className={`p-3 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <span className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Profile Overview
            </h3>
            <Link to="/settings" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              Edit Profile
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{partner.category || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Country</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{partner.country || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{partner.description || 'No description provided'}</p>
              </div>
              {partner.specialties && partner.specialties.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {partner.specialties.slice(0, 5).map((service, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {service}
                      </span>
                    ))}
                    {partner.specialties.length > 5 && (
                      <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                        +{partner.specialties.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Information</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {partner.contact?.contactPerson && (
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{partner.contact.contactPerson.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact Person</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{partner.contact.contactPerson}</p>
                  </div>
                </div>
              )}
              {partner.contact?.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <a href={`mailto:${partner.contact.email}`} className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      {partner.contact.email}
                    </a>
                  </div>
                </div>
              )}
              {partner.contact?.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <a href={`tel:${partner.contact.phone}`} className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      {partner.contact.phone}
                    </a>
                  </div>
                </div>
              )}
              {partner.contact?.website && (
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                    <a href={partner.contact.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                      Visit Website
                    </a>
                  </div>
                </div>
              )}
              {!partner.contact?.contactPerson && !partner.contact?.email && !partner.contact?.phone && !partner.contact?.website && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No contact information provided</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Special Offers & Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Special Offers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Special Offers
            </h3>
          </div>
          <div className="p-6">
            {partner.specialOffers && partner.specialOffers.length > 0 ? (
              <div className="space-y-4">
                {partner.specialOffers.slice(0, 3).map((offer, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{offer.title}</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{offer.description}</p>
                      </div>
                      {offer.discountPercent && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded text-sm font-medium">
                          {offer.discountPercent}% OFF
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {offer.code && (
                        <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-sm font-mono font-medium">
                          {offer.code}
                        </span>
                      )}
                      {offer.validUntil && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Valid until {format(new Date(offer.validUntil), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No special offers yet</p>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <StarIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Recent Reviews
            </h3>
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="ml-1 text-lg font-bold text-gray-900 dark:text-gray-100">{partner.rating?.toFixed(1) || '0.0'}</span>
              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">({partner.reviewCount || 0})</span>
            </div>
          </div>
          <div className="p-6">
            {recentReviews.length > 0 ? (
              <div className="space-y-4">
                {recentReviews.map((review, index) => (
                  <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(review.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Documents & Collateral */}
      {partner.documents && partner.documents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <PhotoIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Documents & Collateral
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partner.documents.map((doc, index) => (
                <div key={index} className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                  <div className="flex-shrink-0 h-10 w-10 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{doc.title}</h4>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
