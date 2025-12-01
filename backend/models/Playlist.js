const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a playlist name'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  videos: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Video',
  }],
  thumbnail: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for video count
playlistSchema.virtual('videoCount').get(function() {
  return this.videos ? this.videos.length : 0;
});

// Virtual for total duration (calculated when populated)
playlistSchema.virtual('totalDuration').get(function() {
  if (!this.videos || this.videos.length === 0) return '0m';

  let totalMinutes = 0;
  this.videos.forEach(video => {
    if (video.duration) {
      // Parse duration like "12:30" or "1:30:00"
      const parts = video.duration.split(':').map(Number);
      if (parts.length === 2) {
        totalMinutes += parts[0] + parts[1] / 60;
      } else if (parts.length === 3) {
        totalMinutes += parts[0] * 60 + parts[1] + parts[2] / 60;
      }
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Ensure virtuals are included in JSON
playlistSchema.set('toJSON', { virtuals: true });
playlistSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Playlist', playlistSchema);
