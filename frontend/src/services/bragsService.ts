import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://sign-company.onrender.com/api');

// Create axios instance with base configuration
const bragsAPI = axios.create({
  baseURL: `${API_URL}/brags`,
  timeout: 30000, // 30 seconds for file uploads
});

// Add auth token to requests
bragsAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface BragAuthor {
  _id: string;
  name: string;
  email: string;
  role?: string;
  location?: string;
  company?: string;
}

export interface BragComment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  text: string;
  createdAt: string;
}

export interface BragImage {
  url: string;
  caption?: string;
}

export interface Brag {
  _id: string;
  title: string;
  content: string;
  author: BragAuthor;
  tags: string[];
  featuredImage?: string;
  images?: BragImage[];
  status: 'pending' | 'approved' | 'rejected';
  moderatorNotes?: string;
  moderatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  moderatedAt?: string;
  likes: string[];
  likesCount: number;
  comments: BragComment[];
  commentsCount: number;
  views: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
}

export interface BragsPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BragsResponse {
  success: boolean;
  data: Brag[];
  pagination: BragsPagination;
}

export interface SingleBragResponse {
  success: boolean;
  data: Brag;
}

export interface BragsStats {
  totalStories: number;
  publishedStories: number;
  pendingStories: number;
  rejectedStories: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  topContributors: Array<{
    _id: string;
    name: string;
    email: string;
    count: number;
  }>;
}

export interface GetBragsParams {
  page?: number;
  limit?: number;
  sort?: 'popular' | 'likes' | 'views' | 'oldest' | '-createdAt';
  search?: string;
  tag?: string;
  author?: string;
  status?: 'published' | 'pending' | 'approved' | 'rejected' | 'all';
}

export interface CreateBragData {
  title: string;
  content: string;
  tags?: string[];
  featuredImage?: File;
  images?: File[];
}

export interface UpdateBragData {
  title?: string;
  content?: string;
  tags?: string[];
  featuredImage?: File;
  images?: File[];
}

export interface ModerateBragData {
  status: 'approved' | 'rejected';
  moderatorNotes?: string;
}

// API Functions

/**
 * Get all success stories with pagination and filters
 */
export const getBrags = async (params: GetBragsParams = {}): Promise<BragsResponse> => {
  const response = await bragsAPI.get('/', { params });
  return response.data;
};

/**
 * Get single success story by ID
 */
export const getBragById = async (id: string): Promise<SingleBragResponse> => {
  const response = await bragsAPI.get(`/${id}`);
  return response.data;
};

/**
 * Create new success story
 */
export const createBrag = async (data: CreateBragData): Promise<SingleBragResponse> => {
  const formData = new FormData();

  formData.append('title', data.title);
  formData.append('content', data.content);

  if (data.tags && data.tags.length > 0) {
    data.tags.forEach(tag => formData.append('tags', tag));
  }

  if (data.featuredImage) {
    formData.append('featuredImage', data.featuredImage);
  }

  if (data.images && data.images.length > 0) {
    data.images.forEach(image => formData.append('images', image));
  }

  const response = await bragsAPI.post('/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Update success story
 */
export const updateBrag = async (
  id: string,
  data: UpdateBragData
): Promise<SingleBragResponse> => {
  const formData = new FormData();

  if (data.title) formData.append('title', data.title);
  if (data.content) formData.append('content', data.content);

  if (data.tags && data.tags.length > 0) {
    data.tags.forEach(tag => formData.append('tags', tag));
  }

  if (data.featuredImage) {
    formData.append('featuredImage', data.featuredImage);
  }

  if (data.images && data.images.length > 0) {
    data.images.forEach(image => formData.append('images', image));
  }

  const response = await bragsAPI.put(`/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Delete success story
 */
export const deleteBrag = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await bragsAPI.delete(`/${id}`);
  return response.data;
};

/**
 * Like/Unlike success story
 */
export const toggleLike = async (
  id: string
): Promise<{ success: boolean; data: { likes: number; isLiked: boolean }; message: string }> => {
  const response = await bragsAPI.post(`/${id}/like`);
  return response.data;
};

/**
 * Add comment to success story
 */
export const addComment = async (
  id: string,
  text: string
): Promise<{ success: boolean; data: BragComment; message: string }> => {
  const response = await bragsAPI.post(`/${id}/comment`, { text });
  return response.data;
};

/**
 * Delete comment from success story
 */
export const deleteComment = async (
  bragId: string,
  commentId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await bragsAPI.delete(`/${bragId}/comment/${commentId}`);
  return response.data;
};

/**
 * Moderate success story (Admin only)
 */
export const moderateBrag = async (
  id: string,
  data: ModerateBragData
): Promise<SingleBragResponse> => {
  const response = await bragsAPI.put(`/${id}/moderate`, data);
  return response.data;
};

/**
 * Get public success stories statistics
 */
export const getPublicStats = async (): Promise<{ success: boolean; data: {
  publishedStories: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
} }> => {
  const response = await bragsAPI.get('/stats');
  return response.data;
};

/**
 * Get success stories statistics (Admin only)
 */
export const getBragsStats = async (): Promise<{ success: boolean; data: BragsStats }> => {
  const response = await bragsAPI.get('/admin/stats');
  return response.data;
};

/**
 * Get user's own success stories
 */
export const getMyBrags = async (): Promise<{ success: boolean; data: Brag[] }> => {
  const response = await bragsAPI.get('/user/my-stories');
  return response.data;
};

/**
 * Get user's own success stories statistics
 */
export const getMyStats = async (): Promise<{ success: boolean; data: {
  publishedStories: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
} }> => {
  const response = await bragsAPI.get('/user/my-stats');
  return response.data;
};

// Export the axios instance for custom requests if needed
export default bragsAPI;
