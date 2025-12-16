import { useState, useEffect } from 'react';
import { CalendarDaysIcon, MapPinIcon, ClockIcon, TicketIcon, UserGroupIcon, SparklesIcon, MicrophoneIcon, AcademicCapIcon, GlobeAmericasIcon, Cog6ToothIcon, PhotoIcon, DocumentIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePreviewMode } from '../context/PreviewModeContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import CustomSelect from '../components/CustomSelect';

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://sign-company.onrender.com/api');

interface Speaker {
  _id?: string;
  id?: string; // For backward compatibility
  name: string;
  title: string;
  company: string;
  image: string;
  bio: string;
  topic: string;
  day?: string;
  time?: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
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
  const { getEffectiveRole } = usePreviewMode();
  const effectiveRole = getEffectiveRole();
  const isAdmin = effectiveRole === 'admin';
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isRegistered, setIsRegistered] = useState(false);
  const [displayConvention, setDisplayConvention] = useState<any>(null);

  // Admin state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'gallery' | 'documents'>('gallery');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [conventions, setConventions] = useState<any[]>([]);
  const [selectedConvention, setSelectedConvention] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [newScheduleDay, setNewScheduleDay] = useState({
    day: '',
    date: '',
    events: []
  });
  const [newScheduleEvent, setNewScheduleEvent] = useState({
    time: '',
    title: '',
    speaker: '',
    location: '',
    type: 'keynote' as 'keynote' | 'workshop' | 'networking' | 'meal' | 'exhibition'
  });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [scheduleIdToDelete, setScheduleIdToDelete] = useState<string | null>(null);
  const [selectedScheduleDayIndex, setSelectedScheduleDayIndex] = useState<number | null>(null);
  const [showConfirmDeleteSpeaker, setShowConfirmDeleteSpeaker] = useState(false);
  const [speakerIdToDelete, setSpeakerIdToDelete] = useState<string | null>(null);
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
    expectedAttendees: 0,
    educationalSessions: 0,
    exhibitors: 0,
    isActive: true,
    isFeatured: false
  });

  // Gallery lightbox state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string; conventionTitle: string } | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Speaker management state
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [speakerImageMode, setSpeakerImageMode] = useState<'upload' | 'url'>('upload');
  const [newSpeaker, setNewSpeaker] = useState({
    name: '',
    title: '',
    company: '',
    bio: '',
    topic: '',
    day: '',
    time: '',
    imageUrl: '',
    email: '',
    linkedin: '',
    twitter: '',
    website: ''
  });
  const [speakerImageFile, setSpeakerImageFile] = useState<File | null>(null);
  const [newRegistrationOption, setNewRegistrationOption] = useState({
    name: '',
    price: '',
    description: ''
  });
  const [earlyBirdSettings, setEarlyBirdSettings] = useState({
    discount: '',
    message: ''
  });

  // Convention settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingSettings, setEditingSettings] = useState<any>(null);

  useEffect(() => {
    const updateCountdown = () => {
      if (!displayConvention) return;

      const conventionDate = new Date(displayConvention.startDate);
      const now = new Date();
      const difference = conventionDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [displayConvention]);

  // Load conventions for gallery (all users) and admin management
  useEffect(() => {
    fetchConventions();
  }, []);

  // Sync registration data when convention changes
  useEffect(() => {
    if (displayConvention && displayConvention.registrationOptions) {
      console.log('Convention registration options updated:', displayConvention.registrationOptions);
    }
  }, [displayConvention?.registrationOptions]);

  const fetchConventions = async () => {
    try {
      const response = await fetch(`${API_URL}/conventions`);
      const data = await response.json();
      if (data.success) {
        setConventions(data.data);
        if (data.data.length > 0) {
          // Find featured convention first, otherwise use first active convention
          const featured = data.data.find((conv: any) => conv.isFeatured && conv.isActive);
          const toDisplay = featured || data.data.find((conv: any) => conv.isActive) || data.data[0];
          setDisplayConvention(toDisplay);

          if (!selectedConvention) {
            setSelectedConvention(data.data[0]._id);
          }
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
          expectedAttendees: 0,
          educationalSessions: 0,
          exhibitors: 0,
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

  // Get speakers from displayed convention
  const speakers: Speaker[] = displayConvention?.speakers || [];

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

  const handleAddScheduleDay = async () => {
    if (!selectedConvention) {
      toast.warning('Please select a convention first');
      return;
    }

    // Only validate day and date when creating a new day (not when editing existing)
    if (selectedScheduleDayIndex === null && (!newScheduleDay.day || !newScheduleDay.date)) {
      toast.warning('Please fill in day and date');
      return;
    }

    if (newScheduleDay.events.length === 0) {
      toast.warning('Please add at least one event');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // If updating an existing day, first delete the old one
      if (selectedScheduleDayIndex !== null) {
        const selectedConv = conventions.find(c => c._id === selectedConvention);
        const oldDay = selectedConv?.schedule?.[selectedScheduleDayIndex];
        if (oldDay && oldDay._id) {
          await fetch(`${API_URL}/conventions/${selectedConvention}/schedule/${oldDay._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      }

      // Now create/update the schedule day with new events
      const response = await fetch(`${API_URL}/conventions/${selectedConvention}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          day: newScheduleDay.day,
          events: newScheduleDay.events
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(selectedScheduleDayIndex !== null ? 'Events added successfully!' : 'Schedule day added successfully!');
        setNewScheduleDay({ day: '', date: '', events: [] });
        setNewScheduleEvent({ time: '', title: '', speaker: '', location: '', type: 'keynote' });
        setSelectedScheduleDayIndex(null);
        setShowScheduleModal(false);

        // Fetch and update the specific convention being edited
        try {
          const convResponse = await fetch(`${API_URL}/conventions/${selectedConvention}`);
          const convData = await convResponse.json();
          if (convData.success && convData.data) {
            setDisplayConvention(convData.data);
            // Also update in the conventions array
            setConventions(prev => prev.map(c => c._id === selectedConvention ? convData.data : c));
          }
        } catch (err) {
          console.error('Error fetching updated convention:', err);
          // Fallback to fetching all conventions
          fetchConventions();
        }
      } else {
        toast.error(`Error: ${data.error || 'Failed to add schedule'}`);
      }
    } catch (error: any) {
      console.error('Error adding schedule:', error);
      toast.error(`Failed to add schedule: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScheduleEvent = () => {
    if (!newScheduleEvent.time || !newScheduleEvent.title || !newScheduleEvent.location) {
      toast.warning('Please fill in time, title, and location');
      return;
    }

    setNewScheduleDay({
      ...newScheduleDay,
      events: [...newScheduleDay.events, newScheduleEvent]
    });

    setNewScheduleEvent({
      time: '',
      title: '',
      speaker: '',
      location: '',
      type: 'keynote'
    });

    toast.success('Event added to schedule day');
  };

  const handleRemoveScheduleEvent = (index: number) => {
    setNewScheduleDay({
      ...newScheduleDay,
      events: newScheduleDay.events.filter((_, i) => i !== index)
    });
  };

  const handleDeleteScheduleDay = (scheduleId: string) => {
    setScheduleIdToDelete(scheduleId);
    setShowConfirmDelete(true);
  };

  const handleConfirmDeleteScheduleDay = async () => {
    if (!displayConvention || !scheduleIdToDelete) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/conventions/${displayConvention._id}/schedule/${scheduleIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Schedule day deleted successfully!');
        setShowConfirmDelete(false);
        setScheduleIdToDelete(null);
        fetchConventions();
      } else {
        toast.error(`Error: ${data.error || 'Failed to delete schedule'}`);
      }
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast.error(`Failed to delete schedule: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpeaker = async () => {
    if (!selectedConvention) {
      toast.warning('Please select a convention first');
      return;
    }

    // Validation
    if (!newSpeaker.name || !newSpeaker.title || !newSpeaker.company ||
        !newSpeaker.bio || !newSpeaker.topic) {
      toast.warning('Please fill in all required fields');
      return;
    }

    // Validate image
    if (speakerImageMode === 'upload' && !speakerImageFile) {
      toast.warning('Please upload a speaker image');
      return;
    }

    if (speakerImageMode === 'url' && !newSpeaker.imageUrl) {
      toast.warning('Please provide an image URL');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Append all speaker data
      formData.append('name', newSpeaker.name);
      formData.append('title', newSpeaker.title);
      formData.append('company', newSpeaker.company);
      formData.append('bio', newSpeaker.bio);
      formData.append('topic', newSpeaker.topic);

      // Optional day and time fields
      if (newSpeaker.day) formData.append('day', newSpeaker.day);
      if (newSpeaker.time) formData.append('time', newSpeaker.time);

      // Optional fields
      if (newSpeaker.email) formData.append('email', newSpeaker.email);
      if (newSpeaker.linkedin) formData.append('linkedin', newSpeaker.linkedin);
      if (newSpeaker.twitter) formData.append('twitter', newSpeaker.twitter);
      if (newSpeaker.website) formData.append('website', newSpeaker.website);

      // Handle image based on mode
      if (speakerImageMode === 'upload' && speakerImageFile) {
        formData.append('image', speakerImageFile);
      } else if (speakerImageMode === 'url') {
        formData.append('imageUrl', newSpeaker.imageUrl);
      }

      const response = await fetch(`${API_URL}/conventions/${selectedConvention}/speakers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Speaker added successfully!');
        setShowSpeakerModal(false);
        await fetchConventions();

        // Reset form
        setNewSpeaker({
          name: '',
          title: '',
          company: '',
          bio: '',
          topic: '',
          imageUrl: '',
          email: '',
          linkedin: '',
          twitter: '',
          website: ''
        });
        setSpeakerImageFile(null);
        setSpeakerImageMode('upload');
      } else {
        toast.error(`Error: ${data.error || 'Failed to add speaker'}`);
      }
    } catch (error: any) {
      console.error('Error adding speaker:', error);
      toast.error(`Failed to add speaker: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpeaker = (speakerId: string) => {
    if (!displayConvention) return;
    setSpeakerIdToDelete(speakerId);
    setShowConfirmDeleteSpeaker(true);
  };

  const handleConfirmDeleteSpeaker = async () => {
    if (!displayConvention || !speakerIdToDelete) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/conventions/${displayConvention._id}/speakers/${speakerIdToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Speaker deleted successfully');
        setShowConfirmDeleteSpeaker(false);
        setSpeakerIdToDelete(null);
        await fetchConventions();
      } else {
        toast.error(`Error: ${data.error || 'Failed to delete speaker'}`);
      }
    } catch (error: any) {
      console.error('Error deleting speaker:', error);
      toast.error(`Failed to delete speaker: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSpeakerImageFile(e.target.files[0]);
    }
  };

  const handleAddRegistrationOption = () => {
    console.log('handleAddRegistrationOption called');
    console.log('newRegistrationOption:', newRegistrationOption);
    console.log('selectedConvention:', selectedConvention);

    if (!newRegistrationOption.name || !newRegistrationOption.price || !newRegistrationOption.description) {
      console.log('Validation failed - missing fields');
      toast.warning('Please fill in all registration option fields');
      return;
    }

    // Get the selected convention from the admin dropdown
    const selectedConv = conventions.find(c => c._id === selectedConvention);
    console.log('selectedConv found:', selectedConv);

    if (!selectedConv) {
      console.log('No convention selected');
      toast.warning('Please select a convention first');
      return;
    }

    const updatedOptions = [
      ...(selectedConv?.registrationOptions || []),
      {
        name: newRegistrationOption.name,
        price: parseFloat(newRegistrationOption.price),
        description: newRegistrationOption.description,
        order: (selectedConv?.registrationOptions?.length || 0)
      }
    ];

    console.log('updatedOptions:', updatedOptions);

    // Update conventions list with updated convention
    setConventions(prev => {
      const updated = prev.map(c =>
        c._id === selectedConvention
          ? { ...c, registrationOptions: updatedOptions }
          : c
      );
      console.log('Updated conventions list:', updated);
      return updated;
    });

    setNewRegistrationOption({ name: '', price: '', description: '' });
    console.log('Option form cleared');
  };

  const handleDeleteRegistrationOption = (index: number) => {
    const selectedConv = conventions.find(c => c._id === selectedConvention);
    if (selectedConv?.registrationOptions) {
      const updatedOptions = selectedConv.registrationOptions.filter((_, i) => i !== index);
      setConventions(prev => prev.map(c =>
        c._id === selectedConvention
          ? { ...c, registrationOptions: updatedOptions }
          : c
      ));
    }
  };

  const handleSaveRegistrationSettings = async () => {
    if (!selectedConvention) {
      toast.warning('Please select a convention first');
      return;
    }

    const selectedConv = conventions.find(c => c._id === selectedConvention);
    if (!selectedConv) {
      toast.warning('Please select a convention first');
      return;
    }

    if (!selectedConv.registrationOptions || selectedConv.registrationOptions.length === 0) {
      toast.warning('Please add at least one registration option');
      return;
    }

    if (earlyBirdSettings.discount && isNaN(parseFloat(earlyBirdSettings.discount))) {
      toast.warning('Early bird discount must be a number');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        registrationOptions: selectedConv.registrationOptions,
        earlyBirdDiscount: earlyBirdSettings.discount ? parseFloat(earlyBirdSettings.discount) : 0,
        earlyBirdMessage: earlyBirdSettings.message || ''
      };

      console.log('Saving registration settings:', updateData);
      console.log('Convention ID:', selectedConvention);

      const response = await fetch(`${API_URL}/conventions/${selectedConvention}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      console.log('Save response:', data);
      console.log('Response status:', response.status);

      if (data.success) {
        toast.success('Registration settings saved successfully!');
        setShowRegistrationModal(false);
        await fetchConventions();

        // Update displayConvention to the one being edited so user sees changes immediately
        const updatedConv = data.data;
        if (updatedConv) {
          setDisplayConvention(updatedConv);
        }
      } else {
        toast.error(`Error: ${data.error || 'Failed to save registration settings'}`);
      }
    } catch (error: any) {
      console.error('Error saving registration settings:', error);
      toast.error(`Failed to save registration settings: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSettings = () => {
    if (!selectedConvention) {
      toast.warning('Please select a convention first');
      return;
    }
    const selectedConv = conventions.find(c => c._id === selectedConvention);
    if (selectedConv) {
      setEditingSettings({
        title: selectedConv.title || '',
        description: selectedConv.description || '',
        startDate: selectedConv.startDate || '',
        endDate: selectedConv.endDate || '',
        location: selectedConv.location || {},
        isActive: selectedConv.isActive || false,
        isFeatured: selectedConv.isFeatured || false
      });
      setShowSettingsModal(true);
    }
  };

  const handleSettingChange = (field: string, value: any) => {
    setEditingSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    if (!editingSettings.title || !editingSettings.description || !editingSettings.startDate || !editingSettings.endDate) {
      toast.warning('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const updateData = {
        title: editingSettings.title,
        description: editingSettings.description,
        startDate: editingSettings.startDate,
        endDate: editingSettings.endDate,
        location: editingSettings.location,
        isActive: editingSettings.isActive,
        isFeatured: editingSettings.isFeatured
      };

      const response = await fetch(`${API_URL}/conventions/${selectedConvention}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Convention settings saved successfully!');
        setShowSettingsModal(false);
        await fetchConventions();
        const updatedConv = data.data;
        if (updatedConv) {
          setDisplayConvention(updatedConv);
        }
      } else {
        toast.error(`Error: ${data.error || 'Failed to save settings'}`);
      }
    } catch (error: any) {
      console.error('Error saving convention settings:', error);
      toast.error(`Failed to save settings: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
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

  // Convert time string (e.g., "9:00 AM", "2:30 PM") to minutes for sorting
  const convertTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + (minutes || 0);
    if (period?.toUpperCase() === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    }
    if (period?.toUpperCase() === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    return totalMinutes;
  };

  // Sort events by time
  const getSortedEvents = (events: any[]): any[] => {
    if (!events) return [];
    return [...events].sort((a, b) =>
      convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time)
    );
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <div className="space-y-6">
      {/* Hero Section with Countdown */}
      {displayConvention ? (
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl shadow-lg p-3 sm:p-4 md:p-6 lg:p-8 text-white overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2">{displayConvention.title}</h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-3 sm:mb-4 text-primary-100">Innovate. Connect. Grow.</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 md:space-x-6 space-y-1.5 sm:space-y-0 text-xs sm:text-sm">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-sm">
                  {new Date(displayConvention.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(displayConvention.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-sm">{displayConvention.location?.venue || 'Location TBA'}</span>
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
      ) : (
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl shadow-lg p-6 text-white text-center">
          <p className="text-lg">Loading convention details...</p>
        </div>
      )}

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
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{displayConvention?.expectedAttendees || 0}+</h3>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Expected Attendees</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 rounded-lg p-5 sm:p-6">
                  <AcademicCapIcon className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400 mb-3 sm:mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{displayConvention?.educationalSessions || 0}+</h3>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Educational Sessions</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 rounded-lg p-5 sm:p-6">
                  <GlobeAmericasIcon className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 dark:text-purple-400 mb-3 sm:mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{displayConvention?.exhibitors || 0}+</h3>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Industry Exhibitors</p>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">About the Convention</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {displayConvention?.description || 'Convention description coming soon.'}
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
              {displayConvention?.schedule && displayConvention.schedule.length > 0 ? (
                displayConvention.schedule.map((day: any, dayIdx: number) => (
                  <div key={dayIdx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {day.day || `Day ${dayIdx + 1}`}
                      </h3>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteScheduleDay(day._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2"
                          title="Delete schedule day"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {day.events && day.events.length > 0 ? (
                        getSortedEvents(day.events).map((event: any, idx: number) => (
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
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No events scheduled for this day</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center">
                  <CalendarDaysIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
                  <p className="text-yellow-800 dark:text-yellow-400">
                    No schedule has been created yet. {isAdmin && 'Go to the Admin tab to add one.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Speakers Tab */}
          {activeTab === 'speakers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Learn from the best in the industry. Our speakers bring decades of experience and cutting-edge insights.
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowSpeakerModal(true)}
                    className="py-2 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm flex items-center flex-shrink-0 ml-4"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Speaker
                  </button>
                )}
              </div>

              {speakers.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 text-center">
                  <MicrophoneIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
                  <p className="text-yellow-800 dark:text-yellow-400">
                    No speakers have been added yet. {isAdmin && 'Add your first speaker above!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {speakers.map((speaker) => (
                    <div
                      key={speaker._id || speaker.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg dark:hover:bg-gray-600 transition-all group relative"
                    >
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSpeaker(speaker._id || speaker.id!);
                          }}
                          className="absolute top-4 right-4 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                          title="Delete speaker"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                      <div
                        onClick={() => setSelectedSpeaker(speaker)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
                          {speaker.image ? (
                            <img
                              src={speaker.image}
                              alt={speaker.name}
                              className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                              {speaker.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{speaker.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{speaker.title}</p>
                            <p className="text-sm text-primary-600 dark:text-primary-400">{speaker.company}</p>
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Topic:</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{speaker.topic}</p>
                            </div>
                            {(speaker.day || speaker.time) && (
                              <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                {speaker.day && (
                                  <div className="flex items-center">
                                    <CalendarDaysIcon className="h-4 w-4 mr-1 text-primary-600 dark:text-primary-400" />
                                    {speaker.day}
                                  </div>
                                )}
                                {speaker.time && (
                                  <div className="flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1 text-primary-600 dark:text-primary-400" />
                                    {speaker.time}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <p className="text-gray-600 dark:text-gray-400">
                  Join us for an unforgettable experience at {displayConvention?.title}
                </p>
              </div>

              {!isRegistered ? (
                <div className="space-y-6">
                  {displayConvention?.registrationOptions && displayConvention.registrationOptions.length > 0 ? (
                    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Registration Options</h4>
                      <div className="space-y-4">
                        {displayConvention.registrationOptions
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((option, index) => (
                            <label key={index} className="block">
                              <input
                                type="radio"
                                name="registration"
                                className="mr-3"
                                defaultChecked={index === 0}
                              />
                              <span className="text-gray-700 dark:text-gray-300">
                                <strong>{option.name}</strong> - ${option.price}
                                <span className="block text-sm text-gray-600 dark:text-gray-400 ml-6">
                                  {option.description}
                                </span>
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-400">
                        Registration options are not yet configured for this convention.
                      </p>
                    </div>
                  )}

                  {displayConvention?.earlyBirdDiscount && displayConvention.earlyBirdDiscount > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-400">
                        <strong>Early Bird Special:</strong>{' '}
                        {displayConvention.earlyBirdMessage ||
                          `Register before ${
                            displayConvention.earlyBirdDeadline
                              ? new Date(displayConvention.earlyBirdDeadline).toLocaleDateString()
                              : 'the deadline'
                          } and save ${displayConvention.earlyBirdDiscount}% on all passes!`}
                      </p>
                    </div>
                  )}

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
                    Thank you for registering for {displayConvention?.title}.
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
                    <CustomSelect
                      label="Select Convention"
                      value={selectedConvention}
                      onChange={(value) => setSelectedConvention(value)}
                      options={conventions.map((conv) => ({
                        value: conv._id,
                        label: `${conv.title} - ${new Date(conv.startDate).toLocaleDateString()}`,
                      }))}
                    />
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
                {/* Convention Settings */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 md:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Cog6ToothIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Convention Settings</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Edit dates, location, title and description</p>
                      </div>
                    </div>
                    <button
                      onClick={handleEditSettings}
                      className="py-2 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm"
                    >
                      Edit
                    </button>
                  </div>
                  {selectedConvention && conventions.find(c => c._id === selectedConvention) && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Title</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{conventions.find(c => c._id === selectedConvention)?.title}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Description</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{conventions.find(c => c._id === selectedConvention)?.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Start Date</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(conventions.find(c => c._id === selectedConvention)?.startDate).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">End Date</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(conventions.find(c => c._id === selectedConvention)?.endDate).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {conventions.find(c => c._id === selectedConvention)?.isActive && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">Active</span>
                        )}
                        {conventions.find(c => c._id === selectedConvention)?.isFeatured && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">Featured</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

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

                {/* Schedule Management */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 md:col-span-2">
                  <div className="flex items-center mb-4">
                    <CalendarDaysIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Schedule</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage convention schedule and events</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm flex items-center justify-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Schedule Day
                  </button>
                </div>

                {/* Registration Management */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 md:col-span-2">
                  <div className="flex items-center mb-4">
                    <TicketIcon className="h-8 w-8 text-secondary-600 dark:text-secondary-400 mr-3" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Registration</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage registration options and pricing</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!selectedConvention) {
                        toast.warning('Please select a convention first');
                        return;
                      }
                      const selectedConv = conventions.find(c => c._id === selectedConvention);
                      setShowRegistrationModal(true);
                      // Initialize early bird settings from convention
                      setEarlyBirdSettings({
                        discount: selectedConv?.earlyBirdDiscount?.toString() || '',
                        message: selectedConv?.earlyBirdMessage || ''
                      });
                    }}
                    className="w-full py-3 px-4 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 active:bg-secondary-800 transition-colors shadow-sm flex items-center justify-center"
                  >
                    <Cog6ToothIcon className="h-5 w-5 mr-2" />
                    Manage Registration
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expected Attendees
                  </label>
                  <input
                    type="number"
                    value={newConvention.expectedAttendees}
                    onChange={(e) => setNewConvention({ ...newConvention, expectedAttendees: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Educational Sessions
                  </label>
                  <input
                    type="number"
                    value={newConvention.educationalSessions}
                    onChange={(e) => setNewConvention({ ...newConvention, educationalSessions: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Industry Exhibitors
                  </label>
                  <input
                    type="number"
                    value={newConvention.exhibitors}
                    onChange={(e) => setNewConvention({ ...newConvention, exhibitors: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 50"
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

      {/* Schedule Management Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8">
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Events to Schedule</h3>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setNewScheduleDay({ day: '', date: '', events: [] });
                  setNewScheduleEvent({ time: '', title: '', speaker: '', location: '', type: 'keynote' });
                  setSelectedScheduleDayIndex(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Day Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Day *
                </label>
                <select
                  value={selectedScheduleDayIndex === null ? 'new' : selectedScheduleDayIndex.toString()}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setSelectedScheduleDayIndex(null);
                      setNewScheduleDay({ day: '', date: '', events: [] });
                    } else {
                      const idx = parseInt(e.target.value);
                      const selectedConv = conventions.find(c => c._id === selectedConvention);
                      const selectedDay = selectedConv?.schedule?.[idx];
                      if (selectedDay) {
                        setSelectedScheduleDayIndex(idx);
                        setNewScheduleDay({
                          day: selectedDay.day,
                          date: selectedDay.date,
                          events: [...selectedDay.events]
                        });
                      }
                    }
                    setNewScheduleEvent({ time: '', title: '', speaker: '', location: '', type: 'keynote' });
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="new">+ Create New Day</option>
                  {conventions.find(c => c._id === selectedConvention)?.schedule?.map((day: any, idx: number) => (
                    <option key={idx} value={idx.toString()}>
                      {day.day} - {day.date}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule Day Info (only show if creating new day) */}
              {selectedScheduleDayIndex === null && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Day Name *
                    </label>
                    <input
                      type="text"
                      value={newScheduleDay.day}
                      onChange={(e) => setNewScheduleDay({ ...newScheduleDay, day: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Day 1, August 22"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="text"
                      value={newScheduleDay.date}
                      onChange={(e) => setNewScheduleDay({ ...newScheduleDay, date: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., August 22, 2025"
                    />
                  </div>
                </div>
              )}

              {/* Events List - Always Visible */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Events ({newScheduleDay.events.length})</h4>
                {newScheduleDay.events.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 py-2">No events added yet. Add an event below to get started.</p>
                ) : (
                  <div className="space-y-2">
                    {getSortedEvents(newScheduleDay.events).map((event, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-700 rounded-lg p-3 flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{event.time} • {event.location}</p>
                              {event.speaker && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">Speaker: {event.speaker}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveScheduleEvent(idx)}
                          className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Event Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Events to This Day</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time *
                    </label>
                    <input
                      type="text"
                      value={newScheduleEvent.time}
                      onChange={(e) => setNewScheduleEvent({ ...newScheduleEvent, time: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 9:00 AM"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={newScheduleEvent.title}
                      onChange={(e) => setNewScheduleEvent({ ...newScheduleEvent, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Opening Keynote"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Speaker (optional)
                    </label>
                    <input
                      type="text"
                      value={newScheduleEvent.speaker}
                      onChange={(e) => setNewScheduleEvent({ ...newScheduleEvent, speaker: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Speaker name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={newScheduleEvent.location}
                      onChange={(e) => setNewScheduleEvent({ ...newScheduleEvent, location: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Grand Ballroom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Type *
                    </label>
                    <select
                      value={newScheduleEvent.type}
                      onChange={(e) => setNewScheduleEvent({ ...newScheduleEvent, type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="keynote">Keynote</option>
                      <option value="workshop">Workshop</option>
                      <option value="networking">Networking</option>
                      <option value="meal">Meal</option>
                      <option value="exhibition">Exhibition</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAddScheduleEvent}
                    className="w-full mt-3 py-2 px-3 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 active:bg-secondary-800 transition-colors"
                  >
                    Add Event to Schedule
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setNewScheduleDay({ day: '', date: '', events: [] });
                  setNewScheduleEvent({ time: '', title: '', speaker: '', location: '', type: 'keynote' });
                }}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddScheduleDay}
                disabled={
                  loading ||
                  newScheduleDay.events.length === 0 ||
                  (selectedScheduleDayIndex === null && (!newScheduleDay.day || !newScheduleDay.date))
                }
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Events'}
              </button>
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
                {selectedSpeaker.image ? (
                  <img
                    src={selectedSpeaker.image}
                    alt={selectedSpeaker.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
                    {selectedSpeaker.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
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
                    </div>

                    {(selectedSpeaker.day || selectedSpeaker.time) && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">Event Schedule</h5>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          {selectedSpeaker.day && (
                            <div className="flex items-center">
                              <CalendarDaysIcon className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                              {selectedSpeaker.day}
                            </div>
                          )}
                          {selectedSpeaker.time && (
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                              {selectedSpeaker.time}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    {(selectedSpeaker.email || selectedSpeaker.website || selectedSpeaker.linkedin || selectedSpeaker.twitter) && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">Connect</h5>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          {selectedSpeaker.email && (
                            <a
                              href={`mailto:${selectedSpeaker.email}`}
                              className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                            >
                              Email
                            </a>
                          )}
                          {selectedSpeaker.website && (
                            <a
                              href={selectedSpeaker.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                            >
                              Website
                            </a>
                          )}
                          {selectedSpeaker.linkedin && (
                            <a
                              href={selectedSpeaker.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                            >
                              LinkedIn
                            </a>
                          )}
                          {selectedSpeaker.twitter && (
                            <a
                              href={selectedSpeaker.twitter.startsWith('http') ? selectedSpeaker.twitter : `https://twitter.com/${selectedSpeaker.twitter.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                            >
                              Twitter
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Schedule Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h2.586a1 1 0 00-.707-1.707h-3.172a1 1 0 00-.707.293l-.929.929A1 1 0 009 5.586V7a1 1 0 001 1h2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                Delete Schedule Day?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                This action cannot be undone. The schedule day and all its events will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowConfirmDelete(false);
                  setScheduleIdToDelete(null);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteScheduleDay}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Speaker Confirmation Modal */}
      {showConfirmDeleteSpeaker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h2.586a1 1 0 00-.707-1.707h-3.172a1 1 0 00-.707.293l-.929.929A1 1 0 009 5.586V7a1 1 0 001 1h2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                Delete Speaker?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                This action cannot be undone. The speaker will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowConfirmDeleteSpeaker(false);
                  setSpeakerIdToDelete(null);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteSpeaker}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Speaker Modal */}
      {showSpeakerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8">
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Speaker</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a speaker to this convention</p>
              </div>
              <button
                onClick={() => {
                  setShowSpeakerModal(false);
                  setNewSpeaker({
                    name: '',
                    title: '',
                    company: '',
                    bio: '',
                    topic: '',
                    day: '',
                    time: '',
                    imageUrl: '',
                    email: '',
                    linkedin: '',
                    twitter: '',
                    website: ''
                  });
                  setSpeakerImageFile(null);
                  setSpeakerImageMode('upload');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Basic Information</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={newSpeaker.name}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Sarah Johnson"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title / Position *</label>
                  <input
                    type="text"
                    value={newSpeaker.title}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., CEO & Industry Leader"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company / Organization *</label>
                  <input
                    type="text"
                    value={newSpeaker.company}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, company: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., SignTech Innovations"
                  />
                </div>
              </div>

              {/* Biography */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Biography *</label>
                <textarea
                  value={newSpeaker.bio}
                  onChange={(e) => setNewSpeaker({ ...newSpeaker, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief biography of the speaker..."
                />
              </div>

              {/* Session Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Topic *</label>
                <input
                  type="text"
                  value={newSpeaker.topic}
                  onChange={(e) => setNewSpeaker({ ...newSpeaker, topic: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., The Future of Digital Signage"
                />
              </div>

              {/* Event Day and Time */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Event Schedule (Optional)</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Day</label>
                    <input
                      type="text"
                      value={newSpeaker.day}
                      onChange={(e) => setNewSpeaker({ ...newSpeaker, day: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Day 1 or May 15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Time</label>
                    <input
                      type="time"
                      value={newSpeaker.time}
                      onChange={(e) => setNewSpeaker({ ...newSpeaker, time: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Speaker Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Speaker Photo *</label>

                {/* Image Mode Toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSpeakerImageMode('upload')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      speakerImageMode === 'upload'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeakerImageMode('url')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      speakerImageMode === 'url'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Use URL
                  </button>
                </div>

                {speakerImageMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSpeakerImageChange}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {speakerImageFile && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Selected: {speakerImageFile.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    value={newSpeaker.imageUrl}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://example.com/speaker-photo.jpg"
                  />
                )}
              </div>

              {/* Optional Contact Information */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Optional Contact Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={newSpeaker.email}
                      onChange={(e) => setNewSpeaker({ ...newSpeaker, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="speaker@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
                    <input
                      type="url"
                      value={newSpeaker.website}
                      onChange={(e) => setNewSpeaker({ ...newSpeaker, website: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">LinkedIn</label>
                    <input
                      type="url"
                      value={newSpeaker.linkedin}
                      onChange={(e) => setNewSpeaker({ ...newSpeaker, linkedin: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Twitter</label>
                    <input
                      type="text"
                      value={newSpeaker.twitter}
                      onChange={(e) => setNewSpeaker({ ...newSpeaker, twitter: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowSpeakerModal(false);
                  setNewSpeaker({
                    name: '',
                    title: '',
                    company: '',
                    bio: '',
                    topic: '',
                    day: '',
                    time: '',
                    imageUrl: '',
                    email: '',
                    linkedin: '',
                    twitter: '',
                    website: ''
                  });
                  setSpeakerImageFile(null);
                  setSpeakerImageMode('upload');
                }}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSpeaker}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Speaker'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Management Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8">
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manage Registration Settings</h3>
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setNewRegistrationOption({ name: '', price: '', description: '' });
                  setEarlyBirdSettings({ discount: '', message: '' });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Registration Options Section */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <TicketIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Add Registration Option
                  </h4>

                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                    {/* Option Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Option Name *
                      </label>
                      <input
                        type="text"
                        value={newRegistrationOption.name}
                        onChange={(e) => setNewRegistrationOption({ ...newRegistrationOption, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., Standard Ticket, VIP Ticket"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price ($) *
                      </label>
                      <input
                        type="number"
                        value={newRegistrationOption.price}
                        onChange={(e) => setNewRegistrationOption({ ...newRegistrationOption, price: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., 99.99"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={newRegistrationOption.description}
                        onChange={(e) => setNewRegistrationOption({ ...newRegistrationOption, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., Includes lunch and workshop access"
                      />
                    </div>

                    <button
                      onClick={handleAddRegistrationOption}
                      className="w-full py-2 px-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 inline mr-2" />
                      Add Option
                    </button>
                  </div>
                </div>

                {/* Display Existing Registration Options */}
                {conventions.find(c => c._id === selectedConvention)?.registrationOptions && conventions.find(c => c._id === selectedConvention)!.registrationOptions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Current Options</h4>
                    <div className="space-y-2">
                      {conventions.find(c => c._id === selectedConvention)!.registrationOptions.map((option: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{option.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">${option.price.toFixed(2)}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{option.description}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteRegistrationOption(index)}
                            className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete option"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Early Bird Settings Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5 text-amber-500" />
                    Early Bird Settings (Optional)
                  </h4>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    {/* Early Bird Discount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Discount Percentage (%)
                      </label>
                      <input
                        type="number"
                        value={earlyBirdSettings.discount}
                        onChange={(e) => setEarlyBirdSettings({ ...earlyBirdSettings, discount: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g., 15"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    </div>

                    {/* Early Bird Message */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Custom Message
                      </label>
                      <textarea
                        value={earlyBirdSettings.message}
                        onChange={(e) => setEarlyBirdSettings({ ...earlyBirdSettings, message: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g., Early bird pricing available until December 31st!"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Leave empty for default message
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setNewRegistrationOption({ name: '', price: '', description: '' });
                  setEarlyBirdSettings({ discount: '', message: '' });
                }}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRegistrationSettings}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convention Settings Modal */}
      {showSettingsModal && editingSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8">
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Convention Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Edit convention details</p>
              </div>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setEditingSettings(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Basic Information</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Convention Title *
                  </label>
                  <input
                    type="text"
                    value={editingSettings.title || ''}
                    onChange={(e) => handleSettingChange('title', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter convention title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={editingSettings.description || ''}
                    onChange={(e) => handleSettingChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter convention description"
                  />
                </div>
              </div>

              {/* Date and Time Information */}
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Date & Time</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={editingSettings.startDate ? new Date(editingSettings.startDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleSettingChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={editingSettings.endDate ? new Date(editingSettings.endDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => handleSettingChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Location</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={editingSettings.location?.venue || ''}
                      onChange={(e) => handleSettingChange('location', { ...editingSettings.location, venue: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Venue name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editingSettings.location?.address || ''}
                      onChange={(e) => handleSettingChange('location', { ...editingSettings.location, address: e.target.value })}
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
                      value={editingSettings.location?.city || ''}
                      onChange={(e) => handleSettingChange('location', { ...editingSettings.location, city: e.target.value })}
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
                      value={editingSettings.location?.state || ''}
                      onChange={(e) => handleSettingChange('location', { ...editingSettings.location, state: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="State/Province"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={editingSettings.location?.zipCode || ''}
                      onChange={(e) => handleSettingChange('location', { ...editingSettings.location, zipCode: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Postal code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={editingSettings.location?.country || ''}
                      onChange={(e) => handleSettingChange('location', { ...editingSettings.location, country: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Status Settings */}
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Status</h4>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={editingSettings.isActive || false}
                      onChange={(e) => handleSettingChange('isActive', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active Convention
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={editingSettings.isFeatured || false}
                      onChange={(e) => handleSettingChange('isFeatured', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Featured Convention
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setEditingSettings(null);
                }}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={loading || !editingSettings.title || !editingSettings.description}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
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