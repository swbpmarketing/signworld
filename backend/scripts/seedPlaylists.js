const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Playlist = require('../models/Playlist');
const Video = require('../models/Video');

const samplePlaylists = [
  {
    name: 'New Owner Essentials',
    description: 'Everything you need to know to get started with your sign business',
    isPublic: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Advanced Techniques',
    description: 'Master advanced sign making and installation techniques',
    isPublic: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Marketing Mastery',
    description: 'Learn how to market your sign business effectively',
    isPublic: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Equipment Maintenance',
    description: 'Keep your equipment running smoothly with these maintenance guides',
    isPublic: true,
    isActive: true,
    sortOrder: 4,
  },
  {
    name: 'Vehicle Wrap Training',
    description: 'Complete guide to vehicle wraps from start to finish',
    isPublic: true,
    isActive: true,
    sortOrder: 5,
  },
];

const seedPlaylists = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing videos to add to playlists
    const videos = await Video.find({ isActive: true }).limit(20);
    console.log(`Found ${videos.length} videos to potentially add to playlists`);

    // Clear existing playlists
    await Playlist.deleteMany({});
    console.log('Cleared existing playlists');

    // Create playlists and distribute videos
    for (let i = 0; i < samplePlaylists.length; i++) {
      const playlistData = samplePlaylists[i];

      // Add some videos to each playlist (distribute evenly)
      const startIdx = Math.floor((i / samplePlaylists.length) * videos.length);
      const endIdx = Math.floor(((i + 1) / samplePlaylists.length) * videos.length);
      const playlistVideos = videos.slice(startIdx, endIdx).map(v => v._id);

      const playlist = await Playlist.create({
        ...playlistData,
        videos: playlistVideos,
      });

      console.log(`Created playlist: ${playlist.name} with ${playlistVideos.length} videos`);
    }

    console.log('\n✅ Playlists seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding playlists:', error);
    process.exit(1);
  }
};

seedPlaylists();
