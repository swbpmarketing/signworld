const mongoose = require('mongoose');

const conventionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
  },
  location: {
    venue: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  schedule: [{
    day: Date,
    events: [{
      time: String,
      title: String,
      description: String,
      speaker: String,
      room: String,
    }],
  }],
  registrationLink: String,
  registrationDeadline: Date,
  earlyBirdDeadline: Date,
  pricing: {
    earlyBird: Number,
    regular: Number,
    lateFee: Number,
  },
  sponsors: [{
    name: String,
    logo: String,
    level: {
      type: String,
      enum: ['platinum', 'gold', 'silver', 'bronze'],
    },
    website: String,
  }],
  documents: [{
    title: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  gallery: [{
    imageUrl: String,
    caption: String,
    year: Number,
  }],
  isActive: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  expectedAttendees: {
    type: Number,
    default: 0,
  },
  educationalSessions: {
    type: Number,
    default: 0,
  },
  exhibitors: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Convention', conventionSchema);