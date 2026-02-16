const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const Partner = require('../models/Partner');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching notifications'
    });
  }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching unread count'
    });
  }
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Server error marking notification as read'
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Server error marking notifications as read'
    });
  }
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting notification'
    });
  }
});

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    res.json({
      success: true,
      message: 'All notifications deleted'
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting notifications'
    });
  }
});

// @desc    Send broadcast notification to all users (Admin only)
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
router.post('/broadcast', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, message, type = 'announcement', targetRole, notificationMethod = 'internal' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    // Target users by role — default to all non-admin users
    const userQuery = { isActive: true };
    if (targetRole && targetRole !== 'all') {
      userQuery.role = targetRole;
    } else {
      userQuery.role = { $in: ['owner', 'vendor'] };
    }

    const users = await User.find(userQuery).select('_id email name');

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No users found to notify'
      });
    }

    if (notificationMethod === 'email') {
      // Send email to each owner
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
              .header { background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${title}</h1>
              </div>
              <div class="content">
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
              <div class="footer">
                <p>This is a broadcast announcement from Sign Company Dashboard.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      let emailsSent = 0;
      let emailsFailed = 0;
      for (const user of users) {
        if (user.email) {
          const result = await sendEmail({
            to: user.email,
            subject: title,
            html: emailHtml,
            text: message,
          });
          if (result.success) {
            emailsSent++;
          } else {
            emailsFailed++;
          }
        }
      }

      // Also create internal notification records for history tracking
      const notifications = users.map(user => ({
        recipient: user._id,
        sender: req.user._id,
        type: type,
        title: title,
        message: message,
        isRead: false
      }));
      await Notification.insertMany(notifications);

      res.status(201).json({
        success: true,
        message: `Email broadcast sent to ${emailsSent} users` + (emailsFailed > 0 ? ` (${emailsFailed} failed)` : ''),
        recipientCount: emailsSent
      });
    } else {
      // Internal notification only
      const notifications = users.map(user => ({
        recipient: user._id,
        sender: req.user._id,
        type: type,
        title: title,
        message: message,
        isRead: false
      }));

      await Notification.insertMany(notifications);

      res.status(201).json({
        success: true,
        message: `Broadcast sent to ${users.length} users`,
        recipientCount: users.length
      });
    }
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({
      success: false,
      error: 'Server error sending broadcast notification'
    });
  }
});

// @desc    Get broadcast history (Admin only)
// @route   GET /api/notifications/broadcasts
// @access  Private/Admin
router.get('/broadcasts', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Get unique broadcast messages sent by admins
    const broadcasts = await Notification.aggregate([
      {
        $match: {
          type: 'announcement',
          sender: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            title: '$title',
            message: '$message',
            createdAt: {
              $dateToString: { format: '%Y-%m-%d %H:%M', date: '$createdAt' }
            }
          },
          recipientCount: { $sum: 1 },
          createdAt: { $first: '$createdAt' },
          sender: { $first: '$sender' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    // Populate sender info
    await User.populate(broadcasts, {
      path: 'sender',
      select: 'name firstName lastName'
    });

    res.json({
      success: true,
      data: broadcasts.map(b => ({
        title: b._id.title,
        message: b._id.message,
        recipientCount: b.recipientCount,
        createdAt: b.createdAt,
        sender: b.sender
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching broadcast history:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching broadcast history'
    });
  }
});

// @desc    Send owner broadcast to linked vendor partners
// @route   POST /api/notifications/owner-broadcast
// @access  Private (Owner)
router.post('/owner-broadcast', protect, async (req, res) => {
  try {
    const { title, message, notificationMethod = 'internal' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }

    // Get owner's linked partners with vendor accounts
    const owner = await User.findById(req.user.id).populate({
      path: 'linkedPartners',
      match: { isActive: true, vendorId: { $exists: true, $ne: null } },
      select: 'vendorId name',
    });

    const linkedPartners = owner.linkedPartners || [];
    if (linkedPartners.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No linked vendor partners with accounts found'
      });
    }

    // Get vendor user IDs from linked partners
    const vendorUserIds = linkedPartners.map((p) => p.vendorId);
    const vendorUsers = await User.find({ _id: { $in: vendorUserIds }, isActive: true }).select('_id email name');

    if (vendorUsers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active vendor users found for linked partners'
      });
    }

    if (notificationMethod === 'email') {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${title}</h1>
              </div>
              <div class="content">
                <p>Message from <strong>${req.user.name || 'an owner'}</strong>:</p>
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
              <div class="footer">
                <p>This message was sent via Sign Company Dashboard.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      let emailsSent = 0;
      let emailsFailed = 0;
      for (const vendor of vendorUsers) {
        if (vendor.email) {
          const result = await sendEmail({
            to: vendor.email,
            subject: title,
            html: emailHtml,
            text: message,
          });
          if (result.success) {
            emailsSent++;
          } else {
            emailsFailed++;
          }
        }
      }

      // Also create internal notification records
      const notifications = vendorUsers.map((vendor) => ({
        recipient: vendor._id,
        sender: req.user._id,
        type: 'owner_broadcast',
        title: title,
        message: message,
        isRead: false,
      }));
      await Notification.insertMany(notifications);

      res.status(201).json({
        success: true,
        message: `Email broadcast sent to ${emailsSent} vendor partners` + (emailsFailed > 0 ? ` (${emailsFailed} failed)` : ''),
        recipientCount: emailsSent,
      });
    } else {
      // Internal notification only
      const notifications = vendorUsers.map((vendor) => ({
        recipient: vendor._id,
        sender: req.user._id,
        type: 'owner_broadcast',
        title: title,
        message: message,
        isRead: false,
      }));

      await Notification.insertMany(notifications);

      res.status(201).json({
        success: true,
        message: `Broadcast sent to ${vendorUsers.length} vendor partners`,
        recipientCount: vendorUsers.length,
      });
    }
  } catch (error) {
    console.error('Error sending owner broadcast:', error);
    res.status(500).json({
      success: false,
      error: 'Server error sending owner broadcast'
    });
  }
});

// @desc    Get owner's broadcast history
// @route   GET /api/notifications/owner-broadcasts
// @access  Private (Owner)
router.get('/owner-broadcasts', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const broadcasts = await Notification.aggregate([
      {
        $match: {
          type: 'owner_broadcast',
          sender: req.user._id,
        }
      },
      {
        $group: {
          _id: {
            title: '$title',
            message: '$message',
            createdAt: {
              $dateToString: { format: '%Y-%m-%d %H:%M', date: '$createdAt' }
            }
          },
          recipientCount: { $sum: 1 },
          createdAt: { $first: '$createdAt' },
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: broadcasts.map((b) => ({
        title: b._id.title,
        message: b._id.message,
        recipientCount: b.recipientCount,
        createdAt: b.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      }
    });
  } catch (error) {
    console.error('Error fetching owner broadcast history:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching owner broadcast history'
    });
  }
});

module.exports = router;
