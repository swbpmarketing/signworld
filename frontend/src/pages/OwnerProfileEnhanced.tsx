import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  WrenchScrewdriverIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  ShareIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getOwnerProfile, getOwnerReviews, submitOwnerReview } from '../services/ownerService';
import type { Owner, Review } from '../services/ownerService';
import './OwnerProfile.css';

// Loading skeleton component
const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-gray-200 dark:from-gray-700 to-gray-300 dark:to-gray-800 rounded-xl shadow-lg overflow-hidden h-64 skeleton"></div>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 skeleton"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full skeleton"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 skeleton"></div>
      </div>
    </div>
  </div>
);

const OwnerProfileEnhanced = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [owner, setOwner] = useState<Owner | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOwnerData();
  }, [id]);

  const fetchOwnerData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching owner profile for ID:', id);
      
      const [ownerData, reviewsData] = await Promise.all([
        getOwnerProfile(id),
        getOwnerReviews(id),
      ]);
      
      console.log('✅ Owner data received:', ownerData);
      console.log('✅ Reviews data received:', reviewsData);
      
      setOwner(ownerData);
      setReviews(reviewsData);
    } catch (err) {
      setError('Failed to load owner profile. Please try again later.');
      console.error('Error loading owner profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!owner || !reviewForm.comment.trim()) return;
    
    try {
      setSubmittingReview(true);
      await submitOwnerReview(owner._id || owner.id, reviewForm.rating, reviewForm.comment);
      
      // Refresh reviews
      const updatedReviews = await getOwnerReviews(owner._id || owner.id);
      setReviews(updatedReviews);
      
      // Reset form and close modal
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewModal(false);
      
      // Show success message (you could use a toast notification here)
      alert('Review submitted successfully! It will appear after moderation.');
    } catch (err) {
      alert('Failed to submit review. Please try again.');
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && setReviewForm({ ...reviewForm, rating: i + 1 })}
        className={`star ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {i < Math.floor(rating) ? (
          <StarIconSolid className="h-5 w-5 text-yellow-400" />
        ) : (
          <StarIcon className="h-5 w-5 text-gray-300 dark:text-gray-600" />
        )}
      </button>
    ));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${owner?.name} - ${owner?.company}`,
        text: `Check out ${owner?.name}'s profile on Sign Company Dashboard`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !owner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {error || 'Owner not found'}
          </h2>
          <button
            onClick={() => navigate('/owners')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Owners
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Top Actions Bar */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/owners')}
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Directory
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleShare}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Share profile"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Report profile"
          >
            <FlagIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Image */}
            <div className="flex-shrink-0 profile-image-container">
              <img
                className="h-32 w-32 rounded-full border-4 border-white shadow-xl object-cover"
                src={owner.profileImage || 'https://storage.googleapis.com/msgsndr/DecfA7BjYEDxFe8pqRZs/media/688c61c7ea6d0f0042107b99.jpeg'}
                alt={owner.name}
              />
            </div>
            
            {/* Owner Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white">{owner.name}</h1>
              <p className="text-xl text-primary-100 mt-1">{owner.company}</p>
              
              {/* Stats */}
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-6 stats-container">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center star-rating">
                    {renderStars(owner.rating?.averageRating || owner.stats?.averageRating || 0)}
                  </div>
                  <span className="text-white font-medium">
                    {owner.rating?.averageRating || owner.stats?.averageRating || 0} ({owner.rating?.totalRatings || owner.stats?.totalRatings || 0} reviews)
                  </span>
                </div>
                <div className="text-primary-100">
                  <span className="font-semibold text-white">{owner.yearsInBusiness}</span> years in business
                </div>
                <div className="text-primary-100">
                  <span className="font-semibold text-white">{owner.stats?.projectsCompleted || 0}</span> projects completed
                </div>
              </div>

              {/* Contact Buttons */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start contact-buttons">
                <a
                  href={`tel:${owner.phone}`}
                  className="contact-button inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors duration-200"
                >
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  Call
                </a>
                <a
                  href={`mailto:${owner.email}`}
                  className="contact-button inline-flex items-center px-4 py-2 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors duration-200"
                >
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  Email
                </a>
                <button
                  className="contact-button inline-flex items-center px-4 py-2 bg-primary-800 text-white rounded-lg font-medium hover:bg-primary-900 transition-colors duration-200"
                  onClick={() => navigate(`/chat?contact=${owner._id || owner.id}`)}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {['overview', 'equipment', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  tab-button py-4 px-1 border-b-2 font-medium text-sm capitalize
                  ${activeTab === tab
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <PhoneIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Phone</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{owner.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{owner.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Address</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {owner.address.street}<br />
                        {owner.address.city}, {owner.address.state} {owner.address.zipCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Open Since</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(owner.openDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Connect Online</h4>
                  <div className="flex space-x-3">
                    {owner.socialLinks.facebook && (
                      <a
                        href={owner.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
                        className="social-link text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
                        className="social-link text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
                        className="social-link text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Specialties</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {owner.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="specialty-tag inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                {/* Mentoring Status */}
                {owner.mentoring.available && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mentoring-badge">
                    <div className="flex items-start">
                      <AcademicCapIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">Available for Mentoring</h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {owner.name} is available to mentor in the following areas:
                        </p>
                        <ul className="mt-2 space-y-1">
                          {owner.mentoring.areas.map((area, index) => (
                            <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mr-2"></span>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Equipment & Capabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {owner.equipment.map((item, index) => (
                  <div key={index} className="equipment-card flex items-start bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <WrenchScrewdriverIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reviews & Ratings</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {renderStars(owner.rating?.averageRating || owner.stats?.averageRating || 0)}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {owner.rating?.averageRating || owner.stats?.averageRating || 0} out of 5 ({owner.rating?.totalRatings || owner.stats?.totalRatings || 0} reviews)
                    </span>
                  </div>
                  {user && user.id !== owner.id && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
                    >
                      Write a Review
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6 reviews-container">
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="review-card border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                      <div className="flex items-start space-x-4">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={review.reviewer.profileImage || 'https://storage.googleapis.com/msgsndr/DecfA7BjYEDxFe8pqRZs/media/688c61c7ea6d0f0042107b99.jpeg'}
                          alt={review.reviewer.name}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{review.reviewer.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{review.reviewer.company}</p>
                            </div>
                            <time className="text-sm text-gray-500 dark:text-gray-400">{formatDate(review.createdAt)}</time>
                          </div>
                          <div className="mt-2 flex items-center">
                            {renderStars(review.rating)}
                          </div>
                          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                <div className="flex items-center space-x-1">
                  {renderStars(reviewForm.rating, true)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Share your experience working with this owner..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || !reviewForm.comment.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerProfileEnhanced;
