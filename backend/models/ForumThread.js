const mongoose = require('mongoose');

const forumThreadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'marketing', 'operations', 'equipment', 'suppliers', 'help', 'announcements'],
    default: 'general',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  images: [{
    type: String, // S3 URLs
  }],
  isPinned: {
    type: Boolean,
    default: false,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  replies: [{
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    parentReplyId: {
      type: mongoose.Schema.ObjectId,
      default: null,
    },
    likes: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  }],
  views: {
    type: Number,
    default: 0,
  },
  recentViewers: [{
    identifier: String, // userId or IP address
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  subscribers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  lastReplyAt: Date,
  lastReplyBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp and lastReplyAt
forumThreadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.replies.length > 0) {
    this.lastReplyAt = this.replies[this.replies.length - 1].createdAt;
    this.lastReplyBy = this.replies[this.replies.length - 1].author;
  }
  next();
});

// Performance indexes
forumThreadSchema.index({ category: 1, status: 1 }); // For category filtering
forumThreadSchema.index({ author: 1 }); // For user's threads
forumThreadSchema.index({ createdAt: -1 }); // For sorting by date
forumThreadSchema.index({ lastReplyAt: -1 }); // For sorting by activity
forumThreadSchema.index({ isPinned: -1, lastReplyAt: -1 }); // For pinned threads first
forumThreadSchema.index({ title: 'text', content: 'text' }); // Text search

module.exports = mongoose.model('ForumThread', forumThreadSchema);