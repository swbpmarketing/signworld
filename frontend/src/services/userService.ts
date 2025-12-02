// User Service for API calls
import api from '../config/axios';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: 'admin' | 'owner' | 'vendor';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  profileImage?: string;
  specialties?: string[];
  equipment?: string[];
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    website?: string;
  };
  mentoring?: {
    available: boolean;
    areas: string[];
  };
  isActive: boolean;
  createdAt: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
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
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    website?: string;
  };
  mentoring?: {
    available: boolean;
    areas: string[];
  };
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface NotificationSettings {
  events: boolean;
  forum: boolean;
  library: boolean;
  announcements: boolean;
}

// Get current user profile
export const getCurrentUser = async (): Promise<{ success: boolean; data: UserProfile }> => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Update user profile details
export const updateProfile = async (data: UpdateProfileData): Promise<{ success: boolean; data: UserProfile }> => {
  const response = await api.put('/auth/updatedetails', data);
  return response.data;
};

// Update password
export const updatePassword = async (data: UpdatePasswordData): Promise<{ success: boolean; token?: string }> => {
  const response = await api.put('/auth/updatepassword', data);
  return response.data;
};

// Upload profile photo
export const uploadProfilePhoto = async (userId: string, file: File): Promise<{ success: boolean; data: UserProfile }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.put(`/users/${userId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get notification settings from localStorage (client-side only for now)
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem('notificationSettings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  // Default settings
  return {
    events: true,
    forum: true,
    library: true,
    announcements: true,
  };
};

// Save notification settings to localStorage
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  localStorage.setItem('notificationSettings', JSON.stringify(settings));
};

export default {
  getCurrentUser,
  updateProfile,
  updatePassword,
  uploadProfilePhoto,
  getNotificationSettings,
  saveNotificationSettings,
};
