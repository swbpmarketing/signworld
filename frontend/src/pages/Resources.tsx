import { useState } from 'react';
import {
  BookOpenIcon,
  DocumentDuplicateIcon,
  AcademicCapIcon,
  LightBulbIcon,
  CursorArrowRaysIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'guide' | 'template' | 'tool' | 'video' | 'article';
  featured: boolean;
  rating: number;
  downloads: number;
  fileSize?: string;
  duration?: string;
  tags: string[];
  lastUpdated: string;
}

const Resources = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  // Resource categories
  const categories = [
    { id: 'all', name: 'All Resources', icon: BookOpenIcon, count: 48 },
    { id: 'templates', name: 'Templates', icon: DocumentDuplicateIcon, count: 12 },
    { id: 'guides', name: 'Guides & Tutorials', icon: AcademicCapIcon, count: 15 },
    { id: 'marketing', name: 'Marketing Tools', icon: PresentationChartLineIcon, count: 8 },
    { id: 'design', name: 'Design Resources', icon: CursorArrowRaysIcon, count: 10 },
    { id: 'business', name: 'Business Tools', icon: LightBulbIcon, count: 6 },
    { id: 'technical', name: 'Technical Specs', icon: WrenchScrewdriverIcon, count: 7 },
    { id: 'legal', name: 'Legal & Compliance', icon: ShieldCheckIcon, count: 5 },
  ];

  // Mock resources data
  const resources: Resource[] = [
    {
      id: '1',
      title: 'Sign Design Best Practices Guide',
      description: 'Comprehensive guide covering typography, color theory, and layout principles for effective sign design.',
      category: 'guides',
      type: 'guide',
      featured: true,
      rating: 4.8,
      downloads: 1245,
      fileSize: '15.4 MB',
      tags: ['design', 'typography', 'best practices'],
      lastUpdated: '2025-07-15',
    },
    {
      id: '2',
      title: 'Business Proposal Template',
      description: 'Professional template for creating winning proposals. Includes pricing tables and project timelines.',
      category: 'templates',
      type: 'template',
      featured: true,
      rating: 4.9,
      downloads: 892,
      fileSize: '2.3 MB',
      tags: ['sales', 'proposals', 'templates'],
      lastUpdated: '2025-07-20',
    },
    {
      id: '3',
      title: 'LED Sign Installation Tutorial',
      description: 'Step-by-step video tutorial on proper LED sign installation techniques and safety procedures.',
      category: 'technical',
      type: 'video',
      featured: false,
      rating: 4.7,
      downloads: 567,
      duration: '45 min',
      tags: ['installation', 'LED', 'tutorial'],
      lastUpdated: '2025-07-10',
    },
    {
      id: '4',
      title: 'Social Media Marketing Kit',
      description: 'Complete kit with templates, calendars, and strategies for promoting your sign business online.',
      category: 'marketing',
      type: 'tool',
      featured: true,
      rating: 4.6,
      downloads: 723,
      fileSize: '8.9 MB',
      tags: ['marketing', 'social media', 'promotion'],
      lastUpdated: '2025-07-25',
    },
    {
      id: '5',
      title: 'Safety Compliance Checklist',
      description: 'Essential safety checklist for sign manufacturing and installation operations.',
      category: 'legal',
      type: 'template',
      featured: false,
      rating: 4.9,
      downloads: 456,
      fileSize: '0.8 MB',
      tags: ['safety', 'compliance', 'checklist'],
      lastUpdated: '2025-07-05',
    },
    {
      id: '6',
      title: 'Profit Margin Calculator',
      description: 'Excel-based tool to calculate project costs, margins, and ROI for sign projects.',
      category: 'business',
      type: 'tool',
      featured: true,
      rating: 4.8,
      downloads: 1078,
      fileSize: '1.2 MB',
      tags: ['business', 'calculator', 'finance'],
      lastUpdated: '2025-07-18',
    },
  ];

  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'guide': return '📘';
      case 'template': return '📋';
      case 'tool': return '🛠️';
      case 'video': return '🎥';
      case 'article': return '📄';
      default: return '📎';
    }
  };

  const getTypeColor = (type: Resource['type']) => {
    switch (type) {
      case 'guide': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'template': return 'bg-green-100 text-green-800 border-green-200';
      case 'tool': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'video': return 'bg-red-100 text-red-800 border-red-200';
      case 'article': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredResources = resources.filter(r => r.featured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary-600 to-primary-600 rounded-xl shadow-lg p-8 text-white">
        <div className="max-w-4xl">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Resource Center</h1>
          <p className="text-lg sm:text-xl text-primary-100">
            Access templates, guides, tools, and training materials to grow your sign business
          </p>
          <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-10 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
            <button type="button" className="px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors">
              Request Resource
            </button>
          </form>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{resources.length}</div>
          <div className="text-sm text-gray-600">Total Resources</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">15K+</div>
          <div className="text-sm text-gray-600">Downloads</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">4.8</div>
          <div className="text-sm text-gray-600">Avg. Rating</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">Weekly</div>
          <div className="text-sm text-gray-600">Updates</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <category.icon className={`h-5 w-5 mr-3 ${
                      selectedCategory === category.id ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    {category.name}
                  </div>
                  <span className={`text-xs ${
                    selectedCategory === category.id ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Popular Tags */}
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {['design', 'marketing', 'LED', 'installation', 'templates', 'business'].map((tag) => (
                <button
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Featured Resources */}
          {selectedCategory === 'all' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                Featured Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredResources.slice(0, 4).map((resource) => (
                  <div
                    key={resource.id}
                    onClick={() => setSelectedResource(resource)}
                    className="bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{getTypeIcon(resource.type)}</span>
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span className="ml-1 text-sm font-medium text-gray-700">{resource.rating}</span>
                      </div>
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 line-clamp-2">{resource.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{resource.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{resource.downloads} downloads</span>
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 text-primary-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resource Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedCategory === 'all' ? 'All Resources' : categories.find(c => c.id === selectedCategory)?.name}
              </h3>
              <span className="text-sm text-gray-600">{filteredResources.length} results</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  onClick={() => setSelectedResource(resource)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 text-3xl mr-4">
                      {getTypeIcon(resource.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{resource.title}</h4>
                          <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">{resource.description}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(resource.type)}`}>
                              {resource.type}
                            </span>
                            <div className="flex items-center text-gray-500">
                              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              {resource.rating}
                            </div>
                            <span className="text-gray-500 text-xs sm:text-sm">
                              {resource.fileSize || resource.duration}
                            </span>
                            <span className="text-gray-500 text-xs sm:text-sm">
                              Updated {new Date(resource.lastUpdated).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button className="ml-2 sm:ml-4 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0">
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1 sm:gap-2">
                        {resource.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-4xl mr-4">{getTypeIcon(selectedResource.type)}</span>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">{selectedResource.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(selectedResource.type)}`}>
                        {selectedResource.type}
                      </span>
                      <div className="flex items-center">
                        <StarIcon className="h-5 w-5 text-yellow-500 mr-1" />
                        <span className="font-medium">{selectedResource.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-600">{selectedResource.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Downloads</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedResource.downloads}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Size</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedResource.fileSize || selectedResource.duration || 'N/A'}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedResource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                    >
                      <TagIcon className="h-4 w-4 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(selectedResource.lastUpdated).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    Preview
                  </button>
                  <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center">
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Download Resource
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;