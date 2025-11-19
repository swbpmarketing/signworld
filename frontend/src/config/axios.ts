import axios from 'axios';

// Check for injected API URL from GitHub Pages deployment
const injectedApiUrl = (window as any)?.API_BASE_URL;

// VITE_API_URL should already include /api (e.g., http://localhost:9000/api)
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  injectedApiUrl ||
  (import.meta.env.DEV
    ? 'http://localhost:9000/api'
    : '/api');

// Log the API URL for debugging
console.log('🔗 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  injectedApiUrl,
  finalApiUrl: API_BASE_URL,
  isDev: import.meta.env.DEV
});

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;