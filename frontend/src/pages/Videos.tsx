import { useState, useEffect } from 'react';
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
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  PlayCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon, PlayIcon as PlaySolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  youtubeId: string;
  youtubeUrl: string;
  duration: string;
  views: number;
  uploadDate: string;
  category: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  isBookmarked: boolean;
  isFeatured: boolean;
  isNew: boolean;
  tags: string[];
}

// Sample YouTube videos for sign industry
const videos: Video[] = [
  {
    id: 1,
    title: "How to Install Vinyl Lettering on Windows - Sign Making Tutorial",
    description: "Learn the professional techniques for applying vinyl lettering to windows and glass surfaces. Perfect for beginners in the sign making industry.",
    thumbnail: "https://img.youtube.com/vi/XLsJvlf_EBM/maxresdefault.jpg",
    youtubeId: "XLsJvlf_EBM",
    youtubeUrl: "https://www.youtube.com/watch?v=XLsJvlf_EBM",
    duration: "12:47",
    views: 45832,
    uploadDate: "2 weeks ago",
    category: "Vehicle Wraps",
    instructor: "Sign Pro Academy",
    level: "Beginner",
    rating: 4.8,
    isBookmarked: false,
    isFeatured: true,
    isNew: true,
    tags: ["vinyl", "installation", "windows"]
  },
  {
    id: 2,
    title: "LED Sign Manufacturing Process - Behind the Scenes",
    description: "Take a detailed look at how LED signs are manufactured from start to finish. Understand the technology behind modern digital signage.",
    thumbnail: "https://img.youtube.com/vi/HRqO-F7x4mM/maxresdefault.jpg",
    youtubeId: "HRqO-F7x4mM",
    youtubeUrl: "https://www.youtube.com/watch?v=HRqO-F7x4mM",
    duration: "8:23",
    views: 28921,
    uploadDate: "1 month ago",
    category: "Technical Training",
    instructor: "LED Sign Tech",
    level: "Intermediate",
    rating: 4.9,
    isBookmarked: true,
    isFeatured: false,
    isNew: false,
    tags: ["LED", "manufacturing", "technology"]
  },
  {
    id: 3,
    title: "Vehicle Wrap Design & Installation - Full Process",
    description: "Watch a complete vehicle wrap project from design concept to final installation. Learn tips and tricks from industry professionals.",
    thumbnail: "https://img.youtube.com/vi/KYl7U9bOv14/maxresdefault.jpg",
    youtubeId: "KYl7U9bOv14",
    youtubeUrl: "https://www.youtube.com/watch?v=KYl7U9bOv14",
    duration: "15:42",
    views: 67234,
    uploadDate: "3 weeks ago",
    category: "Vehicle Wraps",
    instructor: "Wrap Masters",
    level: "Advanced",
    rating: 4.9,
    isBookmarked: false,
    isFeatured: true,
    isNew: false,
    tags: ["vehicle wrap", "design", "installation"]
  },
  {
    id: 4,
    title: "Channel Letter Signs - Complete Installation Guide",
    description: "Step-by-step guide on installing illuminated channel letter signs. Covers electrical connections, mounting, and safety procedures.",
    thumbnail: "https://img.youtube.com/vi/P9cOmvuY8cY/maxresdefault.jpg",
    youtubeId: "P9cOmvuY8cY",
    youtubeUrl: "https://www.youtube.com/watch?v=P9cOmvuY8cY",
    duration: "22:15",
    views: 34521,
    uploadDate: "2 months ago",
    category: "Installation",
    instructor: "Sign Installation Pro",
    level: "Intermediate",
    rating: 4.7,
    isBookmarked: false,
    isFeatured: false,
    isNew: false,
    tags: ["channel letters", "installation", "electrical"]
  },
  {
    id: 5,
    title: "Digital Signage Content Creation Tips",
    description: "Learn how to create engaging content for digital signs. Covers design principles, software tools, and best practices.",
    thumbnail: "https://img.youtube.com/vi/lSSqD-s1hXA/maxresdefault.jpg",
    youtubeId: "lSSqD-s1hXA",
    youtubeUrl: "https://www.youtube.com/watch?v=lSSqD-s1hXA",
    duration: "10:35",
    views: 19876,
    uploadDate: "1 week ago",
    category: "Business Growth",
    instructor: "Digital Sign Expert",
    level: "Beginner",
    rating: 4.6,
    isBookmarked: false,
    isFeatured: false,
    isNew: true,
    tags: ["digital signage", "content", "design"]
  },
  {
    id: 6,
    title: "Sign Business Marketing Strategies That Work",
    description: "Proven marketing strategies specifically for sign companies. Learn how to attract more customers and grow your business.",
    thumbnail: "https://img.youtube.com/vi/rH5L_YaUfqw/maxresdefault.jpg",
    youtubeId: "rH5L_YaUfqw",
    youtubeUrl: "https://www.youtube.com/watch?v=rH5L_YaUfqw",
    duration: "18:20",
    views: 23654,
    uploadDate: "3 weeks ago",
    category: "Business Growth",
    instructor: "Sign Business Coach",
    level: "Intermediate",
    rating: 4.8,
    isBookmarked: false,
    isFeatured: false,
    isNew: false,
    tags: ["marketing", "business", "growth"]
  }
];

const categories = [
  { name: "All Videos", icon: VideoCameraIcon, count: 156 },
  { name: "Vehicle Wraps", icon: ArrowTrendingUpIcon, count: 34 },
  { name: "Technical Training", icon: WrenchScrewdriverIcon, count: 45 },
  { name: "Business Growth", icon: LightBulbIcon, count: 28 },
  { name: "Installation", icon: SparklesIcon, count: 23 },
  { name: "Design Tips", icon: AcademicCapIcon, count: 26 }
];

const playlists = [
  { name: "New Owner Essentials", videos: 12, duration: "4h 30m" },
  { name: "Advanced Techniques", videos: 8, duration: "3h 15m" },
  { name: "Marketing Mastery", videos: 6, duration: "2h 45m" },
  { name: "Equipment Maintenance", videos: 10, duration: "3h 50m" }
];

const Videos = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoList, setVideoList] = useState(videos);
  const [isLoading, setIsLoading] = useState(false);

  const toggleBookmark = (videoId: number) => {
    setVideoList(videoList.map(video =>
      video.id === videoId
        ? { ...video, isBookmarked: !video.isBookmarked }
        : video
    ));
  };

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
    // Track view
    setVideoList(videoList.map(v => 
      v.id === video.id ? { ...v, views: v.views + 1 } : v
    ));
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  const filteredVideos = videoList.filter(video => {
    if (selectedCategory !== 'All Videos' && video.category !== selectedCategory) return false;
    if (searchQuery && !video.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !video.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
                <VideoCameraIcon className="h-8 w-8 mr-3" />
                Video Learning Center
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Expert tutorials and training videos to grow your business
              </p>
            </div>
            <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200">
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
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">156</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Videos</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">48h</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Content</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <EyeIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">234K</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <StarIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">4.8</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Rating</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search videos by title, topic, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
            <FunnelIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
            Filter
          </button>
        </div>
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
                      {category.count}
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
              {playlists.map((playlist) => (
                <button
                  key={playlist.name}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {playlist.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {playlist.videos} videos • {playlist.duration}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="lg:col-span-3">
          {/* Featured Video */}
          {!searchQuery && selectedCategory === 'All Videos' && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Featured Video</h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 relative group cursor-pointer">
                  <img
                    src={videos[0].thumbnail}
                    alt={videos[0].title}
                    className="w-full h-80 object-cover"
                  />
                  <div
                    onClick={() => openVideo(videos[0])}
                    className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <PlaySolidIcon className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                      ⭐ Featured
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-black bg-opacity-75 text-white text-sm">
                      {videos[0].duration}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{videos[0].title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2">{videos[0].description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{videos[0].instructor}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{videos[0].views.toLocaleString()} views</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{videos[0].uploadDate}</span>
                    </div>
                    <button
                      onClick={() => openVideo(videos[0])}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Watch Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div 
                  onClick={() => openVideo(video)}
                  className="aspect-w-16 aspect-h-9 relative group">
                  <img
                    src={video.thumbnail}
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
                  <div className="absolute bottom-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-black bg-opacity-75 text-white text-xs">
                      {video.duration}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                      {video.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(video.id);
                      }}
                      className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {video.isBookmarked ? (
                        <BookmarkSolidIcon className="h-5 w-5 text-primary-600 dark:text-primary-500" />
                      ) : (
                        <BookmarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      video.level === 'Beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      video.level === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {video.level}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{video.category}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                      <span>{video.instructor}</span>
                      <div className="flex items-center">
                        <StarSolidIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span>{video.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                      <span className="whitespace-nowrap">{video.views.toLocaleString()} views</span>
                      <span className="whitespace-nowrap">{video.uploadDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <VideoCameraIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No videos found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}

          {/* Load More */}
          <div className="text-center mt-8">
            <button className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200">
              Load More Videos
            </button>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl mx-auto">
            {/* Close Button */}
            <button
              onClick={closeVideo}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            
            {/* Video Player Container */}
            <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
              {/* YouTube Iframe */}
              <div className="relative pb-[56.25%]">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              {/* Video Info */}
              <div className="bg-gray-900 p-6">
                <h3 className="text-xl font-bold text-white mb-2">{selectedVideo.title}</h3>
                <p className="text-gray-300 mb-4">{selectedVideo.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center">
                    <VideoCameraIcon className="h-4 w-4 mr-1" />
                    {selectedVideo.instructor}
                  </span>
                  <span className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {selectedVideo.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {selectedVideo.duration}
                  </span>
                  <span className="flex items-center">
                    <StarIcon className="h-4 w-4 mr-1" />
                    {selectedVideo.rating} rating
                  </span>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedVideo.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;