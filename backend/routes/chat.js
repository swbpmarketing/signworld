const express = require('express');
const router = express.Router();
const multer = require('multer');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { uploadToS3 } = require('../utils/s3');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
});

// @desc    Get all conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    })
      .populate('participants', 'name email role avatar')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    // Format conversations with unread counts for current user
    const formattedConversations = conversations.map(conv => {
      const unreadEntry = conv.unreadCounts.find(
        uc => uc.user.toString() === req.user._id.toString()
      );

      // Get the other participant for direct chats
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== req.user._id.toString()
      );

      return {
        _id: conv._id,
        participants: conv.participants,
        otherParticipant,
        isGroup: conv.isGroup,
        groupName: conv.groupName,
        groupAvatar: conv.groupAvatar,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        lastMessagePreview: conv.lastMessagePreview,
        unreadCount: unreadEntry?.count || 0,
        createdAt: conv.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
    });
  }
});

// @desc    Get or create conversation with a user
// @route   POST /api/chat/conversations
// @access  Private
router.post('/conversations', protect, async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        error: 'Participant ID is required',
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Find or create direct conversation
    const conversation = await Conversation.findOrCreateDirect(
      req.user._id,
      participantId
    );

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation',
    });
  }
});

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
router.get('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Get messages with pagination (newest first for infinite scroll)
    const messages = await Message.find({
      conversation: req.params.id,
      isDeleted: false,
    })
      .populate('sender', 'name email role avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Reverse to show oldest first in UI
    messages.reverse();

    const total = await Message.countDocuments({
      conversation: req.params.id,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
    });
  }
});

// @desc    Send a message
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
router.post('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required',
      });
    }

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Create message
    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      content: content.trim(),
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    // Update conversation's last message
    await conversation.updateLastMessage(message);

    // Populate sender info
    await message.populate('sender', 'name email role avatar');

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
});

// @desc    Send a message with file attachment
// @route   POST /api/chat/conversations/:id/messages/upload
// @access  Private
router.post('/conversations/:id/messages/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { content } = req.body;
    const file = req.file;

    if (!file && (!content || !content.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Message content or file is required',
      });
    }

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    let attachments = [];

    // Upload file to S3 if present
    if (file) {
      const timestamp = Date.now();
      const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}-${sanitizedFilename}`;

      const fileUrl = await uploadToS3(
        file.buffer,
        fileName,
        file.mimetype,
        'chat-attachments'
      );

      attachments.push({
        url: fileUrl,
        filename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      });
    }

    // Create message
    const messageContent = content?.trim() || (file ? `Sent a file: ${file.originalname}` : '');
    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      content: messageContent,
      attachments,
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    // Update conversation's last message
    await conversation.updateLastMessage(message);

    // Populate sender info
    await message.populate('sender', 'name email role avatar');

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending message with attachment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message',
    });
  }
});

// @desc    Mark conversation as read
// @route   POST /api/chat/conversations/:id/read
// @access  Private
router.post('/conversations/:id/read', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Mark as read
    await conversation.markAsRead(req.user._id);

    // Update readBy for all messages in this conversation
    await Message.updateMany(
      {
        conversation: req.params.id,
        'readBy.user': { $ne: req.user._id },
      },
      {
        $push: {
          readBy: { user: req.user._id, readAt: new Date() },
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read',
    });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark as read',
    });
  }
});

// @desc    Get unread message count
// @route   GET /api/chat/unread
// @access  Private
router.get('/unread', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      const unreadEntry = conv.unreadCounts.find(
        uc => uc.user.toString() === req.user._id.toString()
      );
      totalUnread += unreadEntry?.count || 0;
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount: totalUnread,
      },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
    });
  }
});

// @desc    Get all users for starting new chat
// @route   GET /api/chat/users
// @access  Private
router.get('/users', protect, async (req, res) => {
  try {
    const { search } = req.query;

    const query = {
      _id: { $ne: req.user._id },
      isActive: true,
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('name email role avatar companyName')
      .sort({ name: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

// @desc    Delete a message (soft delete)
// @route   DELETE /api/chat/messages/:id
// @access  Private
router.delete('/messages/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    // Only sender can delete their own message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message',
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message',
    });
  }
});

module.exports = router;
