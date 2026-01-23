import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { FolderIcon as FolderSolidIcon } from '@heroicons/react/24/solid';
import CustomSelect from '../components/CustomSelect';
import { useAuth } from '../context/AuthContext';
import { usePreviewMode } from '../context/PreviewModeContext';

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

interface Folder {
  _id: string;
  name: string;
  category: string;
  parentFolder: string | null;
  children?: Folder[];
  fileCount?: number;
  subfolderCount?: number;
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
  const { getEffectiveRole } = usePreviewMode();
  const effectiveRole = getEffectiveRole();
  // Check actual user role for admin-only features (not preview role)
  const isAdmin = user?.role === 'admin';
  const isOwner = effectiveRole === 'owner';
  const canUpload = isAdmin || isOwner;
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('-createdAt');

  // Folder navigation state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderHierarchy, setFolderHierarchy] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showFolderPanel, setShowFolderPanel] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const ITEMS_PER_PAGE = 12;

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('other');
  const [customCategory, setCustomCategory] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadMode, setUploadMode] = useState<'files' | 'folder'>('files'); // Toggle between file and folder upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // New Folder modal state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderModalCategory, setFolderModalCategory] = useState<string>('other');

  // Preview modal state
  const [previewFile, setPreviewFile] = useState<LibraryFile | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<LibraryFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Derive current category label and count for header, to match category chips
  const selectedCategoryMeta = selectedCategory === 'all' ? null : categoryMeta[selectedCategory];
  const selectedCategoryFromList = categories.find((c) => c.id === selectedCategory);
  const currentCategoryLabel =
    selectedCategory === 'all'
      ? 'All Files'
      : selectedCategoryMeta?.name || selectedCategoryFromList?.name || 'Files';
  const currentCategoryCount =
    selectedCategory === 'all'
      ? stats?.overview?.totalFiles || 0
      : selectedCategoryFromList?.count ?? files.length;

  // Fetch library files
  const fetchFiles = useCallback(async (page: number = 1) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (currentFolderId) params.append('folderId', currentFolderId);
      if (searchQuery) params.append('search', searchQuery);

      // Convert display file type to regex pattern for backend
      if (selectedFileType) {
        let fileTypePattern = '';
        switch (selectedFileType) {
          case 'PDFs':
            fileTypePattern = 'pdf';
            break;
          case 'Images':
            fileTypePattern = 'image';
            break;
          case 'Documents':
            fileTypePattern = 'word|document';
            break;
          case 'Spreadsheets':
            fileTypePattern = 'sheet|excel';
            break;
          case 'Other':
            // Backend handles "Other" specially to exclude common types
            fileTypePattern = 'Other';
            break;
          default:
            fileTypePattern = selectedFileType;
        }
        params.append('fileType', fileTypePattern);
      }

      params.append('sort', sortBy);
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`${API_URL}/library?${params}`, {
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
        setError(data.error || 'Failed to fetch files');
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to connect to server');
    }
  }, [selectedCategory, searchQuery, sortBy, currentFolderId, selectedFileType]);

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

  // Fetch folder hierarchy for current category
  const fetchFolders = async (category: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/folders/hierarchy/${category}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setFolderHierarchy(data.data);
      }
    } catch (err) {
      console.error('Error fetching folder hierarchy:', err);
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

  // Refetch when category changes - reset to page 1 and folder
  useEffect(() => {
    setCurrentPage(1);
    setCurrentFolderId(null); // Reset to category root when category changes
    if (selectedCategory !== 'all') {
      fetchFolders(selectedCategory);
    }
  }, [selectedCategory]);

  // Refetch files when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
    fetchFiles(1);
  }, [searchQuery, sortBy, fetchFiles]);

  // Refetch files when folder changes
  useEffect(() => {
    setCurrentPage(1);
    fetchFiles(1);
  }, [currentFolderId, fetchFiles]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchFiles(newPage);
      // Scroll to top of files section
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

  // Auto-open file from search results
  useEffect(() => {
    const fileId = searchParams.get('id');
    if (fileId) {
      const fetchAndOpenFile = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/library/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success && data.data) {
            setPreviewFile(data.data);
            setShowPreviewModal(true);
            setSearchParams({});
          } else {
            toast.error('File not found');
            setSearchParams({});
          }
        } catch (error) {
          console.error('Failed to fetch file:', error);
          toast.error('Failed to load file');
          setSearchParams({});
        }
      };
      fetchAndOpenFile();
    }
  }, [searchParams, setSearchParams]);

  // Handle archive file
  const handleArchive = async (e: React.MouseEvent, file: LibraryFile) => {
    e.stopPropagation();
    setOpenMenuId(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/library/${file._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: false })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`"${file.title}" has been archived`);
        fetchFiles(currentPage);
        fetchStats();
        fetchCategories();
      } else {
        toast.error(data.error || 'Failed to archive file');
      }
    } catch (err) {
      console.error('Error archiving file:', err);
      toast.error('Failed to archive file');
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (e: React.MouseEvent, file: LibraryFile) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  // Handle delete file
  const handleDelete = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/library/${fileToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`"${fileToDelete.title}" has been deleted`);
        setShowDeleteModal(false);
        setFileToDelete(null);
        fetchFiles(currentPage);
        fetchStats();
        fetchCategories();
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

  // Toggle folder expansion
  const toggleFolderExpansion = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Handle folder click - navigate into folder
  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  // Handle delete folder
  const handleDeleteFolder = async (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this folder?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Folder deleted successfully');
        fetchFolders(selectedCategory);
        fetchFiles();
      } else {
        toast.error(data.error || 'Failed to delete folder');
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
      toast.error('Failed to delete folder');
    }
  };

  // Find folder by ID in hierarchy
  const findFolderInHierarchy = (id: string, folders: Folder[]): Folder | null => {
    for (const folder of folders) {
      if (folder._id === id) return folder;
      if (folder.children) {
        const found = findFolderInHierarchy(id, folder.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Get current folder object for display
  const currentFolder = currentFolderId ? findFolderInHierarchy(currentFolderId, folderHierarchy) : null;

  // Build breadcrumbs path from root to current folder
  const buildBreadcrumbs = (targetId: string, folders: Folder[]): Folder[] => {
    for (const folder of folders) {
      if (folder._id === targetId) {
        return [folder];
      }
      if (folder.children) {
        const pathInChildren = buildBreadcrumbs(targetId, folder.children);
        if (pathInChildren.length > 0) {
          return [folder, ...pathInChildren];
        }
      }
    }
    return [];
  };

  const breadcrumbs = currentFolderId ? buildBreadcrumbs(currentFolderId, folderHierarchy) : [];

  // Render folder tree recursively
  const renderFolderTree = (folders: Folder[], level: number = 0): JSX.Element[] => {
    return folders.map((folder) => (
      <div key={folder._id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg ${
            currentFolderId === folder._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
          }`}
          style={{ marginLeft: `${level * 20}px` }}
          title={folder.name}
        >
          <button
            onClick={() => toggleFolderExpansion(folder._id)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex-shrink-0"
          >
            <ChevronLeftIcon
              className={`h-4 w-4 transition-transform ${
                expandedFolders.has(folder._id) ? 'rotate-90' : ''
              }`}
            />
          </button>
          <button
            onClick={() => handleFolderClick(folder._id)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
            title={folder.name}
          >
            <FolderIcon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate block">
              {folder.name}
            </span>
          </button>
          {isAdmin && (
            <button
              onClick={(e) => handleDeleteFolder(e, folder._id)}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 rounded flex-shrink-0"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        {expandedFolders.has(folder._id) && folder.children && folder.children.length > 0 && (
          <div>{renderFolderTree(folder.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropFiles = (files: File[]) => {
    // Filter out duplicates based on file name and size
    const newFiles = files.filter(newFile => {
      return !uploadFiles.some(
        existingFile =>
          existingFile.name === newFile.name &&
          existingFile.size === newFile.size
      );
    });

    // Notify if duplicates were removed
    if (newFiles.length < files.length) {
      const duplicateCount = files.length - newFiles.length;
      toast.success(`${duplicateCount} duplicate file(s) ignored`);
    }

    const totalFiles = uploadFiles.length + newFiles.length;

    if (totalFiles > 10) {
      const available = 10 - uploadFiles.length;
      toast.error(`Only ${available} more file(s) can be added (max 10 total)`);
      setUploadFiles([...uploadFiles, ...newFiles.slice(0, available)]);
    } else {
      setUploadFiles([...uploadFiles, ...newFiles]);
    }
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    handleDropFiles(files);
  };

  const handleFileSelect = (files: FileList | null) => {
    let newFiles = Array.from(files || []);

    // Filter out duplicates based on file name and size
    const filteredFiles = newFiles.filter(newFile => {
      return !uploadFiles.some(
        existingFile =>
          existingFile.name === newFile.name &&
          existingFile.size === newFile.size
      );
    });

    // Notify if duplicates were removed
    if (filteredFiles.length < newFiles.length) {
      const duplicateCount = newFiles.length - filteredFiles.length;
      toast.success(`${duplicateCount} duplicate file(s) ignored`);
    }

    newFiles = filteredFiles;

    // Check if this is a folder upload by looking at the webkitRelativePath property
    const isFolderUpload = newFiles.some(f => (f as any).webkitRelativePath);

    if (isFolderUpload) {
      // Folder uploads can have many files, just add them all
      setUploadFiles([...uploadFiles, ...newFiles]);
      setUploadMode('folder');
    } else {
      // Regular file uploads limited to 10 files
      const totalFiles = uploadFiles.length + newFiles.length;
      if (totalFiles > 10) {
        const available = 10 - uploadFiles.length;
        toast.error(`Only ${available} more file(s) can be added (max 10 total)`);
        setUploadFiles([...uploadFiles, ...newFiles.slice(0, available)]);
      } else {
        setUploadFiles([...uploadFiles, ...newFiles]);
      }
      setUploadMode('files');
    }
  };

  // Helper function to find folder by ID in hierarchy
  const findFolderById = (folderId: string, hierarchy: Folder[]): Folder | null => {
    for (const folder of hierarchy) {
      if (folder._id === folderId) return folder;
      if (folder.children) {
        const found = findFolderById(folderId, folder.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Handle upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: uploadFiles.length });
    try {
      const token = localStorage.getItem('token');

      // Determine category - use folder's category if uploading to a folder
      let finalCategory = uploadCategory === 'other' && customCategory ? customCategory : uploadCategory;
      if (currentFolderId) {
        if (folderHierarchy.length > 0) {
          const folder = findFolderById(currentFolderId, folderHierarchy);
          if (folder && folder.category) {
            finalCategory = folder.category;
          } else {
            // Fallback to selected category if folder not found or has no category
            finalCategory = selectedCategory !== 'all' ? selectedCategory : 'other';
          }
        } else {
          // No folder hierarchy loaded, use selected category as fallback
          finalCategory = selectedCategory !== 'all' ? selectedCategory : 'other';
        }
      }

      let successCount = 0;
      let failureCount = 0;

      // Upload each file individually
      for (let index = 0; index < uploadFiles.length; index++) {
        const file = uploadFiles[index];

        // Update progress to show current file being uploaded
        setUploadProgress({ current: index + 1, total: uploadFiles.length });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', uploadTitle || file.name);
        formData.append('description', uploadDescription);
        formData.append('category', finalCategory);
        formData.append('tags', uploadTags);

        // If uploading to a specific folder, include the folder ID
        if (currentFolderId) {
          formData.append('folderId', currentFolderId);
        }

        // For folder uploads, send the relative path to recreate folder structure
        if (uploadMode === 'folder') {
          const webkitPath = (file as any).webkitRelativePath;
          if (webkitPath) {
            // Extract folder path (everything except the filename)
            const parts = webkitPath.split('/');
            if (parts.length > 1) {
              const folderPath = parts.slice(0, -1).join('/');
              formData.append('folderPath', folderPath);
            }
          }
        }

        try {
          const response = await fetch(`${API_URL}/library`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            failureCount++;
            // Show error message for this file
            const errorMsg = data.error || 'Failed to upload file';
            toast.error(`${file.name}: ${errorMsg}`);
          }
        } catch (err) {
          failureCount++;
          const errorMsg = err instanceof Error ? err.message : 'Failed to upload file';
          toast.error(`${file.name}: ${errorMsg}`);
        }
      }

      if (successCount > 0) {
        setShowUploadModal(false);
        setUploadFiles([]);
        setUploadTitle('');
        setUploadDescription('');
        setUploadCategory('other');
        setCustomCategory('');
        setUploadTags('');
        setUploadProgress({ current: 0, total: 0 });

        const message = uploadFiles.length === 1
          ? 'File uploaded successfully!'
          : `${successCount} file(s) uploaded${failureCount > 0 ? `, ${failureCount} failed` : ''}`;

        if (isOwner) {
          toast.success(message + ' Files will be visible after admin approval.');
        } else {
          toast.success(message);
        }
        fetchFiles();
        fetchStats();
        fetchCategories();
        // Refresh folder hierarchy if a category is selected
        if (selectedCategory !== 'all') {
          fetchFolders(selectedCategory);
        }
      } else {
        const errorMsg = failureCount === 1 ? '1 file failed to upload' : `${failureCount} files failed to upload`;
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload files';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  // Handle create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    // Validate category is provided
    if (!folderModalCategory) {
      toast.error('Please select a category');
      return;
    }

    setCreatingFolder(true);
    try {
      const token = localStorage.getItem('token');

      // Determine which category to use
      // If inside a folder, use the parent folder's category
      // Otherwise, use the selected category from the modal
      let categoryForFolder = folderModalCategory;
      if (currentFolder && currentFolder.category) {
        categoryForFolder = currentFolder.category;
      }

      const response = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          category: categoryForFolder,
          parentFolderId: currentFolderId // Support nested folder creation
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Folder "${newFolderName}" created successfully`);
        setShowNewFolderModal(false);
        setNewFolderName('');
        // Reset to default category
        if (categories.length > 0) {
          setFolderModalCategory(categories[0].id);
        }
        // Refresh both files and folder hierarchy to show new folder
        fetchFiles();
        fetchFolders(categoryForFolder);
      } else {
        toast.error(data.error || 'Failed to create folder');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create folder';
      toast.error(errorMsg);
    } finally {
      setCreatingFolder(false);
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
    <div className="space-y-8 min-w-0 max-w-full overflow-x-hidden" data-tour="library-content">
      {/* Header Section */}
      <div className="bg-blue-50 dark:bg-blue-900 border-blue-100 dark:border-blue-900/30 rounded-lg border p-4 sm:p-6 w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              File Library
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Access and manage all your Sign Company resources in one place
            </p>
          </div>
          {canUpload && (
            <div className="flex-shrink-0 flex gap-2">
              <button
                onClick={() => {
                  // Initialize category based on current context
                  if (selectedCategory !== 'all') {
                    setFolderModalCategory(selectedCategory);
                  } else if (categories.length > 0) {
                    // If viewing all categories, default to first available category
                    setFolderModalCategory(categories[0].id);
                  }
                  setShowNewFolderModal(true);
                }}
                className="px-2.5 py-1.5 bg-primary-600 text-sm hover:bg-primary-700 text-white rounded-lg transition-colors font-medium inline-flex items-center"
              >
                <FolderIcon className="h-5 w-5 mr-2" />
                New Folder
              </button>
              <button
                data-tour="upload-file-button"
                onClick={() => setShowUploadModal(true)}
                className="px-2.5 py-1.5 bg-primary-600 text-sm hover:bg-primary-700 text-white rounded-lg transition-colors font-medium inline-flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Upload Files
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-4 overflow-hidden">
        <div className="relative">
          <div
            className={`flex items-center gap-2 ${
              showAllCategories ? 'flex-wrap' : 'overflow-x-auto scrollbar-hide'
            } ${
              !showAllCategories && categories.filter(c => c.count > 0).length > 3 ? 'pr-20' : ''
            }`}
            style={showAllCategories ? undefined : { scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
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
            {/* Built-in categories with files */}
            {Object.entries(categoryMeta).map(([key, meta]) => {
              const cat = categories.find(c => c.id === key);
              // Only show if category has files
              if (!cat || cat.count === 0) return null;
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
                  <span className="ml-2 text-xs opacity-75">({cat.count})</span>
                </button>
              );
            })}
            {/* Custom categories (not in categoryMeta) */}
            {categories.map((cat) => {
              if (categoryMeta[cat.id]) return null; // Skip if already shown above
              if (cat.count === 0) return null; // Hide categories with no files
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <FolderIcon className="h-4 w-4 mr-2" />
                  {cat.name}
                  <span className="ml-2 text-xs opacity-75">({cat.count})</span>
                </button>
              );
            })}
          </div>
          {/* Toggle to expand/collapse categories - Position depends on expanded state */}
          {categories.filter(c => c.count > 0).length > 3 && !showAllCategories && (
            <>
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none z-0" />
              <button
                type="button"
                onClick={() => setShowAllCategories(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-200 dark:border-gray-700 z-10"
              >
                <span>More</span>
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </button>
            </>
          )}
        </div>
        {/* Collapse button when expanded - shown below the categories */}
        {categories.filter(c => c.count > 0).length > 3 && showAllCategories && (
          <div className="flex justify-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowAllCategories(false)}
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span>Collapse</span>
              <ChevronDownIcon className="ml-1 h-4 w-4 rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* File Type Stats */}
      {fileTypeStats.length > 0 && (
        <div data-tour="file-type-cards" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {fileTypeStats.map((stat) => {
            const isSelected = selectedFileType === stat.type;
            return (
              <button
                key={stat.type}
                onClick={() => {
                  if (selectedFileType === stat.type) {
                    setSelectedFileType(null);
                    setCurrentPage(1);
                  } else {
                    setSelectedFileType(stat.type);
                    setCurrentPage(1);
                  }
                }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 cursor-pointer text-left w-full ${
                  isSelected
                    ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50'
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.count}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.type}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0 flex gap-2">
            <div className="flex-1 min-w-0 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                data-tour="search-files"
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
              className="px-2.5 py-1.5 bg-primary-600 text-sm hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
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
      <div className={`grid gap-6 ${
        showFolderPanel && selectedCategory !== 'all' && folderHierarchy.length > 0
          ? 'grid-cols-1 lg:grid-cols-3'
          : 'grid-cols-1'
      }`}>
        {/* Files Section - Main/Left Column */}
        <div className={showFolderPanel && selectedCategory !== 'all' && folderHierarchy.length > 0 ? 'lg:col-span-2' : ''}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <FolderSolidIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-500" />
                {currentFolder
                  ? `${currentCategoryLabel} / ${currentFolder.name}`
                  : currentCategoryLabel}
                <span className="ml-2 text-sm font-normal text-gray-500">({currentCategoryCount})</span>
              </h3>
            </div>
            <div className="p-6">
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{error}</p>
                  <button
                    onClick={() => fetchFiles()}
                    className="mt-4 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Retry
                  </button>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12">
                  <FolderIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="mt-4 text-gray-500 dark:text-gray-400">No files found</p>
                  {canUpload && (
                    <div className="mt-4 flex gap-3 justify-center">
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-2.5 py-1.5 bg-primary-600 text-sm text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Upload your first file
                      </button>
                      <button
                        onClick={() => {
                          // Initialize category based on current context
                          if (selectedCategory !== 'all') {
                            setFolderModalCategory(selectedCategory);
                          } else if (categories.length > 0) {
                            // If viewing all categories, default to first available category
                            setFolderModalCategory(categories[0].id);
                          }
                          setShowNewFolderModal(true);
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Create a Folder
                      </button>
                    </div>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <>
                  <div data-tour="file-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                      <div
                        key={file._id}
                        className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => handlePreview(file)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            {getFileIcon(file.fileType)}
                            <div className="ml-3 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
                                {file.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.fileSize)}</p>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="relative">
                              <button
                                data-tour="file-actions"
                                onClick={(e) => toggleMenu(e, file._id)}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              >
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </button>
                              {openMenuId === file._id && (
                                <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                                  <button
                                    onClick={(e) => handleArchive(e, file)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <ArchiveBoxIcon className="h-4 w-4" />
                                    Archive
                                  </button>
                                  <button
                                    onClick={(e) => openDeleteConfirmation(e, file)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 rounded-full ${getCategoryColor(file.category)}`}>
                            {categoryMeta[file.category]?.name || file.category}
                          </span>
                          <ArrowDownTrayIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination for Grid View */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalFiles)} of {totalFiles} files
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
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
                            let pageNum;
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
                  {/* Action Buttons Below Files */}
                  {canUpload && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => {
                          if (selectedCategory !== 'all') {
                            setFolderModalCategory(selectedCategory);
                          } else if (categories.length > 0) {
                            setFolderModalCategory(categories[0].id);
                          }
                          setShowNewFolderModal(true);
                        }}
                        className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                      >
                        <FolderIcon className="h-5 w-5 mr-2" />
                        Create Folder
                      </button>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Upload Files
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
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
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(file.category)}`}>
                            {categoryMeta[file.category]?.name || file.category}
                          </span>
                          <ArrowDownTrayIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                          {isAdmin && (
                            <div className="relative">
                              <button
                                onClick={(e) => toggleMenu(e, file._id)}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              >
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </button>
                              {openMenuId === file._id && (
                                <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                                  <button
                                    onClick={(e) => handleArchive(e, file)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <ArchiveBoxIcon className="h-4 w-4" />
                                    Archive
                                  </button>
                                  <button
                                    onClick={(e) => openDeleteConfirmation(e, file)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination for List View */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalFiles)} of {totalFiles} files
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
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
                            let pageNum;
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
                  {/* Action Buttons Below Files */}
                  {canUpload && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => {
                          if (selectedCategory !== 'all') {
                            setFolderModalCategory(selectedCategory);
                          } else if (categories.length > 0) {
                            setFolderModalCategory(categories[0].id);
                          }
                          setShowNewFolderModal(true);
                        }}
                        className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                      >
                        <FolderIcon className="h-5 w-5 mr-2" />
                        Create Folder
                      </button>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Upload Files
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Quick Links - Show when All Files is selected */}
              {selectedCategory === 'all' && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                    <Link
                      to="/recently-deleted"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg transition-colors duration-200 font-medium text-sm"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Recently Deleted
                    </Link>
                    <Link
                      to="/archive"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg transition-colors duration-200 font-medium text-sm"
                    >
                      <ArchiveBoxIcon className="h-4 w-4" />
                      View Archive
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/pending-approval"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg transition-colors duration-200 font-medium text-sm"
                      >
                        <ClipboardDocumentListIcon className="h-4 w-4" />
                        Pending Approvals
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Folders and Sidebar */}
        {showFolderPanel && selectedCategory !== 'all' && folderHierarchy.length > 0 && (
          <div className="space-y-6">
            {/* Folder Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <FolderIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-500" />
                  Folders
                </h3>
                <button
                  onClick={() => setShowFolderPanel(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Hide folders"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Breadcrumb Navigation */}
              {currentFolderId && breadcrumbs.length > 0 && (
                <div data-tour="folder-navigation" className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                      onClick={() => setCurrentFolderId(null)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm flex-shrink-0"
                      title="Go to root"
                    >
                      Root
                    </button>
                    {breadcrumbs.map((folder, index) => (
                      <div key={folder._id} className="flex items-center gap-2 flex-shrink-0">
                        <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <button
                          onClick={() => setCurrentFolderId(folder._id)}
                          className={`text-sm whitespace-nowrap ${
                            index === breadcrumbs.length - 1
                              ? 'text-gray-900 dark:text-gray-100 font-medium'
                              : 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'
                          }`}
                          title={folder.name}
                        >
                          {folder.name.length > 15 ? folder.name.substring(0, 12) + '...' : folder.name}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* Root level button */}
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    currentFolderId === null
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <HomeIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Root</span>
                </button>
                {/* Folder tree */}
                <div className="mt-2">
                  {renderFolderTree(folderHierarchy)}
                </div>
              </div>
            </div>

            {/* Sidebar */}
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

          {/* Archive & Recently Deleted Links */}
          {isAdmin && (
            <div className="space-y-2">
              <Link
                to="/library/pending"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-400 rounded-xl transition-colors duration-200"
              >
                <ClipboardDocumentListIcon className="h-5 w-5" />
                <span className="font-medium">Pending Approval</span>
              </Link>
              <Link
                to="/archive"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/40 text-amber-700 dark:text-amber-400 rounded-xl transition-colors duration-200"
              >
                <ArchiveBoxIcon className="h-5 w-5" />
                <span className="font-medium">View Archive</span>
              </Link>
              <Link
                to="/recently-deleted"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-700 dark:text-red-400 rounded-xl transition-colors duration-200"
              >
                <TrashIcon className="h-5 w-5" />
                <span className="font-medium">Recently Deleted</span>
              </Link>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload Files</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFiles([]);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              {isOwner && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your uploaded files will be reviewed by an admin before appearing in the library.
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {uploadMode === 'folder' ? 'Folder' : 'Files (up to 10 files per upload)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setUploadMode(uploadMode === 'files' ? 'folder' : 'files')}
                    className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    {uploadMode === 'files' ? 'Upload Folder Instead' : 'Upload Files Instead'}
                  </button>
                </div>
                {/* Hidden file input - always in DOM */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                {/* Hidden folder input - always in DOM */}
                <input
                  ref={folderInputRef}
                  type="file"
                  webkitdirectory=""
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                {uploadFiles.length === 0 ? (
                  <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (uploadMode === 'folder') {
                        folderInputRef.current?.click();
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                      dragActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                      <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, PDF, DOC, AI up to 500MB (max 10 files)
                      </p>
                    </div>
                  </div>
                ) : uploading && uploadProgress.total > 0 ? (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Uploading file {uploadProgress.current} of {uploadProgress.total}
                        </p>
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                          {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-300"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                    {uploadFiles[uploadProgress.current - 1] && (
                      <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {uploadFiles[uploadProgress.current - 1].name}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {uploadFiles.length} / 10 file(s) selected
                        </p>
                        <button
                          type="button"
                          onClick={() => setUploadFiles([])}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                      <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {uploadFiles.map((file, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <DocumentIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                {file.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUploadFiles(uploadFiles.filter((_, i) => i !== idx))}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
                              title="Remove file"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (uploadMode === 'folder') {
                          folderInputRef.current?.click();
                        } else {
                          fileInputRef.current?.click();
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Add more {uploadMode === 'folder' ? 'files to this folder' : 'files'}
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Leave empty to use file names"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              {!currentFolderId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => {
                        setUploadCategory(e.target.value);
                        if (e.target.value !== 'other') {
                          setCustomCategory('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {/* Built-in categories - only show if they have files */}
                      {Object.entries(categoryMeta).map(([key, meta]) => {
                        const cat = categories.find(c => c.id === key);
                        if (!cat || cat.count === 0) return null;
                        return (
                          <option key={key} value={key}>{meta.name}</option>
                        );
                      })}

                      {/* Other option - always available for custom categories */}
                      <option value="other">Other</option>

                      {/* Custom categories (not in categoryMeta) - only show if they have files */}
                      {categories.map((cat) => {
                        // Only show if it's not a built-in category
                        if (categoryMeta[cat.id]) return null;
                        // Hide categories with no files
                        if (cat.count === 0) return null;
                        return (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {uploadCategory === 'other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Custom Category Name
                      </label>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="e.g., Client Resources, Special Projects"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated, optional)
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
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFiles([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || uploadFiles.length === 0}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Folder</h3>
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                  // Reset to default category
                  if (categories.length > 0) {
                    setFolderModalCategory(categories[0].id);
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              {currentFolderId && currentFolder ? (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                    Creating inside: <span className="font-bold">{currentFolder.name}</span>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={folderModalCategory}
                    onChange={(e) => setFolderModalCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                    // Reset to default category
                    if (categories.length > 0) {
                      setFolderModalCategory(categories[0].id);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingFolder ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete File</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-gray-100">"{fileToDelete.title}"</span>? Deleted files will be stored in Recently Deleted for 30 days.
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
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
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
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors cursor-pointer"
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

                // Check if fileUrl is missing
                if (!fileUrl) {
                  return (
                    <div className="bg-white rounded-lg shadow-2xl aspect-[8.5/11] flex flex-col items-center justify-center p-8 sm:p-12">
                      <div className="p-6 sm:p-8 bg-red-100 rounded-xl mb-4">
                        <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="mt-4 text-xl sm:text-2xl font-semibold text-gray-900 text-center">File Not Available</h3>
                      <p className="mt-3 text-gray-500 text-center max-w-md text-sm sm:text-base">
                        The file URL is missing. This usually means the file failed to upload to storage.
                      </p>
                      <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
                        <span>{formatFileSize(previewFile.fileSize)}</span>
                        <span>•</span>
                        <span>{previewFile.fileName}</span>
                      </div>
                      <button
                        onClick={closePreview}
                        className="mt-6 sm:mt-8 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200"
                      >
                        Close
                      </button>
                    </div>
                  );
                }

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
                      onError={(e) => {
                        console.error('PDF iframe failed to load:', fileUrl);
                      }}
                    />
                  );
                }

                if (previewFile.fileType.includes('image')) {
                  return (
                    <div className="bg-gray-800 rounded-lg shadow-2xl p-4 flex items-center justify-center">
                      <img
                        src={fileUrl}
                        alt={previewFile.title}
                        className="max-w-full max-h-[80vh] object-contain rounded"
                        onError={(e) => {
                          console.error('Image failed to load:', fileUrl);
                          e.currentTarget.src = '';
                        }}
                      />
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
