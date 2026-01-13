import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socketService';
import api from '../config/axios';

interface PresenceStatus {
  status: 'online' | 'offline' | 'idle';
  lastActivity: number | null;
}

interface PresenceMap {
  [userId: string]: PresenceStatus;
}

const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
const ACTIVITY_CHECK_INTERVAL = 10 * 1000; // 10 seconds

export const usePresence = (userIds: string[] = []) => {
  const { user } = useAuth();
  const [presence, setPresence] = useState<PresenceMap>({});
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Send heartbeat to backend
  const sendHeartbeat = useCallback(async () => {
    if (!user?._id && !user?.id) return;

    try {
      await api.post('/chat/presence/activity');
    } catch (error) {
      // Silently fail - presence is not critical
      console.debug('Failed to send presence heartbeat:', error);
    }
  }, [user]);

  // Send activity via socket
  const sendSocketActivity = useCallback(() => {
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
      socket.emit('presence:activity');
    }
  }, []);

  // Fetch presence status for users
  const fetchPresence = useCallback(async (userIdsToFetch: string[]) => {
    if (userIdsToFetch.length === 0) return;

    try {
      const response = await api.get('/chat/presence', {
        params: {
          userIds: userIdsToFetch.join(','),
        },
      });
      
      if (response.data.success) {
        setPresence(prev => ({
          ...prev,
          ...response.data.data,
        }));
      }
    } catch (error) {
      console.debug('Failed to fetch presence:', error);
    }
  }, []);

  // Initialize presence tracking
  useEffect(() => {
    if (!user?._id && !user?.id) return;

    const socket = socketService.connect();
    const token = localStorage.getItem('token');

    // Authenticate when socket connects (or reconnects)
    const handleConnect = () => {
      if (token) {
        // Small delay to ensure socket is ready
        setTimeout(() => {
          socket.emit('authenticate', token);
        }, 100);
      }
    };

    // Listen for presence updates
    const handlePresenceUpdate = (data: { userId: string; status: 'online' | 'offline' | 'idle' }) => {
      setPresence(prev => ({
        ...prev,
        [data.userId]: {
          status: data.status,
          lastActivity: Date.now(),
        },
      }));
    };

    // Handle disconnect - mark current user as offline
    const handleDisconnect = () => {
      const currentUserId = user?._id || user?.id;
      if (currentUserId) {
        setPresence(prev => ({
          ...prev,
          [currentUserId]: {
            status: 'offline',
            lastActivity: Date.now(),
          },
        }));
      }
    };

    // Handle page unload - notify server
    const handleBeforeUnload = () => {
      // Send disconnect signal if possible
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };

    // Authenticate on connect
    if (socket.connected && token) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    // Listen for reconnection
    socket.on('reconnect', handleConnect);

    // Also authenticate on successful auth response (for logging)
    socket.on('auth:success', () => {
      console.debug('Socket authenticated successfully');
    });

    // Set up heartbeat interval
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
      sendSocketActivity();
    }, HEARTBEAT_INTERVAL);

    // Check for user activity and send updates
    activityCheckIntervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      // If user has been active in the last minute, send activity update
      if (timeSinceActivity < 60 * 1000) {
        sendSocketActivity();
      }
    }, ACTIVITY_CHECK_INTERVAL);

    socketService.on('presence:update', handlePresenceUpdate);
    
    // Listen for disconnect events
    if (socket) {
      socket.on('disconnect', handleDisconnect);
    }

    // Handle page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }
      socketService.off('presence:update', handlePresenceUpdate);
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('reconnect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [user, sendHeartbeat, sendSocketActivity]);

  // Fetch presence for provided userIds
  useEffect(() => {
    if (userIds.length > 0) {
      fetchPresence(userIds);
      
      // Refresh presence every 30 seconds
      const interval = setInterval(() => {
        fetchPresence(userIds);
      }, 30 * 1000);

      return () => clearInterval(interval);
    }
  }, [userIds.join(','), fetchPresence]); // Use join to avoid unnecessary re-renders

  // Get presence for a specific user
  const getPresence = useCallback((userId: string): PresenceStatus => {
    return presence[userId] || { status: 'offline', lastActivity: null };
  }, [presence]);

  // Check if user is online (not offline)
  const isOnline = useCallback((userId: string): boolean => {
    const userPresence = getPresence(userId);
    return userPresence.status === 'online' || userPresence.status === 'idle';
  }, [getPresence]);

  return {
    presence,
    getPresence,
    isOnline,
    refreshPresence: () => userIds.length > 0 && fetchPresence(userIds),
  };
};
