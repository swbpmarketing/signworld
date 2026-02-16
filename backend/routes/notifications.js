const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const Partner = require('../models/Partner');
const { protect, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');

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
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Announcement from SignWorld Business Partners</p>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding: 36px 30px;">
                        <div style="color: #374151; font-size: 15px; line-height: 1.7;">
                          ${message.replace(/\n/g, '<br>')}
                        </div>
                      </td>
                    </tr>
                    <!-- CTA -->
                    <tr>
                      <td style="padding: 0 30px 36px;" align="center">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Go to Dashboard</a>
                      </td>
                    </tr>
                    <!-- Divider -->
                    <tr>
                      <td style="padding: 0 30px;">
                        <div style="border-top: 1px solid #e5e7eb;"></div>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 30px; text-align: center;">
                        <p style="margin: 0; color: #9ca3af; font-size: 13px;">&copy; ${new Date().getFullYear()} SignWorld Business Partners. All rights reserved.</p>
                        <p style="margin: 6px 0 0; color: #9ca3af; font-size: 12px;">This is an announcement from the SignWorld Dashboard.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      let emailsSent = 0;
      let emailsFailed = 0;
      for (const user of users) {
        if (user.email) {
          const result = await emailService.sendEmail({
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
      const senderName = req.user.name || 'an owner';
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Broadcast from SignWorld Business Partners</p>
                      </td>
                    </tr>
                    <!-- Sender Info -->
                    <tr>
                      <td style="padding: 28px 30px 0;">
                        <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #2563eb;">
                          <tr>
                            <td style="padding: 14px 18px;">
                              <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">Message from ${senderName}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding: 24px 30px 36px;">
                        <div style="color: #374151; font-size: 15px; line-height: 1.7;">
                          ${message.replace(/\n/g, '<br>')}
                        </div>
                      </td>
                    </tr>
                    <!-- CTA -->
                    <tr>
                      <td style="padding: 0 30px 36px;" align="center">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Go to Dashboard</a>
                      </td>
                    </tr>
                    <!-- Divider -->
                    <tr>
                      <td style="padding: 0 30px;">
                        <div style="border-top: 1px solid #e5e7eb;"></div>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 30px; text-align: center;">
                        <p style="margin: 0; color: #9ca3af; font-size: 13px;">&copy; ${new Date().getFullYear()} SignWorld Business Partners. All rights reserved.</p>
                        <p style="margin: 6px 0 0; color: #9ca3af; font-size: 12px;">This broadcast was sent via the SignWorld Dashboard.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      let emailsSent = 0;
      let emailsFailed = 0;
      for (const vendor of vendorUsers) {
        if (vendor.email) {
          const result = await emailService.sendEmail({
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
