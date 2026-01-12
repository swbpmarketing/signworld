const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a folder name'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Folder must belong to a category'],
  },
  parentFolder: {
    type: mongoose.Schema.ObjectId,
    ref: 'Folder',
    default: null, // null means it's a top-level folder in the category
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  deletedAt: {
    type: Date,
    default: null,
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

// Ensure unique folder names per parent (or category for root folders)
folderSchema.index({ category: 1, parentFolder: 1, name: 1 }, { unique: true, sparse: true });
folderSchema.index({ category: 1, parentFolder: 1, isActive: 1, deletedAt: 1 }); // For retrieving active folders
folderSchema.index({ createdBy: 1 }); // For user's folders

// Update updatedAt before saving
folderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Folder', folderSchema);
