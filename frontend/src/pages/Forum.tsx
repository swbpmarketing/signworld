import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import {
  ChatBubbleLeftRightIcon,
  FireIcon,
  HashtagIcon,
  ClockIcon,
  UserGroupIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BookmarkIcon,
  FlagIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BellIcon,
  ChartBarIcon,
  LockClosedIcon,
  TagIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon, LockClosedIcon as LockSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface ForumThread {
  _id: string;
  title: string;
  author: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  category: string;
  subcategory?: string;
  createdAt: string;
  lastActivity?: string;
  content: string;
  views: number;
  replyCount: number;
  likes?: string[];
  isPinned: boolean;
  isLocked: boolean;
  isBookmarked?: boolean;
  tags: string[];
  lastReply?: {
    author: string;
    time: string;
  };
  status: string;
}

const forumCategories = [
  { 
    name: 'General Discussion', 
    icon: ChatBubbleLeftRightIcon, 
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    count: 342,
    subcategories: ['Announcements', 'Introductions', 'General Chat']
  },
  { 
    name: 'Business Growth', 
    icon: ChartBarIcon, 
    color: 'text-green-600',
    bg: 'bg-green-100',
    count: 256,
    subcategories: ['Marketing', 'Sales Strategies', 'Client Management']
  },
  { 
    name: 'Technical Support', 
    icon: HashtagIcon, 
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    count: 189,
    subcategories: ['Equipment', 'Software', 'Installation']
  },
  { 
    name: 'Training & Resources', 
    icon: BookmarkIcon, 
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    count: 167,
    subcategories: ['Tutorials', 'Best Practices', 'Certifications']
  },
];

const Forum = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThread, setNewThread] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'latest' | 'hot' | 'top' | 'unanswered'>('latest');
  const [stats, setStats] = useState({
    totalThreads: 0,
    todayThreads: 0,
    totalReplies: 0,
    trendingTags: [] as { name: string; count: number }[]
  });
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyingToThread, setReplyingToThread] = useState<ForumThread | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  // Fetch threads from API
  const fetchThreads = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);

      // Map sort options to API sort values
      const sortMap = {
        latest: '-createdAt',
        hot: '-views',
        top: '-likes',
        unanswered: 'replies'
      };

      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        sort: sortMap[sortBy],
        ...(selectedCategory !== 'All Categories' && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/forum?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setThreads(prev => [...prev, ...data.data]);
        } else {
          setThreads(data.data);
        }
        setTotalPages(data.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error('Failed to load forum threads');
    } finally {
      setLoading(false);
    }
  };

  // Fetch forum stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/forum/stats/overview');
      const data = await response.json();

      if (data.success) {
        setStats({
          totalThreads: data.data.totalThreads || 0,
          todayThreads: data.data.todayThreads || 0,
          totalReplies: data.data.totalReplies || 0,
          trendingTags: data.data.trendingTags || []
        });
      }
    } catch (error) {
      console.error('Error fetching forum stats:', error);
    }
  };

  // Load threads and stats on component mount and when filters change
  useEffect(() => {
    setPage(1);
    fetchThreads(1, false);
    fetchStats();
  }, [selectedCategory, searchQuery, sortBy]);

  // Handle create thread
  const handleCreateThread = async () => {
    if (!newThread.title || !newThread.content) {
      toast.warning('Please provide both title and content');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newThread),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Thread created successfully!');
        setShowCreateModal(false);
        setNewThread({
          title: '',
          content: '',
          category: 'general',
          tags: [],
        });
        fetchThreads(); // Refresh thread list
      } else {
        toast.error(data.error || 'Failed to create thread');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  // Handle add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !newThread.tags.includes(tagInput.trim())) {
      setNewThread({
        ...newThread,
        tags: [...newThread.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  // Handle remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setNewThread({
      ...newThread,
      tags: newThread.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleBookmark = (threadId: string) => {
    // Handle bookmarking logic
    console.log('Bookmarking thread:', threadId);
  };

  // Handle like/unlike thread
  const handleLikeThread = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault(); // Prevent navigation if inside a link

    if (!user) {
      toast.warning('Please login to like threads');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/forum/${threadId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Update the threads array with the new like status
        setThreads(prevThreads =>
          prevThreads.map(thread =>
            thread._id === threadId
              ? {
                  ...thread,
                  likes: data.data.isLiked
                    ? [...(thread.likes || []), user._id]
                    : (thread.likes || []).filter((userId: string) => userId !== user._id)
                }
              : thread
          )
        );
        toast.success(data.data.isLiked ? 'Thread liked!' : 'Thread unliked');
      }
    } catch (error) {
      console.error('Error liking thread:', error);
      toast.error('Failed to like thread');
    }
  };

  // Handle post reply
  const handlePostReply = async () => {
    if (!user) {
      toast.warning('Please login to post a reply');
      return;
    }

    if (!replyContent.trim()) {
      toast.warning('Please enter a reply');
      return;
    }

    if (!replyingToThread) {
      toast.error('No thread selected');
      return;
    }

    try {
      setSubmittingReply(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/forum/${replyingToThread._id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyContent }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Reply posted successfully!');
        setReplyContent('');
        setShowReplyModal(false);
        setReplyingToThread(null);
        // Refresh threads to show updated reply count
        fetchThreads(page);
      } else {
        toast.error(data.error || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle load more threads
  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchThreads(page + 1, true);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setPage(1);
  };

  // Handle sort filter
  const handleSortChange = (newSort: 'latest' | 'hot' | 'top' | 'unanswered') => {
    setSortBy(newSort);
    setPage(1);
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3" />
                Community Forum
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Connect, share, and learn from fellow Sign Company owners
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Thread
            </button>
          </div>
        </div>
      </div>

      {/* Forum Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ChatBubbleLeftIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalThreads.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Threads</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalReplies.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Replies</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <FireIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.todayThreads.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Today's Threads</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search threads, topics, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200">
            Search
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleCategorySelect('All Categories')}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${selectedCategory === 'All Categories' ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">All Categories</p>
                </button>
                {forumCategories.map((category) => (
                  <div key={category.name} className="space-y-1">
                    <button
                      onClick={() => handleCategorySelect(category.name)}
                      className={`w-full group p-3 rounded-lg transition-colors ${selectedCategory === category.name ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                          <div className={`p-2 rounded-lg ${category.bg} dark:bg-opacity-20`}>
                            <category.icon className={`h-5 w-5 ${category.color}`} />
                          </div>
                          <div className="ml-3 text-left min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{category.name}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trending Tags */}
          {stats.trendingTags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <TagIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Trending Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.trendingTags.map((tag) => (
                  <button
                    key={tag.name}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    #{tag.name}
                    <span className="ml-1 text-gray-500 dark:text-gray-400">({tag.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <BellIcon className="h-4 w-4 mr-2 text-gray-400" />
                My Subscriptions
              </button>
              <button className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <BookmarkIcon className="h-4 w-4 mr-2 text-gray-400" />
                Bookmarked Threads
              </button>
              <button className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                Recent Activity
              </button>
            </div>
          </div>
        </div>

        {/* Thread List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Sorting Options */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleSortChange('latest')}
                  className={`text-sm font-medium pb-1 transition-colors ${sortBy === 'latest' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                  Latest
                </button>
                <button
                  onClick={() => handleSortChange('hot')}
                  className={`text-sm font-medium pb-1 transition-colors ${sortBy === 'hot' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                  Hot
                </button>
                <button
                  onClick={() => handleSortChange('top')}
                  className={`text-sm font-medium pb-1 transition-colors ${sortBy === 'top' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                  Top
                </button>
                <button
                  onClick={() => handleSortChange('unanswered')}
                  className={`text-sm font-medium pb-1 transition-colors ${sortBy === 'unanswered' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                  Unanswered
                </button>
              </div>
            </div>
          </div>

          {/* Threads */}
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                      <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No threads found. Be the first to start a discussion!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create First Thread
              </button>
            </div>
          ) : (
            threads.map((thread: any) => {
              const authorName = thread.author?.name || 'Unknown';
              const authorInitials = authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              const formattedDate = new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeAgo = (() => {
                const seconds = Math.floor((Date.now() - new Date(thread.createdAt).getTime()) / 1000);
                if (seconds < 60) return 'just now';
                if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
                if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
                if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
                return formattedDate;
              })();

              return (
                <div
                  key={thread._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Thread Header */}
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {authorInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <Link to={`/forum/thread/${thread._id}`}>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors flex items-center gap-2 line-clamp-2">
                                  {thread.isPinned && <FireIcon className="h-5 w-5 text-orange-500" />}
                                  {thread.isLocked && <LockSolidIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                                  {thread.title}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{authorName}</span>
                                <span>{thread.author?.role || 'Member'}</span>
                                <span>•</span>
                                <span>{timeAgo}</span>
                                <span>•</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 capitalize">
                                  {thread.category}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleBookmark(thread._id)}
                              className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <BookmarkIcon className="h-5 w-5 text-gray-400" />
                            </button>
                          </div>

                          {/* Thread Preview */}
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{thread.content}</p>

                          {/* Tags */}
                          {thread.tags && thread.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3">
                              {thread.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Thread Stats and Last Reply */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-3">
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
                              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                <EyeIcon className="h-4 w-4" />
                                {thread.views?.toLocaleString() || 0}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setReplyingToThread(thread);
                                  setShowReplyModal(true);
                                }}
                                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                              >
                                <ChatBubbleLeftIcon className="h-4 w-4" />
                                {thread.replyCount || 0}
                              </button>
                              <button
                                onClick={(e) => handleLikeThread(e, thread._id)}
                                className={`flex items-center gap-1 transition-colors cursor-pointer ${
                                  user && thread.likes?.includes(user._id)
                                    ? 'text-red-500 hover:text-red-600'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                                }`}
                              >
                                {user && thread.likes?.includes(user._id) ? (
                                  <HeartSolidIcon className="h-4 w-4" />
                                ) : (
                                  <HeartIcon className="h-4 w-4" />
                                )}
                                {thread.likes?.length || 0}
                              </button>
                            </div>
                            {thread.lastReply && (
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Last reply by <span className="font-medium text-gray-700 dark:text-gray-300">{thread.lastReply.author}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Load More */}
          {threads.length > 0 && page < totalPages && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Loading...' : 'Load More Threads'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Thread Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8">
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Thread</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thread Title *
                </label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter a descriptive title for your thread"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {newThread.title.length}/200 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={newThread.category}
                  onChange={(e) => setNewThread({ ...newThread, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="general">General Discussion</option>
                  <option value="technical">Technical Support</option>
                  <option value="marketing">Marketing & Sales</option>
                  <option value="operations">Operations</option>
                  <option value="equipment">Equipment</option>
                  <option value="suppliers">Suppliers</option>
                  <option value="help">Help & Questions</option>
                  <option value="announcements">Announcements</option>
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Write your thread content here... Be as detailed as possible to get better responses."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Type a tag and press Enter"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {newThread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newThread.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateThread}
                disabled={loading || !newThread.title || !newThread.content}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Creating...' : 'Create Thread'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal - Enhanced Threads Style */}
      {showReplyModal && replyingToThread && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowReplyModal(false);
            setReplyContent('');
            setReplyingToThread(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyContent('');
                  setReplyingToThread(null);
                }}
                className="text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Reply</h3>
              <button
                onClick={handlePostReply}
                disabled={!replyContent.trim() || submittingReply}
                className={`text-[15px] font-bold px-4 py-1.5 rounded-full transition-all ${
                  replyContent.trim() && !submittingReply
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {submittingReply ? 'Posting...' : 'Post'}
              </button>
            </div>

            {/* Original Thread with connecting line */}
            <div className="px-5 py-4">
              <div className="flex gap-3 relative">
                {/* Connecting line */}
                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                <div className="flex-shrink-0 relative z-10">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold ring-4 ring-white dark:ring-gray-800">
                    {replyingToThread.author?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">
                      {replyingToThread.author?.name || 'Unknown User'}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">·</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(replyingToThread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[15px] text-gray-900 dark:text-gray-100 line-clamp-3 mb-2">
                    {replyingToThread.content}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Replying to <span className="text-primary-600 dark:text-primary-400">
                      @{(replyingToThread.author?.name || 'unknown').toLowerCase().replace(/\s+/g, '')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Reply Input */}
              <div className="flex gap-3 pt-2">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                    {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </div>
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${replyingToThread.author?.name || 'Unknown User'}...`}
                    className="w-full min-h-[120px] max-h-[300px] p-0 mt-2 border-0 focus:ring-0 resize-none bg-transparent text-gray-900 dark:text-gray-100 text-[15px] placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                    autoFocus
                  />
                  {replyContent.length > 0 && (
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className={`text-xs font-medium ${
                        replyContent.length > 280 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {replyContent.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Forum;