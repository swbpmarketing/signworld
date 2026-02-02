import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  VideoCameraIcon,
  PlayIcon,
  ClockIcon,
  EyeIcon,
  AcademicCapIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  PlayCircleIcon,
  XMarkIcon,
  PlusIcon,
  CloudArrowUpIcon,
  LinkIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon, PlayIcon as PlaySolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import CustomSelect from '../components/CustomSelect';
import { useAuth } from '../context/AuthContext';
import usePermissions from '../hooks/usePermissions';
import { getVideos, getVideoStats, getVideo, createVideo, uploadVideo, updateVideo, deleteVideo, incrementVideoView } from '../services/videoService';
import type { Video as VideoType, CreateVideoData } from '../services/videoService';
import { getPlaylists } from '../services/playlistService';
import type { Playlist } from '../services/playlistService';
import toast from 'react-hot-toast';

interface VideoUI extends VideoType {
  isBookmarked?: boolean;
  isNew?: boolean;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor?: string;
  uploadDate?: string;
  thumbnailUrl?: string;
}

const categoryMapping: { [key: string]: string } = {
  'All Videos': 'all',
  'Vehicle Wraps': 'marketing',
  'Technical Training': 'technical',
  'Business Growth': 'business',
  'Installation': 'training',
  'Design Tips': 'other',
};

const backendToUICategory: { [key: string]: string } = {
  'training': 'Installation',
  'marketing': 'Vehicle Wraps',
  'technical': 'Technical Training',
  'business': 'Business Growth',
  'product-demo': 'Product Demo',
  'webinar': 'Webinar',
  'other': 'Design Tips',
};

const categoryIcons: { [key: string]: any } = {
  'All Videos': VideoCameraIcon,
  'Vehicle Wraps': ArrowTrendingUpIcon,
  'Technical Training': WrenchScrewdriverIcon,
  'Business Growth': LightBulbIcon,
  'Installation': SparklesIcon,
  'Design Tips': AcademicCapIcon,
  'Product Demo': PlayCircleIcon,
  'Webinar': AcademicCapIcon,
};

/**
 * VideoOptionsMenu Component - Dropdown menu for edit/delete actions
 */
const VideoOptionsMenu = ({
  video,
  onEdit,
  onDelete,
  canRemoveVideo
}: {
  video: VideoUI;
  onEdit: () => void;
  onDelete: () => void;
  canRemoveVideo: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!canRemoveVideo) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Options"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 border-b border-gray-200 dark:border-gray-600"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Video
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            Delete Video
          </button>
        </div>
      )}
    </div>
  );
};

const Videos = () => {
  const { user } = useAuth();
  const { canCreate, canDelete } = usePermissions();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState('All Videos');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoUI | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showMobileCategoriesDropdown, setShowMobileCategoriesDropdown] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'youtube' | 'file'>('youtube');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    youtubeUrl: '',
    category: 'other',
    customCategory: '',
    duration: '',
    tags: [],
    presenter: { name: '', title: '', company: '' },
    isFeatured: false,
  });
  const [tagsInput, setTagsInput] = useState('');

  // Fetch videos
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ['videos', selectedCategory, searchQuery, sortBy, currentPage, itemsPerPage],
    queryFn: () => {
      // Find the backend key for the selected category
      let categoryKey = 'all';
      if (selectedCategory !== 'All Videos') {
        // Check if it's in the old mapping first
        if (categoryMapping[selectedCategory]) {
          categoryKey = categoryMapping[selectedCategory];
        } else {
          // Otherwise, convert UI name to backend format (lowercase with hyphens)
          categoryKey = selectedCategory.toLowerCase().replace(/\s+/g, '-');
        }
      }

      return getVideos({
        category: categoryKey,
        search: searchQuery,
        sort: sortBy,
        page: currentPage,
        limit: itemsPerPage,
      });
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['videoStats'],
    queryFn: getVideoStats,
  });

  // Note: Removed auto-setting of category to allow users to select "Other / Custom"

  // Fetch playlists
  const { data: playlistsData } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => getPlaylists({ limit: 10 }),
  });

  // Create video mutation (YouTube)
  const createVideoMutation = useMutation({
    mutationFn: createVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videoStats'] });
      toast.success('Video added successfully!');
      resetForm();
      setShowUploadModal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add video');
    },
  });

  // Upload video mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: CreateVideoData }) => {
      setIsUploading(true);
      return uploadVideo(file, metadata, setUploadProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videoStats'] });
      toast.success('Video uploaded successfully!');
      resetForm();
      setShowUploadModal(false);
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload video');
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videoStats'] });
      toast.success('Video deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete video');
    },
  });

  // Edit video state and mutation
  const [editingVideo, setEditingVideo] = useState<VideoUI | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({
    title: '',
    description: '',
    category: 'other',
    duration: '',
    tags: [],
    presenter: { name: '', title: '', company: '' },
    isFeatured: false,
  });

  const editVideoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateVideoData> }) => updateVideo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videoStats'] });
      toast.success('Video updated successfully!');
      setShowEditModal(false);
      setEditingVideo(null);
      setEditFormData({
        title: '',
        description: '',
        category: 'other',
        duration: '',
        tags: [],
        presenter: { name: '', title: '', company: '' },
        isFeatured: false,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update video');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtubeUrl: '',
      category: 'other',
      customCategory: '',
      duration: '',
      tags: [],
      presenter: { name: '', title: '', company: '' },
      isFeatured: false,
    });
    setTagsInput('');
    setVideoFile(null);
    setThumbnailFile(null);
    setUploadType('youtube');
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1); // Reset to first page
  };

  // Reset page when category or playlist changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedPlaylist]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Auto-open video from URL parameter
  useEffect(() => {
    const videoId = searchParams.get('id');
    if (videoId) {
      // Fetch the specific video by ID
      const fetchAndOpenVideo = async () => {
        try {
          const response = await getVideo(videoId);
          if (response.success && response.data) {
            openVideo(response.data as VideoUI);
            // Remove the id parameter from URL
            setSearchParams({});
          }
        } catch (error) {
          console.error('Failed to fetch video:', error);
          toast.error('Video not found');
          setSearchParams({});
        }
      };
      fetchAndOpenVideo();
    }
  }, [searchParams, setSearchParams]);

  const toggleBookmark = (videoId: string) => {
    setBookmarkedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const openVideo = async (video: VideoUI) => {
    setSelectedVideo(video);
    // Increment view count
    try {
      await incrementVideoView(video._id);
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }

    // Handle custom category
    let finalCategory = formData.category;
    if (formData.category === 'other') {
      if (!formData.customCategory?.trim()) {
        toast.error('Please enter a custom category name');
        return;
      }
      finalCategory = formData.customCategory.trim().toLowerCase().replace(/\s+/g, '-');
    }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    const dataToSubmit = {
      ...formData,
      category: finalCategory,
      tags,
    };
    // Remove customCategory from submission
    delete dataToSubmit.customCategory;

    if (uploadType === 'youtube') {
      if (!formData.youtubeUrl) {
        toast.error('Please enter a YouTube URL');
        return;
      }
      createVideoMutation.mutate(dataToSubmit);
    } else {
      if (!videoFile) {
        toast.error('Please select a video file');
        return;
      }
      uploadVideoMutation.mutate({
        file: videoFile,
        metadata: dataToSubmit,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  // Transform API data to UI format
  const allVideos: VideoUI[] = (videosData?.data || []).map((video: VideoType) => {
    // Determine instructor name based on uploader role
    let instructorName = 'SignWorld Business Partners'; // Default

    if (video.presenter?.name) {
      instructorName = video.presenter.name;
    } else if (video.uploadedBy) {
      // If uploaded by admin, show "SignWorld Business Partners"
      // If uploaded by owner, show the owner's name
      if (video.uploadedBy.role === 'admin') {
        instructorName = 'SignWorld Business Partners';
      } else if (video.uploadedBy.role === 'owner') {
        instructorName = video.uploadedBy.name;
      }
    }

    return {
      ...video,
      isBookmarked: bookmarkedVideos.has(video._id),
      isNew: new Date(video.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
      level: 'Intermediate' as const,
      instructor: instructorName,
      uploadDate: new Date(video.publishedAt || video.createdAt).toLocaleDateString(),
    };
  });

  // Filter by playlist if one is selected
  const videos: VideoUI[] = selectedPlaylist
    ? allVideos.filter(video =>
        selectedPlaylist.videos.some(pv => pv._id === video._id)
      )
    : allVideos;

  const featuredVideo = allVideos.find(v => v.isFeatured) || allVideos[0];

  // Handle playlist selection
  const handlePlaylistSelect = (playlist: Playlist) => {
    if (selectedPlaylist?._id === playlist._id) {
      setSelectedPlaylist(null); // Deselect if clicking same playlist
    } else {
      setSelectedPlaylist(playlist);
      setSelectedCategory('All Videos'); // Reset category filter
      setSearchQuery(''); // Clear search
      setSearchInput('');
    }
  };
  const stats = statsData?.data;

  // Compute categories dynamically from stats
  const dynamicCategories = useMemo(() => {
    const baseCategories = [
      { name: 'All Videos', icon: VideoCameraIcon, backendKey: 'all' },
    ];

    // Get all categories from stats and display them
    if (stats?.categoryCounts) {
      // Collect all categories first
      const allCategories: Array<{ name: string; icon: any; backendKey: string }> = [];

      Object.keys(stats.categoryCounts).forEach(backendKey => {
        const count = stats.categoryCounts[backendKey];
        if (count > 0) {
          const uiName = backendToUICategory[backendKey] || backendKey.charAt(0).toUpperCase() + backendKey.slice(1).replace(/-/g, ' ');
          allCategories.push({
            name: uiName,
            icon: categoryIcons[uiName] || VideoCameraIcon,
            backendKey,
          });
        }
      });

      // Sort categories alphabetically by name
      allCategories.sort((a, b) => a.name.localeCompare(b.name));

      // Add sorted categories to baseCategories
      baseCategories.push(...allCategories);
    }

    return baseCategories;
  }, [stats?.categoryCounts]);

  // Use permissions hook for role-based access
  const { role, isAdmin } = usePermissions();
  const canAddVideo = canCreate('videos');
  const canRemoveVideo = canDelete('videos');

  return (
    <div className="space-y-8" data-tour="videos-content">
      {/* Header Section */}
      <div className="bg-blue-50 dark:bg-blue-900 border-blue-100 dark:border-blue-900/30 rounded-lg border p-4 sm:p-6 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              <VideoCameraIcon className="h-6 w-6 sm:h-8 sm:w-8 mr-2 inline-block" />
              Video Learning Center
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Expert tutorials and training videos to grow your business
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            {canCreate && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-2.5 py-1.5 bg-primary-600 text-sm hover:bg-primary-700 text-white rounded-lg transition-colors font-medium inline-flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Video
              </button>
            )}
            <button className="px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium inline-flex items-center border border-gray-300 dark:border-gray-600">
              <PlayCircleIcon className="h-5 w-5 mr-2" />
              Watch Intro
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <VideoCameraIcon className="h-8 w-8 text-primary-600 dark:text-primary-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalVideos || 0}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Videos</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalDuration || '0h'}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Content</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <EyeIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalViews?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <StarIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.avgRating || '0.0'}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Rating</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4" role="search" aria-label="Video search">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <label htmlFor="video-search-input" className="sr-only">
                Search videos
              </label>
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <input
                id="video-search-input"
                data-tour="video-search"
                type="search"
                placeholder="Search videos by title, topic, or instructor..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                aria-label="Search videos by title, topic, or instructor"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-primary-600 text-sm hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 hover-lift focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Search videos"
            >
              <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
          <div className="w-40">
            <label htmlFor="video-sort" className="sr-only">
              Sort videos by
            </label>
            <CustomSelect
              value={sortBy}
              onChange={(value) => setSortBy(value)}
              options={[
                { value: 'newest', label: 'Newest' },
                { value: 'oldest', label: 'Oldest' },
                { value: 'popular', label: 'Most Viewed' },
                { value: 'rating', label: 'Top Rated' },
              ]}
            />
          </div>
        </form>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories - Mobile Dropdown */}
        <div className="lg:hidden space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setShowMobileCategoriesDropdown(!showMobileCategoriesDropdown)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Categories</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({selectedCategory})
                </span>
              </div>
              <ChevronDownIcon
                className={`h-5 w-5 text-gray-500 transition-transform ${showMobileCategoriesDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {showMobileCategoriesDropdown && (
              <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                <nav className="space-y-1">
                  {dynamicCategories.map((category) => {
                    const count = category.name === 'All Videos' ? stats?.totalVideos : (stats?.categoryCounts?.[category.backendKey] || 0);
                    return (
                      <button
                        key={category.name}
                        onClick={() => {
                          setSelectedCategory(category.name);
                          setShowMobileCategoriesDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all duration-200 ${
                          selectedCategory === category.name
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <category.icon className={`h-5 w-5 mr-3 ${
                            selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                          }`} />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <span className={`text-sm ${
                          selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          {/* Playlists - Mobile */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Popular Playlists</h3>
              {selectedPlaylist && (
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="space-y-3">
              {playlistsData?.data && playlistsData.data.length > 0 ? (
                playlistsData.data.map((playlist: Playlist) => {
                  const isSelected = selectedPlaylist?._id === playlist._id;
                  return (
                    <button
                      key={playlist._id}
                      onClick={() => handlePlaylistSelect(playlist)}
                      className={`w-full text-left p-3 rounded-lg transition-colors group ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-sm font-medium ${
                            isSelected
                              ? 'text-primary-700 dark:text-primary-400'
                              : 'text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`}>
                            {playlist.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {playlist.videoCount} videos • {playlist.duration}
                          </p>
                        </div>
                        <ChevronRightIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                        }`} />
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No playlists available yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          {/* Categories */}
          <div data-tour="video-categories" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
              <nav className="space-y-2">
                {dynamicCategories.map((category) => {
                  const count = category.name === 'All Videos' ? stats?.totalVideos : (stats?.categoryCounts?.[category.backendKey] || 0);
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`w-full text-left px-4 py-2 rounded-lg flex items-center justify-between transition-all duration-200 ${
                        selectedCategory === category.name
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <category.icon className={`h-5 w-5 mr-3 ${
                          selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                        }`} />
                        <span>{category.name}</span>
                      </div>
                      <span className={`text-sm ${
                        selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Playlists */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Popular Playlists</h3>
              {selectedPlaylist && (
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="space-y-3">
              {playlistsData?.data && playlistsData.data.length > 0 ? (
                playlistsData.data.map((playlist: Playlist) => {
                  const isSelected = selectedPlaylist?._id === playlist._id;
                  return (
                    <button
                      key={playlist._id}
                      onClick={() => handlePlaylistSelect(playlist)}
                      className={`w-full text-left p-3 rounded-lg transition-colors group ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-sm font-medium ${
                            isSelected
                              ? 'text-primary-700 dark:text-primary-400'
                              : 'text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`}>
                            {playlist.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {playlist.videoCount} videos • {playlist.duration}
                          </p>
                        </div>
                        <ChevronRightIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                        }`} />
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No playlists available yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="lg:col-span-3">
          {/* Playlist Selection Indicator */}
          {selectedPlaylist && (
            <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    Viewing playlist
                  </p>
                  <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100">
                    {selectedPlaylist.name}
                  </h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                    {videos.length} video{videos.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="px-2.5 py-1.5 bg-primary-600 text-sm text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Show All Videos
                </button>
              </div>
            </div>
          )}

          {/* Featured Video */}
          {!searchQuery && selectedCategory === 'All Videos' && !selectedPlaylist && featuredVideo && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Featured Video</h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 relative group cursor-pointer">
                  <img
                    src={featuredVideo.thumbnail || featuredVideo.thumbnailUrl || 'https://via.placeholder.com/640x360?text=Video'}
                    alt={featuredVideo.title}
                    className="w-full h-80 object-cover"
                  />
                  <div
                    onClick={() => openVideo(featuredVideo)}
                    className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <PlaySolidIcon className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                      Featured
                    </span>
                  </div>
                  {featuredVideo.duration && (
                    <div className="absolute bottom-4 right-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-black bg-opacity-75 text-white text-sm">
                        {featuredVideo.duration}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 flex-1">{featuredVideo.title}</h4>
                    <VideoOptionsMenu
                      video={featuredVideo}
                      onEdit={() => {
                        setEditingVideo(featuredVideo);
                        setEditFormData({
                          title: featuredVideo.title,
                          description: featuredVideo.description || '',
                          category: featuredVideo.category,
                          duration: featuredVideo.duration || '',
                          tags: featuredVideo.tags || [],
                          presenter: featuredVideo.presenter || { name: '', title: '', company: '' },
                          isFeatured: featuredVideo.isFeatured,
                        });
                        setShowEditModal(true);
                      }}
                      onDelete={() => deleteVideoMutation.mutate(featuredVideo._id)}
                      canRemoveVideo={canRemoveVideo}
                    />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2">{featuredVideo.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{featuredVideo.instructor}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{featuredVideo.views?.toLocaleString() || 0} views</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{featuredVideo.uploadDate}</span>
                    </div>
                    <button
                      onClick={() => openVideo(featuredVideo)}
                      className="inline-flex items-center px-2.5 py-1.5 bg-primary-600 text-sm text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Watch Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {videosLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700 animate-shimmer" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-3/4 rounded animate-shimmer" />
                    <div className="h-4 w-full rounded animate-shimmer" />
                    <div className="flex justify-between items-center mt-4">
                      <div className="h-4 w-20 rounded animate-shimmer" />
                      <div className="h-4 w-16 rounded animate-shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Video Grid */}
          {!videosLoading && videos.length > 0 && (
            <>
              <div data-tour="video-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                {videos.map((video) => (
                  <div
                    key={video._id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    <div
                      onClick={() => openVideo(video)}
                      className="aspect-w-16 aspect-h-9 relative group">
                      <img
                        src={video.thumbnail || video.thumbnailUrl || 'https://via.placeholder.com/640x360?text=Video'}
                        alt={video.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <PlaySolidIcon className="h-12 w-12 text-white" />
                      </div>
                      {video.isNew && (
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                            New
                          </span>
                        </div>
                      )}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-black bg-opacity-75 text-white text-xs">
                            {video.duration}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                          {video.title}
                        </h4>
                        <div className="flex items-center">
                          <VideoOptionsMenu
                            video={video}
                            onEdit={() => {
                              setEditingVideo(video);
                              setEditFormData({
                                title: video.title,
                                description: video.description || '',
                                category: video.category,
                                duration: video.duration || '',
                                tags: video.tags || [],
                                presenter: video.presenter || { name: '', title: '', company: '' },
                                isFeatured: video.isFeatured,
                              });
                              setShowEditModal(true);
                            }}
                            onDelete={() => deleteVideoMutation.mutate(video._id)}
                            canRemoveVideo={canRemoveVideo}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(video._id);
                            }}
                            className="ml-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {video.isBookmarked ? (
                              <BookmarkSolidIcon className="h-5 w-5 text-primary-600 dark:text-primary-500" />
                            ) : (
                              <BookmarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          video.level === 'Beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          video.level === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {video.level}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {backendToUICategory[video.category] || video.category}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                          <span>{video.instructor}</span>
                          <div className="flex items-center">
                            <StarSolidIcon className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{video.likes?.length || 0}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                          <span className="whitespace-nowrap">{video.views?.toLocaleString() || 0} views</span>
                          <span className="whitespace-nowrap">{video.uploadDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {videosData?.pagination && videosData.pagination.pages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Page Info */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, videosData.pagination.total)} of {videosData.pagination.total} videos
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {/* First Page */}
                      {currentPage > 3 && (
                        <>
                          <button
                            onClick={() => setCurrentPage(1)}
                            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            1
                          </button>
                          {currentPage > 4 && (
                            <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                          )}
                        </>
                      )}

                      {/* Page Buttons */}
                      {Array.from({ length: videosData.pagination.pages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show current page, 2 before, and 2 after
                          return page >= currentPage - 2 && page <= currentPage + 2;
                        })
                        .map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              page === currentPage
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        ))
                      }

                      {/* Last Page */}
                      {currentPage < videosData.pagination.pages - 2 && (
                        <>
                          {currentPage < videosData.pagination.pages - 3 && (
                            <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(videosData.pagination.pages)}
                            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            {videosData.pagination.pages}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(videosData.pagination.pages, prev + 1))}
                      disabled={currentPage === videosData.pagination.pages}
                      className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!videosLoading && videos.length === 0 && (
            <div className="text-center py-12">
              <VideoCameraIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No videos found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
              {canAddVideo && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-2.5 py-1.5 bg-primary-600 text-sm text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Video
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Modal - Centered Modal */}
      {selectedVideo && createPortal(
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            maxHeight: '100vh',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            zIndex: 9999
          } as React.CSSProperties}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeVideo();
          }}
        >
          <div className="relative w-full max-w-5xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
            {/* Close Button */}
            <button
              onClick={closeVideo}
              className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Video Player - 16:9 aspect ratio */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {selectedVideo.youtubeId ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : selectedVideo.videoUrl ? (
                <video
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                  src={selectedVideo.videoUrl}
                  controls
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <p className="text-white">Video not available</p>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="px-6 py-4">
              <h3 className="text-lg font-bold text-white mb-1">{selectedVideo.title}</h3>
              {selectedVideo.description && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{selectedVideo.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <VideoCameraIcon className="h-4 w-4 mr-1" />
                  {selectedVideo.instructor}
                </span>
                <span className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {selectedVideo.views?.toLocaleString() || 0} views
                </span>
                {selectedVideo.duration && (
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {selectedVideo.duration}
                  </span>
                )}
                <span className="flex items-center">
                  <StarIcon className="h-4 w-4 mr-1" />
                  {selectedVideo.likes?.length || 0} likes
                </span>
                {/* Tags inline */}
                {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedVideo.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            maxHeight: '100vh',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          } as React.CSSProperties}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add New Video</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Upload Type Toggle */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setUploadType('youtube')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    uploadType === 'youtube'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <LinkIcon className="h-5 w-5" />
                  YouTube Link
                </button>
                <button
                  onClick={() => setUploadType('file')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    uploadType === 'file'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <CloudArrowUpIcon className="h-5 w-5" />
                  Upload File
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter video title"
                  required
                />
              </div>

              {/* YouTube URL or File Upload */}
              {uploadType === 'youtube' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    YouTube URL *
                  </label>
                  <input
                    type="url"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Video File *
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
                    >
                      {videoFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <VideoCameraIcon className="h-8 w-8 text-primary-600" />
                          <span className="text-gray-700 dark:text-gray-300">{videoFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 dark:text-gray-400">Click to upload video</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">MP4, WebM, MOV up to 500MB</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Thumbnail (optional)
                    </label>
                    <div
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 transition-colors"
                    >
                      {thumbnailFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-gray-700 dark:text-gray-300">{thumbnailFile.name}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload thumbnail</p>
                      )}
                    </div>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter video description"
                />
              </div>

              {/* Category and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                  >
                    {/* Dynamic categories from database - sorted alphabetically */}
                    {Object.keys(statsData?.data?.categoryCounts || {})
                      .sort((a, b) => {
                        const nameA = a.charAt(0).toUpperCase() + a.slice(1).replace(/-/g, ' ');
                        const nameB = b.charAt(0).toUpperCase() + b.slice(1).replace(/-/g, ' ');
                        return nameA.localeCompare(nameB);
                      })
                      .map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}
                        </option>
                      ))
                    }
                    {/* Always show Other / Custom option */}
                    <option value="other">Other / Custom</option>
                  </select>
                  {formData.category === 'other' && (
                    <input
                      type="text"
                      placeholder="Enter custom category name"
                      value={formData.customCategory || ''}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 12:30"
                  />
                </div>
              </div>

              {/* Presenter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Presenter Name
                </label>
                <input
                  type="text"
                  value={formData.presenter?.name || ''}
                  onChange={(e) => setFormData({ ...formData, presenter: { ...formData.presenter, name: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter presenter name"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., vinyl, installation, tutorial"
                />
              </div>

              {/* Featured */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mark as featured video
                </label>
              </div>

              {/* Upload Progress - Prominent Display */}
              {isUploading && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{uploadProgress}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                          Uploading video...
                        </p>
                        <p className="text-xs text-primary-700 dark:text-primary-300">
                          Please don't close this window
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">{uploadProgress}%</p>
                      <p className="text-xs text-primary-700 dark:text-primary-300">Complete</p>
                    </div>
                  </div>
                  <div className="w-full bg-primary-200 dark:bg-primary-900/40 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300 relative overflow-hidden"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || createVideoMutation.isPending || uploadVideoMutation.isPending}
                  className="px-2.5 py-1.5 bg-primary-600 text-sm text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(isUploading || createVideoMutation.isPending || uploadVideoMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      {isUploading ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      {uploadType === 'youtube' ? <LinkIcon className="h-5 w-5" /> : <CloudArrowUpIcon className="h-5 w-5" />}
                      {uploadType === 'youtube' ? 'Add Video' : 'Upload Video'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditModal && editingVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            maxHeight: '100vh',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          } as React.CSSProperties}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Video</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingVideo(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editVideoMutation.mutate({
                  id: editingVideo._id,
                  data: {
                    title: editFormData.title,
                    description: editFormData.description,
                    category: editFormData.category,
                    duration: editFormData.duration,
                    tags: editFormData.tags,
                    presenter: editFormData.presenter,
                    isFeatured: editFormData.isFeatured,
                  },
                });
              }}
              className="p-6 space-y-5"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Video title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Video description"
                  rows={3}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  {/* Dynamic categories from database - sorted alphabetically */}
                  {Object.keys(statsData?.data?.categoryCounts || {})
                    .sort((a, b) => {
                      const nameA = a.charAt(0).toUpperCase() + a.slice(1).replace(/-/g, ' ');
                      const nameB = b.charAt(0).toUpperCase() + b.slice(1).replace(/-/g, ' ');
                      return nameA.localeCompare(nameB);
                    })
                    .map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}
                      </option>
                    ))
                  }
                  {/* Always show Other option */}
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={editFormData.duration}
                  onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. 15:30"
                />
              </div>

              {/* Presenter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Presenter Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.presenter.name}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      presenter: { ...editFormData.presenter, name: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Presenter Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.presenter.title}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      presenter: { ...editFormData.presenter, title: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Featured */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={editFormData.isFeatured}
                  onChange={(e) => setEditFormData({ ...editFormData, isFeatured: e.target.checked })}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Featured Video
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingVideo(null);
                  }}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editVideoMutation.isPending}
                  className="px-2.5 py-1.5 bg-primary-600 text-sm text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {editVideoMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <PencilIcon className="h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;
