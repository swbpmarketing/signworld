const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // For YouTube videos
  youtubeId: {
    type: String,
  },
  youtubeUrl: {
    type: String,
  },
  // For uploaded videos
  videoUrl: {
    type: String,
  },
  videoSize: {
    type: Number,
  },
  thumbnail: String,
  thumbnailUrl: String,
  duration: String,
  presenter: {
    name: String,
    title: String,
    company: String,
  },
  category: {
    type: String,
    default: 'other',
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  topic: {
    type: String,
    trim: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Custom validation: must have either youtubeUrl or videoUrl
videoSchema.pre('validate', function(next) {
  if (!this.youtubeUrl && !this.videoUrl) {
    this.invalidate('youtubeUrl', 'Please provide either a YouTube URL or upload a video file');
  }
  next();
});

// Extract YouTube ID from URL if needed
videoSchema.pre('save', function(next) {
  if (this.youtubeUrl && !this.youtubeId) {
    const match = this.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match) {
      this.youtubeId = match[1];
    }
  }

  // Set thumbnail from YouTube if not provided and is YouTube video
  if (this.youtubeId && !this.thumbnail && !this.thumbnailUrl) {
    // Use hqdefault instead of maxresdefault for better compatibility
    this.thumbnail = `https://img.youtube.com/vi/${this.youtubeId}/hqdefault.jpg`;
  }

  next();
});

module.exports = mongoose.model('Video', videoSchema);
