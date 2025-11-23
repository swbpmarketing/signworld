import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import './OwnerProfile.css';

// Mock data for demonstration
const mockOwnerData = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@signcompany.com',
  phone: '(555) 123-4567',
  company: 'Smith Signs & Graphics',
  profileImage: 'https://storage.googleapis.com/msgsndr/DecfA7BjYEDxFe8pqRZs/media/688c61c7ea6d0f0042107b99.jpeg',
  address: {
    street: '123 Main Street',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    country: 'USA',
  },
  openDate: '2015-03-15',
  yearsInBusiness: 9,
  specialties: [
    'Channel Letters',
    'Monument Signs',
    'Vehicle Wraps',
    'LED Displays',
    'Wayfinding Signage',
  ],
  equipment: [
    'CNC Router - MultiCam 3000 Series',
    'Large Format Printer - HP Latex 570',
    'Vinyl Plotter - Graphtec FC9000',
    'Channel Letter Bender - AccuBend 410',
    'Laser Engraver - Epilog Fusion Pro',
  ],
  mentoring: {
    available: true,
    areas: ['Business Growth', 'Equipment Training', 'Project Management'],
  },
  socialLinks: {
    facebook: 'https://facebook.com/smithsigns',
    linkedin: 'https://linkedin.com/company/smith-signs',
    instagram: 'https://instagram.com/smithsigns',
    website: 'https://www.smithsigns.com',
  },
  stats: {
    averageRating: 4.7,
    totalRatings: 23,
    projectsCompleted: 342,
    yearsWithSignWorld: 5,
  },
};

const mockReviews = [
  {
    id: '1',
    reviewer: {
      name: 'Sarah Johnson',
      company: 'Johnson Creative Signs',
      profileImage: 'https://storage.googleapis.com/msgsndr/DecfA7BjYEDxFe8pqRZs/media/688c61c7ea6d0f0042107b99.jpeg',
    },
    rating: 5,
    comment: 'John has been an incredible mentor. His expertise in channel letters helped us streamline our production process and increase efficiency by 30%.',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    reviewer: {
      name: 'Michael Chen',
      company: 'Chen Signs & Graphics',
      profileImage: 'https://storage.googleapis.com/msgsndr/DecfA7BjYEDxFe8pqRZs/media/688c61c7ea6d0f0042107b99.jpeg',
    },
    rating: 4,
    comment: 'Great experience working with John on a collaborative project. Very professional and knowledgeable about the industry.',
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    reviewer: {
      name: 'Emily Rodriguez',
      company: 'Bright Signs Co.',
      profileImage: 'https://storage.googleapis.com/msgsndr/DecfA7BjYEDxFe8pqRZs/media/688c61c7ea6d0f0042107b99.jpeg',
    },
    rating: 5,
    comment: 'John\'s equipment recommendations were spot on. Saved us thousands on our new printer purchase. Highly recommend reaching out to him!',
    createdAt: '2023-12-20',
  },
];

const OwnerProfile = () => {
  const { id } = useParams();
  const [owner, setOwner] = useState(mockOwnerData);
  const [reviews, setReviews] = useState(mockReviews);
  const [activeTab, setActiveTab] = useState('overview');

  // In a real application, fetch owner data from API
  useEffect(() => {
    // Simulating API call
    setOwner(mockOwnerData);
    setReviews(mockReviews);
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i}>
        {i < Math.floor(rating) ? (
          <StarIconSolid className="h-5 w-5 text-yellow-400" />
        ) : (
          <StarIcon className="h-5 w-5 text-gray-300" />
        )}
      </span>
    ));
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <img
                className="h-32 w-32 rounded-full border-4 border-white shadow-xl"
                src={owner.profileImage}
                alt={owner.name}
              />
            </div>
            
            {/* Owner Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white">{owner.name}</h1>
              <p className="text-xl text-primary-100 mt-1">{owner.company}</p>
              
              {/* Stats */}
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-6">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center star-rating">
                    {renderStars(owner.stats.averageRating)}
                  </div>
                  <span className="text-white font-medium">
                    {owner.stats.averageRating} ({owner.stats.totalRatings} reviews)
                  </span>
                </div>
                <div className="text-primary-100">
                  <span className="font-semibold text-white">{owner.yearsInBusiness}</span> years in business
                </div>
                <div className="text-primary-100">
                  <span className="font-semibold text-white">{owner.stats.projectsCompleted}</span> projects completed
                </div>
              </div>

              {/* Contact Buttons */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <a
                  href={`tel:${owner.phone}`}
                  className="inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors duration-200"
                >
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  Call
                </a>
                <a
                  href={`mailto:${owner.email}`}
                  className="inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors duration-200"
                >
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  Email
                </a>
                <button className="inline-flex items-center px-4 py-2 bg-primary-800 text-white rounded-lg font-medium hover:bg-primary-900 transition-colors duration-200">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {['overview', 'equipment', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm capitalize
                  ${activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {/* Overview Tab */}
              {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{owner.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{owner.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-sm text-gray-600">
                        {owner.address.street}<br />
                        {owner.address.city}, {owner.address.state} {owner.address.zipCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Open Since</p>
                      <p className="text-sm text-gray-600">{formatDate(owner.openDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Connect Online</h4>
                  <div className="flex space-x-3">
                    {owner.socialLinks.facebook && (
                      <a
                        href={owner.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <span className="sr-only">Facebook</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                        </svg>
                      </a>
                    )}
                    {owner.socialLinks.linkedin && (
                      <a
                        href={owner.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <span className="sr-only">LinkedIn</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      </a>
                    )}
                    {owner.socialLinks.instagram && (
                      <a
                        href={owner.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <span className="sr-only">Instagram</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                        </svg>
                      </a>
                    )}
                    {owner.socialLinks.website && (
                      <a
                        href={owner.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <span className="sr-only">Website</span>
                        <GlobeAltIcon className="h-6 w-6" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Specialties and Mentoring */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {owner.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                {/* Mentoring Status */}
                {owner.mentoring.available && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AcademicCapIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-green-900">Available for Mentoring</h4>
                        <p className="text-sm text-green-700 mt-1">
                          {owner.name} is available to mentor in the following areas:
                        </p>
                        <ul className="mt-2 space-y-1">
                          {owner.mentoring.areas.map((area, index) => (
                            <li key={index} className="text-sm text-green-700 flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></span>
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment & Capabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {owner.equipment.map((item, index) => (
                  <div key={index} className="flex items-start bg-gray-50 rounded-lg p-4">
                    <WrenchScrewdriverIcon className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Reviews & Ratings</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {renderStars(owner.stats.averageRating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {owner.stats.averageRating} out of 5 ({owner.stats.totalRatings} reviews)
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-start space-x-4">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={review.reviewer.profileImage}
                        alt={review.reviewer.name}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{review.reviewer.name}</h4>
                            <p className="text-sm text-gray-500">{review.reviewer.company}</p>
                          </div>
                          <time className="text-sm text-gray-500">{formatDate(review.createdAt)}</time>
                        </div>
                        <div className="mt-2 flex items-center">
                          {renderStars(review.rating)}
                        </div>
                        <p className="mt-3 text-sm text-gray-700">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;