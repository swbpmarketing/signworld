import { useState, useEffect } from 'react';
import { CalendarDaysIcon, MapPinIcon, ClockIcon, TicketIcon, UserGroupIcon, SparklesIcon, MicrophoneIcon, AcademicCapIcon, GlobeAmericasIcon, Cog6ToothIcon, PhotoIcon, DocumentIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://sign-company.onrender.com/api');

interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  image: string;
  bio: string;
  topic: string;
  day: string;
  time: string;
}

interface Schedule {
  day: string;
  date: string;
  events: {
    time: string;
    title: string;
    speaker?: string;
    location: string;
    type: 'keynote' | 'workshop' | 'networking' | 'meal' | 'exhibition';
  }[];
}

const Convention = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isRegistered, setIsRegistered] = useState(false);

  // Admin state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'gallery' | 'documents'>('gallery');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [conventions, setConventions] = useState<any[]>([]);
  const [selectedConvention, setSelectedConvention] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [newConvention, setNewConvention] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: {
      venue: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    isActive: true,
    isFeatured: false
  });

  // Gallery lightbox state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string; conventionTitle: string } | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Convention date - August 22, 2025
  const conventionDate = new Date(2025, 7, 22, 9, 0, 0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const difference = conventionDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load conventions for gallery (all users) and admin management
  useEffect(() => {
    fetchConventions();
  }, []);

  const fetchConventions = async () => {
    try {
      const response = await fetch(`${API_URL}/conventions`);
      const data = await response.json();
      if (data.success) {
        setConventions(data.data);
        if (data.data.length > 0 && !selectedConvention) {
          setSelectedConvention(data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching conventions:', error);
    }
  };

  const handleCreateConvention = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/conventions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newConvention)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Convention created successfully!');
        setShowCreateModal(false);
        fetchConventions();
        setSelectedConvention(data.data._id);
        // Reset form
        setNewConvention({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          location: {
            venue: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'USA'
          },
          isActive: true,
          isFeatured: false
        });
      } else {
        toast.error(`Error: ${data.error || 'Failed to create convention'}`);
      }
    } catch (error: any) {
      console.error('Error creating convention:', error);
      toast.error(`Failed to create convention: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Mock speakers data
  const speakers: Speaker[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      title: 'CEO & Industry Leader',
      company: 'SignTech Innovations',
      image: 'https://via.placeholder.com/150',
      bio: 'With over 20 years in the sign industry, Sarah has revolutionized digital signage solutions.',
      topic: 'The Future of Digital Signage',
      day: 'Day 1',
      time: '9:30 AM'
    },
    {
      id: '2',
      name: 'Michael Chen',
      title: 'Marketing Director',
      company: 'BrandVision Group',
      image: 'https://via.placeholder.com/150',
      bio: 'Expert in brand development and marketing strategies for sign businesses.',
      topic: 'Building Your Sign Business Brand',
      day: 'Day 1',
      time: '11:00 AM'
    },
    {
      id: '3',
      name: 'Lisa Rodriguez',
      title: 'Technical Specialist',
      company: 'LED Solutions Pro',
      image: 'https://via.placeholder.com/150',
      bio: 'Leading expert in LED technology and sustainable sign solutions.',
      topic: 'Sustainable Sign Manufacturing',
      day: 'Day 2',
      time: '10:00 AM'
    },
    {
      id: '4',
      name: 'David Thompson',
      title: 'Business Coach',
      company: 'Growth Strategies Inc.',
      image: 'https://via.placeholder.com/150',
      bio: 'Helps sign businesses scale operations and increase profitability.',
      topic: 'Scaling Your Sign Business',
      day: 'Day 2',
      time: '2:00 PM'
    }
  ];

  // Mock schedule data
  const schedule: Schedule[] = [
    {
      day: 'Day 1',
      date: 'August 22, 2025',
      events: [
        { time: '8:00 AM', title: 'Registration & Welcome Breakfast', location: 'Main Lobby', type: 'meal' },
        { time: '9:00 AM', title: 'Opening Ceremony', location: 'Grand Ballroom', type: 'keynote' },
        { time: '9:30 AM', title: 'The Future of Digital Signage', speaker: 'Sarah Johnson', location: 'Grand Ballroom', type: 'keynote' },
        { time: '11:00 AM', title: 'Building Your Sign Business Brand', speaker: 'Michael Chen', location: 'Room A', type: 'workshop' },
        { time: '12:30 PM', title: 'Networking Lunch', location: 'Dining Hall', type: 'meal' },
        { time: '2:00 PM', title: 'Innovation Exhibition', location: 'Exhibition Hall', type: 'exhibition' },
        { time: '4:00 PM', title: 'Panel Discussion: Industry Trends', location: 'Grand Ballroom', type: 'keynote' },
        { time: '6:00 PM', title: 'Welcome Reception', location: 'Rooftop Terrace', type: 'networking' }
      ]
    },
    {
      day: 'Day 2',
      date: 'August 23, 2025',
      events: [
        { time: '8:30 AM', title: 'Morning Coffee & Networking', location: 'Main Lobby', type: 'networking' },
        { time: '10:00 AM', title: 'Sustainable Sign Manufacturing', speaker: 'Lisa Rodriguez', location: 'Room B', type: 'workshop' },
        { time: '11:30 AM', title: 'Technology Showcase', location: 'Exhibition Hall', type: 'exhibition' },
        { time: '1:00 PM', title: 'Awards Luncheon', location: 'Grand Ballroom', type: 'meal' },
        { time: '2:00 PM', title: 'Scaling Your Sign Business', speaker: 'David Thompson', location: 'Room A', type: 'workshop' },
        { time: '3:30 PM', title: 'Best Practices Roundtable', location: 'Conference Room C', type: 'networking' },
        { time: '5:00 PM', title: 'Closing Ceremony', location: 'Grand Ballroom', type: 'keynote' },
        { time: '7:00 PM', title: 'Gala Dinner', location: 'Crystal Ballroom', type: 'meal' }
      ]
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: SparklesIcon },
    { id: 'schedule', label: 'Schedule', icon: CalendarDaysIcon },
    { id: 'speakers', label: 'Speakers', icon: MicrophoneIcon },
    { id: 'gallery', label: 'Gallery', icon: PhotoIcon },
    { id: 'registration', label: 'Registration', icon: TicketIcon },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Cog6ToothIcon }] : []),
  ];

  // File upload handler
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;
    if (!selectedConvention) {
      toast.warning('Please select a convention first');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      selectedFiles.forEach(file => {
        formData.append(uploadType, file);
      });

      if (uploadType === 'gallery') {
        formData.append('caption', 'Convention Gallery');
        formData.append('year', new Date().getFullYear().toString());
      }

      const endpoint = uploadType === 'gallery' ? 'gallery' : 'documents';
      const response = await fetch(`${API_URL}/conventions/${selectedConvention}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success(`${uploadType === 'gallery' ? 'Images' : 'Documents'} uploaded successfully!`);
        setSelectedFiles([]);
        setShowUploadModal(false);
        fetchConventions(); // Refresh to show updated data
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error || 'Upload failed'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'keynote': return '🎤';
      case 'workshop': return '🛠️';
      case 'networking': return '🤝';
      case 'meal': return '🍽️';
      case 'exhibition': return '🏛️';
      default: return '📅';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'keynote': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-700';
      case 'workshop': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-700';
      case 'networking': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-700';
      case 'meal': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
      case 'exhibition': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400 border-pink-200 dark:border-pink-700';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <div className="space-y-6">
      {/* Hero Section with Countdown */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl shadow-lg p-3 sm:p-4 md:p-6 lg:p-8 text-white overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2">Sign Company Convention 2025</h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-3 sm:mb-4 text-primary-100">Innovate. Connect. Grow.</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 md:space-x-6 space-y-1.5 sm:space-y-0 text-xs sm:text-sm">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-sm">August 22-23, 2025</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Las Vegas Convention Center</span>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 md:p-6 min-w-0">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3 md:mb-4 text-center">Event Starts In</h3>
            <div className="grid grid-cols-4 gap-1 sm:gap-2 md:gap-3 lg:gap-4 text-center">
              <div className="min-w-0">
                <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold tabular-nums">{countdown.days}</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-tight sm:tracking-wide mt-0.5 sm:mt-1">Days</div>
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold tabular-nums">{countdown.hours}</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-tight sm:tracking-wide mt-0.5 sm:mt-1">Hours</div>
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold tabular-nums">{countdown.minutes}</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-tight sm:tracking-wide mt-0.5 sm:mt-1">Min</div>
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold tabular-nums">{countdown.seconds}</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-tight sm:tracking-wide mt-0.5 sm:mt-1">Sec</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex justify-between sm:justify-start overflow-x-auto scrollbar-hide -mb-px px-0 sm:px-3 md:px-6" aria-label="Tabs" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex flex-col sm:flex-row items-center justify-center py-2 sm:py-2.5 md:py-3 lg:py-4 px-1.5 sm:px-2 md:px-3 lg:px-4 border-b-2 font-medium text-[10px] sm:text-[11px] md:text-xs lg:text-sm transition-colors whitespace-nowrap flex-1 sm:flex-initial flex-shrink-0 min-w-0
                  ${activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <tab.icon className="h-4 w-4 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 mb-0.5 sm:mb-0 sm:mr-1 md:mr-1.5 lg:mr-2 flex-shrink-0" />
                <span className="truncate text-center sm:text-left">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-lg p-5 sm:p-6">
                  <UserGroupIcon className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 dark:text-blue-400 mb-3 sm:mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">500+</h3>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Expected Attendees</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 rounded-lg p-5 sm:p-6">
                  <AcademicCapIcon className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400 mb-3 sm:mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">30+</h3>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Educational Sessions</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 rounded-lg p-5 sm:p-6">
                  <GlobeAmericasIcon className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 dark:text-purple-400 mb-3 sm:mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">50+</h3>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Industry Exhibitors</p>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">About the Convention</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Join us for the most anticipated Sign Company event of the year! The 2025 Annual Convention brings together
                  sign industry professionals from across the nation for two days of learning, networking, and innovation.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Discover cutting-edge technologies, learn from industry leaders, and connect with fellow sign business
                  owners. Whether you're looking to grow your business, stay ahead of trends, or find new partnerships,
                  this convention has something for everyone.
                </p>

                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">What to Expect</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <StarIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    Keynote presentations from industry visionaries
                  </li>
                  <li className="flex items-start">
                    <StarIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    Hands-on workshops and technical training sessions
                  </li>
                  <li className="flex items-start">
                    <StarIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    Exhibition hall featuring the latest products and services
                  </li>
                  <li className="flex items-start">
                    <StarIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    Networking opportunities with peers and partners
                  </li>
                  <li className="flex items-start">
                    <StarIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    Awards ceremony recognizing excellence in the industry
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {schedule.map((day) => (
                <div key={day.day} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{day.day}</h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{day.date}</span>
                  </div>
                  <div className="space-y-3">
                    {day.events.map((event, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 flex items-start space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">{getEventTypeIcon(event.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{event.title}</h4>
                              {event.speaker && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Speaker: {event.speaker}</p>
                              )}
                              <div className="flex flex-col sm:flex-row sm:items-center mt-2 sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {event.time}
                                </span>
                                <span className="flex items-center">
                                  <MapPinIcon className="h-4 w-4 mr-1" />
                                  {event.location}
                                </span>
                              </div>
                            </div>
                            <span className={`
                              inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                              ${getEventTypeColor(event.type)}
                            `}>
                              {event.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Speakers Tab */}
          {activeTab === 'speakers' && (
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Learn from the best in the industry. Our speakers bring decades of experience and cutting-edge insights.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {speakers.map((speaker) => (
                  <div
                    key={speaker.id}
                    onClick={() => setSelectedSpeaker(speaker)}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg dark:hover:bg-gray-600 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {speaker.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{speaker.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{speaker.title}</p>
                        <p className="text-sm text-primary-600 dark:text-primary-400">{speaker.company}</p>
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Topic:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{speaker.topic}</p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          {speaker.day} • {speaker.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="space-y-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Convention Gallery</h3>
                <p className="text-gray-600 dark:text-gray-400">Photos and memories from our Sign Company conventions</p>
              </div>

              {conventions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <PhotoIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Gallery Images Yet</h4>
                  <p className="text-gray-500 dark:text-gray-400">Check back soon for photos from our conventions!</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {conventions
                    .filter(conv => conv.gallery && conv.gallery.length > 0)
                    .map((conv) => (
                      <div key={conv._id} className="bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
                        {/* Convention Header */}
                        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{conv.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <CalendarDaysIcon className="h-4 w-4 mr-1" />
                              {new Date(conv.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                            {conv.location?.city && (
                              <span className="flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                {conv.location.city}, {conv.location.state}
                              </span>
                            )}
                            <span className="text-primary-600 dark:text-primary-400 font-medium">
                              {conv.gallery.length} {conv.gallery.length === 1 ? 'photo' : 'photos'}
                            </span>
                          </div>
                        </div>

                        {/* Image Grid */}
                        <div className="p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {conv.gallery.map((image: any, index: number) => (
                              <div
                                key={index}
                                onClick={() => setLightboxImage({ url: image.imageUrl, caption: image.caption, conventionTitle: conv.title })}
                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                              >
                                <img
                                  src={image.imageUrl}
                                  alt={image.caption || `${conv.title} - Photo ${index + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                                  <PhotoIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                {image.caption && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs truncate">{image.caption}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                  {conventions.filter(conv => conv.gallery && conv.gallery.length > 0).length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <PhotoIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Photos Uploaded Yet</h4>
                      <p className="text-gray-500 dark:text-gray-400">Gallery photos will appear here once uploaded by administrators.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Registration Tab */}
          {activeTab === 'registration' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Reserve Your Spot</h3>
                <p className="text-gray-600 dark:text-gray-400">Join us for an unforgettable experience at Sign Company Convention 2025</p>
              </div>

              {!isRegistered ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Registration Options</h4>
                    <div className="space-y-4">
                      <label className="block">
                        <input type="radio" name="registration" className="mr-3" defaultChecked />
                        <span className="text-gray-700 dark:text-gray-300">
                          <strong>Full Convention Pass</strong> - $599
                          <span className="block text-sm text-gray-600 dark:text-gray-400 ml-6">
                            Access to all sessions, workshops, exhibition hall, and meals
                          </span>
                        </span>
                      </label>
                      <label className="block">
                        <input type="radio" name="registration" className="mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">
                          <strong>Day Pass</strong> - $349
                          <span className="block text-sm text-gray-600 dark:text-gray-400 ml-6">
                            Single day access to sessions and exhibition hall
                          </span>
                        </span>
                      </label>
                      <label className="block">
                        <input type="radio" name="registration" className="mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">
                          <strong>Virtual Pass</strong> - $199
                          <span className="block text-sm text-gray-600 dark:text-gray-400 ml-6">
                            Live streaming access to keynote sessions
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                      <strong>Early Bird Special:</strong> Register before July 1st and save 20% on all passes!
                    </p>
                  </div>

                  <button
                    onClick={() => setIsRegistered(true)}
                    className="w-full py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm"
                  >
                    Complete Registration
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Registration Complete!</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Thank you for registering for Sign Company Convention 2025.
                    We've sent a confirmation email with your ticket details.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <button className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm">
                      Download Ticket
                    </button>
                    <button className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors">
                      Add to Calendar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Tab */}
          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Convention Management</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage conventions, upload files</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="py-2 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Convention
                  </button>
                </div>

                {/* Convention Selector */}
                {conventions.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Convention
                    </label>
                    <select
                      value={selectedConvention}
                      onChange={(e) => setSelectedConvention(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {conventions.map((conv) => (
                        <option key={conv._id} value={conv._id}>
                          {conv.title} - {new Date(conv.startDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Files will be uploaded to the selected convention
                    </p>
                  </div>
                )}
              </div>

              {conventions.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 mb-3">
                    No conventions found. Create your first convention to start uploading files.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="py-2 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm inline-flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create First Convention
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Gallery Images */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center mb-4">
                    <PhotoIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gallery Images</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Upload convention photos</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadType('gallery');
                      setShowUploadModal(true);
                    }}
                    className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm flex items-center justify-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Upload Images
                  </button>
                </div>

                {/* Upload Documents */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center mb-4">
                    <DocumentIcon className="h-8 w-8 text-secondary-600 dark:text-secondary-400 mr-3" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Documents</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Upload schedules, brochures, PDFs</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadType('documents');
                      setShowUploadModal(true);
                    }}
                    className="w-full py-3 px-4 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 active:bg-secondary-800 transition-colors shadow-sm flex items-center justify-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Upload Documents
                  </button>
                </div>
              </div>
              )}
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Create Convention Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8">
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Convention</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Convention Title *
                  </label>
                  <input
                    type="text"
                    value={newConvention.title}
                    onChange={(e) => setNewConvention({ ...newConvention, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Sign Company Convention 2025"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newConvention.description}
                    onChange={(e) => setNewConvention({ ...newConvention, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe the convention..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newConvention.startDate}
                    onChange={(e) => setNewConvention({ ...newConvention, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newConvention.endDate}
                    onChange={(e) => setNewConvention({ ...newConvention, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={newConvention.location.venue}
                    onChange={(e) => setNewConvention({ ...newConvention, location: { ...newConvention.location, venue: e.target.value } })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Las Vegas Convention Center"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={newConvention.location.address}
                    onChange={(e) => setNewConvention({ ...newConvention, location: { ...newConvention.location, address: e.target.value } })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={newConvention.location.city}
                    onChange={(e) => setNewConvention({ ...newConvention, location: { ...newConvention.location, city: e.target.value } })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={newConvention.location.state}
                    onChange={(e) => setNewConvention({ ...newConvention, location: { ...newConvention.location, state: e.target.value } })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={newConvention.location.zipCode}
                    onChange={(e) => setNewConvention({ ...newConvention, location: { ...newConvention.location, zipCode: e.target.value } })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ZIP Code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={newConvention.location.country}
                    onChange={(e) => setNewConvention({ ...newConvention, location: { ...newConvention.location, country: e.target.value } })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Country"
                  />
                </div>

                <div className="md:col-span-2 flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newConvention.isActive}
                      onChange={(e) => setNewConvention({ ...newConvention, isActive: e.target.checked })}
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newConvention.isFeatured}
                      onChange={(e) => setNewConvention({ ...newConvention, isFeatured: e.target.checked })}
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConvention}
                disabled={loading || !newConvention.title || !newConvention.description || !newConvention.startDate || !newConvention.endDate}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Convention'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full">
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                {uploadType === 'gallery' ? (
                  <PhotoIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-2" />
                ) : (
                  <DocumentIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400 mr-2" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Upload {uploadType === 'gallery' ? 'Images' : 'Documents'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select {uploadType === 'gallery' ? 'Images' : 'Documents'}
                  </label>
                  <input
                    type="file"
                    multiple
                    accept={uploadType === 'gallery' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.txt'}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {uploadType === 'gallery'
                      ? 'Upload up to 20 images (JPG, PNG, GIF). Max 10MB per file.'
                      : 'Upload up to 10 documents (PDF, DOC, DOCX, XLS, XLSX). Max 10MB per file.'}
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Selected Files ({selectedFiles.length})
                    </h4>
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedFiles.map((file, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span className="truncate">{file.name}</span>
                          <button
                            onClick={() => {
                              setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
                            }}
                            className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles([]);
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={selectedFiles.length === 0 || uploading}
                  className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Speaker Details Modal */}
      {selectedSpeaker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-start justify-between p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 z-10">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Speaker Profile</h3>
              <button
                onClick={() => setSelectedSpeaker(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
                  {selectedSpeaker.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{selectedSpeaker.name}</h4>
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">{selectedSpeaker.title}</p>
                  <p className="text-primary-600 dark:text-primary-400 mb-4">{selectedSpeaker.company}</p>

                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base">Biography</h5>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{selectedSpeaker.bio}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base">Session Topic</h5>
                      <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 font-medium">{selectedSpeaker.topic}</p>
                      <div className="flex items-center justify-center sm:justify-start mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <CalendarDaysIcon className="h-4 w-4 mr-1" />
                        {selectedSpeaker.day} • {selectedSpeaker.time}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-white">
                <h4 className="text-lg font-semibold">{lightboxImage.conventionTitle}</h4>
                {lightboxImage.caption && (
                  <p className="text-sm text-gray-300">{lightboxImage.caption}</p>
                )}
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || 'Convention photo'}
                className="max-w-full max-h-[calc(90vh-100px)] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default Convention;