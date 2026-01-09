const express = require('express');
const router = express.Router();
const { protect, handlePreviewMode, blockPreviewWrites } = require('../middleware/auth');
const equipmentStatsService = require('../services/equipmentStatsService');

/**
 * GET /api/equipment-stats/popular
 * Get popular equipment by cart/wishlist/quote interactions
 * @access Private
 */
router.get('/popular', protect, handlePreviewMode, async (req, res) => {
  try {
    const stats = await equipmentStatsService.getPopularEquipment();

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve popular equipment',
      });
    }

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
 * GET /api/equipment-stats
 * Get user equipment stats
 * @access Private
 */
router.get('/', protect, handlePreviewMode, async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user._id;

    const stats = await equipmentStatsService.getUserStats(targetUserId);

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve stats',
      });
    }

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
 * POST /api/equipment-stats/sync-cart
 * Sync cart items from localStorage
 * @access Private
 * @body cartItems - Array of items from localStorage
 */
router.post('/sync-cart', protect, handlePreviewMode, blockPreviewWrites, async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user._id;
    const { cartItems } = req.body;

    if (!Array.isArray(cartItems)) {
      return res.status(400).json({
        success: false,
        error: 'cartItems must be an array',
      });
    }

    const stats = await equipmentStatsService.syncCart(targetUserId, cartItems);

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to sync cart',
      });
    }

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
 * POST /api/equipment-stats/sync-wishlist
 * Sync wishlist items from localStorage
 * @access Private
 * @body wishlistItems - Array of equipment IDs
 */
router.post('/sync-wishlist', protect, handlePreviewMode, blockPreviewWrites, async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user._id;
    const { wishlistItems } = req.body;

    if (!Array.isArray(wishlistItems)) {
      return res.status(400).json({
        success: false,
        error: 'wishlistItems must be an array',
      });
    }

    const stats = await equipmentStatsService.syncWishlist(targetUserId, wishlistItems);

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to sync wishlist',
      });
    }

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
 * POST /api/equipment-stats/cart/:equipmentId
 * Add item to cart
 * @access Private
 * @body quantity - Quantity to add (default: 1)
 */
router.post('/cart/:equipmentId', protect, handlePreviewMode, blockPreviewWrites, async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user._id;
    const { equipmentId } = req.params;
    const { quantity } = req.body;

    const stats = await equipmentStatsService.addToCart(targetUserId, equipmentId, quantity || 1);

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add to cart',
      });
    }

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
 * POST /api/equipment-stats/wishlist/:equipmentId
 * Add item to wishlist
 * @access Private
 */
router.post('/wishlist/:equipmentId', protect, handlePreviewMode, blockPreviewWrites, async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user._id;
    const { equipmentId } = req.params;

    const stats = await equipmentStatsService.addToWishlist(targetUserId, equipmentId);

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add to wishlist',
      });
    }

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
 * DELETE /api/equipment-stats/wishlist/:equipmentId
 * Remove item from wishlist
 * @access Private
 */
router.delete('/wishlist/:equipmentId', protect, handlePreviewMode, blockPreviewWrites, async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user._id;
    const { equipmentId } = req.params;

    const stats = await equipmentStatsService.removeFromWishlist(targetUserId, equipmentId);

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to remove from wishlist',
      });
    }

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
 * POST /api/equipment-stats/quote-request/:equipmentId
 * Add quote request
 * @access Private
 */
router.post('/quote-request/:equipmentId', protect, handlePreviewMode, blockPreviewWrites, async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user._id;
    const { equipmentId } = req.params;

    const stats = await equipmentStatsService.addQuoteRequest(targetUserId, equipmentId);

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add quote request',
      });
    }

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
 * POST /api/equipment-stats/clear-cart
 * Clear cart
 * @access Private
 */
router.post('/clear-cart', protect, handlePreviewMode, blockPreviewWrites, async (req, res) => {
  try {
    const targetUserId = req.previewMode.active
      ? req.previewMode.previewUser._id
      : req.user._id;

    const stats = await equipmentStatsService.clearCart(targetUserId);

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to clear cart',
      });
    }

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

module.exports = router;
