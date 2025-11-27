const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  }],
  isGroup: {
    type: Boolean,
    default: false,
  },
  groupName: {
    type: String,
    maxlength: [100, 'Group name cannot exceed 100 characters'],
  },
  groupAvatar: String,
  lastMessage: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastMessagePreview: {
    type: String,
    maxlength: 100,
  },
  unreadCounts: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    count: {
      type: Number,
      default: 0,
    },
  }],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
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

// Index for finding user's conversations
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Find or create a direct conversation between two users
conversationSchema.statics.findOrCreateDirect = async function(userId1, userId2) {
  // Sort IDs to ensure consistent lookup
  const participants = [userId1, userId2].sort();

  let conversation = await this.findOne({
    isGroup: false,
    participants: { $all: participants, $size: 2 },
  }).populate('participants', 'name email role avatar')
    .populate('lastMessage');

  if (!conversation) {
    conversation = await this.create({
      participants,
      isGroup: false,
      createdBy: userId1,
      unreadCounts: [
        { user: userId1, count: 0 },
        { user: userId2, count: 0 },
      ],
    });
    conversation = await conversation.populate('participants', 'name email role avatar');
  }

  return conversation;
};

// Update last message info
conversationSchema.methods.updateLastMessage = async function(message) {
  this.lastMessage = message._id;
  this.lastMessageAt = message.createdAt;
  this.lastMessagePreview = message.content.substring(0, 100);
  this.updatedAt = Date.now();

  // Increment unread count for all participants except sender
  this.unreadCounts.forEach(uc => {
    if (uc.user.toString() !== message.sender.toString()) {
      uc.count += 1;
    }
  });

  await this.save();
};

// Mark as read for a user
conversationSchema.methods.markAsRead = async function(userId) {
  const unreadEntry = this.unreadCounts.find(
    uc => uc.user.toString() === userId.toString()
  );
  if (unreadEntry) {
    unreadEntry.count = 0;
  }
  await this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
