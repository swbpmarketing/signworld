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
    day: String,
    events: [{
      time: String,
      title: String,
      description: String,
      speaker: String,
      location: String,
      type: {
        type: String,
        enum: ['keynote', 'workshop', 'networking', 'meal', 'exhibition'],
        default: 'keynote'
      }
    }],
  }],
  speakers: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    day: String,
    time: String,
    email: String,
    linkedin: String,
    twitter: String,
    website: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  registrationLink: String,
  registrationDeadline: Date,
  earlyBirdDeadline: Date,
  pricing: {
    earlyBird: Number,
    regular: Number,
    lateFee: Number,
  },
  registrationOptions: [{
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  }],
  earlyBirdDiscount: {
    type: Number,
    default: 0,
  },
  earlyBirdMessage: String,
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