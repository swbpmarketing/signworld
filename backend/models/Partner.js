const mongoose = require('mongoose');

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
    required: [true, 'Please add a logo'],
  },
  category: {
    type: String,
    enum: ['materials', 'equipment', 'software', 'services', 'financing', 'insurance', 'other'],
    required: true,
  },
  country: {
    type: String,
    enum: ['USA', 'Canada'],
    required: true,
  },
  contact: {
    name: String,
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: String,
    website: String,
  },
  services: [{
    type: String,
    trim: true,
  }],
  specialOffers: [{
    title: String,
    description: String,
    validUntil: Date,
    code: String,
  }],
  documents: [{
    title: String,
    fileUrl: String,
    fileType: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
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
});

module.exports = mongoose.model('Partner', partnerSchema);