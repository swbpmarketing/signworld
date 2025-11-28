// Owner Service for API calls
import api from '../config/axios';

export interface BusinessHours {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
}

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Owner {
  _id: string;
  id: string; // We'll map _id to id in the component
  name: string;
  email: string;
  phone: string;
  company: string;
  profileImage: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  location?: GeoLocation;
  businessHours?: BusinessHours;
  openDate: string;
  yearsInBusiness: number;
  specialties: string[];
  equipment: string[];
  mentoring: {
    available: boolean;
    areas: string[];
  };
  socialLinks: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    website?: string;
  };
  stats?: {
    averageRating: number;
    totalRatings: number;
    projectsCompleted: number;
    yearsWithSignWorld: number;
  };
  rating?: {
    averageRating: number;
    totalRatings: number;
  };
}

export interface MapOwner extends Owner {
  distance?: number; // Distance in miles from search center
}

export interface Review {
  id: string;
  reviewer: {
    id: string;
    name: string;
    company: string;
    profileImage: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Get all owners
export const getOwners = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  specialty?: string;
  city?: string;
  state?: string;
}): Promise<{
  data: Owner[];
  count: number;
  total: number;
  pagination: {
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  try {
    const response = await api.get('/owners', { params });
    // Map _id to id for each owner
    if (response.data.data && Array.isArray(response.data.data)) {
      response.data.data = response.data.data.map((owner: any) => ({
        ...owner,
        id: owner._id || owner.id
      }));
    }
    return response.data;
  } catch (error: any) {
    // Enhanced error logging for debugging
    console.error('Error fetching owners:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    
    // Provide a more descriptive error message
    if (error.response?.status === 404) {
      throw new Error('Owners endpoint not found. Please check the server configuration.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error while fetching owners. Please try again later.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication error. Please login and try again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You do not have permission to view this resource.');
    } else {
      // Include more error details for debugging
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Failed to fetch owners. Please try again.';
      throw new Error(errorMessage);
    }
  }
};

// Get owner profile by ID
export const getOwnerProfile = async (ownerId: string): Promise<Owner> => {
  try {
    const response = await api.get(`/owners/${ownerId}`);
    const owner = response.data.data || response.data;
    // Ensure id field exists
    if (owner && owner._id && !owner.id) {
      owner.id = owner._id;
    }
    return owner;
  } catch (error) {
    console.error('Error fetching owner profile:', error);
    console.error('Owner ID:', ownerId);
    console.error('Error details:', error.response?.data);
    throw error;
  }
};

// Get owner reviews
export const getOwnerReviews = async (ownerId: string): Promise<Review[]> => {
  try {
    const response = await api.get(`/owners/${ownerId}/reviews`);
    return response.data.data || response.data || [];
  } catch (error) {
    console.error('Error fetching owner reviews:', error);
    // Return empty array on error to prevent crashes
    return [];
  }
};

// Submit a review for an owner
export const submitOwnerReview = async (
  ownerId: string,
  rating: number,
  comment: string
): Promise<Review> => {
  try {
    const response = await api.post(`/owners/${ownerId}/reviews`, {
      rating,
      comment,
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

// Update owner profile (for owner's own profile)
export const updateOwnerProfile = async (
  ownerId: string,
  updates: Partial<Owner>
): Promise<Owner> => {
  try {
    const response = await api.put(`/owners/${ownerId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating owner profile:', error);
    throw error;
  }
};

// Search owners by location, specialty, or equipment
export const searchOwners = async (params: {
  query?: string;
  location?: string;
  specialty?: string;
  equipment?: string;
  page?: number;
  limit?: number;
}): Promise<{ owners: Owner[]; total: number }> => {
  try {
    const response = await api.get('/owners/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching owners:', error);
    throw error;
  }
};

// Get recommended owners based on user's profile
export const getRecommendedOwners = async (
  userId: string,
  limit: number = 5
): Promise<Owner[]> => {
  try {
    const response = await api.get(`/owners/recommended/${userId}`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recommended owners:', error);
    throw error;
  }
};

// Create new owner (admin only)
export const createOwner = async (ownerData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  specialties?: string[];
  equipment?: string[];
  yearsInBusiness?: number;
  sendWelcomeEmail?: boolean;
}): Promise<Owner> => {
  try {
    const response = await api.post('/owners', ownerData);
    return response.data.data || response.data;
  } catch (error: any) {
    console.error('Error creating owner:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to create owner';
    throw new Error(errorMessage);
  }
};

// Delete owner (admin only)
export const deleteOwner = async (ownerId: string): Promise<void> => {
  try {
    await api.delete(`/owners/${ownerId}`);
  } catch (error: any) {
    console.error('Error deleting owner:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to delete owner';
    throw new Error(errorMessage);
  }
};

// Get all owners with map coordinates
export const getMapOwners = async (): Promise<{
  data: MapOwner[];
  count: number;
}> => {
  try {
    const response = await api.get('/owners/map');
    // Map _id to id for each owner
    if (response.data.data && Array.isArray(response.data.data)) {
      response.data.data = response.data.data.map((owner: any) => ({
        ...owner,
        id: owner._id || owner.id
      }));
    }
    return response.data;
  } catch (error: any) {
    console.error('Error fetching map owners:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch map data');
  }
};

// Get nearby owners within radius
export const getNearbyOwners = async (params: {
  lat: number;
  lng: number;
  radius?: number; // in miles
  specialty?: string;
  limit?: number;
}): Promise<{
  data: MapOwner[];
  count: number;
  center: { lat: number; lng: number };
  radius: number;
}> => {
  try {
    const response = await api.get('/owners/nearby', { params });
    // Map _id to id for each owner
    if (response.data.data && Array.isArray(response.data.data)) {
      response.data.data = response.data.data.map((owner: any) => ({
        ...owner,
        id: owner._id || owner.id
      }));
    }
    return response.data;
  } catch (error: any) {
    console.error('Error fetching nearby owners:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch nearby owners');
  }
};

// Helper function to check if business is currently open
export const isBusinessOpen = (businessHours?: BusinessHours): boolean => {
  if (!businessHours) return false;

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()] as keyof BusinessHours;
  const dayHours = businessHours[currentDay];

  if (!dayHours || dayHours.closed) return false;

  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(dayHours.open?.replace(':', '') || '0');
  const closeTime = parseInt(dayHours.close?.replace(':', '') || '0');

  return currentTime >= openTime && currentTime <= closeTime;
};

// Helper function to format address string
export const formatAddress = (address?: Owner['address']): string => {
  if (!address) return '';
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode
  ].filter(Boolean);
  return parts.join(', ');
};