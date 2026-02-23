const express = require('express');
const router = express.Router();
const BugReport = require('../models/BugReport');
const Notification = require('../models/Notification');
const { protect, authorize, optionalProtect, handlePreviewMode } = require('../middleware/auth');
const { bugReportFiles } = require('../middleware/upload');
const parseMentions = require('../utils/parseMentions');
const { sendBugReportCreated, sendBugReportStatusChanged, sendBugReportComment } = require('../services/discordService');

// @desc    Get all bug reports with filtering
// @route   GET /api/bug-reports
// @access  Private (admin sees all, others see only their own)
router.get('/', protect, handlePreviewMode, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      priority,
      search,
      sort = '-createdAt'
    } = req.query;

    // Build query - admins see all reports, others see only their own
    const query = {};

    // Non-admins can only see their own reports
    if (req.user.role !== 'admin') {
      query.author = req.user.id;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Search in title, description, and taskNumber
    if (search) {
      // Escape special regex characters to prevent ReDoS attacks
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { taskNumber: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Determine sort order
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

    // Get total count for pagination
    const total = await BugReport.countDocuments(query);

    let reports;

    // Use aggregation pipeline for votes sorting to properly count array length
    if (sort === 'votes') {
      reports = await BugReport.aggregate([
        { $match: query },
        { $addFields: { votesCount: { $size: { $ifNull: ['$votes', []] } } } },
        { $sort: { votesCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);

      // Populate references after aggregation
      await BugReport.populate(reports, [
        { path: 'author', select: 'name email role company profileImage' },
        { path: 'assignedTo', select: 'name email' },
        { path: 'comments.user', select: 'name email profileImage' }
      ]);
    } else {
      // Get reports with pagination using regular query
      reports = await BugReport.find(query)
        .populate('author', 'name email role company profileImage')
        .populate('assignedTo', 'name email')
        .populate('comments.user', 'name email profileImage')
        .sort(sortOption)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();
    }

    // Format reports with calculated fields
    const formattedReports = reports.map(report => ({
      ...report,
      votesCount: report.votes?.length || 0,
      commentsCount: report.comments?.length || 0,
      hasVoted: report.votes?.some(v => v.toString() === req.user.id) || false,
    }));

    res.status(200).json({
      success: true,
      data: formattedReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bug reports'
    });
  }
});

// @desc    Get bug report statistics
// @route   GET /api/bug-reports/stats
// @access  Private (admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await BugReport.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          bugs: { $sum: { $cond: [{ $eq: ['$type', 'bug'] }, 1, 0] } },
          features: { $sum: { $cond: [{ $eq: ['$type', 'feature'] }, 1, 0] } },
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
        bugs: 0,
        features: 0,
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

// @desc    Get single bug report
// @route   GET /api/bug-reports/:id
// @access  Private (admin can view all, others can view only their own)
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await BugReport.findById(req.params.id)
      .populate('author', 'name email role company profileImage')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email profileImage');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Bug report not found'
      });
    }

    // Non-admins can only view their own reports
    if (req.user.role !== 'admin' && report.author._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this report'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...report.toObject(),
        votesCount: report.votes?.length || 0,
        commentsCount: report.comments?.length || 0,
        hasVoted: report.votes?.some(v => v.toString() === req.user.id) || false,
      }
    });
  } catch (error) {
    console.error('Error fetching bug report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bug report'
    });
  }
});

// @desc    Create new bug report
// @route   POST /api/bug-reports
// @access  Private
router.post('/', protect, bugReportFiles, async (req, res) => {
  try {
    const { title, description, type, priority, stepsToReproduce, expectedBehavior, actualBehavior } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title and description'
      });
    }

    // Handle file uploads
    let attachments = [];
    if (req.files && req.files.attachments) {
      attachments = req.files.attachments.map(file => ({
        url: file.s3Url || file.location,
        filename: file.originalname,
        mimetype: file.mimetype,
      }));
    }

    // Create report
    const report = await BugReport.create({
      title,
      description,
      stepsToReproduce: stepsToReproduce || '',
      expectedBehavior: expectedBehavior || '',
      actualBehavior: actualBehavior || '',
      type: type || 'bug',
      priority: priority || 'medium',
      author: req.user.id,
      attachments,
      status: 'pending',
    });

    // Populate author information
    await report.populate('author', 'name email role company profileImage');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('bug-reports').emit('bugReport:new', {
        report: {
          ...report.toObject(),
          votesCount: 0,
          commentsCount: 0,
        }
      });
    }

    // Fire-and-forget Discord notification
    sendBugReportCreated(report);

    res.status(201).json({
      success: true,
      data: report,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error creating bug report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bug report'
    });
  }
});

// @desc    Update bug report
// @route   PUT /api/bug-reports/:id
// @access  Private (author or admin)
router.put('/:id', protect, async (req, res) => {
  try {
    let report = await BugReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Bug report not found'
      });
    }

    // Check authorization
    if (report.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this report'
      });
    }

    const { title, description, type, priority, stepsToReproduce, expectedBehavior, actualBehavior, status, assignedTo, adminNotes } = req.body;

    // Update allowed fields
    if (title) report.title = title;
    if (description) report.description = description;
    if (type) report.type = type;
    if (priority) report.priority = priority;
    if (stepsToReproduce !== undefined) report.stepsToReproduce = stepsToReproduce;
    if (expectedBehavior !== undefined) report.expectedBehavior = expectedBehavior;
    if (actualBehavior !== undefined) report.actualBehavior = actualBehavior;

    // Only admins can update these fields
    if (req.user.role === 'admin') {
      if (status) report.status = status;
      if (assignedTo !== undefined) report.assignedTo = assignedTo || null;
      if (adminNotes !== undefined) report.adminNotes = adminNotes;
    }

    await report.save();
    await report.populate('author', 'name email role company profileImage');
    await report.populate('assignedTo', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('bug-reports').emit('bugReport:updated', {
        report: {
          ...report.toObject(),
          votesCount: report.votes?.length || 0,
          commentsCount: report.comments?.length || 0,
        }
      });
    }

    res.status(200).json({
      success: true,
      data: report,
      message: 'Bug report updated successfully'
    });
  } catch (error) {
    console.error('Error updating bug report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bug report'
    });
  }
});

// @desc    Update bug report status (admin only)
// @route   PUT /api/bug-reports/:id/status
// @access  Private (admin only)
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (!status || !['pending', 'in_progress', 'qa', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required'
      });
    }

    const report = await BugReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Bug report not found'
      });
    }

    const previousStatus = report.status;
    report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;

    await report.save();
    await report.populate('author', 'name email role company profileImage');
    await report.populate('assignedTo', 'name email');
    await report.populate('comments.user', 'name email profileImage');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('bug-reports').emit('bugReport:statusChanged', {
        reportId: report._id,
        previousStatus,
        newStatus: status,
        report: {
          ...report.toObject(),
          votesCount: report.votes?.length || 0,
          commentsCount: report.comments?.length || 0,
        }
      });
    }

    // Fire-and-forget Discord notification
    sendBugReportStatusChanged(report, previousStatus, status, req.user);

    // Notify the author about status change
    if (report.author._id.toString() !== req.user.id) {
      try {
        await Notification.createAndEmit(io, {
          recipient: report.author._id,
          sender: req.user.id,
          type: 'feedback_status',
          title: 'Feedback Status Updated',
          message: `Your ${report.type === 'bug' ? 'bug report' : 'feature request'} "${report.title}" has been ${status === 'in_progress' ? 'moved to In Progress' : status}`,
          referenceType: 'BugReport',
          referenceId: report._id,
          link: `/bug-reports?view=${report._id}`,
        });
      } catch (notifError) {
        console.error('Error creating status notification:', notifError);
      }
    }

    res.status(200).json({
      success: true,
      data: report,
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

// @desc    Delete bug report
// @route   DELETE /api/bug-reports/:id
// @access  Private (author or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await BugReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Bug report not found'
      });
    }

    // Check authorization
    if (report.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this report'
      });
    }

    await report.deleteOne();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('bug-reports').emit('bugReport:deleted', {
        reportId: req.params.id
      });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'Bug report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bug report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete bug report'
    });
  }
});

// @desc    Vote for bug report
// @route   POST /api/bug-reports/:id/vote
// @access  Private
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Atomic vote: only adds if user not already in array
    let report = await BugReport.findOneAndUpdate(
      { _id: req.params.id, votes: { $ne: userId } },
      { $addToSet: { votes: userId } },
      { new: true }
    );
    let hasVoted = true;

    if (!report) {
      // User already voted — atomic unvote
      report = await BugReport.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { votes: userId } },
        { new: true }
      );
      hasVoted = false;
    }

    if (!report) {
      return res.status(404).json({ success: false, error: 'Bug report not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('bug-reports').emit('bugReport:vote', {
        reportId: report._id,
        votesCount: report.votes.length,
        userId: userId.toString(),
        hasVoted
      });
    }

    res.status(200).json({
      success: true,
      data: {
        votesCount: report.votes.length,
        hasVoted
      },
      message: hasVoted ? 'Vote added' : 'Vote removed'
    });
  } catch (error) {
    console.error('Error toggling vote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle vote'
    });
  }
});

// @desc    Add comment to bug report
// @route   POST /api/bug-reports/:id/comment
// @access  Private
router.post('/:id/comment', protect, ...bugReportFiles, async (req, res) => {
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

    const report = await BugReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Bug report not found'
      });
    }

    // Add comment
    report.comments.push({
      user: req.user.id,
      text: text ? text.trim() : '',
      attachments: commentAttachments,
      createdAt: Date.now()
    });

    await report.save();
    await report.populate('comments.user', 'name email profileImage');

    // Get the newly added comment
    const newComment = report.comments[report.comments.length - 1];

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('bug-reports').emit('bugReport:comment', {
        reportId: report._id,
        comment: newComment,
        commentsCount: report.comments.length
      });
    }

    // Fire-and-forget Discord notification
    sendBugReportComment(report, newComment, req.user);

    // Send mention notifications
    try {
      const mentionedIds = parseMentions(text);
      for (const userId of mentionedIds) {
        if (userId === req.user.id) continue;
        await Notification.createAndEmit(io, {
          recipient: userId,
          sender: req.user.id,
          type: 'mention',
          title: 'Mentioned in Bug Report',
          message: `${req.user.name} mentioned you in a comment on bug report: "${report.title}"`,
          referenceType: 'BugReport',
          referenceId: report._id,
          link: `/bug-reports?view=${report._id}`,
        });
      }
    } catch (mentionError) {
      console.error('Error creating mention notifications:', mentionError);
    }

    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// @desc    Edit comment on bug report
// @route   PUT /api/bug-reports/:id/comment/:commentId
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

    const report = await BugReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Bug report not found'
      });
    }

    // Find comment
    const comment = report.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check authorization - only comment author can edit
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this comment'
      });
    }

    // Update comment
    comment.text = text.trim();
    comment.editedAt = Date.now();

    await report.save();
    await report.populate('comments.user', 'name email profileImage');

    // Get the updated comment
    const updatedComment = report.comments.id(req.params.commentId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('bug-reports').emit('bugReport:commentEdited', {
        reportId: report._id,
        comment: updatedComment,
      });
    }

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

// @desc    Delete comment from bug report
// @route   DELETE /api/bug-reports/:id/comment/:commentId
// @access  Private (comment author or admin)
router.delete('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const report = await BugReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Bug report not found'
      });
    }

    // Find comment
    const comment = report.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check authorization
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
      });
    }

    // Remove comment
    comment.deleteOne();
    await report.save();

    // Emit real-time update for comment deletion
    const io = req.app.get('io');
    if (io) {
      io.to('bug-reports').emit('bugReport:commentDeleted', {
        reportId: report._id,
        commentId: req.params.commentId,
        commentsCount: report.comments.length
      });
    }

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
