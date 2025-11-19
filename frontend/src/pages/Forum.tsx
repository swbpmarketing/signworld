import { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon, LockClosedIcon as LockSolidIcon } from '@heroicons/react/24/solid';

interface ForumThread {
  id: number;
  title: string;
  author: string;
  authorAvatar: string;
  authorRole: string;
  category: string;
  subcategory?: string;
  createdAt: string;
  lastActivity: string;
  content: string;
  views: number;
  replies: number;
  likes: number;
  isPinned: boolean;
  isLocked: boolean;
  isBookmarked: boolean;
  tags: string[];
  lastReply?: {
    author: string;
    time: string;
  };
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

const threads: ForumThread[] = [
  {
    id: 1,
    title: "New vinyl cutting techniques that increased our efficiency by 40%",
    author: "David Martinez",
    authorAvatar: "DM",
    authorRole: "Owner - 5 years",
    category: "Technical Support",
    subcategory: "Equipment",
    createdAt: "2 hours ago",
    lastActivity: "5 minutes ago",
    content: "Hey everyone! I wanted to share some new techniques we've been using...",
    views: 1234,
    replies: 45,
    likes: 89,
    isPinned: true,
    isLocked: false,
    isBookmarked: false,
    tags: ["vinyl", "efficiency", "tips"],
    lastReply: {
      author: "Sarah Chen",
      time: "5 minutes ago"
    }
  },
  {
    id: 2,
    title: "Q1 2024 Marketing Strategies - What's Working for You?",
    author: "Lisa Thompson",
    authorAvatar: "LT",
    authorRole: "Owner - 8 years",
    category: "Business Growth",
    subcategory: "Marketing",
    createdAt: "1 day ago",
    lastActivity: "2 hours ago",
    content: "As we kick off Q1, I'm curious about what marketing strategies...",
    views: 892,
    replies: 32,
    likes: 67,
    isPinned: false,
    isLocked: false,
    isBookmarked: true,
    tags: ["marketing", "strategy", "2024"],
    lastReply: {
      author: "Mike Johnson",
      time: "2 hours ago"
    }
  },
  {
    id: 3,
    title: "ANNOUNCEMENT: New Partnership with 3M - Exclusive Discounts",
    author: "Sign Company Admin",
    authorAvatar: "SW",
    authorRole: "Administrator",
    category: "General Discussion",
    subcategory: "Announcements",
    createdAt: "3 days ago",
    lastActivity: "1 day ago",
    content: "We're excited to announce our new partnership with 3M...",
    views: 3456,
    replies: 78,
    likes: 234,
    isPinned: true,
    isLocked: true,
    isBookmarked: false,
    tags: ["partnership", "discount", "3M"],
    lastReply: {
      author: "John Davis",
      time: "1 day ago"
    }
  }
];

const trendingTags = [
  { name: "led-signs", count: 234 },
  { name: "vehicle-wraps", count: 189 },
  { name: "pricing", count: 156 },
  { name: "installation", count: 145 },
  { name: "marketing", count: 134 },
  { name: "equipment", count: 123 },
];

const Forum = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleBookmark = (threadId: number) => {
    // Handle bookmarking logic
    console.log('Bookmarking thread:', threadId);
  };

  return (
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
            <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Thread
            </button>
          </div>
        </div>
      </div>

      {/* Forum Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <UserGroupIcon className="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">1,234</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ChatBubbleLeftIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">5,678</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Threads</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <FireIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">89</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Today's Posts</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ClockIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">24/7</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Support Available</p>
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
                {forumCategories.map((category) => (
                  <div key={category.name} className="space-y-1">
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="w-full group"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center min-w-0">
                          <div className={`p-2 rounded-lg ${category.bg} dark:bg-opacity-20`}>
                            <category.icon className={`h-5 w-5 ${category.color}`} />
                          </div>
                          <div className="ml-3 text-left min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{category.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{category.count} threads</p>
                          </div>
                        </div>
                        {category.subcategories && (
                          expandedCategories.includes(category.name)
                            ? <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                            : <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    {category.subcategories && expandedCategories.includes(category.name) && (
                      <div className="ml-12 space-y-1">
                        {category.subcategories.map((sub) => (
                          <button
                            key={sub}
                            className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trending Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Trending Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
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
                <button className="text-sm font-medium text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 pb-1">
                  Latest
                </button>
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 pb-1">
                  Hot
                </button>
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 pb-1">
                  Top
                </button>
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 pb-1">
                  Unanswered
                </button>
              </div>
            </div>
          </div>

          {/* Threads */}
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Thread Header */}
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {thread.authorAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <Link to={`/forum/thread/${thread.id}`}>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors flex items-center gap-2 line-clamp-2">
                              {thread.isPinned && <FireIcon className="h-5 w-5 text-orange-500" />}
                              {thread.isLocked && <LockSolidIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                              {thread.title}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{thread.author}</span>
                            <span>{thread.authorRole}</span>
                            <span>•</span>
                            <span>{thread.createdAt}</span>
                            <span>•</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                              {thread.category}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleBookmark(thread.id)}
                          className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {thread.isBookmarked ? (
                            <BookmarkSolidIcon className="h-5 w-5 text-primary-600" />
                          ) : (
                            <BookmarkIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Thread Preview */}
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{thread.content}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3">
                        {thread.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Thread Stats and Last Reply */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-3">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <EyeIcon className="h-4 w-4" />
                            {thread.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <ChatBubbleLeftIcon className="h-4 w-4" />
                            {thread.replies}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <ChevronUpIcon className="h-4 w-4" />
                            {thread.likes}
                          </span>
                        </div>
                        {thread.lastReply && (
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-right sm:text-left">
                            Last reply by <span className="font-medium text-gray-700 dark:text-gray-300">{thread.lastReply.author}</span> {thread.lastReply.time}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Load More */}
          <div className="text-center pt-4">
            <button className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200">
              Load More Threads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;