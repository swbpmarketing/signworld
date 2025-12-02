import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  StarIcon,
  ArrowTrendingUpIcon,
  PlayCircleIcon,
  XMarkIcon,
  PlusIcon,
  CloudArrowUpIcon,
  LinkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon, PlayIcon as PlaySolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import CustomSelect from '../components/CustomSelect';
import { useAuth } from '../context/AuthContext';
import usePermissions from '../hooks/usePermissions';
import { getVideos, getVideoStats, createVideo, uploadVideo, deleteVideo, incrementVideoView } from '../services/videoService';
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

const categories = [
  { name: "All Videos", icon: VideoCameraIcon, count: 0 },
  { name: "Vehicle Wraps", icon: ArrowTrendingUpIcon, count: 0 },
  { name: "Technical Training", icon: WrenchScrewdriverIcon, count: 0 },
  { name: "Business Growth", icon: LightBulbIcon, count: 0 },
  { name: "Installation", icon: SparklesIcon, count: 0 },
  { name: "Design Tips", icon: AcademicCapIcon, count: 0 }
];


const Videos = () => {
  const { user } = useAuth();
  const { canCreate, canDelete } = usePermissions();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] = useState('All Videos');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoUI | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'youtube' | 'file'>('youtube');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CreateVideoData>({
    title: '',
    description: '',
    youtubeUrl: '',
    category: 'other',
    duration: '',
    tags: [],
    presenter: { name: '', title: '', company: '' },
    isFeatured: false,
  });
  const [tagsInput, setTagsInput] = useState('');

  // Fetch videos
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ['videos', selectedCategory, searchQuery, sortBy],
    queryFn: () => getVideos({
      category: categoryMapping[selectedCategory] || 'all',
      search: searchQuery,
      sort: sortBy,
      limit: 50,
    }),
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['videoStats'],
    queryFn: getVideoStats,
  });

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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtubeUrl: '',
      category: 'other',
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
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

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

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

    if (uploadType === 'youtube') {
      if (!formData.youtubeUrl) {
        toast.error('Please enter a YouTube URL');
        return;
      }
      createVideoMutation.mutate({
        ...formData,
        tags,
      });
    } else {
      if (!videoFile) {
        toast.error('Please select a video file');
        return;
      }
      uploadVideoMutation.mutate({
        file: videoFile,
        metadata: {
          ...formData,
          tags,
        },
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
  const videos: VideoUI[] = (videosData?.data || []).map((video: VideoType) => ({
    ...video,
    isBookmarked: bookmarkedVideos.has(video._id),
    isNew: new Date(video.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    level: 'Intermediate' as const,
    instructor: video.presenter?.name || 'Sign Pro Academy',
    uploadDate: new Date(video.publishedAt || video.createdAt).toLocaleDateString(),
  }));

  const featuredVideo = videos.find(v => v.isFeatured) || videos[0];
  const stats = statsData?.data;

  // Use permissions hook for role-based access
  const canAddVideo = canCreate('videos');
  const canRemoveVideo = canDelete('videos');

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <VideoCameraIcon className="h-8 w-8 mr-3" />
                Video Learning Center
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Expert tutorials and training videos to grow your business
              </p>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              {canAddVideo && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Video
                </button>
              )}
              <button className="inline-flex items-center px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors duration-200">
                <PlayCircleIcon className="h-5 w-5 mr-2" />
                Watch Intro
              </button>
            </div>
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
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search videos by title, topic, or instructor..."
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
          <div className="w-40">
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
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200 ${
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
                      {stats?.categoryCounts?.[categoryMapping[category.name]] || 0}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Playlists */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Popular Playlists</h3>
            <div className="space-y-3">
              {playlistsData?.data && playlistsData.data.length > 0 ? (
                playlistsData.data.map((playlist: Playlist) => (
                  <button
                    key={playlist._id}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                          {playlist.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {playlist.videoCount} videos • {playlist.duration}
                        </p>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))
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
          {/* Featured Video */}
          {!searchQuery && selectedCategory === 'All Videos' && featuredVideo && (
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
                    {canRemoveVideo && (
                      <button
                        onClick={() => deleteVideoMutation.mutate(featuredVideo._id)}
                        className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
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
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Video Grid */}
          {!videosLoading && videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
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
                      {canRemoveVideo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVideoMutation.mutate(video._id);
                          }}
                          className="ml-1 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
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
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
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
          style={{ zIndex: 9999 }}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
                    <option value="training">Installation</option>
                    <option value="marketing">Vehicle Wraps</option>
                    <option value="technical">Technical Training</option>
                    <option value="business">Business Growth</option>
                    <option value="product-demo">Product Demo</option>
                    <option value="webinar">Webinar</option>
                    <option value="other">Other</option>
                  </select>
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

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
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
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || createVideoMutation.isPending || uploadVideoMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </div>
  );
};

export default Videos;
