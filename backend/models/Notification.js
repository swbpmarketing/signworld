const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'chat_message',           // New chat message
      'brag_post',              // New success story post
      'forum_post',             // New forum post
      'forum_reply',            // Reply to your forum post
      'equipment_listing',      // New equipment listing
      'equipment_inquiry',      // Inquiry about equipment
      'like',                   // Someone liked your post
      'comment',                // Someone commented on your post
      'new_video',              // New video posted
      'new_event',              // New event created
      'new_convention',         // New convention
      'event_reminder',         // Event reminder
      'mention',                // Someone mentioned you
      'system'                  // System notification
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Reference to the related entity
  referenceType: {
    type: String,
    enum: ['Message', 'Brag', 'ForumThread', 'Equipment', 'Video', 'Event', 'Convention', 'Comment', null]
  },
  referenceId: {
    type: mongoose.Schema.ObjectId,
    refPath: 'referenceType'
  },
  // For navigation
  link: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Ensure virtuals are included in JSON
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

// Static method to create and emit notification
notificationSchema.statics.createAndEmit = async function(io, notificationData) {
  const notification = await this.create(notificationData);

  // Populate sender info
  await notification.populate('sender', 'name firstName lastName profileImage');

  // Emit to the recipient's room
  if (io) {
    io.to(`user:${notificationData.recipient}`).emit('notification', notification);
  }

  return notification;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('Notification', notificationSchema);
