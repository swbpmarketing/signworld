// User Presence Service
// Tracks user online/offline/idle status in memory

const presenceMap = new Map(); // userId -> { status: 'online'|'offline'|'idle', lastActivity: timestamp, socketId: string }
const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds (as per requirements)

/**
 * Set user as online
 * @param {string} userId - User ID
 * @param {string} socketId - Socket connection ID
 */
const setOnline = (userId, socketId) => {
  presenceMap.set(userId, {
    status: 'online',
    lastActivity: Date.now(),
    socketId,
  });
  return { status: 'online', userId };
};

/**
 * Set user as offline
 * @param {string} userId - User ID
 */
const setOffline = (userId) => {
  const presence = presenceMap.get(userId);
  if (presence) {
    presenceMap.set(userId, {
      ...presence,
      status: 'offline',
      lastActivity: Date.now(),
    });
  } else {
    presenceMap.set(userId, {
      status: 'offline',
      lastActivity: Date.now(),
      socketId: null,
    });
  }
  return { status: 'offline', userId };
};

/**
 * Update user activity timestamp
 * @param {string} userId - User ID
 * @returns {Object|null} Update result with status change info
 */
const updateActivity = (userId) => {
  const presence = presenceMap.get(userId);
  if (presence) {
    const wasIdle = presence.status === 'idle';
    presence.lastActivity = Date.now();
    // If user was idle, mark as online again
    if (wasIdle) {
      presence.status = 'online';
      return { status: 'online', userId, wasIdle: true };
    }
    return { status: 'online', userId, wasIdle: false };
  }
  return null;
};

/**
 * Set user as idle (inactive for X minutes)
 * @param {string} userId - User ID
 */
const setIdle = (userId) => {
  const presence = presenceMap.get(userId);
  if (presence && presence.status === 'online') {
    presence.status = 'idle';
    return { status: 'idle', userId };
  }
  return null;
};

/**
 * Get user presence status
 * @param {string} userId - User ID
 * @returns {Object|null} Presence object or null if not found
 */
const getPresence = (userId) => {
  const presence = presenceMap.get(userId);
  if (!presence) {
    return { status: 'offline', lastActivity: null };
  }

  // Check if user should be marked as idle
  const timeSinceActivity = Date.now() - presence.lastActivity;
  if (presence.status === 'online' && timeSinceActivity > IDLE_TIMEOUT) {
    presence.status = 'idle';
  }

  return {
    status: presence.status,
    lastActivity: presence.lastActivity,
  };
};

/**
 * Get presence status for multiple users
 * @param {string[]} userIds - Array of user IDs
 * @returns {Object} Map of userId -> presence status
 */
const getBulkPresence = (userIds) => {
  const result = {};
  userIds.forEach(userId => {
    result[userId] = getPresence(userId);
  });
  return result;
};

/**
 * Remove user from presence map (on disconnect)
 * @param {string} userId - User ID
 */
const removeUser = (userId) => {
  presenceMap.delete(userId);
};

/**
 * Get user by socket ID
 * @param {string} socketId - Socket connection ID
 * @returns {string|null} User ID or null
 */
const getUserBySocketId = (socketId) => {
  for (const [userId, presence] of presenceMap.entries()) {
    if (presence.socketId === socketId) {
      return userId;
    }
  }
  return null;
};

/**
 * Check and update idle users
 * Called periodically to mark inactive users as idle
 * @param {Function} broadcastCallback - Callback to broadcast status changes
 */
const checkIdleUsers = (broadcastCallback) => {
  const now = Date.now();
  presenceMap.forEach((presence, userId) => {
    if (presence.status === 'online') {
      const timeSinceActivity = now - presence.lastActivity;
      if (timeSinceActivity > IDLE_TIMEOUT) {
        presence.status = 'idle';
        // Broadcast idle status change
        if (broadcastCallback) {
          broadcastCallback({ userId, status: 'idle' });
        }
      }
    }
  });
};

/**
 * Get all online users
 * @returns {string[]} Array of user IDs who are online
 */
const getOnlineUsers = () => {
  const onlineUsers = [];
  presenceMap.forEach((presence, userId) => {
    if (presence.status === 'online') {
      onlineUsers.push(userId);
    }
  });
  return onlineUsers;
};

module.exports = {
  setOnline,
  setOffline,
  updateActivity,
  setIdle,
  getPresence,
  getBulkPresence,
  removeUser,
  getUserBySocketId,
  getOnlineUsers,
  checkIdleUsers,
  IDLE_TIMEOUT,
};
