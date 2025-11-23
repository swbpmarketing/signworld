import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  FolderIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  FilmIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ChevronRightIcon,
  ClockIcon,
  HomeIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { FolderIcon as FolderSolidIcon } from '@heroicons/react/24/solid';

// Type definitions for file library
interface FileItem {
  id: number;
  name: string;
  type: 'folder' | 'file';
  fileType?: string;
  size?: string;
  modified?: string;
  items?: number;
  lastModified?: string;
  parentId?: number;
}

interface FolderStructure {
  [key: string]: FileItem[];
}

const folderStructure: FolderStructure = {
  root: [
    { id: 1, name: 'Marketing Materials', type: 'folder', items: 45, lastModified: '2024-01-15', size: '2.4 GB' },
    { id: 2, name: 'Training Videos', type: 'folder', items: 23, lastModified: '2024-01-10', size: '15.8 GB' },
    { id: 3, name: 'Legal Documents', type: 'folder', items: 67, lastModified: '2024-01-12', size: '890 MB' },
    { id: 4, name: 'Event Photos', type: 'folder', items: 342, lastModified: '2024-01-08', size: '5.2 GB' },
  ],
  '1': [
    { id: 101, name: 'Brand Guidelines V3.pdf', type: 'file', fileType: 'pdf', size: '12.3 MB', modified: '1 day ago', parentId: 1 },
    { id: 102, name: 'Q1 Marketing Strategy.pdf', type: 'file', fileType: 'pdf', size: '2.4 MB', modified: '2 hours ago', parentId: 1 },
    { id: 103, name: 'Social Media Templates', type: 'folder', items: 15, lastModified: '2024-01-14', size: '156 MB', parentId: 1 },
    { id: 104, name: 'Product Photos', type: 'folder', items: 28, lastModified: '2024-01-13', size: '1.8 GB', parentId: 1 },
  ],
  '2': [
    { id: 201, name: 'Installation Guide 2024.mp4', type: 'file', fileType: 'video', size: '450 MB', modified: '5 hours ago', parentId: 2 },
    { id: 202, name: 'Safety Procedures.mp4', type: 'file', fileType: 'video', size: '320 MB', modified: '1 day ago', parentId: 2 },
    { id: 203, name: 'Basic Training', type: 'folder', items: 8, lastModified: '2024-01-09', size: '5.2 GB', parentId: 2 },
    { id: 204, name: 'Advanced Training', type: 'folder', items: 12, lastModified: '2024-01-08', size: '8.6 GB', parentId: 2 },
  ],
  '3': [
    { id: 301, name: 'Territory Agreement Template.docx', type: 'file', fileType: 'doc', size: '156 KB', modified: '3 days ago', parentId: 3 },
    { id: 302, name: 'Franchise Agreements', type: 'folder', items: 23, lastModified: '2024-01-11', size: '234 MB', parentId: 3 },
    { id: 303, name: 'Vendor Contracts', type: 'folder', items: 18, lastModified: '2024-01-10', size: '189 MB', parentId: 3 },
    { id: 304, name: 'Insurance Documents', type: 'folder', items: 26, lastModified: '2024-01-09', size: '467 MB', parentId: 3 },
  ],
  '4': [
    { id: 401, name: 'Convention Highlights 2023.mp4', type: 'file', fileType: 'video', size: '245 MB', modified: '2 days ago', parentId: 4 },
    { id: 402, name: '2023 Convention', type: 'folder', items: 156, lastModified: '2024-01-07', size: '2.1 GB', parentId: 4 },
    { id: 403, name: '2022 Convention', type: 'folder', items: 134, lastModified: '2023-08-15', size: '1.8 GB', parentId: 4 },
    { id: 404, name: 'Team Building Events', type: 'folder', items: 52, lastModified: '2024-01-06', size: '1.3 GB', parentId: 4 },
  ],
  // Nested folders
  '103': [
    { id: 1031, name: 'Instagram Templates.psd', type: 'file', fileType: 'image', size: '45 MB', modified: '2 days ago', parentId: 103 },
    { id: 1032, name: 'Facebook Cover.psd', type: 'file', fileType: 'image', size: '38 MB', modified: '3 days ago', parentId: 103 },
    { id: 1033, name: 'Twitter Headers.psd', type: 'file', fileType: 'image', size: '28 MB', modified: '4 days ago', parentId: 103 },
  ],
  '203': [
    { id: 2031, name: 'Module 1 - Getting Started.mp4', type: 'file', fileType: 'video', size: '680 MB', modified: '1 week ago', parentId: 203 },
    { id: 2032, name: 'Module 2 - Basic Operations.mp4', type: 'file', fileType: 'video', size: '720 MB', modified: '1 week ago', parentId: 203 },
    { id: 2033, name: 'Module 3 - Safety First.mp4', type: 'file', fileType: 'video', size: '550 MB', modified: '1 week ago', parentId: 203 },
  ],
};

const recentFiles = [
  { id: 1, name: 'Q1_Marketing_Strategy.pdf', type: 'pdf', size: '2.4 MB', modified: '2 hours ago', folder: 'Marketing Materials' },
  { id: 2, name: 'Installation_Guide_2024.docx', type: 'doc', size: '1.8 MB', modified: '5 hours ago', folder: 'Training Videos' },
  { id: 3, name: 'Brand_Guidelines_V3.pdf', type: 'pdf', size: '12.3 MB', modified: '1 day ago', folder: 'Marketing Materials' },
  { id: 4, name: 'Convention_Highlights_2023.mp4', type: 'video', size: '245 MB', modified: '2 days ago', folder: 'Event Photos' },
  { id: 5, name: 'Territory_Agreement_Template.docx', type: 'doc', size: '156 KB', modified: '3 days ago', folder: 'Legal Documents' },
];

const fileTypeStats = [
  { type: 'Documents', count: 234, icon: DocumentTextIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
  { type: 'Images', count: 456, icon: PhotoIcon, color: 'text-green-600', bg: 'bg-green-100' },
  { type: 'Videos', count: 89, icon: FilmIcon, color: 'text-purple-600', bg: 'bg-purple-100' },
  { type: 'Other', count: 121, icon: DocumentIcon, color: 'text-gray-600', bg: 'bg-gray-100' },
];

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

const Library = () => {
  console.log('Library component is rendering');
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>(['root']);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [currentItems, setCurrentItems] = useState<FileItem[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Extract folder path from URL
  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(part => part && part !== 'library');
    if (pathParts.length > 0) {
      setCurrentPath(['root', ...pathParts]);
    } else {
      setCurrentPath(['root']);
    }
  }, [location.pathname]);

  // Update current items based on path
  useEffect(() => {
    const folderId = currentPath[currentPath.length - 1];
    const items = folderStructure[folderId] || folderStructure['root'];
    setCurrentItems(items);
    updateBreadcrumbs();
  }, [currentPath]);

  const updateBreadcrumbs = () => {
    const crumbs: BreadcrumbItem[] = [{ id: 'root', name: 'Home', path: '/library' }];
    
    // Build breadcrumbs from path
    let pathStr = '/library';
    for (let i = 1; i < currentPath.length; i++) {
      const folderId = currentPath[i];
      const parentItems = folderStructure[currentPath[i - 1]] || [];
      const folder = parentItems.find(item => item.id.toString() === folderId);
      
      if (folder && folder.type === 'folder') {
        pathStr += `/${folderId}`;
        crumbs.push({ id: folderId, name: folder.name, path: pathStr });
      }
    }
    
    setBreadcrumbs(crumbs);
  };

  const navigateToFolder = (folderId: number) => {
    setIsNavigating(true);
    const newPath = `/library/${folderId}`;
    navigate(newPath);
    setTimeout(() => setIsNavigating(false), 300);
  };

  const navigateToBreadcrumb = (path: string) => {
    setIsNavigating(true);
    navigate(path);
    setTimeout(() => setIsNavigating(false), 300);
  };

  const goBack = () => {
    if (currentPath.length > 1) {
      setIsNavigating(true);
      const newPath = currentPath.slice(0, -1);
      const pathStr = newPath.length === 1 ? '/library' : `/library/${newPath.slice(1).join('/')}`;
      navigate(pathStr);
      setTimeout(() => setIsNavigating(false), 300);
    }
  };

  // Filter items based on search
  const filteredItems = currentItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const folders = filteredItems.filter(item => item.type === 'folder');
  const files = filteredItems.filter(item => item.type === 'file');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <DocumentTextIcon className="h-8 w-8 text-red-500" />;
      case 'doc':
        return <DocumentTextIcon className="h-8 w-8 text-blue-500" />;
      case 'video':
        return <FilmIcon className="h-8 w-8 text-purple-500" />;
      case 'image':
        return <PhotoIcon className="h-8 w-8 text-green-500" />;
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  console.log('Library component is returning JSX');
  
  try {
    return (
      <div className="space-y-8">
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
            <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200">
              <PlusIcon className="h-5 w-5 mr-2" />
              Upload Files
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center space-x-2">
            {currentPath.length > 1 && (
              <button
                onClick={goBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2"
                title="Go back"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id}>
                <button
                  onClick={() => navigateToBreadcrumb(crumb.path)}
                  className={`inline-flex items-center px-3 py-1 rounded-md transition-all duration-200 ${
                    index === breadcrumbs.length - 1
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {index === 0 && <HomeIcon className="h-4 w-4 mr-1" />}
                  {crumb.name}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* File Type Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {fileTypeStats.map((stat) => (
          <div key={stat.type} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bg} dark:bg-opacity-20`}>
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

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
              <FunnelIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Filter
            </button>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'} transition-colors duration-200`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'} transition-colors duration-200`}
              >
                <ViewColumnsIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Folders Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <FolderSolidIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-500" />
                Folders
              </h3>
            </div>
            <div className="p-6">
              {folders.length === 0 && currentPath.length > 1 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No folders in this directory</p>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id)}
                      className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden ${
                        isNavigating ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center">
                          <FolderIcon className="h-10 w-10 text-primary-600 dark:text-primary-500 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors duration-200" />
                          <div className="ml-3">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
                              {folder.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{folder.items} items</p>
                          </div>
                        </div>
                        <ChevronRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-200 group-hover:translate-x-1" />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 relative z-10">
                        <span>{folder.size}</span>
                        <span>{folder.lastModified}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id)}
                      className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer group relative overflow-hidden ${
                        isNavigating ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center flex-1 relative z-10">
                        <FolderIcon className="h-8 w-8 text-primary-600 dark:text-primary-500 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors duration-200" />
                        <div className="ml-3 flex-1">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
                            {folder.name}
                          </h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{folder.items} items</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{folder.size}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{folder.lastModified}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-200 group-hover:translate-x-1 relative z-10" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Files Section / Recent Files */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                {currentPath.length > 1 ? (
                  <>
                    <DocumentIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-500" />
                    Files in this folder
                  </>
                ) : (
                  <>
                    <ClockIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-500" />
                    Recent Files
                  </>
                )}
              </h3>
            </div>
            <div className="p-6">
              {(currentPath.length > 1 ? files : recentFiles).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {currentPath.length > 1 ? 'No files in this folder' : 'No recent files'}
                </p>
              ) : (
              <div className="space-y-3">
                {(currentPath.length > 1 ? files : recentFiles).map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer group"
                  >
                    <div className="flex items-center min-w-0">
                      {getFileIcon(file.type)}
                      <div className="ml-3 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {file.folder} • {file.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 ml-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{file.modified}</span>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all duration-200">
                        <ArrowDownTrayIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
              <button className="mt-4 w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                View all recent files →
              </button>
            </div>
          </div>

          {/* Storage Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Storage Usage</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Used</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">24.2 GB of 50 GB</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style={{ width: '48.4%' }}></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                25.8 GB available • Upgrade for more storage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error rendering Library component:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error rendering Library component. Check console for details.
      </div>
    );
  }
};

export default Library;