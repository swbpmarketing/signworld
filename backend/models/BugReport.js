const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  stepsToReproduce: {
    type: String,
    default: '',
  },
  expectedBehavior: {
    type: String,
    default: '',
  },
  actualBehavior: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['bug', 'feature'],
    default: 'bug',
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'rejected', 'completed'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  attachments: [{
    url: String,
    filename: String,
    mimetype: String,
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
  votes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  adminNotes: String,
  resolvedAt: Date,
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
bugReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'completed' && !this.resolvedAt) {
    this.resolvedAt = Date.now();
  }
  next();
});

// Indexes for better query performance
bugReportSchema.index({ status: 1, createdAt: -1 });
bugReportSchema.index({ author: 1, createdAt: -1 });
bugReportSchema.index({ type: 1, status: 1 });
bugReportSchema.index({ priority: 1 });
bugReportSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('BugReport', bugReportSchema);
