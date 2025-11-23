import { useState, useEffect } from 'react';
import {
  TrophyIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  FireIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface SuccessStory {
  id: number;
  title: string;
  author: string;
  authorAvatar: string;
  location: string;
  date: string;
  readTime: string;
  category: string;
  excerpt: string;
  content: string;
  metrics: {
    revenue?: string;
    growth?: string;
    timeframe?: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
  tags: string[];
  image: string;
}

const successStories: SuccessStory[] = [
  {
    id: 1,
    title: "From Zero to $1M: How We Built Our Sign Empire",
    author: "Sarah Johnson",
    authorAvatar: "SJ",
    location: "Phoenix, AZ",
    date: "2 days ago",
    readTime: "5 min read",
    category: "Growth Story",
    excerpt: "Starting with just one vinyl cutter in my garage, I built a thriving sign business that now serves over 500 clients across Arizona.",
    content: "Full story content here...",
    metrics: {
      revenue: "$1.2M",
      growth: "+340%",
      timeframe: "24 months"
    },
    likes: 234,
    comments: 45,
    isLiked: false,
    tags: ["growth", "startup", "inspiration"],
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80"
  },
  {
    id: 2,
    title: "Landing the City's Biggest Contract: A Step-by-Step Guide",
    author: "Michael Chen",
    authorAvatar: "MC",
    location: "Seattle, WA",
    date: "1 week ago",
    readTime: "8 min read",
    category: "Big Wins",
    excerpt: "How strategic networking and quality work helped us secure a $500K contract with the city for all municipal signage.",
    content: "Full story content here...",
    metrics: {
      revenue: "$500K",
      timeframe: "Single Contract"
    },
    likes: 189,
    comments: 32,
    isLiked: true,
    tags: ["contracts", "networking", "municipal"],
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"
  },
  {
    id: 3,
    title: "Innovation in Action: Our Award-Winning LED Display",
    author: "Emily Rodriguez",
    authorAvatar: "ER",
    location: "Miami, FL",
    date: "2 weeks ago",
    readTime: "6 min read",
    category: "Innovation",
    excerpt: "We developed a revolutionary weatherproof LED display system that won the Sign Company Innovation Award and transformed our business.",
    content: "Full story content here...",
    metrics: {
      growth: "+85%",
      timeframe: "6 months"
    },
    likes: 312,
    comments: 56,
    isLiked: false,
    tags: ["innovation", "technology", "awards"],
    image: "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800&q=80"
  },
  {
    id: 4,
    title: "Giving Back: Our Community Signage Project",
    author: "David Martinez",
    authorAvatar: "DM",
    location: "Austin, TX",
    date: "3 weeks ago",
    readTime: "4 min read",
    category: "Community Impact",
    excerpt: "We donated and installed new signage for 15 local nonprofits, strengthening our community ties and brand reputation.",
    content: "Full story content here...",
    metrics: {
      timeframe: "3 months"
    },
    likes: 156,
    comments: 28,
    isLiked: false,
    tags: ["community", "nonprofit", "giving-back"],
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80"
  },
  {
    id: 5,
    title: "Building a Dream Team: Our Hiring Success Story",
    author: "Lisa Thompson",
    authorAvatar: "LT",
    location: "Denver, CO",
    date: "1 month ago",
    readTime: "7 min read",
    category: "Team Building",
    excerpt: "How we grew from 2 to 25 employees in 18 months while maintaining our culture and quality standards.",
    content: "Full story content here...",
    metrics: {
      growth: "+1150%",
      timeframe: "18 months"
    },
    likes: 203,
    comments: 41,
    isLiked: true,
    tags: ["team", "culture", "growth"],
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
  },
  {
    id: 6,
    title: "Overcoming Supply Chain Challenges in 2023",
    author: "Robert Kim",
    authorAvatar: "RK",
    location: "Chicago, IL",
    date: "5 weeks ago",
    readTime: "6 min read",
    category: "Challenges Overcome",
    excerpt: "When material costs skyrocketed, we innovated our procurement process and found creative solutions to maintain profitability.",
    content: "Full story content here...",
    metrics: {
      revenue: "$2.3M",
      growth: "+15%",
      timeframe: "Despite challenges"
    },
    likes: 178,
    comments: 29,
    isLiked: false,
    tags: ["challenges", "innovation", "procurement"],
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80"
  }
];

const categories = [
  { name: 'All Stories', count: 156 },
  { name: 'Growth Story', count: 45 },
  { name: 'Big Wins', count: 32 },
  { name: 'Innovation', count: 28 },
  { name: 'Community Impact', count: 21 },
  { name: 'Team Building', count: 18 },
  { name: 'Challenges Overcome', count: 12 }
];

const Brags = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Stories');
  const [stories, setStories] = useState(successStories);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStories, setFilteredStories] = useState(successStories);

  // Filter stories when category or search changes
  const filterStories = () => {
    let filtered = [...stories];
    
    // Filter by category
    if (selectedCategory !== 'All Stories') {
      filtered = filtered.filter(story => story.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(story => 
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredStories(filtered);
  };

  // Apply filters when category or search changes
  useEffect(() => {
    filterStories();
  }, [selectedCategory, searchQuery, stories]);

  const handleLike = (storyId: number) => {
    setStories(stories.map(story => 
      story.id === storyId 
        ? { ...story, isLiked: !story.isLiked, likes: story.isLiked ? story.likes - 1 : story.likes + 1 }
        : story
    ));
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    // Scroll to top of stories when category changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <TrophyIcon className="h-8 w-8 mr-3" />
                Success Stories
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Celebrating achievements and milestones from our Sign Company community
              </p>
            </div>
            <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200">
              <PlusIcon className="h-5 w-5 mr-2" />
              Share Your Story
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <FireIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">156</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Success Stories</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <ChartBarIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">$45M</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Generated</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <SparklesIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">89</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Awards Won</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <StarIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">4.9</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Rating</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search success stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
            <FunnelIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
            Filter
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
            <nav className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium border-l-4 border-primary-600 dark:border-primary-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className={`text-sm ${
                    selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="lg:col-span-3 space-y-6">
          {filteredStories.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <TrophyIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No stories found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredStories.map((story) => (
            <article
              key={story.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col">
                <div className="w-full h-48 sm:h-64">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-6">
                  {/* Story Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                        {story.authorAvatar}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{story.author}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{story.location} • {story.date}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                      {story.category}
                    </span>
                  </div>

                  {/* Story Content */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{story.excerpt}</p>

                  {/* Metrics */}
                  {story.metrics && (
                    <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
                      {story.metrics.revenue && (
                        <div className="flex items-center text-xs sm:text-sm">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ChartBarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="ml-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                            <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">{story.metrics.revenue}</p>
                          </div>
                        </div>
                      )}
                      {story.metrics.growth && (
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="ml-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Growth</p>
                            <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">{story.metrics.growth}</p>
                          </div>
                        </div>
                      )}
                      {story.metrics.timeframe && (
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="ml-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Timeframe</p>
                            <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">{story.metrics.timeframe}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags and Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      {story.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleLike(story.id)}
                        className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        {story.isLiked ? (
                          <HeartSolidIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
                        ) : (
                          <HeartIcon className="h-5 w-5" />
                        )}
                        <span className="text-sm">{story.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <ChatBubbleLeftIcon className="h-5 w-5" />
                        <span className="text-sm">{story.comments}</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        <ShareIcon className="h-5 w-5" />
                      </button>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{story.readTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))
          )}

          {/* Load More */}
          <div className="text-center">
            <button className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200">
              Load More Stories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brags;