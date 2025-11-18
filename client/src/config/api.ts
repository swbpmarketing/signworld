// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:5000' 
    : 'https://sign-company.onrender.com');

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  AUTH: `${API_BASE_URL}/api/auth`,
  USERS: `${API_BASE_URL}/api/users`,
  EVENTS: `${API_BASE_URL}/api/events`,
  CONVENTIONS: `${API_BASE_URL}/api/conventions`,
  BRAGS: `${API_BASE_URL}/api/brags`,
  FORUM: `${API_BASE_URL}/api/forum`,
  LIBRARY: `${API_BASE_URL}/api/library`,
  OWNERS: `${API_BASE_URL}/api/owners`,
  RATINGS: `${API_BASE_URL}/api/ratings`,
  PARTNERS: `${API_BASE_URL}/api/partners`,
  VIDEOS: `${API_BASE_URL}/api/videos`,
  EQUIPMENT: `${API_BASE_URL}/api/equipment`,
  FAQS: `${API_BASE_URL}/api/faqs`,
};

export default API_ENDPOINTS;