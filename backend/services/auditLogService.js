const AuditLog = require('../models/AuditLog');

/**
 * Log a preview mode action
 * @param {Object} logData - Audit log data
 * @returns {Promise<Object|null>} Created audit log or null on failure
 */
const logPreviewAction = async (logData) => {
  try {
    const auditLog = new AuditLog({
      adminUserId: logData.adminUserId,
      previewedUserId: logData.previewedUserId,
      action: logData.action,
      resourceType: logData.resourceType,
      resourceId: logData.resourceId,
      endpoint: logData.endpoint,
      httpMethod: logData.httpMethod,
      metadata: logData.metadata || {},
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error logging preview action:', error);
    // Don't throw - audit failure shouldn't break the app
    return null;
  }
};

/**
 * Get audit logs for a specific admin
 * @param {String} adminUserId - Admin user ID
 * @param {Object} options - Query options (limit, skip, startDate, endDate)
 * @returns {Promise<Array>} Array of audit logs
 */
const getAdminAuditLogs = async (adminUserId, options = {}) => {
  try {
    const { limit = 100, skip = 0, startDate, endDate } = options;

    const query = { adminUserId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('previewedUserId', 'name email role company')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    return logs;
  } catch (error) {
    console.error('Error fetching admin audit logs:', error);
    return [];
  }
};

/**
 * Get audit logs for a specific previewed user (who accessed their data)
 * @param {String} previewedUserId - Previewed user ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of audit logs
 */
const getUserAccessLogs = async (previewedUserId, options = {}) => {
  try {
    const { limit = 100, skip = 0, startDate, endDate } = options;

    const query = { previewedUserId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('adminUserId', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    return logs;
  } catch (error) {
    console.error('Error fetching user access logs:', error);
    return [];
  }
};

/**
 * Get audit log statistics
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Audit statistics
 */
const getAuditStats = async (filters = {}) => {
  try {
    const { adminUserId, startDate, endDate } = filters;

    const query = {};
    if (adminUserId) query.adminUserId = adminUserId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const totalLogs = await AuditLog.countDocuments(query);
    const blockedWrites = await AuditLog.countDocuments({ ...query, action: 'blocked_write' });

    // Get action breakdown
    const actionBreakdown = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get most accessed users
    const mostAccessedUsers = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$previewedUserId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalLogs,
      blockedWrites,
      actionBreakdown: actionBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      mostAccessedUsers,
    };
  } catch (error) {
    console.error('Error getting audit stats:', error);
    return null;
  }
};

module.exports = {
  logPreviewAction,
  getAdminAuditLogs,
  getUserAccessLogs,
  getAuditStats,
};
