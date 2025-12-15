const mongoose = require('mongoose');

const satisfactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ratedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['vendor', 'product', 'service', 'interaction'],
      default: 'interaction',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: String,
    categories: {
      professionalism: { type: Number, min: 1, max: 5 },
      responsiveness: { type: Number, min: 1, max: 5 },
      quality: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
    },
    isAnonymous: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for quick queries
satisfactionSchema.index({ userId: 1, createdAt: -1 });
satisfactionSchema.index({ ratedUserId: 1, createdAt: -1 });
satisfactionSchema.index({ rating: 1 });

module.exports = mongoose.model('Satisfaction', satisfactionSchema);
