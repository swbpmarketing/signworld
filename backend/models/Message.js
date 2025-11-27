const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
  },
  attachments: [{
    url: String,
    filename: String,
    fileType: String,
    fileSize: Number,
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for efficient message retrieval
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
