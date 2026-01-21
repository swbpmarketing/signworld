const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const icalGenerator = require('ical-generator');
const ical = icalGenerator.default || icalGenerator;
const { protect } = require('../middleware/auth');

// Get all published events (public route for calendar display)
router.get('/public', async (req, res) => {
  try {
    const events = await Event.find({ isPublished: true })
      .populate('organizer', 'name email')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
});

// Development/admin endpoint to seed sample events (must come BEFORE /:id route)
router.get('/seed', async (req, res) => {
  try {
    // Allow seeding in development or with special query parameter for initial setup
    if (process.env.NODE_ENV === 'production' && req.query.setup !== 'initial') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - use ?setup=initial for first-time setup'
      });
    }

    // Find or create an admin user to be the organizer
    const User = require('../models/User');
    let organizer = await User.findOne({ role: 'admin' });
    
    if (!organizer) {
      console.log('No admin user found. Creating a default organizer...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      organizer = await User.create({
        name: 'System Admin',
        email: 'admin@signcompany.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      });
    }

    // Clear existing events
    await Event.deleteMany({});
    console.log('Cleared existing events');

    // Sample events data
    const events = [
      {
        title: 'Monthly Owner Meeting',
        description: 'Monthly meeting to discuss Q3 goals and performance metrics. Review sales figures, upcoming projects, and team updates.',
        startDate: new Date('2025-08-15T14:00:00.000Z'),
        endDate: new Date('2025-08-15T15:30:00.000Z'),
        category: 'meeting',
        color: '#00A6FB',
        location: 'Virtual - Zoom',
        isOnline: true,
        onlineLink: 'https://zoom.us/j/123456789',
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Sign Design Workshop',
        description: 'Learn advanced techniques for creating eye-catching sign designs. Hands-on workshop with industry experts.',
        startDate: new Date('2025-08-08T10:00:00.000Z'),
        endDate: new Date('2025-08-08T12:00:00.000Z'),
        category: 'training',
        color: '#10B981',
        location: 'Training Center - Room A',
        isOnline: false,
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Annual Convention 2025',
        description: 'The biggest Sign Company event of the year! Network with industry professionals, learn about new trends, and celebrate our achievements.',
        startDate: new Date('2025-08-22T09:00:00.000Z'),
        endDate: new Date('2025-08-24T17:00:00.000Z'),
        category: 'convention',
        color: '#8B5CF6',
        location: 'Las Vegas Convention Center',
        isOnline: false,
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Digital Marketing Webinar',
        description: 'Discover effective strategies for growing your sign business with digital marketing. Topics include SEO, social media, and online advertising.',
        startDate: new Date('2025-08-18T13:00:00.000Z'),
        endDate: new Date('2025-08-18T14:00:00.000Z'),
        category: 'webinar',
        color: '#F59E0B',
        location: 'Online',
        isOnline: true,
        onlineLink: 'https://teams.microsoft.com/l/meetup-join/12345',
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Summer BBQ & Team Building',
        description: 'Join us for our annual summer BBQ and team building activities. Great food, fun games, and time to connect with colleagues.',
        startDate: new Date('2025-08-25T12:00:00.000Z'),
        endDate: new Date('2025-08-25T16:00:00.000Z'),
        category: 'social',
        color: '#EC4899',
        location: 'Company Headquarters - Outdoor Area',
        isOnline: false,
        organizer: organizer._id,
        isPublished: true
      },
      {
        title: 'Equipment Maintenance Training',
        description: 'Essential training on proper maintenance and care of sign-making equipment. Preventive maintenance schedules and troubleshooting tips.',
        startDate: new Date('2025-09-05T09:00:00.000Z'),
        endDate: new Date('2025-09-05T11:00:00.000Z'),
        category: 'training',
        color: '#10B981',
        location: 'Workshop Floor',
        isOnline: false,
        organizer: organizer._id,
        isPublished: true
      }
    ];

    // Create events
    const createdEvents = await Event.create(events);
    
    res.json({
      success: true,
      message: `Created ${createdEvents.length} sample events`,
      data: createdEvents
    });
  } catch (error) {
    console.error('Error seeding events:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding events',
      error: error.message
    });
  }
});

// Test endpoint to debug route matching
router.get('/calendar-feed', async (req, res) => {
  res.json({
    success: true,
    message: 'Calendar feed endpoint is reachable'
  });
});

// Generate iCal calendar feed (public route - must come BEFORE /:id route)
router.get('/calendar.ics', async (req, res) => {
  try {
    // Fetch all published events
    const events = await Event.find({ 
      isPublished: true,
      startDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Include events from last 7 days
    }).populate('organizer', 'name email');
    
    // Create calendar
    const calendar = ical({
      domain: req.get('host') || 'localhost',
      name: process.env.CALENDAR_NAME || 'Sign Company Calendar',
      description: 'Sign Company Dashboard Events and Schedule',
      timezone: process.env.CALENDAR_TIMEZONE || 'America/New_York',
      ttl: 60 * 60 * 24, // 24 hours cache
      prodId: {
        company: 'Sign Company Dashboard',
        product: 'Calendar Feed',
        language: 'EN'
      }
    });
    
    // Add events to calendar
    events.forEach(event => {
      const icalEvent = calendar.createEvent({
        uid: event._id.toString(),
        start: event.startDate,
        end: event.endDate,
        summary: event.title,
        description: event.description,
        location: event.location || '',
        organizer: {
          name: event.organizer?.name || 'Sign Company',
          email: event.organizer?.email || process.env.DEFAULT_ORGANIZER_EMAIL || 'events@signcompany.com'
        },
        url: event.onlineLink || '',
        categories: event.category ? [{ name: event.category }] : [],
        created: event.createdAt,
        lastModified: event.updatedAt || event.createdAt
      });
      
      // Add attendees if available
      if (event.attendees && event.attendees.length > 0) {
        event.attendees
          .filter(attendee => attendee.status === 'confirmed')
          .forEach(attendee => {
            if (attendee.user && attendee.user.email) {
              icalEvent.createAttendee({
                email: attendee.user.email,
                name: attendee.user.name || attendee.user.email,
                status: 'ACCEPTED'
              });
            }
          });
      }
      
      // Add alarms/reminders
      icalEvent.createAlarm({
        type: 'display',
        trigger: 24 * 60 * 60, // 24 hours before
        description: `Reminder: ${event.title}`
      });
      
      icalEvent.createAlarm({
        type: 'display',
        trigger: 60 * 60, // 1 hour before
        description: `Starting soon: ${event.title}`
      });
    });
    
    // Set appropriate headers
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sign-company-calendar.ics"',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    // Send calendar
    res.send(calendar.toString());
    
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating calendar feed'
    });
  }
});

// Get calendar feed info (public route - must come BEFORE /:id route)
router.get('/calendar/info', async (req, res) => {
  try {
    const eventsCount = await Event.countDocuments({ 
      isPublished: true,
      startDate: { $gte: new Date() }
    });
    
    const upcomingEvents = await Event.find({ 
      isPublished: true,
      startDate: { $gte: new Date() }
    })
    .select('title startDate category')
    .sort({ startDate: 1 })
    .limit(5);
    
    res.json({
      success: true,
      data: {
        calendarName: process.env.CALENDAR_NAME || 'Sign Company Calendar',
        description: 'Sign Company Dashboard Events and Schedule',
        eventsCount: eventsCount,
        upcomingEvents: upcomingEvents,
        feedUrl: `${req.protocol}://${req.get('host')}/api/events/calendar.ics`,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching calendar info:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar information'
    });
  }
});

// Get all events (protected route for admin/management)
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find({ isPublished: true })
      .populate('organizer', 'name email')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
});

// Get single event (protected route)
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('attendees.user', 'name email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  }
});

// Create new event (protected route)
router.post('/', protect, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user.id
    };

    const event = await Event.create(eventData);
    await event.populate('organizer', 'name email');

    // Send response immediately
    res.status(201).json({
      success: true,
      data: event
    });

    // Create notifications for all users about new event in background (non-blocking)
    const io = req.app.get('io');

    // Use setImmediate to run notification creation asynchronously without blocking
    setImmediate(async () => {
      try {
        const allUsers = await User.find({
          _id: { $ne: req.user.id },
          isActive: true
        }).select('_id');

        // Create notifications without awaiting each one
        const notificationPromises = allUsers.map(user =>
          Notification.createAndEmit(io, {
            recipient: user._id,
            sender: req.user.id,
            type: 'new_event',
            title: 'New Event Added',
            message: `A new event has been scheduled: "${event.title}"`,
            referenceType: 'Event',
            referenceId: event._id,
            link: `/events`,
          }).catch(err => {
            console.error(`Failed to create notification for user ${user._id}:`, err);
          })
        );

        // Wait for all notifications to complete
        await Promise.all(notificationPromises);

        // Emit to events room for real-time updates
        if (io) {
          io.to('events').emit('event:new', event);
        }
      } catch (notifError) {
        console.error('Error creating event notifications:', notifError);
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating event'
    });
  }
});

// Update event (protected route)
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user is the organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }
    
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('organizer', 'name email');
    
    res.json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating event'
    });
  }
});

// Delete event (protected route)
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user is the organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }
    
    await Event.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting event'
    });
  }
});

// RSVP to event (protected route)
router.post('/:id/rsvp', protect, async (req, res) => {
  try {
    const { status } = req.body; // 'confirmed', 'declined', 'pending'
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user already RSVP'd
    const existingRsvp = event.attendees.find(
      attendee => attendee.user.toString() === req.user.id
    );
    
    if (existingRsvp) {
      existingRsvp.status = status;
      existingRsvp.rsvpDate = new Date();
    } else {
      event.attendees.push({
        user: req.user.id,
        status: status,
        rsvpDate: new Date()
      });
    }
    
    await event.save();
    await event.populate('attendees.user', 'name email');
    
    res.json({
      success: true,
      message: `RSVP updated to ${status}`,
      data: event
    });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating RSVP'
    });
  }
});

module.exports = router;