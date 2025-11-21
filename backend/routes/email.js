const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter for email endpoints (prevent spam)
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many email requests from this IP, please try again later.'
});

/**
 * @route   POST /api/email/contact
 * @desc    Send contact form email
 * @access  Public
 */
router.post('/contact', emailLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const result = await emailService.sendContactFormEmail({
      name,
      email,
      message
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Your message has been sent successfully!'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending your message'
    });
  }
});

/**
 * @route   POST /api/email/event-reminder
 * @desc    Send event reminder email
 * @access  Private
 */
router.post('/event-reminder', protect, async (req, res) => {
  try {
    const { eventId, reminderTime } = req.body;

    if (!eventId || !reminderTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId and reminderTime'
      });
    }

    // Get event details
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const result = await emailService.sendEventReminder({
      to: req.user.email,
      name: req.user.name,
      event: {
        title: event.title,
        start: event.start,
        end: event.end,
        location: event.location,
        description: event.description
      },
      reminderTime
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send reminder email'
      });
    }

    res.json({
      success: true,
      message: 'Event reminder sent successfully'
    });
  } catch (error) {
    console.error('Event reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending reminder'
    });
  }
});

/**
 * @route   POST /api/email/welcome
 * @desc    Send welcome email to new users (admin only)
 * @access  Private/Admin
 */
router.post('/welcome', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId'
      });
    }

    // Get user details
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const result = await emailService.sendWelcomeEmail({
      to: user.email,
      name: user.name
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send welcome email'
      });
    }

    res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending welcome email'
    });
  }
});

/**
 * @route   POST /api/email/test
 * @desc    Test email configuration (admin only)
 * @access  Private/Admin
 */
router.post('/test', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const result = await emailService.sendWelcomeEmail({
      to: req.user.email,
      name: req.user.name
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Email test failed',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Test email sent successfully to ' + req.user.email,
      data: result.data
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending test email'
    });
  }
});

module.exports = router;
