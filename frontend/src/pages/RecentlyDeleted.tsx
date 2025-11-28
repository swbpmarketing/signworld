import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FolderIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  FilmIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  ArrowLeftIcon,
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
  deletedAt: string;
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

const RecentlyDeleted = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('-deletedAt');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const ITEMS_PER_PAGE = 12;

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<LibraryFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Preview modal state
  const [previewFile, setPreviewFile] = useState<LibraryFile | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Fetch deleted files
  const fetchFiles = useCallback(async (page: number = 1) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`${API_URL}/library/deleted?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setFiles(data.data);
        setTotalFiles(data.totalFiles || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } else {
        setError(data.error || 'Failed to fetch deleted files');
      }
    } catch (err) {
      console.error('Error fetching deleted files:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy]);

  // Initial load
  useEffect(() => {
    fetchFiles();
  }, []);

  // Refetch when filters change - reset to page 1
  useEffect(() => {
    setCurrentPage(1);
    fetchFiles(1);
  }, [searchQuery, sortBy]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchFiles(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle search
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  // Toggle dropdown menu
  const toggleMenu = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === fileId ? null : fileId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  // Handle restore file
  const handleRestore = async (e: React.MouseEvent, file: LibraryFile) => {
    e.stopPropagation();
    setOpenMenuId(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/library/${file._id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`"${file.title}" has been restored`);
        fetchFiles(currentPage);
      } else {
        toast.error(data.error || 'Failed to restore file');
      }
    } catch (err) {
      console.error('Error restoring file:', err);
      toast.error('Failed to restore file');
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (e: React.MouseEvent, file: LibraryFile) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  // Handle permanent delete
  const handlePermanentDelete = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/library/${fileToDelete._id}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`"${fileToDelete.title}" has been permanently deleted`);
        setShowDeleteModal(false);
        setFileToDelete(null);
        fetchFiles(currentPage);
      } else {
        toast.error(data.error || 'Failed to delete file');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error('Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  // Handle file preview
  const handlePreview = async (file: LibraryFile) => {
    try {
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

  // Calculate days remaining before permanent deletion (30 days from deletion)
  const getDaysRemaining = (deletedAt: string): number => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate);
    expiryDate.setDate(expiryDate.getDate() + 30);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Format days remaining with appropriate styling
  const formatDaysRemaining = (deletedAt: string): { text: string; urgent: boolean } => {
    const days = getDaysRemaining(deletedAt);
    if (days === 0) return { text: 'Expires today', urgent: true };
    if (days === 1) return { text: '1 day left', urgent: true };
    if (days <= 7) return { text: `${days} days left`, urgent: true };
    return { text: `${days} days left`, urgent: false };
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

  // Redirect non-admins
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <TrashIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Access restricted to administrators</p>
        <Link
          to="/library"
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Back to Library
        </Link>
      </div>
    );
  }

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
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <TrashIcon className="h-8 w-8 text-white" />
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Recently Deleted
                </h1>
              </div>
              <p className="mt-3 text-lg text-red-100">
                Restore or permanently delete files
              </p>
            </div>
            <Link
              to="/library"
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Library
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0 flex gap-2">
            <div className="flex-1 min-w-0 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search deleted files..."
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
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
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
                  { value: '-deletedAt', label: 'Recently Deleted' },
                  { value: 'deletedAt', label: 'Oldest Deleted' },
                  { value: 'title', label: 'Name A-Z' },
                  { value: '-title', label: 'Name Z-A' },
                  { value: '-fileSize', label: 'Size (Large)' },
                  { value: 'fileSize', label: 'Size (Small)' },
                ]}
              />
            </div>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'} transition-colors duration-200`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'} transition-colors duration-200`}
              >
                <ViewColumnsIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Files Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <FolderSolidIcon className="h-5 w-5 mr-2 text-red-500 dark:text-red-400" />
            Deleted Files
            <span className="ml-2 text-sm font-normal text-gray-500">({totalFiles})</span>
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
              <TrashIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">No deleted files</p>
              <Link
                to="/library"
                className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Back to Library
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div
                    key={file._id}
                    className="relative border border-red-200 dark:border-red-900/50 rounded-lg p-4 hover:border-red-400 dark:hover:border-red-700 hover:shadow-md transition-all duration-200 cursor-pointer group bg-red-50/50 dark:bg-red-900/10"
                    onClick={() => handlePreview(file)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        {getFileIcon(file.fileType)}
                        <div className="ml-3 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 line-clamp-2">
                            {file.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.fileSize)}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => toggleMenu(e, file._id)}
                          className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                        {openMenuId === file._id && (
                          <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                            <button
                              onClick={(e) => handleRestore(e, file)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <ArrowUturnLeftIcon className="h-4 w-4" />
                              Restore
                            </button>
                            <button
                              onClick={(e) => openDeleteConfirmation(e, file)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete Forever
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className={`px-2 py-1 rounded-full ${getCategoryColor(file.category)}`}>
                        {categoryMeta[file.category]?.name || file.category}
                      </span>
                      {(() => {
                        const remaining = formatDaysRemaining(file.deletedAt);
                        return (
                          <span className={`px-2 py-1 rounded-full font-medium ${
                            remaining.urgent
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                          }`}>
                            {remaining.text}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination for Grid View */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalFiles)} of {totalFiles} files
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <ChevronLeftIcon className="h-4 w-4 mr-1" />
                      Prev
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center justify-between p-3 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg cursor-pointer group bg-red-50/30 dark:bg-red-900/5"
                    onClick={() => handlePreview(file)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {getFileIcon(file.fileType)}
                      <div className="ml-3 flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 truncate">
                          {file.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>•</span>
                          <span>Deleted {formatDate(file.deletedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {(() => {
                        const remaining = formatDaysRemaining(file.deletedAt);
                        return (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            remaining.urgent
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                          }`}>
                            {remaining.text}
                          </span>
                        );
                      })()}
                      <span className={`hidden sm:inline-block px-2 py-1 rounded-full text-xs ${getCategoryColor(file.category)}`}>
                        {categoryMeta[file.category]?.name || file.category}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => toggleMenu(e, file._id)}
                          className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                        {openMenuId === file._id && (
                          <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                            <button
                              onClick={(e) => handleRestore(e, file)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <ArrowUturnLeftIcon className="h-4 w-4" />
                              Restore
                            </button>
                            <button
                              onClick={(e) => openDeleteConfirmation(e, file)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete Forever
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination for List View */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalFiles)} of {totalFiles} files
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <ChevronLeftIcon className="h-4 w-4 mr-1" />
                      Prev
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Forever</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to permanently delete <span className="font-medium text-gray-900 dark:text-gray-100">"{fileToDelete.title}"</span>? This action cannot be undone and the file will be removed from storage.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setFileToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
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

export default RecentlyDeleted;
