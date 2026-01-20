const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  query: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  resultCount: {
    type: Number,
    default: 0,
  },
  // Track which data types were searched
  dataTypes: [{
    type: String,
    enum: ['files', 'owners', 'events', 'forum', 'stories', 'suppliers', 'videos', 'equipment'],
  }],
  // Execution time in milliseconds
  executionTime: {
    type: Number,
  },
  // Store conversation messages for this search session
  conversation: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    searchResults: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
});

// Compound index for efficient user queries sorted by time
searchHistorySchema.index({ user: 1, timestamp: -1 });

// Index for autocomplete suggestions
searchHistorySchema.index({ query: 1, timestamp: -1 });

// TTL index - auto-delete searches older than 90 days (as per PRD requirement)
// 90 days = 90 * 24 * 60 * 60 = 7,776,000 seconds
searchHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
