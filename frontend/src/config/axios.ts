import axios from 'axios';

// Check for injected API URL from GitHub Pages deployment
const injectedApiUrl = (window as any)?.API_BASE_URL;

// In development, use relative /api path which will be proxied by Vite
// In production, use /api path which will hit the same domain
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  injectedApiUrl ||
  '/api';

// API base URL is configured above

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token and preview context to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add preview context header if in preview mode
    // This is used by backend to filter data for the previewed user
    // IMPORTANT: Do NOT add preview header to auth-related endpoints
    // to prevent preview mode from affecting authentication
    const isAuthEndpoint = config.url?.includes('/auth/') || config.url?.includes('/auth');

    if (!isAuthEndpoint) {
      try {
        const previewStateJson = sessionStorage.getItem('preview-mode-state');
        if (previewStateJson) {
          const previewState = JSON.parse(previewStateJson);
          if (previewState.type === 'user' && previewState.userId) {
            config.headers['X-Preview-User-Id'] = previewState.userId;
          }
        }
      } catch (e) {
        // sessionStorage not available or invalid JSON
      }
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