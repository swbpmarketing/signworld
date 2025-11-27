import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FolderIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  FilmIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ClockIcon,
  HomeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { FolderIcon as FolderSolidIcon } from '@heroicons/react/24/solid';
import CustomSelect from '../components/CustomSelect';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? '/api'
    : 'https://sign-company.onrender.com/api');

// Type definitions
interface LibraryFile {
  _id: string;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  tags: string[];
  uploadedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface LibraryStats {
  overview: {
    totalFiles: number;
    totalSize: number;
    totalDownloads: number;
  };
  byCategory: { _id: string; count: number; totalSize: number }[];
  byType: { _id: string; count: number }[];
  recentFiles: LibraryFile[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

const categoryMeta: { [key: string]: { name: string; icon: string; color: string } } = {
  hr: { name: 'HR Documents', icon: 'users', color: 'blue' },
  marketing: { name: 'Marketing Materials', icon: 'megaphone', color: 'purple' },
  training: { name: 'Training Documents', icon: 'academic-cap', color: 'green' },
  operations: { name: 'Operations', icon: 'cog', color: 'gray' },
  forms: { name: 'Forms & Templates', icon: 'document', color: 'yellow' },
  fonts: { name: 'Fonts', icon: 'font', color: 'pink' },
  artwork: { name: 'Artwork & Graphics', icon: 'photo', color: 'indigo' },
  other: { name: 'Other', icon: 'folder', color: 'gray' }
};

const Library = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('-createdAt');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadTags, setUploadTags] = useState('');
  const [uploading, setUploading] = useState(false);

  // Preview modal state
  const [previewFile, setPreviewFile] = useState<LibraryFile | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Fetch library files
  const fetchFiles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort', sortBy);
      params.append('limit', '50');

      const response = await fetch(`${API_URL}/library?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setFiles(data.data);
      } else {
        setError(data.error || 'Failed to fetch files');
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to connect to server');
    }
  }, [selectedCategory, searchQuery, sortBy]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/library/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/library/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFiles(), fetchStats(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Handle search
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  // Handle file preview
  const handlePreview = async (file: LibraryFile) => {
    try {
      // If file doesn't have full details (e.g., from recentFiles), fetch them
      if (!file.fileUrl) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/library/${file._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setPreviewFile(data.data);
        } else {
          setPreviewFile(file);
        }
      } else {
        setPreviewFile(file);
      }
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Error fetching file details:', err);
      setPreviewFile(file);
      setShowPreviewModal(true);
    }
  };

  // Close preview modal
  const closePreview = () => {
    setShowPreviewModal(false);
    setPreviewFile(null);
  };

  // Handle upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('description', uploadDescription);
      formData.append('category', uploadCategory);
      formData.append('tags', uploadTags);

      const response = await fetch(`${API_URL}/library`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadDescription('');
        setUploadCategory('other');
        setUploadTags('');
        fetchFiles();
        fetchStats();
        fetchCategories();
      } else {
        alert(data.error || 'Failed to upload file');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Get file icon based on mime type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <DocumentTextIcon className="h-8 w-8 text-red-500" />;
    }
    if (fileType.includes('word') || fileType.includes('document')) {
      return <DocumentTextIcon className="h-8 w-8 text-blue-500" />;
    }
    if (fileType.includes('video')) {
      return <FilmIcon className="h-8 w-8 text-purple-500" />;
    }
    if (fileType.includes('image')) {
      return <PhotoIcon className="h-8 w-8 text-green-500" />;
    }
    if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <DocumentTextIcon className="h-8 w-8 text-green-600" />;
    }
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  };

  // Get category color class
  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    };
    const meta = categoryMeta[category];
    return colors[meta?.color || 'gray'] || colors.gray;
  };

  // Stats for display
  const fileTypeStats = stats?.byType?.map(t => ({
    type: t._id,
    count: t.count,
    icon: t._id === 'PDFs' ? DocumentTextIcon :
          t._id === 'Images' ? PhotoIcon :
          t._id === 'Documents' ? DocumentTextIcon :
          t._id === 'Spreadsheets' ? DocumentTextIcon : DocumentIcon,
    color: t._id === 'PDFs' ? 'text-red-600 dark:text-red-400' :
           t._id === 'Images' ? 'text-green-600 dark:text-green-400' :
           t._id === 'Documents' ? 'text-blue-600 dark:text-blue-400' :
           t._id === 'Spreadsheets' ? 'text-emerald-600 dark:text-emerald-400' :
           'text-gray-600 dark:text-gray-400',
    bg: t._id === 'PDFs' ? 'bg-red-100 dark:bg-red-900/30' :
        t._id === 'Images' ? 'bg-green-100 dark:bg-green-900/30' :
        t._id === 'Documents' ? 'bg-blue-100 dark:bg-blue-900/30' :
        t._id === 'Spreadsheets' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
        'bg-gray-100 dark:bg-gray-700',
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0 max-w-full">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                File Library
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Access and manage all your Sign Company resources in one place
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Upload Files
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-4 overflow-hidden">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            All Files
            <span className="ml-2 text-xs opacity-75">({stats?.overview?.totalFiles || 0})</span>
          </button>
          {Object.entries(categoryMeta).map(([key, meta]) => {
            const cat = categories.find(c => c.id === key);
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FolderIcon className="h-4 w-4 mr-2" />
                {meta.name}
                {cat && <span className="ml-2 text-xs opacity-75">({cat.count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* File Type Stats */}
      {fileTypeStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {fileTypeStats.map((stat) => (
            <div key={stat.type} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.count}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0 flex gap-2">
            <div className="flex-1 min-w-0 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <div className="w-40 flex-shrink-0">
              <CustomSelect
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                options={[
                  { value: '-createdAt', label: 'Newest' },
                  { value: 'createdAt', label: 'Oldest' },
                  { value: 'title', label: 'Name A-Z' },
                  { value: '-title', label: 'Name Z-A' },
                  { value: '-fileSize', label: 'Size (Large)' },
                  { value: 'fileSize', label: 'Size (Small)' },
                  { value: '-downloadCount', label: 'Most Downloads' },
                ]}
              />
            </div>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'} transition-colors duration-200`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'} transition-colors duration-200`}
              >
                <ViewColumnsIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Files Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <FolderSolidIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-500" />
                {selectedCategory === 'all' ? 'All Files' : categoryMeta[selectedCategory]?.name || 'Files'}
                <span className="ml-2 text-sm font-normal text-gray-500">({files.length})</span>
              </h3>
            </div>
            <div className="p-6">
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{error}</p>
                  <button
                    onClick={() => fetchFiles()}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Retry
                  </button>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12">
                  <FolderIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="mt-4 text-gray-500 dark:text-gray-400">No files found</p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Upload your first file
                    </button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((file) => (
                    <div
                      key={file._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={() => handlePreview(file)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          {getFileIcon(file.fileType)}
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
                              {file.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.fileSize)}</p>
                          </div>
                        </div>
                        <ArrowDownTrayIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full ${getCategoryColor(file.category)}`}>
                          {categoryMeta[file.category]?.name || file.category}
                        </span>
                        <span>{file.downloadCount} downloads</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file._id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer group"
                      onClick={() => handlePreview(file)}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        {getFileIcon(file.fileType)}
                        <div className="ml-3 flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                            {file.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDate(file.createdAt)}</span>
                            <span>•</span>
                            <span>{file.downloadCount} downloads</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(file.category)}`}>
                          {categoryMeta[file.category]?.name || file.category}
                        </span>
                        <ArrowDownTrayIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Files */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-500" />
                Recent Files
              </h3>
            </div>
            <div className="p-6">
              {stats?.recentFiles && stats.recentFiles.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentFiles.map((file) => (
                    <div
                      key={file._id}
                      className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer group"
                      onClick={() => handlePreview(file)}
                    >
                      {getFileIcon(file.fileType)}
                      <div className="ml-3 min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600">
                          {file.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent files</p>
              )}
            </div>
          </div>

          {/* Storage Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Library Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Files</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{stats?.overview?.totalFiles || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Size</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatFileSize(stats?.overview?.totalSize || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Downloads</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{stats?.overview?.totalDownloads || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload File</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  File
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter file title"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {Object.entries(categoryMeta).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g., template, marketing, 2024"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal - Simplified */}
      {showPreviewModal && previewFile && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-900 z-[100] flex flex-col" style={{ margin: 0 }}>
          {/* Dark Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={closePreview}
                className="p-2 text-gray-300 hover:bg-gray-700 rounded-full transition-colors mr-2"
                title="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              <div className="ml-2 min-w-0">
                <h3 className="text-base font-medium text-white truncate">
                  {previewFile.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  {formatFileSize(previewFile.fileSize)} • {previewFile.fileName}
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  if (previewFile._id) {
                    try {
                      toast.success('Download started!');
                      const token = localStorage.getItem('token');
                      const response = await fetch(`${API_URL}/library/${previewFile._id}/download-file`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (!response.ok) throw new Error('Download failed');
                      const blob = await response.blob();
                      const blobUrl = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = blobUrl;
                      link.download = previewFile.fileName || previewFile.title || 'download';
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      setTimeout(() => {
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                      }, 100);
                      // Refresh to update download count
                      fetchFiles();
                    } catch (error) {
                      console.error('Download failed:', error);
                      toast.error('Download failed. Please try again.');
                    }
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>

          {/* Document Preview Area */}
          <div className="flex-1 overflow-auto bg-gray-700 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-5xl">
              {(() => {
                const fileUrl = previewFile.fileUrl;
                const isDemo = fileUrl?.includes('sign-company-uploads.s3.amazonaws.com') &&
                  (fileUrl.includes('/documents/') || fileUrl.includes('/fonts/') || fileUrl.includes('/artwork/'));

                if (isDemo) {
                  return (
                    <div className="bg-white rounded-lg shadow-2xl aspect-[8.5/11] flex flex-col items-center justify-center p-8 sm:p-12">
                      <div className="p-6 sm:p-8 bg-gray-100 rounded-xl">
                        {getFileIcon(previewFile.fileType)}
                      </div>
                      <h3 className="mt-6 sm:mt-8 text-xl sm:text-2xl font-semibold text-gray-900 text-center">{previewFile.title}</h3>
                      <p className="mt-3 text-gray-500 text-center max-w-md text-sm sm:text-base">{previewFile.description}</p>
                      <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
                        <span>{formatFileSize(previewFile.fileSize)}</span>
                        <span>•</span>
                        <span>{previewFile.fileName}</span>
                      </div>
                      <div className="mt-6 sm:mt-8 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm text-center">
                        Sample file preview - actual file would display here in production
                      </div>
                    </div>
                  );
                }

                if (previewFile.fileType.includes('pdf')) {
                  return (
                    <iframe
                      src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      className="w-full bg-white rounded-lg shadow-2xl"
                      style={{ height: 'calc(100vh - 100px)', minHeight: '500px' }}
                      title={previewFile.title}
                    />
                  );
                }

                if (previewFile.fileType.includes('image')) {
                  return (
                    <div className="bg-gray-800 rounded-lg shadow-2xl p-4 flex items-center justify-center">
                      <img src={fileUrl} alt={previewFile.title} className="max-w-full max-h-[80vh] object-contain rounded" />
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-lg shadow-2xl aspect-[8.5/11] flex flex-col items-center justify-center p-8 sm:p-12">
                    <div className="p-6 sm:p-8 bg-gray-100 rounded-xl">
                      {getFileIcon(previewFile.fileType)}
                    </div>
                    <h3 className="mt-6 sm:mt-8 text-xl sm:text-2xl font-semibold text-gray-900 text-center">{previewFile.title}</h3>
                    <p className="mt-3 text-gray-500 text-center max-w-md text-sm sm:text-base">{previewFile.description}</p>
                    <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
                      <span>{formatFileSize(previewFile.fileSize)}</span>
                      <span>•</span>
                      <span>{previewFile.fileName}</span>
                    </div>
                    <button
                      onClick={() => window.open(fileUrl, '_blank')}
                      className="mt-6 sm:mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Download File
                    </button>
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
