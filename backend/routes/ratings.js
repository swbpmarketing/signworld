const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const satisfactionService = require('../services/satisfactionService');

/**
 * POST /api/ratings
 * Create a new satisfaction rating
 * Requires authentication
 */
router.post('/', auth, async (req, res) => {
  try {
    const { ratedUserId, rating, comment, categories, entityType, entityId, isAnonymous } = req.body;

    // Validation
    if (!ratedUserId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'ratedUserId and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    if (req.user._id.toString() === ratedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot rate yourself',
      });
    }

    const newRating = await satisfactionService.createRating(req.user._id, ratedUserId, {
      rating,
      comment,
      categories,
      entityType,
      entityId,
      isAnonymous,
    });

    res.status(201).json({
      success: true,
      message: 'Rating created successfully',
      data: newRating,
    });
  } catch (error) {
    console.error('Error creating rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating rating',
      error: error.message,
    });
  }
});

/**
 * GET /api/ratings/user/:userId
 * Get all ratings received by a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const { userId } = req.params;

    const result = await satisfactionService.getUserRatings(userId, parseInt(limit), parseInt(skip));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting user ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving ratings',
      error: error.message,
    });
  }
});

/**
 * GET /api/ratings/score/:userId
 * Get satisfaction score for a user
 */
router.get('/score/:userId', async (req, res) => {
  try {
    const { entityType } = req.query;
    const { userId } = req.params;

    const score = await satisfactionService.getUserSatisfactionScore(
      userId,
      entityType || null
    );

    res.json({
      success: true,
      data: score,
    });
  } catch (error) {
    console.error('Error getting satisfaction score:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating satisfaction score',
      error: error.message,
    });
  }
});

/**
 * GET /api/ratings/recent/:userId
 * Get recent ratings for a user
 * Query params: given (true/false), limit
 */
router.get('/recent/:userId', auth, async (req, res) => {
  try {
    const { given = false, limit = 10 } = req.query;
    const { userId } = req.params;

    // Check if user is viewing their own ratings or has permission
    if (req.user._id.toString() !== userId) {
      // Allow public viewing of received ratings only
      if (given === 'true') {
        return res.status(403).json({
          success: false,
          message: 'Cannot view other users\' given ratings',
        });
      }
    }

    const ratings = await satisfactionService.getRecentRatings(
      userId,
      given === 'true',
      parseInt(limit)
    );

    res.json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    console.error('Error getting recent ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving recent ratings',
      error: error.message,
    });
  }
});

/**
 * POST /api/ratings/:ratingId/helpful
 * Mark a rating as helpful
 */
router.post('/:ratingId/helpful', async (req, res) => {
  try {
    const { ratingId } = req.params;

    const updated = await satisfactionService.markAsHelpful(ratingId);

    res.json({
      success: true,
      message: 'Rating marked as helpful',
      data: updated,
    });
  } catch (error) {
    console.error('Error marking rating as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating rating',
      error: error.message,
    });
  }
});

/**
 * POST /api/ratings/:ratingId/not-helpful
 * Mark a rating as not helpful
 */
router.post('/:ratingId/not-helpful', async (req, res) => {
  try {
    const { ratingId } = req.params;

    const updated = await satisfactionService.markAsNotHelpful(ratingId);

    res.json({
      success: true,
      message: 'Rating marked as not helpful',
      data: updated,
    });
  } catch (error) {
    console.error('Error marking rating as not helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating rating',
      error: error.message,
    });
  }
});

/**
 * GET /api/ratings/analytics/:userId
 * Get vendor/user satisfaction analytics
 */
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const analytics = await satisfactionService.getVendorAnalytics(userId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error getting vendor analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics',
      error: error.message,
    });
  }
});

module.exports = router;
