const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Please add a question'],
    trim: true,
  },
  answer: {
    type: String,
    required: [true, 'Please add an answer'],
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'billing', 'equipment', 'materials', 'operations', 'training', 'other'],
    default: 'general',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  helpful: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    visitorId: {
      type: String,
    },
    isHelpful: {
      type: Boolean,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  relatedFAQs: [{
    type: mongoose.Schema.ObjectId,
    ref: 'FAQ',
  }],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
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

// Calculate helpfulness percentage
faqSchema.virtual('helpfulnessScore').get(function() {
  if (this.helpful.length === 0) return null;
  const helpfulCount = this.helpful.filter(h => h.isHelpful).length;
  return Math.round((helpfulCount / this.helpful.length) * 100);
});

// Update timestamp
faqSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for text search
faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });

module.exports = mongoose.model('FAQ', faqSchema);
