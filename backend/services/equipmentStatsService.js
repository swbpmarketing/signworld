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

/**
 * Get popular equipment aggregated from all users
 */
const getPopularEquipment = async (limit = 10) => {
  try {
    // Aggregate cart adds by equipment
    const allStats = await EquipmentStats.find({}).lean();

    const equipmentPopularity = {};

    // Count cart adds
    allStats.forEach((stat) => {
      stat.cartItems?.forEach((item) => {
        const equipmentId = item.equipmentId?.toString();
        if (!equipmentPopularity[equipmentId]) {
          equipmentPopularity[equipmentId] = {
            equipmentId,
            cartAdds: 0,
            wishlistAdds: 0,
            quoteRequests: 0,
          };
        }
        equipmentPopularity[equipmentId].cartAdds++;
      });

      // Count wishlist adds
      stat.wishlistItems?.forEach((item) => {
        const equipmentId = item.equipmentId?.toString();
        if (!equipmentPopularity[equipmentId]) {
          equipmentPopularity[equipmentId] = {
            equipmentId,
            cartAdds: 0,
            wishlistAdds: 0,
            quoteRequests: 0,
          };
        }
        equipmentPopularity[equipmentId].wishlistAdds++;
      });

      // Count quote requests
      stat.quoteRequests?.forEach((req) => {
        const equipmentId = req.equipmentId?.toString();
        if (!equipmentPopularity[equipmentId]) {
          equipmentPopularity[equipmentId] = {
            equipmentId,
            cartAdds: 0,
            wishlistAdds: 0,
            quoteRequests: 0,
          };
        }
        equipmentPopularity[equipmentId].quoteRequests++;
      });
    });

    // Get equipment details and sort by total interactions
    const topEquipment = await Promise.all(
      Object.values(equipmentPopularity)
        .sort((a, b) => {
          const totalA = a.cartAdds + a.wishlistAdds + a.quoteRequests;
          const totalB = b.cartAdds + b.wishlistAdds + b.quoteRequests;
          return totalB - totalA;
        })
        .slice(0, limit)
        .map(async (item) => {
          const equipment = await Equipment.findById(item.equipmentId).lean();
          return {
            equipmentId: item.equipmentId,
            name: equipment?.name || 'Unknown Equipment',
            cartAdds: item.cartAdds,
            wishlistAdds: item.wishlistAdds,
            quoteRequests: item.quoteRequests,
          };
        })
    );

    return topEquipment;
  } catch (error) {
    console.error('Error getting popular equipment:', error);
    return [];
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
  getPopularEquipment,
};
