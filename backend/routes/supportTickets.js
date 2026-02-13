const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { supportTicketFiles } = require('../middleware/upload');
const parseMentions = require('../utils/parseMentions');

// @desc    Get all support tickets with filtering
// @route   GET /api/support-tickets
// @access  Private (admin sees all, owners see only their own)
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      category,
      priority,
      search,
      sort = '-createdAt'
    } = req.query;

    const query = {};

    // Non-admins can only see their own tickets
    if (req.user.role !== 'admin') {
      query.author = req.user.id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { subject: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { ticketNumber: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    let sortOption = {};
    switch (sort) {
      case 'priority':
        sortOption = { priority: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const total = await SupportTicket.countDocuments(query);

    const tickets = await SupportTicket.find(query)
      .populate('author', 'name email role company profileImage')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email role profileImage')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const formattedTickets = tickets.map(ticket => ({
      ...ticket,
      commentsCount: ticket.comments?.length || 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedTickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support tickets'
    });
  }
});

// @desc    Get support ticket statistics
// @route   GET /api/support-tickets/stats
// @access  Private (admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          awaitingResponse: { $sum: { $cond: [{ $eq: ['$status', 'awaiting_response'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        total: 0,
        open: 0,
        inProgress: 0,
        awaitingResponse: 0,
        resolved: 0,
        closed: 0,
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// @desc    Get single support ticket
// @route   GET /api/support-tickets/:id
// @access  Private (author or admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('author', 'name email role company profileImage')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email role profileImage');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    if (req.user.role !== 'admin' && ticket.author._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this ticket'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...ticket.toObject(),
        commentsCount: ticket.comments?.length || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support ticket'
    });
  }
});

// @desc    Create new support ticket
// @route   POST /api/support-tickets
// @access  Private
router.post('/', protect, ...supportTicketFiles, async (req, res) => {
  try {
    const { subject, description, category, priority, companyName, contactName, contactEmail, contactPhone } = req.body;

    // Support both legacy (subject+description) and new form (companyName+description via service request)
    const finalSubject = subject || (companyName ? `${category === 'technical' ? 'Technical' : category === 'business' ? 'Business' : 'General'} Support Request - ${companyName}` : 'Support Request');
    const finalDescription = description;

    if (!finalDescription) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a description'
      });
    }

    let attachments = [];
    if (req.files && req.files.attachments) {
      attachments = req.files.attachments.map(file => ({
        url: file.s3Url || file.location,
        filename: file.originalname,
        mimetype: file.mimetype,
      }));
    }

    const ticket = await SupportTicket.create({
      subject: finalSubject,
      description: finalDescription,
      category: category || 'general',
      priority: priority || 'medium',
      author: req.user.id,
      status: 'open',
      attachments,
      companyName: companyName || undefined,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
    });

    await ticket.populate('author', 'name email role company profileImage');

    // Notify all admins about new ticket
    const io = req.app.get('io');
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const admin of admins) {
        if (admin._id.toString() !== req.user.id) {
          await Notification.createAndEmit(io, {
            recipient: admin._id,
            sender: req.user.id,
            type: 'support_ticket',
            title: 'New Support Ticket',
            message: `${req.user.name} submitted a support ticket: "${finalSubject}"`,
            referenceType: 'SupportTicket',
            referenceId: ticket._id,
            link: `/support-tickets?view=${ticket._id}`,
          });
        }
      }
    } catch (notifError) {
      console.error('Error creating ticket notifications:', notifError);
    }

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket'
    });
  }
});

// @desc    Update support ticket
// @route   PUT /api/support-tickets/:id
// @access  Private (author edits subject/description; admin edits all fields)
router.put('/:id', protect, async (req, res) => {
  try {
    let ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    if (ticket.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this ticket'
      });
    }

    const { subject, description, category, priority, status, assignedTo } = req.body;

    // Author can edit subject and description
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;

    // Only admins can update these fields
    if (req.user.role === 'admin') {
      if (category) ticket.category = category;
      if (priority) ticket.priority = priority;
      if (status) ticket.status = status;
      if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;
    }

    await ticket.save();
    await ticket.populate('author', 'name email role company profileImage');
    await ticket.populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      data: ticket,
      message: 'Support ticket updated successfully'
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update support ticket'
    });
  }
});

// @desc    Update support ticket status (admin only)
// @route   PUT /api/support-tickets/:id/status
// @access  Private (admin only)
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['open', 'in_progress', 'awaiting_response', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    const previousStatus = ticket.status;
    ticket.status = status;

    await ticket.save();
    await ticket.populate('author', 'name email role company profileImage');
    await ticket.populate('assignedTo', 'name email');
    await ticket.populate('comments.user', 'name email role profileImage');

    // Notify the author about status change
    const io = req.app.get('io');
    if (ticket.author._id.toString() !== req.user.id) {
      try {
        const statusLabels = {
          open: 'Open',
          in_progress: 'In Progress',
          awaiting_response: 'Awaiting Response',
          resolved: 'Resolved',
          closed: 'Closed',
        };
        await Notification.createAndEmit(io, {
          recipient: ticket.author._id,
          sender: req.user.id,
          type: 'support_ticket',
          title: 'Support Ticket Updated',
          message: `Your support ticket "${ticket.subject}" status changed to ${statusLabels[status]}`,
          referenceType: 'SupportTicket',
          referenceId: ticket._id,
          link: `/support-tickets?view=${ticket._id}`,
        });
      } catch (notifError) {
        console.error('Error creating status notification:', notifError);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...ticket.toObject(),
        commentsCount: ticket.comments?.length || 0,
      },
      message: `Status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

// @desc    Delete support ticket
// @route   DELETE /api/support-tickets/:id
// @access  Private (author or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    if (ticket.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this ticket'
      });
    }

    await ticket.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Support ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete support ticket'
    });
  }
});

// @desc    Add comment/reply to support ticket
// @route   POST /api/support-tickets/:id/comment
// @access  Private
router.post('/:id/comment', protect, ...supportTicketFiles, async (req, res) => {
  try {
    const { text } = req.body;

    let commentAttachments = [];
    if (req.files && req.files.attachments) {
      commentAttachments = req.files.attachments.map(file => ({
        url: file.s3Url || file.location,
        filename: file.originalname,
        mimetype: file.mimetype,
      }));
    }

    if ((!text || text.trim() === '') && commentAttachments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment text or attachments required'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Only author or admin can comment
    if (ticket.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to comment on this ticket'
      });
    }

    const isAdminReply = req.user.role === 'admin';

    // Add comment
    ticket.comments.push({
      user: req.user.id,
      text: text ? text.trim() : '',
      isAdminReply,
      attachments: commentAttachments,
      createdAt: Date.now()
    });

    // Auto-update status based on who replied
    if (isAdminReply && ticket.status === 'open') {
      ticket.status = 'awaiting_response';
    } else if (!isAdminReply && ticket.status === 'awaiting_response') {
      ticket.status = 'open';
    }

    await ticket.save();
    await ticket.populate('comments.user', 'name email role profileImage');
    await ticket.populate('author', 'name email role company profileImage');

    const newComment = ticket.comments[ticket.comments.length - 1];

    // Notify the other party
    const io = req.app.get('io');
    try {
      if (isAdminReply) {
        // Admin replied → notify ticket author
        if (ticket.author._id.toString() !== req.user.id) {
          await Notification.createAndEmit(io, {
            recipient: ticket.author._id,
            sender: req.user.id,
            type: 'support_ticket_reply',
            title: 'Support Ticket Reply',
            message: `Admin replied to your support ticket: "${ticket.subject}"`,
            referenceType: 'SupportTicket',
            referenceId: ticket._id,
            link: `/support-tickets?view=${ticket._id}`,
          });
        }
      } else {
        // Owner replied → notify all admins
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
          await Notification.createAndEmit(io, {
            recipient: admin._id,
            sender: req.user.id,
            type: 'support_ticket_reply',
            title: 'Support Ticket Reply',
            message: `${req.user.name} replied to support ticket: "${ticket.subject}"`,
            referenceType: 'SupportTicket',
            referenceId: ticket._id,
            link: `/support-tickets?view=${ticket._id}`,
          });
        }
      }
    } catch (notifError) {
      console.error('Error creating reply notification:', notifError);
    }

    // Send mention notifications (skip users who already got a reply notification)
    try {
      const alreadyNotified = new Set();
      if (isAdminReply && ticket.author._id.toString() !== req.user.id) {
        alreadyNotified.add(ticket.author._id.toString());
      }
      const mentionedIds = parseMentions(text);
      for (const userId of mentionedIds) {
        if (userId === req.user.id) continue;
        if (alreadyNotified.has(userId)) continue;
        await Notification.createAndEmit(io, {
          recipient: userId,
          sender: req.user.id,
          type: 'mention',
          title: 'Mentioned in Support Ticket',
          message: `${req.user.name} mentioned you in a comment on support ticket: "${ticket.subject}"`,
          referenceType: 'SupportTicket',
          referenceId: ticket._id,
          link: `/support-tickets?view=${ticket._id}`,
        });
      }
    } catch (mentionError) {
      console.error('Error creating mention notifications:', mentionError);
    }

    res.status(201).json({
      success: true,
      data: newComment,
      ticket: {
        ...ticket.toObject(),
        commentsCount: ticket.comments.length,
      },
      message: 'Reply added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// @desc    Edit comment on support ticket
// @route   PUT /api/support-tickets/:id/comment/:commentId
// @access  Private (comment author only)
router.put('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    const comment = ticket.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this comment'
      });
    }

    comment.text = text.trim();
    comment.editedAt = Date.now();

    await ticket.save();
    await ticket.populate('comments.user', 'name email role profileImage');

    const updatedComment = ticket.comments.id(req.params.commentId);

    res.status(200).json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully'
    });
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit comment'
    });
  }
});

// @desc    Delete comment from support ticket
// @route   DELETE /api/support-tickets/:id/comment/:commentId
// @access  Private (comment author or admin)
router.delete('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    const comment = ticket.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    comment.deleteOne();
    await ticket.save();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

module.exports = router;
