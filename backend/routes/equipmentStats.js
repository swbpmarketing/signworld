const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const equipmentStatsService = require('../services/equipmentStatsService');

/**
 * GET /api/equipment-stats
 * Get user equipment stats
 * @access Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const stats = await equipmentStatsService.getUserStats(req.user._id);

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
router.post('/sync-cart', protect, async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!Array.isArray(cartItems)) {
      return res.status(400).json({
        success: false,
        error: 'cartItems must be an array',
      });
    }

    const stats = await equipmentStatsService.syncCart(req.user._id, cartItems);

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
router.post('/sync-wishlist', protect, async (req, res) => {
  try {
    const { wishlistItems } = req.body;

    if (!Array.isArray(wishlistItems)) {
      return res.status(400).json({
        success: false,
        error: 'wishlistItems must be an array',
      });
    }

    const stats = await equipmentStatsService.syncWishlist(req.user._id, wishlistItems);

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
router.post('/cart/:equipmentId', protect, async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { quantity } = req.body;

    const stats = await equipmentStatsService.addToCart(req.user._id, equipmentId, quantity || 1);

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
router.post('/wishlist/:equipmentId', protect, async (req, res) => {
  try {
    const { equipmentId } = req.params;

    const stats = await equipmentStatsService.addToWishlist(req.user._id, equipmentId);

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
router.delete('/wishlist/:equipmentId', protect, async (req, res) => {
  try {
    const { equipmentId } = req.params;

    const stats = await equipmentStatsService.removeFromWishlist(req.user._id, equipmentId);

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
router.post('/quote-request/:equipmentId', protect, async (req, res) => {
  try {
    const { equipmentId } = req.params;

    const stats = await equipmentStatsService.addQuoteRequest(req.user._id, equipmentId);

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
router.post('/clear-cart', protect, async (req, res) => {
  try {
    const stats = await equipmentStatsService.clearCart(req.user._id);

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
