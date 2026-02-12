const mongoose = require('mongoose');
const Counter = require('./Counter');

const bugReportSchema = new mongoose.Schema({
  taskNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
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
      default: '',
    },
    attachments: [{
      url: String,
      filename: String,
      mimetype: String,
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    editedAt: {
      type: Date,
      default: null,
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
bugReportSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'completed' && !this.resolvedAt) {
    this.resolvedAt = Date.now();
  }

  // Auto-generate taskNumber for new reports
  if (this.isNew && !this.taskNumber) {
    const seq = await Counter.getNextSequence('bugReport');
    const prefix = this.type === 'feature' ? 'FR' : 'BUG';
    this.taskNumber = `${prefix}-${String(seq).padStart(3, '0')}`;
  }

  next();
});

// Handle findByIdAndUpdate and findOneAndUpdate operations
bugReportSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (!update) return next();

  // Handle both direct updates and $set operator
  const setUpdate = update.$set || update;

  // Always update the timestamp
  this.set({ updatedAt: Date.now() });

  // Only set resolvedAt if status is being set to completed AND resolvedAt isn't already being set
  const newStatus = setUpdate.status;
  const hasResolvedAt = setUpdate.resolvedAt || (update.$set && update.$set.resolvedAt);
  if (newStatus === 'completed' && !hasResolvedAt) {
    this.set({ resolvedAt: Date.now() });
  }

  next();
});

// Indexes for better query performance
bugReportSchema.index({ status: 1, createdAt: -1 });
bugReportSchema.index({ author: 1, createdAt: -1 });
bugReportSchema.index({ type: 1, status: 1 });
bugReportSchema.index({ priority: 1 });
bugReportSchema.index({ title: 'text', description: 'text' });
bugReportSchema.index({ taskNumber: 1 });

module.exports = mongoose.model('BugReport', bugReportSchema);
