// Equipment Service for API calls
import api from '../config/axios';

export type EquipmentSpecifications = {
  [key: string]: string;
};

export type Equipment = {
  _id: string;
  name: string;
  description: string;
  brand: string;
  model?: string;
  category: string;
  specifications?: EquipmentSpecifications;
  image?: string;
  images?: Array<{
    url: string;
    caption?: string;
    isPrimary?: boolean;
  }>;
  documents?: Array<{
    title: string;
    fileUrl: string;
    fileType: string;
  }>;
  price: string;
  priceNote?: string;
  availability: 'in-stock' | 'out-of-stock' | 'pre-order' | 'discontinued';
  rating: number;
  reviews: number;
  warranty: string;
  leadTime: string;
  features: string[];
  relatedProducts?: Equipment[];
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentStats = {
  totalEquipment: number;
  categoryCounts: { [key: string]: number };
  brandCounts: { [key: string]: number };
  brands: string[];
};

export type GetEquipmentParams = {
  category?: string;
  brand?: string;
  search?: string;
  featured?: boolean;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sort?: 'featured' | 'price-low' | 'price-high' | 'rating' | 'name' | 'newest';
};

export type GetEquipmentResponse = {
  success: boolean;
  data: Equipment[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
};

export type CreateEquipmentData = {
  name: string;
  description: string;
  brand: string;
  model?: string;
  category: string;
  specifications?: EquipmentSpecifications;
  image?: string;
  price: string;
  priceNote?: string;
  availability?: string;
  rating?: number;
  reviews?: number;
  warranty?: string;
  leadTime?: string;
  features?: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
};

export type InquiryData = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
};

// Get all equipment with filters
export const getEquipment = async (params: GetEquipmentParams = {}): Promise<GetEquipmentResponse> => {
  const queryParams = new URLSearchParams();
  if (params.category && params.category !== 'all') queryParams.append('category', params.category);
  if (params.brand) queryParams.append('brand', params.brand);
  if (params.search) queryParams.append('search', params.search);
  if (params.featured) queryParams.append('featured', 'true');
  if (params.inStock) queryParams.append('inStock', 'true');
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sort) queryParams.append('sort', params.sort);
  const response = await api.get(`/equipment?${queryParams.toString()}`);
  return response.data;
};

// Get equipment statistics
export const getEquipmentStats = async (): Promise<{ success: boolean; data: EquipmentStats }> => {
  const response = await api.get('/equipment/stats');
  return response.data;
};

// Get single equipment by ID
export const getEquipmentById = async (id: string): Promise<{ success: boolean; data: Equipment }> => {
  const response = await api.get(`/equipment/${id}`);
  return response.data;
};

// Create new equipment (Admin only)
export const createEquipment = async (equipmentData: CreateEquipmentData): Promise<{ success: boolean; data: Equipment }> => {
  const response = await api.post('/equipment', equipmentData);
  return response.data;
};

// Update equipment (Admin only)
export const updateEquipment = async (id: string, equipmentData: Partial<CreateEquipmentData>): Promise<{ success: boolean; data: Equipment }> => {
  const response = await api.put(`/equipment/${id}`, equipmentData);
  return response.data;
};

// Delete equipment (Admin only)
export const deleteEquipment = async (id: string): Promise<{ success: boolean; data: object }> => {
  const response = await api.delete(`/equipment/${id}`);
  return response.data;
};

// Submit inquiry for equipment
export const submitEquipmentInquiry = async (id: string, inquiryData: InquiryData): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/equipment/${id}/inquiry`, inquiryData);
  return response.data;
};

export default {
  getEquipment,
  getEquipmentStats,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  submitEquipmentInquiry,
};
