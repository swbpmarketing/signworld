const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  name: {
    type: String,
    required: [true, 'Please add equipment name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  brand: {
    type: String,
    required: [true, 'Please add a brand'],
    trim: true,
  },
  model: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: [
      'large-format-printers',
      'vinyl-cutters',
      'cnc-routers',
      'channel-letter',
      'welding',
      'vehicles',
      'heat-transfer',
      'laminators',
      'led-lighting',
      'digital-displays',
      'hand-tools',
      'safety-equipment',
      'software',
      'materials',
      'other'
    ],
    required: true,
  },
  specifications: {
    type: Map,
    of: String,
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
  }],
  // Primary image URL for easy access
  image: {
    type: String,
  },
  documents: [{
    title: String,
    fileUrl: String,
    fileType: String,
  }],
  price: {
    type: String,
    required: true,
  },
  priceNote: {
    type: String,
  },
  availability: {
    type: String,
    enum: ['in-stock', 'out-of-stock', 'pre-order', 'discontinued'],
    default: 'in-stock',
  },
  // Rating system
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  // Additional info
  warranty: {
    type: String,
    default: '1 Year',
  },
  leadTime: {
    type: String,
    default: 'Ships in 1-2 weeks',
  },
  features: [{
    type: String,
    trim: true,
  }],
  inquiries: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    name: String,
    email: String,
    company: String,
    phone: String,
    message: String,
    status: {
      type: String,
      enum: ['new', 'contacted', 'completed', 'cancelled'],
      default: 'new',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  relatedProducts: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Equipment',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isNewArrival: {
    type: Boolean,
    default: false,
  },
  sortOrder: {
    type: Number,
    default: 0,
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

// Update timestamp
equipmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
equipmentSchema.index({ name: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Equipment', equipmentSchema);
