const User = require('../models/User');
const Rating = require('../models/Rating');
const mongoose = require('mongoose');

// @desc    Get all owners
// @route   GET /api/owners
// @access  Public
exports.getOwners = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const query = { role: 'owner', isActive: true };
    
    // Add search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { specialties: { $in: [searchRegex] } },
        { 'address.city': searchRegex },
        { 'address.state': searchRegex }
      ];
    }
    
    // Add specialty filter
    if (req.query.specialty) {
      query.specialties = { $in: [new RegExp(req.query.specialty, 'i')] };
    }
    
    // Add location filter
    if (req.query.city) {
      query['address.city'] = new RegExp(req.query.city, 'i');
    }
    
    if (req.query.state) {
      query['address.state'] = new RegExp(req.query.state, 'i');
    }

    const owners = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    // Get rating statistics for each owner
    const ownersWithRatings = await Promise.all(
      owners.map(async (owner) => {
        const ratingStats = await Rating.getAverageRating(owner._id);
        return {
          ...owner.toObject(),
          rating: ratingStats
        };
      })
    );

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: ownersWithRatings.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      data: ownersWithRatings,
    });
  } catch (error) {
    console.error('Get owners error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error - Unable to fetch owners',
    });
  }
};

// @desc    Get single owner
// @route   GET /api/owners/:id
// @access  Public
exports.getOwner = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid owner ID format',
      });
    }

    const owner = await User.findOne({ 
      _id: id, 
      role: 'owner', 
      isActive: true 
    }).select('-password');

    if (!owner) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found',
      });
    }

    // Get rating statistics
    const ratingStats = await Rating.getAverageRating(owner._id);
    
    // Get recent reviews (published and approved)
    const recentReviews = await Rating.find({
      owner: owner._id,
      status: 'approved',
      isPublished: true
    })
    .populate('reviewer', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('rating comment createdAt reviewer');

    const ownerData = {
      ...owner.toObject(),
      rating: ratingStats,
      recentReviews
    };

    res.status(200).json({
      success: true,
      data: ownerData,
    });
  } catch (error) {
    console.error('Get owner error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error - Unable to fetch owner',
    });
  }
};

// @desc    Get owner reviews
// @route   GET /api/owners/:id/reviews
// @access  Public
exports.getOwnerReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid owner ID format',
      });
    }

    // Check if owner exists
    const owner = await User.findOne({ 
      _id: id, 
      role: 'owner', 
      isActive: true 
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found',
      });
    }

    const query = {
      owner: id,
      status: 'approved',
      isPublished: true
    };

    const reviews = await Rating.find(query)
      .populate('reviewer', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex)
      .select('rating comment createdAt reviewer');

    const total = await Rating.countDocuments(query);
    
    // Get rating distribution
    const ratingDistribution = await Rating.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      ratingDistribution,
      data: reviews,
    });
  } catch (error) {
    console.error('Get owner reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error - Unable to fetch reviews',
    });
  }
};

// @desc    Create review for owner
// @route   POST /api/owners/:id/reviews
// @access  Private
exports.createOwnerReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid owner ID format',
      });
    }

    // Check if owner exists
    const owner = await User.findOne({ 
      _id: id, 
      role: 'owner', 
      isActive: true 
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found',
      });
    }

    // Check if user is trying to review themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot review yourself',
      });
    }

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid rating between 1 and 5',
      });
    }

    // Check if user has already reviewed this owner
    const existingReview = await Rating.findOne({
      owner: id,
      reviewer: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this owner',
      });
    }

    const review = await Rating.create({
      owner: id,
      reviewer: req.user.id,
      rating: parseInt(rating),
      comment: comment?.trim() || '',
      status: 'pending', // Reviews need approval
      isPublished: false
    });

    const populatedReview = await Rating.findById(review._id)
      .populate('reviewer', 'name profileImage')
      .populate('owner', 'name company');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and is pending approval',
      data: populatedReview,
    });
  } catch (error) {
    console.error('Create owner review error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this owner',
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error - Unable to create review',
    });
  }
};

// @desc    Update owner profile (owner can update their own profile)
// @route   PUT /api/owners/:id
// @access  Private (Owner or Admin)
exports.updateOwner = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid owner ID format',
      });
    }

    // Check if user is updating their own profile or is admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile',
      });
    }

    const owner = await User.findOne({ 
      _id: id, 
      role: 'owner' 
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found',
      });
    }

    // Fields that can be updated
    const allowedFields = [
      'name', 'phone', 'company', 'address', 'specialties',
      'equipment', 'yearsInBusiness', 'profileImage', 'socialLinks',
      'mentoring', 'location', 'businessHours'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Only admin can update isActive status
    if (req.user.role === 'admin' && req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive;
    }

    const updatedOwner = await User.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: updatedOwner,
    });
  } catch (error) {
    console.error('Update owner error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error - Unable to update owner',
    });
  }
};

// @desc    Create new owner (admin only)
// @route   POST /api/owners
// @access  Private/Admin
exports.createOwner = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      company,
      address,
      specialties,
      equipment,
      yearsInBusiness,
      sendWelcomeEmail
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists'
      });
    }

    // Create owner
    const owner = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'owner',
      phone,
      company,
      address,
      specialties: specialties || [],
      equipment: equipment || [],
      yearsInBusiness,
      isActive: true
    });

    // Send welcome email if requested
    if (sendWelcomeEmail) {
      const emailService = require('../services/emailService');
      await emailService.sendWelcomeEmail({
        to: owner.email,
        name: owner.name
      });
    }

    // Return owner without password
    const ownerData = await User.findById(owner._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'Owner created successfully',
      data: ownerData
    });
  } catch (error) {
    console.error('Create owner error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server Error - Unable to create owner'
    });
  }
};

// @desc    Delete owner (admin only)
// @route   DELETE /api/owners/:id
// @access  Private/Admin
exports.deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid owner ID format',
      });
    }

    const owner = await User.findOne({
      _id: id,
      role: 'owner'
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found',
      });
    }

    // Soft delete by setting isActive to false
    owner.isActive = false;
    await owner.save();

    res.status(200).json({
      success: true,
      message: 'Owner deleted successfully',
    });
  } catch (error) {
    console.error('Delete owner error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error - Unable to delete owner',
    });
  }
};

// @desc    Get owners for map display
// @route   GET /api/owners/map
// @access  Public
exports.getMapOwners = async (req, res) => {
  try {
    // Get all active owners with location data
    const owners = await User.find({
      role: 'owner',
      isActive: true,
      'location.coordinates': { $exists: true, $ne: [] }
    })
    .select('name company address location specialties phone email profileImage businessHours yearsInBusiness')
    .lean();

    // Get rating statistics for each owner
    const ownersWithRatings = await Promise.all(
      owners.map(async (owner) => {
        const ratingStats = await Rating.getAverageRating(owner._id);
        return {
          ...owner,
          rating: ratingStats
        };
      })
    );

    res.status(200).json({
      success: true,
      count: ownersWithRatings.length,
      data: ownersWithRatings,
    });
  } catch (error) {
    console.error('Get map owners error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error - Unable to fetch map data',
    });
  }
};

// @desc    Get nearby owners within radius
// @route   GET /api/owners/nearby
// @access  Public
exports.getNearbyOwners = async (req, res) => {
  try {
    const { lat, lng, radius = 50, specialty, limit = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Please provide latitude and longitude',
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistance = parseFloat(radius) * 1609.34; // Convert miles to meters

    // Build the query
    const query = {
      role: 'owner',
      isActive: true,
      'location.coordinates': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      }
    };

    // Add specialty filter if provided
    if (specialty) {
      query.specialties = { $in: [new RegExp(specialty, 'i')] };
    }

    const owners = await User.find(query)
      .select('name company address location specialties phone email profileImage businessHours yearsInBusiness')
      .limit(parseInt(limit))
      .lean();

    // Calculate distance for each owner and add ratings
    const ownersWithDetails = await Promise.all(
      owners.map(async (owner) => {
        const ratingStats = await Rating.getAverageRating(owner._id);

        // Calculate distance using Haversine formula
        const ownerLat = owner.location?.coordinates?.[1];
        const ownerLng = owner.location?.coordinates?.[0];
        let distance = null;

        if (ownerLat && ownerLng) {
          distance = calculateDistance(latitude, longitude, ownerLat, ownerLng);
        }

        return {
          ...owner,
          rating: ratingStats,
          distance: distance !== null ? parseFloat(distance.toFixed(1)) : null
        };
      })
    );

    // Sort by distance
    ownersWithDetails.sort((a, b) => (a.distance || 999) - (b.distance || 999));

    res.status(200).json({
      success: true,
      count: ownersWithDetails.length,
      center: { lat: latitude, lng: longitude },
      radius: parseFloat(radius),
      data: ownersWithDetails,
    });
  } catch (error) {
    console.error('Get nearby owners error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error - Unable to fetch nearby owners',
    });
  }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// @desc    Get owner statistics
// @route   GET /api/owners/:id/stats
// @access  Public
exports.getOwnerStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid owner ID format',
      });
    }

    const owner = await User.findOne({ 
      _id: id, 
      role: 'owner', 
      isActive: true 
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found',
      });
    }

    // Get comprehensive statistics
    const [ratingStats, totalReviews, ratingDistribution] = await Promise.all([
      Rating.getAverageRating(id),
      Rating.countDocuments({ owner: id, status: 'approved', isPublished: true }),
      Rating.aggregate([
        { 
          $match: { 
            owner: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id, 
            status: 'approved', 
            isPublished: true 
          } 
        },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ])
    ]);

    const stats = {
      profile: {
        joinedDate: owner.createdAt,
        yearsInBusiness: owner.yearsInBusiness || 0,
        specialtiesCount: owner.specialties?.length || 0,
        equipmentCount: owner.equipment?.length || 0,
        isMentorAvailable: owner.mentoring?.available || false
      },
      ratings: {
        ...ratingStats,
        totalReviews,
        distribution: ratingDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get owner stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error - Unable to fetch owner statistics',
    });
  }
};