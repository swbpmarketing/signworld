const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Video = require('../models/Video');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Sample videos
const sampleVideos = [
  {
    title: 'Getting Started with Large Format Printing',
    description: 'Learn the basics of large format printing, including file preparation, material selection, and color management.',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeId: 'dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: '20:45',
    category: 'training',
    tags: ['printing', 'large-format', 'beginner'],
    isFeatured: true,
    isActive: true,
    publishedAt: new Date('2024-01-15'),
    views: 2847,
    sortOrder: 1
  },
  {
    title: 'Advanced Vehicle Wrap Techniques',
    description: 'Master the art of vehicle wrapping with professional tips and techniques for complex curves and contours.',
    youtubeUrl: 'https://www.youtube.com/watch?v=J---aiyznGQ',
    youtubeId: 'J---aiyznGQ',
    duration: '30:20',
    category: 'technical',
    tags: ['vehicle-wrap', 'installation', 'advanced'],
    isFeatured: true,
    isActive: true,
    publishedAt: new Date('2024-02-10'),
    views: 1923,
    sortOrder: 2
  },
  {
    title: 'LED Sign Installation Safety',
    description: 'Critical safety protocols and best practices for installing LED and electrical signs.',
    youtubeUrl: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    youtubeId: '3JZ_D3ELwOQ',
    duration: '15:45',
    category: 'training',
    tags: ['led', 'safety', 'installation'],
    isFeatured: false,
    isActive: true,
    publishedAt: new Date('2024-03-05'),
    views: 3421,
    sortOrder: 3
  },
  {
    title: 'Color Matching and Proofing',
    description: 'Ensure accurate color reproduction with proper proofing techniques and color management workflows.',
    youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    youtubeId: 'kJQP7kiw5Fk',
    duration: '12:03',
    category: 'technical',
    tags: ['color', 'proofing', 'design'],
    isFeatured: false,
    isActive: true,
    publishedAt: new Date('2024-03-20'),
    views: 1567,
    sortOrder: 4
  },
  {
    title: 'Channel Letter Fabrication Basics',
    description: 'Step-by-step guide to fabricating channel letters from start to finish.',
    youtubeUrl: 'https://www.youtube.com/watch?v=lXMskKTw3Bc',
    youtubeId: 'lXMskKTw3Bc',
    duration: '35:45',
    category: 'technical',
    tags: ['channel-letters', 'fabrication', 'tutorial'],
    isFeatured: false,
    isActive: true,
    publishedAt: new Date('2024-04-12'),
    views: 2103,
    sortOrder: 5
  },
  {
    title: 'Customer Consultation Best Practices',
    description: 'Learn how to conduct effective customer consultations and close more sales.',
    youtubeUrl: 'https://www.youtube.com/watch?v=r_It_X7v-1E',
    youtubeId: 'r_It_X7v-1E',
    duration: '14:52',
    category: 'business',
    tags: ['sales', 'consultation', 'customer-service'],
    isFeatured: false,
    isActive: true,
    publishedAt: new Date('2024-05-08'),
    views: 1834,
    sortOrder: 6
  },
  {
    title: 'Vinyl Weeding Tips and Tricks',
    description: 'Save time and improve quality with these professional vinyl weeding techniques.',
    youtubeUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    youtubeId: '9bZkp7q19f0',
    duration: '9:27',
    category: 'training',
    tags: ['vinyl', 'weeding', 'tips'],
    isFeatured: false,
    isActive: true,
    publishedAt: new Date('2024-06-15'),
    views: 2456,
    sortOrder: 7
  },
  {
    title: 'Equipment Maintenance 101',
    description: 'Essential maintenance procedures to keep your sign equipment running smoothly.',
    youtubeUrl: 'https://www.youtube.com/watch?v=zNVQfWC_evg',
    youtubeId: 'zNVQfWC_evg',
    duration: '18:54',
    category: 'technical',
    tags: ['equipment', 'maintenance', 'care'],
    isFeatured: false,
    isActive: true,
    publishedAt: new Date('2024-07-22'),
    views: 1678,
    sortOrder: 8
  }
];

// Seed function
const seedVideos = async () => {
  try {
    await connectDB();

    console.log('Clearing existing videos...');
    await Video.deleteMany({});

    console.log('Seeding new videos...');
    const videos = await Video.create(sampleVideos);

    console.log(`✅ Successfully created ${videos.length} videos!`);
    console.log('\nVideo library has been populated.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding videos:', error);
    process.exit(1);
  }
};

// Run seeder
seedVideos();
