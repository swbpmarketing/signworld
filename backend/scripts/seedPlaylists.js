const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Playlist = require('../models/Playlist');
const Video = require('../models/Video');

// Category display names and descriptions
const categoryConfig = {
  'training': {
    name: 'Installation Training',
    description: 'Master installation techniques for signs and vehicle wraps'
  },
  'marketing': {
    name: 'Vehicle Wraps & Marketing',
    description: 'Learn how to market your sign business and create stunning vehicle wraps'
  },
  'technical': {
    name: 'Technical Training',
    description: 'Technical skills and best practices for sign professionals'
  },
  'business': {
    name: 'Business Growth',
    description: 'Grow your sign business with proven strategies and insights'
  },
  'product-demo': {
    name: 'Product Demonstrations',
    description: 'See our products and materials in action'
  },
  'webinar': {
    name: 'Webinars & Workshops',
    description: 'Live sessions and recorded webinars from industry experts'
  },
  'other': {
    name: 'General Topics',
    description: 'Miscellaneous tips, tricks, and industry insights'
  }
};

const seedPlaylists = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all active videos
    const videos = await Video.find({ isActive: true });
    console.log(`Found ${videos.length} total videos`);

    // Get unique categories from existing videos
    const categories = [...new Set(videos.map(v => v.category))].filter(Boolean);
    console.log(`Found ${categories.length} unique categories:`, categories);

    // Clear existing playlists
    await Playlist.deleteMany({});
    console.log('Cleared existing playlists');

    // Create playlists dynamically based on categories
    let sortOrder = 1;
    for (const category of categories) {
      // Get all videos in this category
      const categoryVideos = videos.filter(v => v.category === category);

      if (categoryVideos.length === 0) continue;

      // Get config for this category, or create default
      const config = categoryConfig[category] || {
        name: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
        description: `Videos about ${category.replace(/-/g, ' ')}`
      };

      const playlist = await Playlist.create({
        name: config.name,
        description: config.description,
        videos: categoryVideos.map(v => v._id),
        isPublic: true,
        isActive: true,
        sortOrder: sortOrder++,
      });

      console.log(`✅ Created playlist: "${playlist.name}" with ${categoryVideos.length} videos`);
    }

    // Create a "Featured" playlist with featured videos
    const featuredVideos = videos.filter(v => v.isFeatured);
    if (featuredVideos.length > 0) {
      const featuredPlaylist = await Playlist.create({
        name: 'Featured Videos',
        description: 'Our top recommended videos to get you started',
        videos: featuredVideos.map(v => v._id),
        isPublic: true,
        isActive: true,
        sortOrder: 0, // Show first
      });
      console.log(`✅ Created playlist: "${featuredPlaylist.name}" with ${featuredVideos.length} videos`);
    }

    // Create a "Most Popular" playlist with most viewed videos
    const popularVideos = videos
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10);

    if (popularVideos.length > 0) {
      const popularPlaylist = await Playlist.create({
        name: 'Most Popular',
        description: 'The most watched videos by our community',
        videos: popularVideos.map(v => v._id),
        isPublic: true,
        isActive: true,
        sortOrder: sortOrder++,
      });
      console.log(`✅ Created playlist: "${popularPlaylist.name}" with ${popularVideos.length} videos`);
    }

    console.log('\n✅ Playlists seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding playlists:', error);
    process.exit(1);
  }
};

seedPlaylists();
