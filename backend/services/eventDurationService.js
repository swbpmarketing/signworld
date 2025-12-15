const Event = require('../models/Event');

/**
 * Calculate average event duration in hours by category
 */
const getAverageDurationByCategory = async () => {
  try {
    const categories = ['training', 'webinar', 'convention', 'meeting', 'social', 'other'];
    const durations = {};

    for (const category of categories) {
      const events = await Event.find({ category }).lean();

      if (events.length === 0) {
        durations[category] = 0;
        continue;
      }

      let totalDuration = 0;
      let validCount = 0;

      events.forEach((event) => {
        if (event.startDate && event.endDate) {
          const duration = (event.endDate - event.startDate) / (1000 * 60 * 60); // Convert to hours
          if (duration > 0) {
            totalDuration += duration;
            validCount++;
          }
        }
      });

      durations[category] = validCount > 0 ? Math.round(totalDuration / validCount * 10) / 10 : 0;
    }

    return durations;
  } catch (error) {
    console.error('Error calculating average duration by category:', error);
    return {
      training: 0,
      webinar: 0,
      convention: 0,
      meeting: 0,
      social: 0,
      other: 0,
    };
  }
};

/**
 * Get total hours per event category (for current month or custom period)
 */
const getTotalHoursByCategory = async (startDate = null, endDate = null) => {
  try {
    let query = {};

    if (startDate && endDate) {
      query = {
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      };
    }

    const events = await Event.find(query).lean();
    const totals = {
      training: 0,
      webinar: 0,
      convention: 0,
      meeting: 0,
      social: 0,
      other: 0,
    };

    events.forEach((event) => {
      if (event.startDate && event.endDate && event.category) {
        const duration = (event.endDate - event.startDate) / (1000 * 60 * 60); // Convert to hours
        if (duration > 0 && totals.hasOwnProperty(event.category)) {
          totals[event.category] += Math.round(duration * 10) / 10;
        }
      }
    });

    return totals;
  } catch (error) {
    console.error('Error calculating total hours by category:', error);
    return {
      training: 0,
      webinar: 0,
      convention: 0,
      meeting: 0,
      social: 0,
      other: 0,
    };
  }
};

/**
 * Get event statistics for analytics
 */
const getEventStats = async () => {
  try {
    const allEvents = await Event.find().lean();

    if (allEvents.length === 0) {
      return {
        totalEvents: 0,
        totalHours: 0,
        averageEventDuration: 0,
        eventsByCategory: {},
        upcomingEvents: 0,
        pastEvents: 0,
      };
    }

    const now = new Date();
    let totalDuration = 0;
    let validCount = 0;
    let upcomingCount = 0;
    let pastCount = 0;

    const eventsByCategory = {};

    allEvents.forEach((event) => {
      // Count by category
      if (!eventsByCategory[event.category]) {
        eventsByCategory[event.category] = 0;
      }
      eventsByCategory[event.category]++;

      // Calculate duration
      if (event.startDate && event.endDate) {
        const duration = (event.endDate - event.startDate) / (1000 * 60 * 60);
        if (duration > 0) {
          totalDuration += duration;
          validCount++;
        }
      }

      // Count upcoming vs past
      if (event.startDate > now) {
        upcomingCount++;
      } else {
        pastCount++;
      }
    });

    return {
      totalEvents: allEvents.length,
      totalHours: Math.round(totalDuration * 10) / 10,
      averageEventDuration: validCount > 0 ? Math.round((totalDuration / validCount) * 10) / 10 : 0,
      eventsByCategory,
      upcomingEvents: upcomingCount,
      pastEvents: pastCount,
    };
  } catch (error) {
    console.error('Error getting event stats:', error);
    return {
      totalEvents: 0,
      totalHours: 0,
      averageEventDuration: 0,
      eventsByCategory: {},
      upcomingEvents: 0,
      pastEvents: 0,
    };
  }
};

/**
 * Get user's event participation hours
 */
const getUserEventHours = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await Event.find({
      'attendees.user': userId,
      startDate: { $gte: startDate },
    }).lean();

    let totalHours = 0;
    let attendedCount = 0;

    events.forEach((event) => {
      if (event.startDate && event.endDate) {
        const duration = (event.endDate - event.startDate) / (1000 * 60 * 60);
        if (duration > 0) {
          totalHours += duration;
          attendedCount++;
        }
      }
    });

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      eventsAttended: attendedCount,
      averageEventDuration: attendedCount > 0 ? Math.round((totalHours / attendedCount) * 10) / 10 : 0,
    };
  } catch (error) {
    console.error('Error getting user event hours:', error);
    return {
      totalHours: 0,
      eventsAttended: 0,
      averageEventDuration: 0,
    };
  }
};

module.exports = {
  getAverageDurationByCategory,
  getTotalHoursByCategory,
  getEventStats,
  getUserEventHours,
};
