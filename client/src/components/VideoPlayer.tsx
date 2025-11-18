import { useEffect, useRef } from 'react';
import {
  XMarkIcon,
  VideoCameraIcon,
  EyeIcon,
  ClockIcon,
  StarIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface VideoPlayerVideo {
  id: number;
  title: string;
  description: string;
  youtubeId: string;
  duration: string;
  views: number;
  instructor: string;
  rating: number;
  tags: string[];
  isBookmarked?: boolean;
  isLiked?: boolean;
}

interface VideoPlayerProps {
  video: VideoPlayerVideo;
  onClose: () => void;
  onBookmark?: (videoId: number) => void;
  onLike?: (videoId: number) => void;
  onShare?: (video: VideoPlayerVideo) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  video, 
  onClose, 
  onBookmark,
  onLike,
  onShare 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle ESC key press
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(video);
    } else {
      // Default share behavior
      const shareUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
      if (navigator.share) {
        navigator.share({
          title: video.title,
          text: video.description,
          url: shareUrl
        }).catch(console.error);
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl);
        alert('Video link copied to clipboard!');
      }
    }
  };

  return (
    <div 
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-6xl mx-auto animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors group"
          aria-label="Close video"
        >
          <XMarkIcon className="h-8 w-8 group-hover:rotate-90 transition-transform duration-200" />
        </button>
        
        {/* Video Player Container */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
          {/* YouTube Iframe */}
          <div className="relative pb-[56.25%] bg-black">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          
          {/* Video Info */}
          <div className="bg-gray-900 p-6">
            {/* Title and Actions */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-xl font-bold text-white flex-1">{video.title}</h3>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {onLike && (
                  <button
                    onClick={() => onLike(video.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Like video"
                  >
                    {video.isLiked ? (
                      <HeartSolidIcon className="h-6 w-6 text-red-500" />
                    ) : (
                      <HeartIcon className="h-6 w-6" />
                    )}
                  </button>
                )}
                
                {onBookmark && (
                  <button
                    onClick={() => onBookmark(video.id)}
                    className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                    aria-label="Bookmark video"
                  >
                    {video.isBookmarked ? (
                      <BookmarkSolidIcon className="h-6 w-6 text-primary-500" />
                    ) : (
                      <BookmarkIcon className="h-6 w-6" />
                    )}
                  </button>
                )}
                
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Share video"
                >
                  <ShareIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-gray-300 mb-4 line-clamp-3">{video.description}</p>
            
            {/* Video Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
              <span className="flex items-center">
                <VideoCameraIcon className="h-4 w-4 mr-1.5" />
                {video.instructor}
              </span>
              <span className="flex items-center">
                <EyeIcon className="h-4 w-4 mr-1.5" />
                {video.views.toLocaleString()} views
              </span>
              <span className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1.5" />
                {video.duration}
              </span>
              <span className="flex items-center">
                <StarIcon className="h-4 w-4 mr-1.5 text-yellow-400" />
                {video.rating.toFixed(1)} rating
              </span>
            </div>
            
            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;