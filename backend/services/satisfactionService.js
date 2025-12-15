const Satisfaction = require('../models/Satisfaction');

/**
 * Create a satisfaction rating
 */
const createRating = async (raterUserId, ratedUserId, data) => {
  try {
    const rating = new Satisfaction({
      userId: raterUserId,
      ratedUserId,
      entityType: data.entityType || 'interaction',
      entityId: data.entityId,
      rating: data.rating,
      comment: data.comment,
      categories: data.categories || {},
      isAnonymous: data.isAnonymous || false,
    });

    await rating.save();
    return rating;
  } catch (error) {
    console.error('Error creating satisfaction rating:', error);
    throw error;
  }
};

/**
 * Get all ratings for a user (received)
 */
const getUserRatings = async (userId, limit = 50, skip = 0) => {
  try {
    const ratings = await Satisfaction.find({ ratedUserId: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'name avatar')
      .lean();

    const total = await Satisfaction.countDocuments({ ratedUserId: userId });

    return {
      ratings,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting user ratings:', error);
    throw error;
  }
};

/**
 * Get satisfaction score for a user
 */
const getUserSatisfactionScore = async (userId, entityType = null) => {
  try {
    const query = { ratedUserId: userId };
    if (entityType) {
      query.entityType = entityType;
    }

    const ratings = await Satisfaction.find(query).lean();

    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        categoryAverages: {
          professionalism: 0,
          responsiveness: 0,
          quality: 0,
          valueForMoney: 0,
          communication: 0,
        },
      };
    }

    // Calculate distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    // Calculate category averages
    const categoryTotals = {
      professionalism: { sum: 0, count: 0 },
      responsiveness: { sum: 0, count: 0 },
      quality: { sum: 0, count: 0 },
      valueForMoney: { sum: 0, count: 0 },
      communication: { sum: 0, count: 0 },
    };

    ratings.forEach((rating) => {
      totalRating += rating.rating;
      distribution[rating.rating]++;

      // Sum category ratings
      if (rating.categories) {
        Object.keys(categoryTotals).forEach((category) => {
          if (rating.categories[category]) {
            categoryTotals[category].sum += rating.categories[category];
            categoryTotals[category].count++;
          }
        });
      }
    });

    // Calculate averages
    const categoryAverages = {};
    Object.keys(categoryTotals).forEach((category) => {
      categoryAverages[category] =
        categoryTotals[category].count > 0
          ? parseFloat((categoryTotals[category].sum / categoryTotals[category].count).toFixed(2))
          : 0;
    });

    return {
      averageRating: parseFloat((totalRating / ratings.length).toFixed(2)),
      totalRatings: ratings.length,
      ratingDistribution: distribution,
      categoryAverages,
    };
  } catch (error) {
    console.error('Error calculating satisfaction score:', error);
    throw error;
  }
};

/**
 * Get recent ratings for a user (both given and received)
 */
const getRecentRatings = async (userId, given = true, limit = 10) => {
  try {
    const query = given ? { userId } : { ratedUserId: userId };

    const ratings = await Satisfaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(given ? 'ratedUserId' : 'userId', 'name avatar')
      .lean();

    return ratings.map((rating) => ({
      id: rating._id,
      rating: rating.rating,
      comment: rating.comment,
      categories: rating.categories,
      isAnonymous: rating.isAnonymous,
      entityType: rating.entityType,
      createdAt: rating.createdAt,
      relatedUser: given ? rating.ratedUserId : rating.userId,
    }));
  } catch (error) {
    console.error('Error getting recent ratings:', error);
    throw error;
  }
};

/**
 * Mark a rating as helpful
 */
const markAsHelpful = async (ratingId) => {
  try {
    const rating = await Satisfaction.findByIdAndUpdate(
      ratingId,
      { $inc: { helpful: 1 } },
      { new: true }
    );
    return rating;
  } catch (error) {
    console.error('Error marking rating as helpful:', error);
    throw error;
  }
};

/**
 * Mark a rating as not helpful
 */
const markAsNotHelpful = async (ratingId) => {
  try {
    const rating = await Satisfaction.findByIdAndUpdate(
      ratingId,
      { $inc: { notHelpful: 1 } },
      { new: true }
    );
    return rating;
  } catch (error) {
    console.error('Error marking rating as not helpful:', error);
    throw error;
  }
};

/**
 * Get vendor/user satisfaction analytics
 */
const getVendorAnalytics = async (userId) => {
  try {
    const ratings = await Satisfaction.find({ ratedUserId: userId }).lean();

    if (ratings.length === 0) {
      return {
        trustScore: 0,
        totalReviews: 0,
        byEntityType: {},
        topStrengths: [],
        improvementAreas: [],
      };
    }

    // Group by entity type
    const byEntityType = {};
    ratings.forEach((rating) => {
      if (!byEntityType[rating.entityType]) {
        byEntityType[rating.entityType] = {
          count: 0,
          average: 0,
          sum: 0,
        };
      }
      byEntityType[rating.entityType].count++;
      byEntityType[rating.entityType].sum += rating.rating;
    });

    // Calculate averages
    Object.keys(byEntityType).forEach((type) => {
      byEntityType[type].average = parseFloat(
        (byEntityType[type].sum / byEntityType[type].count).toFixed(2)
      );
    });

    // Calculate category strengths
    const categoryScores = {
      professionalism: { sum: 0, count: 0 },
      responsiveness: { sum: 0, count: 0 },
      quality: { sum: 0, count: 0 },
      valueForMoney: { sum: 0, count: 0 },
      communication: { sum: 0, count: 0 },
    };

    ratings.forEach((rating) => {
      if (rating.categories) {
        Object.keys(categoryScores).forEach((category) => {
          if (rating.categories[category]) {
            categoryScores[category].sum += rating.categories[category];
            categoryScores[category].count++;
          }
        });
      }
    });

    // Convert to averages and identify strengths/weaknesses
    const scores = {};
    Object.keys(categoryScores).forEach((category) => {
      scores[category] =
        categoryScores[category].count > 0
          ? parseFloat(
              (categoryScores[category].sum / categoryScores[category].count).toFixed(2)
            )
          : 0;
    });

    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topStrengths = sortedScores.slice(0, 2).map((item) => ({
      category: item[0],
      score: item[1],
    }));
    const improvementAreas = sortedScores.slice(-2).map((item) => ({
      category: item[0],
      score: item[1],
    }));

    // Calculate trust score (0-100)
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const trustScore = Math.round(avgRating * 20); // 1-5 rating -> 20-100 score

    return {
      trustScore,
      totalReviews: ratings.length,
      averageRating: parseFloat(avgRating.toFixed(2)),
      byEntityType,
      topStrengths,
      improvementAreas,
    };
  } catch (error) {
    console.error('Error getting vendor analytics:', error);
    throw error;
  }
};

module.exports = {
  createRating,
  getUserRatings,
  getUserSatisfactionScore,
  getRecentRatings,
  markAsHelpful,
  markAsNotHelpful,
  getVendorAnalytics,
};
