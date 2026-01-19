// Video Service for API calls
import api from '../config/axios';

export type VideoPresenter = {
  name?: string;
  title?: string;
  company?: string;
};

export type Video = {
  _id: string;
  title: string;
  description?: string;
  youtubeId?: string;
  youtubeUrl?: string;
  videoUrl?: string;
  thumbnail?: string;
  duration?: string;
  presenter?: VideoPresenter;
  category: 'training' | 'marketing' | 'technical' | 'business' | 'product-demo' | 'webinar' | 'other';
  tags: string[];
  topic?: string;
  views: number;
  likes: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  publishedAt: string;
  createdAt: string;
  uploadedBy?: {
    _id: string;
    name: string;
    role: 'admin' | 'owner' | 'vendor';
  };
};

export type VideoStats = {
  totalVideos: number;
  totalViews: number;
  totalDuration: string;
  avgRating: number;
  categoryCounts: { [key: string]: number };
};

export type GetVideosParams = {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
};

export type GetVideosResponse = {
  success: boolean;
  data: Video[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
};

export type CreateVideoData = {
  title: string;
  description?: string;
  youtubeUrl?: string;
  duration?: string;
  presenter?: VideoPresenter;
  category: string;
  tags?: string[];
  topic?: string;
  isFeatured?: boolean;
};

// Get all videos with filters
export const getVideos = async (params: GetVideosParams = {}): Promise<GetVideosResponse> => {
  const queryParams = new URLSearchParams();
  if (params.category && params.category !== 'all') queryParams.append('category', params.category);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sort) queryParams.append('sort', params.sort);
  const response = await api.get(`/videos?${queryParams.toString()}`);
  return response.data;
};

// Get video statistics
export const getVideoStats = async (): Promise<{ success: boolean; data: VideoStats }> => {
  const response = await api.get('/videos/stats');
  return response.data;
};

// Get single video by ID
export const getVideo = async (id: string): Promise<{ success: boolean; data: Video }> => {
  const response = await api.get(`/videos/${id}`);
  return response.data;
};

// Create new video (YouTube link)
export const createVideo = async (videoData: CreateVideoData): Promise<{ success: boolean; data: Video }> => {
  const response = await api.post('/videos', videoData);
  return response.data;
};

// Upload video file with metadata
export const uploadVideo = async (
  file: File,
  metadata: CreateVideoData,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; data: Video }> => {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', metadata.title);
  if (metadata.description) formData.append('description', metadata.description);
  if (metadata.category) formData.append('category', metadata.category);
  if (metadata.duration) formData.append('duration', metadata.duration);
  if (metadata.topic) formData.append('topic', metadata.topic);
  if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
  if (metadata.presenter) formData.append('presenter', JSON.stringify(metadata.presenter));
  if (metadata.isFeatured !== undefined) formData.append('isFeatured', String(metadata.isFeatured));

  const response = await api.post('/videos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
  return response.data;
};

// Update video
export const updateVideo = async (id: string, videoData: Partial<CreateVideoData>): Promise<{ success: boolean; data: Video }> => {
  const response = await api.put(`/videos/${id}`, videoData);
  return response.data;
};

// Delete video
export const deleteVideo = async (id: string): Promise<{ success: boolean; data: object }> => {
  const response = await api.delete(`/videos/${id}`);
  return response.data;
};

// Toggle video like
export const toggleVideoLike = async (id: string): Promise<{ success: boolean; data: { likes: number; isLiked: boolean } }> => {
  const response = await api.post(`/videos/${id}/like`);
  return response.data;
};

// Increment view count
export const incrementVideoView = async (id: string): Promise<{ success: boolean; data: Video }> => {
  const response = await api.post(`/videos/${id}/view`);
  return response.data;
};

export default {
  getVideos,
  getVideoStats,
  getVideo,
  createVideo,
  uploadVideo,
  updateVideo,
  deleteVideo,
  toggleVideoLike,
  incrementVideoView,
};
