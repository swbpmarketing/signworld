const mongoose = require('mongoose');
const Counter = require('./Counter');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters'],
  },
  companyName: {
    type: String,
    trim: true,
    maxlength: [255, 'Company name cannot be more than 255 characters'],
  },
  contactName: {
    type: String,
    trim: true,
  },
  contactEmail: {
    type: String,
    trim: true,
  },
  contactPhone: {
    type: String,
    trim: true,
  },
  attachments: [{
    url: String,
    filename: String,
    mimetype: String,
  }],
  category: {
    type: String,
    enum: ['general', 'billing', 'technical', 'account', 'equipment', 'business', 'other'],
    default: 'general',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'awaiting_response', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
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
    isAdminReply: {
      type: Boolean,
      default: false,
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
  resolvedAt: Date,
  closedAt: Date,
}, {
  timestamps: true,
});

// Pre-save hook: set resolvedAt/closedAt on status transitions & auto-generate ticketNumber
supportTicketSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = Date.now();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = Date.now();
    }
  }

  // Auto-generate ticketNumber for new tickets
  if (this.isNew && !this.ticketNumber) {
    const seq = await Counter.getNextSequence('supportTicket');
    this.ticketNumber = `TKT-${String(seq).padStart(3, '0')}`;
  }

  next();
});

// Handle findOneAndUpdate operations
supportTicketSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (!update) return next();

  const setUpdate = update.$set || update;
  const newStatus = setUpdate.status;

  if (newStatus === 'resolved') {
    this.set({ resolvedAt: Date.now() });
  }
  if (newStatus === 'closed') {
    this.set({ closedAt: Date.now() });
  }

  next();
});

// Indexes
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ author: 1, createdAt: -1 });
supportTicketSchema.index({ category: 1, status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ subject: 'text', description: 'text' });
supportTicketSchema.index({ ticketNumber: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
