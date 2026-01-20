const axios = require('axios');
const cache = require('../utils/cache');

class SearchService {
  constructor() {
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY;
    this.openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  async performAISearch(query, userId) {
    const cacheKey = `search:${userId}:${query}`;
    const cachedResult = await cache.get(cacheKey);
    
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    try {
      // Parse user intent with AI
      const intent = await this.parseSearchIntent(query);
      
      // Perform searches based on intent
      const results = await this.executeSearch(intent);
      
      // Cache results
      await cache.set(cacheKey, JSON.stringify(results), 900); // 15 minutes
      
      // Save to search history
      await this.saveSearchHistory(userId, query);
      
      return results;
    } catch (error) {
      console.error('AI Search error:', error);
      // Fallback to basic search
      return this.performBasicSearch(query);
    }
  }

  async parseSearchIntent(query) {
    try {
      const response = await axios.post(
        this.openRouterUrl,
        {
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: `You are a search intent parser for a sign company dashboard. Parse the user's query and return a JSON object with:
                - dataTypes: array of types to search (files, owners, events, forum, stories, videos, equipment, suppliers)
                - filters: object with specific filters (dateRange, location, tags, etc.)
                - keywords: array of important keywords
                - sortBy: how to sort results (relevance, date, popularity)`
            },
            {
              role: 'user',
              content: query
            }
          ],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'https://sign-company.onrender.com',
            'X-Title': 'Sign Company Dashboard'
          }
        }
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Intent parsing error:', error);
      // Fallback intent
      return {
        dataTypes: ['files', 'owners', 'events', 'forum', 'stories', 'videos', 'equipment', 'suppliers'],
        filters: {},
        keywords: query.split(' ').filter(w => w.length > 2),
        sortBy: 'relevance'
      };
    }
  }

  async executeSearch(intent) {
    const searches = [];

    // Search different data types in parallel
    if (intent.dataTypes.includes('files')) {
      searches.push(this.searchFiles(intent));
    }
    if (intent.dataTypes.includes('owners')) {
      searches.push(this.searchOwners(intent));
    }
    if (intent.dataTypes.includes('events')) {
      searches.push(this.searchEvents(intent));
    }
    if (intent.dataTypes.includes('forum')) {
      searches.push(this.searchForum(intent));
    }
    if (intent.dataTypes.includes('stories')) {
      searches.push(this.searchStories(intent));
    }
    if (intent.dataTypes.includes('videos')) {
      searches.push(this.searchVideos(intent));
    }
    if (intent.dataTypes.includes('equipment')) {
      searches.push(this.searchEquipment(intent));
    }
    if (intent.dataTypes.includes('suppliers')) {
      searches.push(this.searchSuppliers(intent));
    }

    const results = await Promise.all(searches);
    return this.mergeAndRankResults(results.flat(), intent);
  }

  async searchFiles(intent) {
    const LibraryFile = require('../models/LibraryFile');
    const query = this.buildMongoQuery(intent, ['title', 'fileName', 'description', 'tags']);

    const files = await LibraryFile.find(query)
      .limit(10)
      .sort(this.getSortCriteria(intent.sortBy));

    return files.map(file => ({
      id: file._id,
      type: 'file',
      category: 'files',
      title: file.fileName || file.title || 'Untitled',
      description: file.description,
      link: `/library?id=${file._id}`,
      metadata: {
        size: file.fileSize,
        type: file.fileType,
        date: file.createdAt,
        downloads: file.downloadCount
      },
      score: this.calculateRelevanceScore(file, intent)
    }));
  }

  async searchOwners(intent) {
    const User = require('../models/User');
    const query = this.buildMongoQuery(intent, ['name', 'company', 'specialties', 'address.city', 'address.state']);
    query.role = 'owner'; // Only search owners

    if (intent.filters.location) {
      query.$or = query.$or || [];
      query.$or.push(
        { 'address.city': new RegExp(intent.filters.location, 'i') },
        { 'address.state': new RegExp(intent.filters.location, 'i') }
      );
    }

    const owners = await User.find(query)
      .limit(10)
      .sort(this.getSortCriteria(intent.sortBy));

    return owners.map(owner => ({
      id: owner._id,
      type: 'owner',
      category: 'owners',
      title: owner.name,
      description: `${owner.company || ''} - ${owner.address?.city || ''}, ${owner.address?.state || ''}`,
      link: `/owners/${owner._id}`,
      metadata: {
        specialties: owner.specialties,
        company: owner.company,
        author: owner.name
      },
      score: this.calculateRelevanceScore(owner, intent)
    }));
  }

  async searchEvents(intent) {
    const Event = require('../models/Event');
    const query = this.buildMongoQuery(intent, ['title', 'description', 'location']);

    if (intent.filters.dateRange) {
      query.date = this.parseDateRange(intent.filters.dateRange);
    }

    const events = await Event.find(query)
      .limit(10)
      .sort(this.getSortCriteria(intent.sortBy));

    return events.map(event => ({
      id: event._id,
      type: 'event',
      category: 'events',
      title: event.title,
      description: event.description,
      link: `/calendar?id=${event._id}`,
      metadata: {
        date: event.date,
        location: event.location,
        attendees: event.attendees?.length || 0
      },
      score: this.calculateRelevanceScore(event, intent)
    }));
  }

  async searchForum(intent) {
    const ForumThread = require('../models/ForumThread');
    const query = this.buildMongoQuery(intent, ['title', 'content', 'tags']);

    const posts = await ForumThread.find(query)
      .populate('author', 'name')
      .limit(10)
      .sort(this.getSortCriteria(intent.sortBy));

    return posts.map(post => ({
      id: post._id,
      type: 'forum',
      category: 'forum',
      title: post.title,
      description: post.content.substring(0, 150) + '...',
      link: `/forum/thread/${post._id}`,
      metadata: {
        author: post.author?.name,
        date: post.createdAt,
        replies: post.replies?.length || 0,
        views: post.views
      },
      score: this.calculateRelevanceScore(post, intent)
    }));
  }

  async searchStories(intent) {
    const Brag = require('../models/Brag');
    const query = this.buildMongoQuery(intent, ['title', 'content', 'tags']);

    const stories = await Brag.find(query)
      .populate('author', 'name')
      .limit(10)
      .sort(this.getSortCriteria(intent.sortBy));

    return stories.map(story => ({
      id: story._id,
      type: 'story',
      category: 'stories',
      title: story.title,
      description: story.summary || story.content.substring(0, 150) + '...',
      link: `/brags?id=${story._id}`,
      metadata: {
        author: story.author?.name,
        date: story.createdAt,
        category: story.category
      },
      score: this.calculateRelevanceScore(story, intent)
    }));
  }

  async searchVideos(intent) {
    const Video = require('../models/Video');
    const query = this.buildMongoQuery(intent, ['title', 'description', 'tags']);

    const videos = await Video.find(query)
      .limit(10)
      .sort(this.getSortCriteria(intent.sortBy));

    return videos.map(video => ({
      id: video._id,
      type: 'video',
      category: 'videos',
      title: video.title || 'Untitled Video',
      description: video.description,
      link: `/videos?id=${video._id}`,
      metadata: {
        category: video.category,
        views: video.views,
        date: video.createdAt
      },
      score: this.calculateRelevanceScore(video, intent)
    }));
  }

  async searchEquipment(intent) {
    const Equipment = require('../models/Equipment');
    const query = this.buildMongoQuery(intent, ['name', 'description', 'brand', 'category']);

    const equipment = await Equipment.find(query)
      .limit(10)
      .sort(this.getSortCriteria(intent.sortBy));

    return equipment.map(item => ({
      id: item._id,
      type: 'equipment',
      category: 'equipment',
      title: item.name || 'Untitled Equipment',
      description: item.description,
      link: `/equipment/${item._id}`,
      metadata: {
        brand: item.brand,
        model: item.model,
        category: item.category,
        date: item.createdAt
      },
      score: this.calculateRelevanceScore(item, intent)
    }));
  }

  async searchSuppliers(intent) {
    const Partner = require('../models/Partner');
    const query = this.buildMongoQuery(intent, ['name', 'description', 'category']);

    const suppliers = await Partner.find(query)
      .populate('vendorId', 'name')
      .limit(10)
      .sort(this.getSortCriteria(intent.sortBy));

    return suppliers.map(supplier => ({
      id: supplier._id,
      type: 'supplier',
      category: 'suppliers',
      title: supplier.name || 'Untitled Supplier',
      description: supplier.description,
      link: `/partners?id=${supplier._id}`,
      metadata: {
        category: supplier.category,
        vendor: supplier.vendorId?.name,
        date: supplier.createdAt
      },
      score: this.calculateRelevanceScore(supplier, intent)
    }));
  }

  buildMongoQuery(intent, searchFields) {
    const query = {};
    
    if (intent.keywords && intent.keywords.length > 0) {
      query.$or = searchFields.map(field => ({
        [field]: { $regex: intent.keywords.join('|'), $options: 'i' }
      }));
    }

    if (intent.filters.tags && intent.filters.tags.length > 0) {
      query.tags = { $in: intent.filters.tags };
    }

    return query;
  }

  getSortCriteria(sortBy) {
    const sortMap = {
      relevance: { score: -1, createdAt: -1 },
      date: { createdAt: -1 },
      popularity: { views: -1, createdAt: -1 }
    };
    return sortMap[sortBy] || sortMap.relevance;
  }

  calculateRelevanceScore(item, intent) {
    let score = 0;
    const itemText = JSON.stringify(item).toLowerCase();
    
    intent.keywords.forEach(keyword => {
      if (itemText.includes(keyword.toLowerCase())) {
        score += 10;
      }
    });

    // Boost recent items
    const daysSinceCreated = (Date.now() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) score += 5;
    if (daysSinceCreated < 30) score += 3;

    return score;
  }

  mergeAndRankResults(results, intent) {
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  async performBasicSearch(query) {
    // Fallback to simple keyword search
    const keywords = query.split(' ').filter(w => w.length > 2);
    const intent = {
      dataTypes: ['files', 'owners', 'events', 'forum', 'stories', 'videos', 'equipment', 'suppliers'],
      filters: {},
      keywords,
      sortBy: 'relevance'
    };

    return this.executeSearch(intent);
  }

  parseDateRange(dateRange) {
    const now = new Date();
    const ranges = {
      'last month': {
        $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        $lt: new Date(now.getFullYear(), now.getMonth(), 1)
      },
      'this month': {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: now
      },
      'last week': {
        $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        $lte: now
      },
      'Q1': {
        $gte: new Date(now.getFullYear(), 0, 1),
        $lt: new Date(now.getFullYear(), 3, 1)
      },
      'Q2': {
        $gte: new Date(now.getFullYear(), 3, 1),
        $lt: new Date(now.getFullYear(), 6, 1)
      },
      'Q3': {
        $gte: new Date(now.getFullYear(), 6, 1),
        $lt: new Date(now.getFullYear(), 9, 1)
      },
      'Q4': {
        $gte: new Date(now.getFullYear(), 9, 1),
        $lt: new Date(now.getFullYear() + 1, 0, 1)
      }
    };

    return ranges[dateRange] || { $gte: new Date(now.getFullYear(), 0, 1) };
  }

  async saveSearchHistory(userId, query, conversation = []) {
    const SearchHistory = require('../models/SearchHistory');

    await SearchHistory.create({
      user: userId,
      query,
      conversation,
      timestamp: new Date()
    });

    // Keep only last 100 searches per user
    const count = await SearchHistory.countDocuments({ user: userId });
    if (count > 100) {
      const oldestSearches = await SearchHistory
        .find({ user: userId })
        .sort({ timestamp: 1 })
        .limit(count - 100);

      await SearchHistory.deleteMany({
        _id: { $in: oldestSearches.map(s => s._id) }
      });
    }
  }

  async getSuggestions(query, limit = 5) {
    const SearchHistory = require('../models/SearchHistory');
    
    const suggestions = await SearchHistory.aggregate([
      {
        $match: {
          query: { $regex: `^${query}`, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      }
    ]);

    return suggestions.map(s => s._id);
  }

  async getRecentSearches(userId, limit = 10) {
    const SearchHistory = require('../models/SearchHistory');

    const searches = await SearchHistory
      .find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('query conversation timestamp')
      .lean();

    return searches;
  }

  async getPopularSearches(limit = 10) {
    const SearchHistory = require('../models/SearchHistory');
    
    const popular = await SearchHistory.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      }
    ]);

    return popular.map(p => ({
      query: p._id,
      count: p.count
    }));
  }
}

module.exports = new SearchService();