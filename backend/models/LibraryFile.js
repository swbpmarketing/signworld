const mongoose = require('mongoose');

const libraryFileSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['hr', 'marketing', 'training', 'operations', 'forms', 'fonts', 'artwork', 'other'],
    default: 'other',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  downloads: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  downloadCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
  rejectionReason: {
    type: String,
    trim: true,
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    pages: Number,
  },
  thumbnail: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update download count when downloads array is modified
libraryFileSchema.pre('save', function(next) {
  this.downloadCount = this.downloads.length;
  this.updatedAt = Date.now();
  next();
});

// Performance indexes
libraryFileSchema.index({ category: 1, status: 1, isActive: 1 }); // Compound index for filtering
libraryFileSchema.index({ uploadedBy: 1 }); // For user's uploads
libraryFileSchema.index({ createdAt: -1 }); // For sorting by date
libraryFileSchema.index({ status: 1 }); // For pending approval queries
libraryFileSchema.index({ title: 'text', description: 'text' }); // Text search

module.exports = mongoose.model('LibraryFile', libraryFileSchema);