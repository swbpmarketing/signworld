const EquipmentStats = require('../models/EquipmentStats');
const Equipment = require('../models/Equipment');

/**
 * Get or create equipment stats for a user
 */
const getOrCreateStats = async (userId) => {
  try {
    let stats = await EquipmentStats.findOne({ userId });
    if (!stats) {
      stats = new EquipmentStats({ userId });
      await stats.save();
    }
    return stats;
  } catch (error) {
    console.error('Error getting/creating equipment stats:', error);
    return null;
  }
};

/**
 * Sync cart items from client localStorage
 */
const syncCart = async (userId, cartItems) => {
  try {
    let stats = await getOrCreateStats(userId);
    if (!stats) throw new Error('Failed to get stats');

    // Clear existing cart
    stats.cartItems = [];

    // Add new items
    let estimatedSpend = 0;
    for (const item of cartItems) {
      const equipment = await Equipment.findById(item.equipmentId);
      if (equipment) {
        stats.cartItems.push({
          equipmentId: item.equipmentId,
          quantity: item.quantity || 1,
          addedAt: new Date(),
        });
        estimatedSpend += (equipment.price || 0) * (item.quantity || 1);
      }
    }

    stats.stats.cartAddCount = cartItems.length;
    stats.stats.estimatedSpend = estimatedSpend;
    await stats.save();

    return stats;
  } catch (error) {
    console.error('Error syncing cart:', error);
    return null;
  }
};

/**
 * Sync wishlist items from client
 */
const syncWishlist = async (userId, wishlistItems) => {
  try {
    let stats = await getOrCreateStats(userId);
    if (!stats) throw new Error('Failed to get stats');

    stats.wishlistItems = wishlistItems.map((itemId) => ({
      equipmentId: itemId,
      addedAt: new Date(),
    }));

    stats.stats.wishlistAddCount = wishlistItems.length;
    await stats.save();

    return stats;
  } catch (error) {
    console.error('Error syncing wishlist:', error);
    return null;
  }
};

/**
 * Add item to cart
 */
const addToCart = async (userId, equipmentId, quantity = 1) => {
  try {
    let stats = await getOrCreateStats(userId);
    if (!stats) throw new Error('Failed to get stats');

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) throw new Error('Equipment not found');

    // Check if item already in cart
    const existingItem = stats.cartItems.find((item) => item.equipmentId.toString() === equipmentId.toString());

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      stats.cartItems.push({
        equipmentId,
        quantity,
        addedAt: new Date(),
      });
      stats.stats.cartAddCount++;
    }

    // Update estimated spend
    stats.stats.estimatedSpend += equipment.price * quantity;
    await stats.save();

    return stats;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return null;
  }
};

/**
 * Add item to wishlist
 */
const addToWishlist = async (userId, equipmentId) => {
  try {
    let stats = await getOrCreateStats(userId);
    if (!stats) throw new Error('Failed to get stats');

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) throw new Error('Equipment not found');

    const isAlreadyInWishlist = stats.wishlistItems.some(
      (item) => item.equipmentId.toString() === equipmentId.toString()
    );

    if (!isAlreadyInWishlist) {
      stats.wishlistItems.push({
        equipmentId,
        addedAt: new Date(),
      });
      stats.stats.wishlistAddCount++;
      await stats.save();
    }

    return stats;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return null;
  }
};

/**
 * Remove item from wishlist
 */
const removeFromWishlist = async (userId, equipmentId) => {
  try {
    let stats = await getOrCreateStats(userId);
    if (!stats) throw new Error('Failed to get stats');

    stats.wishlistItems = stats.wishlistItems.filter((item) => item.equipmentId.toString() !== equipmentId.toString());

    await stats.save();
    return stats;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return null;
  }
};

/**
 * Add quote request
 */
const addQuoteRequest = async (userId, equipmentId) => {
  try {
    let stats = await getOrCreateStats(userId);
    if (!stats) throw new Error('Failed to get stats');

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) throw new Error('Equipment not found');

    const isAlreadyRequested = stats.quoteRequests.some(
      (req) => req.equipmentId.toString() === equipmentId.toString() && req.status === 'pending'
    );

    if (!isAlreadyRequested) {
      stats.quoteRequests.push({
        equipmentId,
        requestedAt: new Date(),
        status: 'pending',
      });
      stats.stats.quoteRequestCount++;
      await stats.save();
    }

    return stats;
  } catch (error) {
    console.error('Error adding quote request:', error);
    return null;
  }
};

/**
 * Get user equipment stats
 */
const getUserStats = async (userId) => {
  try {
    const stats = await getOrCreateStats(userId);
    if (!stats) return null;

    return {
      cartCount: stats.cartItems.length,
      wishlistCount: stats.wishlistItems.length,
      quoteRequestCount: stats.quoteRequests.filter((r) => r.status === 'pending').length,
      estimatedSpend: stats.stats.estimatedSpend,
      cartItems: stats.cartItems,
      wishlistItems: stats.wishlistItems,
      quoteRequests: stats.quoteRequests,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

/**
 * Clear cart
 */
const clearCart = async (userId) => {
  try {
    let stats = await getOrCreateStats(userId);
    if (!stats) throw new Error('Failed to get stats');

    stats.cartItems = [];
    stats.stats.estimatedSpend = 0;
    await stats.save();

    return stats;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return null;
  }
};

module.exports = {
  getOrCreateStats,
  syncCart,
  syncWishlist,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  addQuoteRequest,
  getUserStats,
  clearCart,
};
