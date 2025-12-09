const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const partnerSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  name: {
    type: String,
    required: [true, 'Please add a partner name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  logo: {
    type: String,
    default: '',
  },
  logoUrl: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['Materials & Supplies', 'Equipment', 'Distributor', 'Services', 'Software', 'Financing', 'Insurance', 'Other'],
    required: true,
  },
  country: {
    type: String,
    enum: ['USA', 'Canada', 'Both'],
    default: 'USA',
  },
  contact: {
    contactPerson: String,
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: String,
    website: String,
    address: String,
  },
  specialties: [{
    type: String,
    trim: true,
  }],
  benefits: [{
    type: String,
    trim: true,
  }],
  discount: {
    type: String,
    default: '',
  },
  yearEstablished: {
    type: Number,
  },
  locations: {
    type: Number,
    default: 1,
  },
  specialOffers: [{
    title: String,
    description: String,
    validUntil: Date,
    code: String,
    discountPercent: Number,
  }],
  documents: [{
    title: String,
    fileUrl: String,
    fileType: String,
  }],
  reviews: [reviewSchema],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  // Analytics tracking
  profileViews: {
    type: Number,
    default: 0,
  },
  viewHistory: [{
    date: { type: Date, default: Date.now },
    count: { type: Number, default: 1 },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate average rating before saving
partnerSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.reviewCount = this.reviews.length;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Partner', partnerSchema);
