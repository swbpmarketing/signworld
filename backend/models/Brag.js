const mongoose = require('mongoose');

const bragSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
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
  tags: [{
    type: String,
    enum: ['sales', 'growth', 'marketing', 'customer-service', 'operations', 'community', 'other'],
  }],
  featuredImage: String,
  images: [{
    url: String,
    caption: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  moderatorNotes: String,
  moderatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  moderatedAt: Date,
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  comments: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  views: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
bragSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  next();
});

// Indexes for better query performance
bragSchema.index({ isPublished: 1, status: 1, createdAt: -1 });
bragSchema.index({ author: 1, createdAt: -1 });
bragSchema.index({ tags: 1 });
bragSchema.index({ views: -1 });
bragSchema.index({ title: 'text', content: 'text' }); // Text search index

module.exports = mongoose.model('Brag', bragSchema);