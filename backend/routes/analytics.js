const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

/**
 * POST /api/analytics/event
 * Log an analytics event
 * @access Private
 */
router.post('/event', protect, async (req, res) => {
  try {
    const { eventType, resourceType, resourceId, relatedUserId, isEngagement, description, metadata } =
      req.body;

    if (!eventType || !resourceType) {
      return res.status(400).json({
        success: false,
        error: 'eventType and resourceType are required',
      });
    }

    const event = await analyticsService.logEvent({
      userId: req.user._id,
      eventType,
      resourceType,
      resourceId,
      relatedUserId,
      isEngagement,
      description,
      metadata: {
        ...metadata,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/engagement-stats
 * Get user engagement stats
 * @access Private
 * @query days - Number of days to look back (default: 7)
 */
router.get('/engagement-stats', protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const stats = await analyticsService.getUserEngagementStats(req.user._id, days);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/engagement-trends
 * Get engagement trends over time
 * @access Private
 * @query days - Number of days to look back (default: 30)
 */
router.get('/engagement-trends', protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trends = await analyticsService.getEngagementTrends(req.user._id, days);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/engagement-score
 * Get user engagement score (0-100)
 * @access Private
 * @query days - Number of days to look back (default: 30)
 */
router.get('/engagement-score', protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const score = await analyticsService.calculateEngagementScore(req.user._id, days);

    res.json({
      success: true,
      data: {
        score,
        days,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/recent-activities
 * Get recent user activities
 * @access Private
 * @query limit - Number of activities to return (default: 5)
 */
router.get('/recent-activities', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const activities = await analyticsService.getRecentActivities(req.user._id, limit);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/resource/:resourceType/:resourceId
 * Get engagement stats for a specific resource
 * @access Public
 */
router.get('/resource/:resourceType/:resourceId', async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const engagement = await analyticsService.getResourceEngagement(resourceId, resourceType);

    res.json({
      success: true,
      data: engagement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
