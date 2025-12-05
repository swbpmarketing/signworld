const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @desc    Get equipment statistics
// @route   GET /api/equipment/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalEquipment = await Equipment.countDocuments({ isActive: true });

    // Get category counts
    const categoryCounts = await Equipment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoryCountsObj = {};
    categoryCounts.forEach(cat => {
      categoryCountsObj[cat._id] = cat.count;
    });

    // Get brand counts
    const brandCounts = await Equipment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$brand', count: { $sum: 1 } } }
    ]);

    const brandCountsObj = {};
    brandCounts.forEach(brand => {
      brandCountsObj[brand._id] = brand.count;
    });

    // Get unique brands
    const brands = await Equipment.distinct('brand', { isActive: true });

    res.json({
      success: true,
      data: {
        totalEquipment,
        categoryCounts: categoryCountsObj,
        brandCounts: brandCountsObj,
        brands: brands.sort(),
      }
    });
  } catch (error) {
    console.error('Error fetching equipment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching equipment statistics'
    });
  }
});

// @desc    Get vendor's equipment statistics for reports
// @route   GET /api/equipment/vendor-stats
// @access  Private/Vendor
router.get('/vendor-stats', protect, authorize('vendor', 'admin'), async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Get all vendor's equipment with inquiries
    const equipment = await Equipment.find({ vendorId });

    // Calculate basic stats
    const totalListings = equipment.length;
    const activeListings = equipment.filter(e => e.isActive).length;
    const inactiveListings = equipment.filter(e => !e.isActive).length;
    const featuredListings = equipment.filter(e => e.isFeatured).length;

    // Category breakdown
    const categoryBreakdown = {};
    equipment.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1;
    });

    // Availability breakdown
    const availabilityBreakdown = {
      'in-stock': equipment.filter(e => e.availability === 'in-stock').length,
      'out-of-stock': equipment.filter(e => e.availability === 'out-of-stock').length,
      'pre-order': equipment.filter(e => e.availability === 'pre-order').length,
      'discontinued': equipment.filter(e => e.availability === 'discontinued').length,
    };

    // Inquiry stats
    let totalInquiries = 0;
    let newInquiries = 0;
    let contactedInquiries = 0;
    let completedInquiries = 0;
    let cancelledInquiries = 0;
    const recentInquiries = [];

    // Sales tracking
    let totalSales = 0;
    let estimatedRevenue = 0;
    const salesByMonth = {};
    const salesByEquipment = {};

    // Helper to parse price string to number
    const parsePrice = (priceStr) => {
      if (typeof priceStr === 'number') return priceStr;
      if (!priceStr) return 0;
      // Remove currency symbols, commas, and other non-numeric chars except decimal
      const cleaned = String(priceStr).replace(/[^0-9.]/g, '');
      return parseFloat(cleaned) || 0;
    };

    // Get current date for monthly tracking
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    equipment.forEach(e => {
      if (e.inquiries && e.inquiries.length > 0) {
        totalInquiries += e.inquiries.length;
        const equipmentPrice = parsePrice(e.price);

        e.inquiries.forEach(inq => {
          switch (inq.status) {
            case 'new': newInquiries++; break;
            case 'contacted': contactedInquiries++; break;
            case 'completed':
              completedInquiries++;
              // Track as a sale
              totalSales++;
              estimatedRevenue += equipmentPrice;

              // Track sales by month
              const inquiryDate = new Date(inq.createdAt);
              if (inquiryDate >= sixMonthsAgo) {
                const monthKey = `${inquiryDate.getFullYear()}-${String(inquiryDate.getMonth() + 1).padStart(2, '0')}`;
                if (!salesByMonth[monthKey]) {
                  salesByMonth[monthKey] = { count: 0, revenue: 0 };
                }
                salesByMonth[monthKey].count++;
                salesByMonth[monthKey].revenue += equipmentPrice;
              }

              // Track sales by equipment
              if (!salesByEquipment[e._id]) {
                salesByEquipment[e._id] = {
                  _id: e._id,
                  name: e.name,
                  category: e.category,
                  price: equipmentPrice,
                  salesCount: 0,
                  revenue: 0,
                };
              }
              salesByEquipment[e._id].salesCount++;
              salesByEquipment[e._id].revenue += equipmentPrice;
              break;
            case 'cancelled': cancelledInquiries++; break;
          }
          recentInquiries.push({
            equipmentId: e._id,
            equipmentName: e.name,
            equipmentPrice: equipmentPrice,
            ...inq.toObject(),
          });
        });
      }
    });

    // Sort recent inquiries by date and take last 10
    recentInquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestInquiries = recentInquiries.slice(0, 10);

    // Top performing equipment (by inquiry count)
    const equipmentPerformance = equipment.map(e => ({
      _id: e._id,
      name: e.name,
      category: e.category,
      inquiryCount: e.inquiries?.length || 0,
      isActive: e.isActive,
      createdAt: e.createdAt,
    })).sort((a, b) => b.inquiryCount - a.inquiryCount).slice(0, 5);

    // Top selling equipment (by completed inquiries / sales)
    const topSellingEquipment = Object.values(salesByEquipment)
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);

    // Calculate conversion rate
    const conversionRate = totalInquiries > 0
      ? ((completedInquiries / totalInquiries) * 100).toFixed(1)
      : 0;

    // Format monthly sales for chart (last 6 months)
    const monthlySales = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      monthlySales.push({
        month: monthName,
        year: date.getFullYear(),
        count: salesByMonth[monthKey]?.count || 0,
        revenue: salesByMonth[monthKey]?.revenue || 0,
      });
    }

    // Recent sales (completed inquiries)
    const recentSales = recentInquiries
      .filter(inq => inq.status === 'completed')
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        overview: {
          totalListings,
          activeListings,
          inactiveListings,
          featuredListings,
        },
        categoryBreakdown,
        availabilityBreakdown,
        inquiryStats: {
          total: totalInquiries,
          new: newInquiries,
          contacted: contactedInquiries,
          completed: completedInquiries,
          cancelled: cancelledInquiries,
        },
        recentInquiries: latestInquiries,
        topEquipment: equipmentPerformance,
        // Sales statistics
        salesStats: {
          totalSales,
          estimatedRevenue,
          conversionRate: parseFloat(conversionRate),
          monthlySales,
          topSellingEquipment,
          recentSales,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching vendor equipment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching equipment statistics'
    });
  }
});

// @desc    Get vendor's own equipment listings
// @route   GET /api/equipment/my-listings
// @access  Private/Vendor
router.get('/my-listings', protect, authorize('vendor', 'admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { vendorId: req.user.id };

    const equipment = await Equipment.find(query)
      .sort({ createdAt: -1 })
      .select('-__v -inquiries');

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Error fetching vendor equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching equipment listings'
    });
  }
});

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      featured,
      inStock,
      limit = 20,
      page = 1,
      sort = 'featured'
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (brand) {
      // Support multiple brands (comma separated)
      const brands = brand.split(',').map(b => b.trim());
      query.brand = { $in: brands };
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (inStock === 'true') {
      query.availability = 'in-stock';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort options
    let sortOption = { isFeatured: -1, sortOrder: 1, createdAt: -1 };
    switch (sort) {
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'featured':
      default:
        sortOption = { isFeatured: -1, sortOrder: 1, createdAt: -1 };
    }

    // Execute query with pagination
    const equipment = await Equipment.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v -inquiries');

    // Get total count for pagination
    const count = await Equipment.countDocuments(query);

    res.json({
      success: true,
      data: equipment,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching equipment'
    });
  }
});

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('relatedProducts', 'name image price brand category');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching equipment'
    });
  }
});

// @desc    Upload equipment image
// @route   POST /api/equipment/upload-image
// @access  Private/Admin or Vendor
router.post('/upload-image', protect, authorize('admin', 'vendor'), upload.single('images'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // The upload middleware handles S3 upload and adds s3Url to req.file
    const imageUrl = req.file.s3Url || req.file.location;

    if (!imageUrl) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload image'
      });
    }

    res.json({
      success: true,
      data: {
        url: imageUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading equipment image:', error);
    res.status(500).json({
      success: false,
      error: 'Error uploading image'
    });
  }
});

// @desc    Create new equipment
// @route   POST /api/equipment
// @access  Private/Admin or Vendor
router.post('/', protect, authorize('admin', 'vendor'), async (req, res) => {
  try {
    const equipmentData = { ...req.body };

    // If vendor is creating, set vendorId to their user ID
    if (req.user.role === 'vendor') {
      equipmentData.vendorId = req.user.id;
      // Vendors can't set featured status
      delete equipmentData.isFeatured;
      delete equipmentData.sortOrder;
    }

    // Parse specifications if string
    if (typeof equipmentData.specifications === 'string') {
      equipmentData.specifications = JSON.parse(equipmentData.specifications);
    }

    // Parse features if string
    if (typeof equipmentData.features === 'string') {
      equipmentData.features = JSON.parse(equipmentData.features);
    }

    const equipment = await Equipment.create(equipmentData);

    // Create notifications for all users about new equipment listing
    const io = req.app.get('io');
    try {
      const sellerName = req.user.name || req.user.firstName || 'A vendor';
      const allUsers = await User.find({
        _id: { $ne: req.user.id },
        isActive: true
      }).select('_id');

      for (const user of allUsers) {
        await Notification.createAndEmit(io, {
          recipient: user._id,
          sender: req.user.id,
          type: 'equipment_listing',
          title: 'New Equipment Listed',
          message: `${sellerName} listed new equipment: "${equipment.name}"`,
          referenceType: 'Equipment',
          referenceId: equipment._id,
          link: `/equipment/${equipment._id}`,
        });
      }
    } catch (notifError) {
      console.error('Error creating equipment listing notifications:', notifError);
    }

    // Emit socket event for real-time updates
    if (io) {
      io.to('equipment').emit('equipment:created', { equipment });
    }

    res.status(201).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private/Admin or Vendor (own equipment only)
router.put('/:id', protect, authorize('admin', 'vendor'), async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    // Vendors can only update their own equipment
    if (req.user.role === 'vendor' && equipment.vendorId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this equipment'
      });
    }

    const updateData = { ...req.body };

    // Vendors can't change certain fields
    if (req.user.role === 'vendor') {
      delete updateData.vendorId;
      delete updateData.isFeatured;
      delete updateData.sortOrder;
    }

    // Parse specifications if string
    if (typeof updateData.specifications === 'string') {
      updateData.specifications = JSON.parse(updateData.specifications);
    }

    // Parse features if string
    if (typeof updateData.features === 'string') {
      updateData.features = JSON.parse(updateData.features);
    }

    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to('equipment').emit('equipment:updated', { equipment: updatedEquipment });
    }

    res.json({
      success: true,
      data: updatedEquipment
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private/Admin or Vendor (own equipment only)
router.delete('/:id', protect, authorize('admin', 'vendor'), async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    // Vendors can only delete their own equipment
    if (req.user.role === 'vendor' && equipment.vendorId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this equipment'
      });
    }

    const equipmentId = equipment._id;
    await Equipment.findByIdAndDelete(req.params.id);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to('equipment').emit('equipment:deleted', { equipmentId });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting equipment'
    });
  }
});

// @desc    Submit inquiry for equipment (creates chat conversation with vendor)
// @route   POST /api/equipment/:id/inquiry
// @access  Private (requires authentication to start chat)
router.post('/:id/inquiry', protect, async (req, res) => {
  console.log('📨 Inquiry endpoint hit:', req.params.id);
  console.log('📨 Request body:', req.body);
  console.log('📨 User:', req.user?.id, req.user?.role);
  try {
    const { name, email, company, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and message'
      });
    }

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    // Check if equipment has a vendor
    if (!equipment.vendorId) {
      return res.status(400).json({
        success: false,
        error: 'This equipment does not have an associated vendor'
      });
    }

    // Don't allow vendor to inquire about their own equipment
    if (equipment.vendorId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot send an inquiry for your own equipment'
      });
    }

    // Store inquiry in equipment record for tracking
    const inquiry = {
      user: req.user.id,
      name,
      email,
      company,
      phone,
      message,
      status: 'new',
      createdAt: new Date()
    };

    equipment.inquiries.push(inquiry);
    await equipment.save();

    // Import models needed for chat
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');

    // Find or create conversation between inquirer and vendor
    const conversation = await Conversation.findOrCreateDirect(req.user.id, equipment.vendorId);

    // Create formatted message with equipment context (plain text)
    const priceDisplay = typeof equipment.price === 'number'
      ? `$${equipment.price.toLocaleString()}`
      : equipment.price;

    const formattedMessage =
      `📦 Equipment Inquiry\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Product: ${equipment.name}\n` +
      `Brand: ${equipment.brand || 'N/A'}\n` +
      `Price: ${priceDisplay}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${message}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Contact: ${email}${phone ? ` | ${phone}` : ''}${company ? `\nCompany: ${company}` : ''}`;

    // Create message in conversation
    const chatMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      content: formattedMessage,
      readBy: [{ user: req.user.id, readAt: new Date() }],
    });

    // Update conversation's last message
    await conversation.updateLastMessage(chatMessage);

    // Populate sender info
    await chatMessage.populate('sender', 'name email role avatar');

    // Get io for real-time updates
    const io = req.app.get('io');

    // Emit real-time chat events
    if (io) {
      // Emit to the conversation room
      io.to(`conversation:${conversation._id}`).emit('message:new', {
        conversationId: conversation._id,
        message: chatMessage
      });
      // Emit to vendor's chat room for sidebar updates
      io.to(`chat:${equipment.vendorId.toString()}`).emit('conversation:update', {
        conversationId: conversation._id,
        lastMessage: chatMessage.content,
        lastMessageAt: chatMessage.createdAt,
        senderId: req.user.id
      });
    }

    // Create notification for vendor
    const senderName = req.user.name || req.user.firstName || name;
    try {
      await Notification.createAndEmit(io, {
        recipient: equipment.vendorId,
        sender: req.user.id,
        type: 'equipment_inquiry',
        title: 'New Equipment Inquiry',
        message: `${senderName} sent an inquiry about "${equipment.name}"`,
        referenceType: 'Equipment',
        referenceId: equipment._id,
        link: `/chat?contact=${req.user.id}`,
      });
    } catch (notifError) {
      console.error('Error creating inquiry notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: {
        conversationId: conversation._id,
        vendorId: equipment.vendorId
      }
    });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({
      success: false,
      error: 'Error submitting inquiry'
    });
  }
});

module.exports = router;
