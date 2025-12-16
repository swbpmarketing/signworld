const express = require('express');
const router = express.Router();
const Convention = require('../models/Convention');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @route   GET /api/conventions
 * @desc    Get all conventions
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { active, featured } = req.query;

    let filter = {};

    // Filter by active status
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    // Filter by featured status
    if (featured !== undefined) {
      filter.isFeatured = featured === 'true';
    }

    const conventions = await Convention.find(filter).sort('-startDate');

    res.json({
      success: true,
      count: conventions.length,
      data: conventions
    });
  } catch (error) {
    console.error('Get conventions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching conventions'
    });
  }
});

/**
 * @route   GET /api/conventions/:id
 * @desc    Get single convention
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    res.json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Get convention error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while fetching convention'
    });
  }
});

/**
 * @route   POST /api/conventions
 * @desc    Create new convention
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const convention = await Convention.create(req.body);

    // Create notifications for all users about new convention
    const io = req.app.get('io');
    try {
      const allUsers = await User.find({
        _id: { $ne: req.user.id },
        isActive: true
      }).select('_id');

      for (const user of allUsers) {
        await Notification.createAndEmit(io, {
          recipient: user._id,
          sender: req.user.id,
          type: 'new_convention',
          title: 'New Convention Announced',
          message: `A new convention has been announced: "${convention.name}"`,
          referenceType: 'Convention',
          referenceId: convention._id,
          link: `/conventions/${convention._id}`,
        });
      }

      // Emit to events room for real-time updates
      if (io) {
        io.to('events').emit('convention:new', convention);
      }
    } catch (notifError) {
      console.error('Error creating convention notifications:', notifError);
    }

    res.status(201).json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Create convention error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while creating convention'
    });
  }
});

/**
 * @route   PUT /api/conventions/:id
 * @desc    Update convention
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('PUT /conventions/:id called');
    console.log('Convention ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    let convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    // Check if dates changed
    const oldStartDate = convention.startDate.getTime();
    const oldEndDate = convention.endDate.getTime();
    const newStartDate = new Date(req.body.startDate).getTime();
    const newEndDate = new Date(req.body.endDate).getTime();
    const datesChanged = oldStartDate !== newStartDate || oldEndDate !== newEndDate;

    convention = await Convention.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    console.log('Updated convention from DB:');
    console.log('Convention ID:', convention._id);
    console.log('Convention title:', convention.title);
    console.log('Registration options:', convention.registrationOptions);
    console.log('Early bird discount:', convention.earlyBirdDiscount);
    console.log('Early bird message:', convention.earlyBirdMessage);
    console.log('Full convention object keys:', Object.keys(convention.toObject ? convention.toObject() : convention));

    // If dates changed and there are attendees, send notifications
    if (datesChanged && convention.attendees && convention.attendees.length > 0) {
      const io = req.app.get('io');
      const oldDateStr = new Date(oldStartDate).toLocaleDateString();
      const newDateStr = convention.startDate.toLocaleDateString();

      console.log(`Dates changed from ${oldDateStr} to ${newDateStr}, notifying ${convention.attendees.length} attendees`);

      try {
        // Send notifications to all attendees
        for (const attendee of convention.attendees) {
          await Notification.createAndEmit(io, {
            recipient: attendee.userId,
            sender: req.user.id,
            type: 'convention_date_change',
            title: `Schedule Update: ${convention.title}`,
            message: `The convention date has been changed. New date: ${convention.startDate.toLocaleDateString()} - ${convention.endDate.toLocaleDateString()}`,
            referenceType: 'Convention',
            referenceId: convention._id,
            link: `/conventions/${convention._id}`,
            metadata: {
              oldStartDate: oldStartDate,
              oldEndDate: oldEndDate,
              newStartDate: newStartDate,
              newEndDate: newEndDate
            }
          });
        }

        // Emit real-time update
        if (io) {
          io.to('conventions').emit('convention:updated', {
            conventionId: convention._id,
            title: convention.title,
            oldStartDate,
            oldEndDate,
            newStartDate,
            newEndDate,
            attendeeCount: convention.attendees.length
          });
        }
      } catch (notifError) {
        console.error('Error sending date change notifications:', notifError);
      }
    }

    // Convert Mongoose document to plain JavaScript object to ensure all fields are included
    const conventionObj = convention.toObject ? convention.toObject() : convention;
    console.log('Final response data registrationOptions:', conventionObj.registrationOptions);

    res.json({
      success: true,
      data: conventionObj
    });
  } catch (error) {
    console.error('Update convention error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while updating convention'
    });
  }
});

/**
 * @route   DELETE /api/conventions/:id
 * @desc    Delete convention
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    await convention.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete convention error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error while deleting convention'
    });
  }
});

/**
 * @route   POST /api/conventions/:id/sponsors
 * @desc    Add sponsor to convention
 * @access  Private/Admin
 */
router.post('/:id/sponsors', protect, authorize('admin'), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    convention.sponsors.push(req.body);
    await convention.save();

    res.status(201).json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Add sponsor error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while adding sponsor'
    });
  }
});

/**
 * @route   DELETE /api/conventions/:id/sponsors/:sponsorId
 * @desc    Remove sponsor from convention
 * @access  Private/Admin
 */
router.delete('/:id/sponsors/:sponsorId', protect, authorize('admin'), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    convention.sponsors = convention.sponsors.filter(
      sponsor => sponsor._id.toString() !== req.params.sponsorId
    );

    await convention.save();

    res.json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Remove sponsor error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while removing sponsor'
    });
  }
});

/**
 * @route   POST /api/conventions/:id/schedule
 * @desc    Add schedule day to convention
 * @access  Private/Admin
 */
router.post('/:id/schedule', protect, authorize('admin'), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    convention.schedule.push(req.body);
    await convention.save();

    res.status(201).json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Add schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while adding schedule'
    });
  }
});

/**
 * @route   DELETE /api/conventions/:id/schedule/:scheduleId
 * @desc    Delete schedule item from convention
 * @access  Private/Admin
 */
router.delete('/:id/schedule/:scheduleId', protect, authorize('admin'), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    convention.schedule = convention.schedule.filter(
      item => item._id.toString() !== req.params.scheduleId
    );

    await convention.save();

    res.json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting schedule'
    });
  }
});

/**
 * @route   GET /api/conventions/upcoming
 * @desc    Get upcoming conventions
 * @access  Public
 */
router.get('/filter/upcoming', async (req, res) => {
  try {
    const now = new Date();

    const conventions = await Convention.find({
      startDate: { $gte: now },
      isActive: true
    }).sort('startDate').limit(5);

    res.json({
      success: true,
      count: conventions.length,
      data: conventions
    });
  } catch (error) {
    console.error('Get upcoming conventions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching upcoming conventions'
    });
  }
});

/**
 * @route   GET /api/conventions/featured
 * @desc    Get featured convention
 * @access  Public
 */
router.get('/filter/featured', async (req, res) => {
  try {
    const convention = await Convention.findOne({
      isFeatured: true,
      isActive: true
    }).sort('-startDate');

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'No featured convention found'
      });
    }

    res.json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Get featured convention error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching featured convention'
    });
  }
});

/**
 * @route   POST /api/conventions/:id/gallery
 * @desc    Upload gallery images to convention
 * @access  Private/Admin
 */
router.post('/:id/gallery', protect, authorize('admin'), upload.multiple('gallery', 20), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    // Add uploaded files to gallery
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        imageUrl: file.s3Url || file.location, // Use S3 URL
        caption: req.body.caption || '',
        year: req.body.year || new Date().getFullYear()
      }));

      convention.gallery.push(...newImages);
      await convention.save();
    }

    res.status(201).json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Upload gallery error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while uploading gallery images'
    });
  }
});

/**
 * @route   DELETE /api/conventions/:id/gallery/:imageId
 * @desc    Delete gallery image from convention
 * @access  Private/Admin
 */
router.delete('/:id/gallery/:imageId', protect, authorize('admin'), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    convention.gallery = convention.gallery.filter(
      image => image._id.toString() !== req.params.imageId
    );

    await convention.save();

    res.json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting gallery image'
    });
  }
});

/**
 * @route   POST /api/conventions/:id/documents
 * @desc    Upload documents to convention
 * @access  Private/Admin
 */
router.post('/:id/documents', protect, authorize('admin'), upload.multiple('documents', 10), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    // Add uploaded files to documents
    if (req.files && req.files.length > 0) {
      const newDocuments = req.files.map(file => ({
        title: req.body.title || file.originalname,
        fileUrl: file.s3Url || file.location, // Use S3 URL
        fileType: file.mimetype
      }));

      convention.documents.push(...newDocuments);
      await convention.save();
    }

    res.status(201).json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while uploading documents'
    });
  }
});

/**
 * @route   DELETE /api/conventions/:id/documents/:documentId
 * @desc    Delete document from convention
 * @access  Private/Admin
 */
router.delete('/:id/documents/:documentId', protect, authorize('admin'), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    convention.documents = convention.documents.filter(
      doc => doc._id.toString() !== req.params.documentId
    );

    await convention.save();

    res.json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting document'
    });
  }
});

/**
 * @route   POST /api/conventions/:id/speakers
 * @desc    Add speaker to convention
 * @access  Private/Admin
 */
router.post('/:id/speakers', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    // Build speaker object from request body
    const speakerData = {
      name: req.body.name,
      title: req.body.title,
      company: req.body.company,
      bio: req.body.bio,
      topic: req.body.topic,
      // Handle both uploaded file and URL input
      image: req.file ? (req.file.s3Url || req.file.location) : req.body.imageUrl,
      // Optional event schedule fields
      day: req.body.day || '',
      time: req.body.time || '',
      // Optional fields
      email: req.body.email || '',
      linkedin: req.body.linkedin || '',
      twitter: req.body.twitter || '',
      website: req.body.website || ''
    };

    convention.speakers.push(speakerData);
    await convention.save();

    res.status(201).json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Add speaker error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while adding speaker'
    });
  }
});

/**
 * @route   DELETE /api/conventions/:id/speakers/:speakerId
 * @desc    Remove speaker from convention
 * @access  Private/Admin
 */
router.delete('/:id/speakers/:speakerId', protect, authorize('admin'), async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    convention.speakers = convention.speakers.filter(
      speaker => speaker._id.toString() !== req.params.speakerId
    );

    await convention.save();

    res.json({
      success: true,
      data: convention
    });
  } catch (error) {
    console.error('Remove speaker error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while removing speaker'
    });
  }
});

/**
 * @route   POST /api/conventions/:id/register
 * @desc    Register user for convention
 * @access  Private
 */
router.post('/:id/register', protect, async (req, res) => {
  try {
    const convention = await Convention.findById(req.params.id);

    if (!convention) {
      return res.status(404).json({
        success: false,
        error: 'Convention not found'
      });
    }

    // Check if user already registered
    const isRegistered = convention.attendees.some(
      attendee => attendee.userId && attendee.userId.toString() === req.user.id
    );

    if (isRegistered) {
      return res.status(400).json({
        success: false,
        error: 'You are already registered for this convention'
      });
    }

    // Get user info
    const user = await User.findById(req.user.id).select('firstName lastName email');

    // Add user to attendees
    convention.attendees.push({
      userId: req.user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      registeredAt: new Date()
    });

    await convention.save();

    // Create notification for user
    const io = req.app.get('io');
    try {
      await Notification.createAndEmit(io, {
        recipient: req.user.id,
        sender: req.user.id,
        type: 'convention_registered',
        title: `Successfully Registered: ${convention.title}`,
        message: `You have been registered for the convention. Check your email for details.`,
        referenceType: 'Convention',
        referenceId: convention._id,
        link: `/conventions/${convention._id}`
      });
    } catch (notifError) {
      console.error('Error creating registration notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Successfully registered for convention',
      data: convention
    });
  } catch (error) {
    console.error('Register for convention error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while registering for convention'
    });
  }
});

module.exports = router;
