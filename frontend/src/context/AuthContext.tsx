import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'vendor';
  company?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isOwner: boolean;
  isVendor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthContext: Checking for existing token');
    const token = localStorage.getItem('token');
    if (token) {
      console.log('AuthContext: Token found, attempting to fetch user');
      // Verify token and get user info
      fetchUser();
    } else {
      console.log('AuthContext: No token found, setting loading to false');
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      console.log('AuthContext: Fetching user data');
      const response = await api.get('/auth/me');
      console.log('AuthContext: User data received', response.data);
      setUser(response.data.data);
    } catch (error: any) {
      console.error('AuthContext: Error fetching user', error.response?.status, error.message);
      localStorage.removeItem('token');
      // Don't navigate to login here - let the app render normally
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);

      setUser(user);
      navigate('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAdmin: user?.role === 'admin',
    isOwner: user?.role === 'owner',
    isVendor: user?.role === 'vendor',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};