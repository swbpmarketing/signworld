import {
  BookmarkIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolidIcon, 
  PlayIcon as PlaySolidIcon,
  StarIcon as StarSolidIcon 
} from '@heroicons/react/24/solid';

interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  youtubeId: string;
  duration: string;
  views: number;
  uploadDate: string;
  category: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  isBookmarked: boolean;
  isNew: boolean;
  tags: string[];
}

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  onBookmark?: (videoId: number) => void;
  layout?: 'grid' | 'list';
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  onPlay, 
  onBookmark,
  layout = 'grid' 
}) => {
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark) {
      onBookmark(video.id);
    }
  };

  if (layout === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
        <div className="flex">
          {/* Thumbnail */}
          <div className="relative w-64 h-36 flex-shrink-0">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div 
              onClick={() => onPlay(video)}
              className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
            >
              <PlaySolidIcon className="h-12 w-12 text-white" />
            </div>
            <div className="absolute bottom-2 right-2">
              <span className="inline-flex items-center px-2 py-1 rounded bg-black bg-opacity-75 text-white text-xs">
                {video.duration}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 flex-1">
                {video.title}
              </h3>
              {onBookmark && (
                <button
                  onClick={handleBookmarkClick}
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {video.isBookmarked ? (
                    <BookmarkSolidIcon className="h-5 w-5 text-primary-600" />
                  ) : (
                    <BookmarkIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              )}
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {video.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{video.instructor}</span>
                <div className="flex items-center">
                  <StarSolidIcon className="h-4 w-4 text-yellow-400 mr-1" />
                  <span>{video.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {video.views.toLocaleString()}
                </span>
                <span>{video.uploadDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
      {/* Thumbnail */}
      <div 
        onClick={() => onPlay(video)}
        className="aspect-w-16 aspect-h-9 relative"
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <PlaySolidIcon className="h-12 w-12 text-white transform group-hover:scale-110 transition-transform duration-200" />
        </div>
        
        {/* Badges */}
        {video.isNew && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
              New
            </span>
          </div>
        )}
        
        {/* Duration */}
        <div className="absolute bottom-2 right-2">
          <span className="inline-flex items-center px-2 py-1 rounded bg-black bg-opacity-75 text-white text-xs">
            <ClockIcon className="h-3 w-3 mr-1" />
            {video.duration}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 flex-1">
            {video.title}
          </h4>
          {onBookmark && (
            <button
              onClick={handleBookmarkClick}
              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Bookmark video"
            >
              {video.isBookmarked ? (
                <BookmarkSolidIcon className="h-5 w-5 text-primary-600" />
              ) : (
                <BookmarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          )}
        </div>
        
        {/* Level & Category */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            video.level === 'Beginner' ? 'bg-green-100 text-green-700' :
            video.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {video.level}
          </span>
          <span className="text-xs text-gray-500">{video.category}</span>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500 text-xs sm:text-sm">
            <span className="font-medium">{video.instructor}</span>
            <div className="flex items-center">
              <StarSolidIcon className="h-4 w-4 text-yellow-400 mr-1" />
              <span>{video.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500 text-xs sm:text-sm">
            <span className="flex items-center whitespace-nowrap">
              <EyeIcon className="h-3.5 w-3.5 mr-1" />
              {video.views.toLocaleString()}
            </span>
            <span className="whitespace-nowrap">{video.uploadDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;