const mongoose = require('mongoose');

const equipmentStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    cartItems: {
      type: [
        {
          equipmentId: mongoose.Schema.Types.ObjectId,
          quantity: Number,
          addedAt: Date,
        },
      ],
      default: [],
    },
    wishlistItems: {
      type: [
        {
          equipmentId: mongoose.Schema.Types.ObjectId,
          addedAt: Date,
        },
      ],
      default: [],
    },
    quoteRequests: {
      type: [
        {
          equipmentId: mongoose.Schema.Types.ObjectId,
          requestedAt: Date,
          status: {
            type: String,
            enum: ['pending', 'quoted', 'accepted', 'declined'],
            default: 'pending',
          },
        },
      ],
      default: [],
    },
    favoriteVendors: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    stats: {
      cartAddCount: { type: Number, default: 0 },
      wishlistAddCount: { type: Number, default: 0 },
      quoteRequestCount: { type: Number, default: 0 },
      viewedEquipmentCount: { type: Number, default: 0 },
      estimatedSpend: { type: Number, default: 0 },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update lastUpdated on any change
equipmentStatsSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('EquipmentStats', equipmentStatsSchema);
