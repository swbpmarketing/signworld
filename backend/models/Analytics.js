const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'profile_view',
        'inquiry_sent',
        'inquiry_received',
        'contact_click',
        'resource_download',
        'equipment_cart_add',
        'equipment_wishlist_add',
        'equipment_quote_request',
        'forum_post_created',
        'forum_reply_created',
        'forum_post_viewed',
        'video_viewed',
        'chat_message_sent',
        'page_visit',
        'content_like',
        'content_comment',
      ],
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['equipment', 'video', 'forum', 'library', 'event', 'user', 'other'],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      duration: Number, // in seconds (for video views, page visits)
      viewCount: { type: Number, default: 1 },
      ipAddress: String,
      userAgent: String,
      pageUrl: String,
    },
    isEngagement: {
      type: Boolean,
      default: false, // true if user took action (clicked, download, etc)
    },
    description: String,
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
analyticsSchema.index({ userId: 1, createdAt: -1 });
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ resourceType: 1, createdAt: -1 });

// TTL index to auto-delete events older than 1 year
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('Analytics', analyticsSchema);
