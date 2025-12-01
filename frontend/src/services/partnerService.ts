// Partner Service for API calls
import api from '../config/axios';

export type PartnerContact = {
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

export type SpecialOffer = {
  title: string;
  description: string;
  validUntil?: string;
  code?: string;
  discountPercent?: number;
}

export type PartnerReview = {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  rating: number;
  comment?: string;
  createdAt: string;
}

export type Partner = {
  _id: string;
  vendorId?: string;
  name: string;
  description: string;
  logo: string;
  logoUrl?: string;
  category: string;
  country: string;
  contact: PartnerContact;
  specialties: string[];
  benefits: string[];
  discount: string;
  yearEstablished?: number;
  locations: number;
  specialOffers: SpecialOffer[];
  documents: { title: string; fileUrl: string; fileType: string }[];
  reviews: PartnerReview[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type PartnerStats = {
  totalPartners: number;
  featuredPartners: number;
  verifiedPartners: number;
  avgRating: number;
  annualSavings: number;
  verifiedPercent: number;
}

export type PartnerCategory = {
  name: string;
  count: number;
}

export type GetPartnersParams = {
  category?: string;
  country?: string;
  featured?: boolean;
  search?: string;
  sort?: 'rating' | 'name' | 'name-desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export type GetPartnersResponse = {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: Partner[];
}

// Get all partners with filters
export const getPartners = async (params: GetPartnersParams = {}): Promise<GetPartnersResponse> => {
  const queryParams = new URLSearchParams();
  if (params.category && params.category !== 'All Partners') queryParams.append('category', params.category);
  if (params.country) queryParams.append('country', params.country);
  if (params.featured) queryParams.append('featured', 'true');
  if (params.search) queryParams.append('search', params.search);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  const response = await api.get(`/partners?${queryParams.toString()}`);
  return response.data;
};

// Get partner statistics
export const getPartnerStats = async (): Promise<{ success: boolean; data: PartnerStats }> => {
  const response = await api.get('/partners/stats');
  return response.data;
};

// Get partner categories with counts
export const getPartnerCategories = async (): Promise<{ success: boolean; data: PartnerCategory[] }> => {
  const response = await api.get('/partners/categories');
  return response.data;
};

// Get single partner by ID
export const getPartner = async (id: string): Promise<{ success: boolean; data: Partner }> => {
  const response = await api.get(`/partners/${id}`);
  return response.data;
};

// Get vendor's own partner profile
export const getMyProfile = async (): Promise<{ success: boolean; data: Partner }> => {
  const response = await api.get('/partners/my-profile');
  return response.data;
};

// Create new partner (Admin/Vendor)
export const createPartner = async (partnerData: Partial<Partner>): Promise<{ success: boolean; data: Partner }> => {
  const response = await api.post('/partners', partnerData);
  return response.data;
};

// Update partner
export const updatePartner = async (id: string, partnerData: Partial<Partner>): Promise<{ success: boolean; data: Partner }> => {
  const response = await api.put(`/partners/${id}`, partnerData);
  return response.data;
};

// Delete partner (Admin only)
export const deletePartner = async (id: string): Promise<{ success: boolean; data: object }> => {
  const response = await api.delete(`/partners/${id}`);
  return response.data;
};

// Add review to partner
export const addPartnerReview = async (id: string, rating: number, comment?: string): Promise<{ success: boolean; data: Partner }> => {
  const response = await api.post(`/partners/${id}/reviews`, { rating, comment });
  return response.data;
};

export default { getPartners, getPartnerStats, getPartnerCategories, getPartner, getMyProfile, createPartner, updatePartner, deletePartner, addPartnerReview };
