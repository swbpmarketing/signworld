// FAQ Service for API calls
import api from '../config/axios';

export type FAQ = {
  _id: string;
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  userVote?: 'helpful' | 'not-helpful' | null;
  order?: number;
  createdAt: string;
  updatedAt: string;
};

export type FAQStats = {
  totalFAQs: number;
  categoryCounts: { [key: string]: number };
  popularSearches: string[];
};

export type GetFAQsParams = {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'order' | 'views' | 'helpful' | 'newest';
};

export type GetFAQsResponse = {
  success: boolean;
  data: FAQ[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
};

export type CreateFAQData = {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  order?: number;
};

export type HelpfulVoteResponse = {
  success: boolean;
  data: {
    helpful: number;
    notHelpful: number;
  };
};

// Helper function to get or create a visitor ID for anonymous voting
export const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('faq-visitor-id');
  if (!visitorId) {
    visitorId = 'visitor_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('faq-visitor-id', visitorId);
  }
  return visitorId;
};

// Get all FAQs with filters
export const getFAQs = async (params: GetFAQsParams = {}): Promise<GetFAQsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.category && params.category !== 'All Topics') queryParams.append('category', params.category);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sort) queryParams.append('sort', params.sort);
  // Include visitorId to get user's vote status
  queryParams.append('visitorId', getVisitorId());
  const response = await api.get(`/faqs?${queryParams.toString()}`);
  return response.data;
};

// Get FAQ statistics
export const getFAQStats = async (): Promise<{ success: boolean; data: FAQStats }> => {
  const response = await api.get('/faqs/stats');
  return response.data;
};

// Get single FAQ by ID
export const getFAQById = async (id: string): Promise<{ success: boolean; data: FAQ }> => {
  const response = await api.get(`/faqs/${id}`);
  return response.data;
};

// Increment FAQ view count
export const incrementFAQView = async (id: string): Promise<{ success: boolean; data: { views: number } }> => {
  const response = await api.post(`/faqs/${id}/view`);
  return response.data;
};

// Vote on FAQ helpfulness
export const voteFAQHelpful = async (
  id: string,
  isHelpful: boolean,
  visitorId?: string
): Promise<HelpfulVoteResponse> => {
  const response = await api.post(`/faqs/${id}/helpful`, {
    isHelpful,
    visitorId: visitorId || getVisitorId()
  });
  return response.data;
};

// Create new FAQ (Admin only)
export const createFAQ = async (faqData: CreateFAQData): Promise<{ success: boolean; data: FAQ }> => {
  const response = await api.post('/faqs', faqData);
  return response.data;
};

// Update FAQ (Admin only)
export const updateFAQ = async (id: string, faqData: Partial<CreateFAQData>): Promise<{ success: boolean; data: FAQ }> => {
  const response = await api.put(`/faqs/${id}`, faqData);
  return response.data;
};

// Delete FAQ (Admin only)
export const deleteFAQ = async (id: string): Promise<{ success: boolean; data: object }> => {
  const response = await api.delete(`/faqs/${id}`);
  return response.data;
};

export default {
  getFAQs,
  getFAQStats,
  getFAQById,
  incrementFAQView,
  voteFAQHelpful,
  createFAQ,
  updateFAQ,
  deleteFAQ,
};
