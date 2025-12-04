import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationRoute,
  type Notification,
  type NotificationResponse,
} from '../services/notificationService';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  getRoute: (notification: Notification) => string;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const userId = user?._id || user?.id;

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response: NotificationResponse = await getNotifications(page, 20);

      if (append) {
        setNotifications(prev => [...prev, ...response.data]);
      } else {
        setNotifications(response.data);
      }

      setUnreadCount(response.unreadCount);
      setHasMore(page < response.pagination.pages);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch and socket setup
  useEffect(() => {
    if (!userId) return;

    // Connect to socket and join user room for notifications
    socketService.connect();
    socketService.joinRoom(`user:${userId}`);

    // Fetch initial notifications
    fetchNotifications(1, false);

    // Also fetch unread count separately for accuracy
    getUnreadNotificationCount().then(count => {
      setUnreadCount(count);
    }).catch(console.error);

    // Listen for real-time notifications
    const handleNewNotification = (notification: Notification) => {
      console.log('New notification received:', notification);

      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      toast(notification.message, {
        icon: getNotificationIcon(notification.type),
        duration: 4000,
      });
    };

    socketService.on<Notification>('notification', handleNewNotification);

    // Cleanup
    return () => {
      socketService.off('notification', handleNewNotification);
      socketService.leaveRoom(`user:${userId}`);
    };
  }, [userId, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    console.log('markAsRead called with:', notificationId);
    try {
      await markNotificationAsRead(notificationId);
      console.log('markNotificationAsRead API call succeeded');
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    console.log('markAllAsRead called');
    try {
      await markAllNotificationsAsRead();
      console.log('markAllNotificationsAsRead API call succeeded');
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark all notifications as read');
    }
  }, []);

  // Dismiss/delete single notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    console.log('dismissNotification called with:', notificationId);
    try {
      await deleteNotification(notificationId);
      console.log('deleteNotification API call succeeded');
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    console.log('clearAll called');
    try {
      await deleteAllNotifications();
      console.log('deleteAllNotifications API call succeeded');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (err: any) {
      console.error('Error deleting all notifications:', err);
      toast.error('Failed to delete all notifications');
    }
  }, []);

  // Load more notifications (pagination)
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetchNotifications(currentPage + 1, true);
    }
  }, [hasMore, loading, currentPage, fetchNotifications]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    setCurrentPage(1);
    await fetchNotifications(1, false);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    currentPage,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    loadMore,
    refresh,
    getRoute: getNotificationRoute,
  };
};

// Helper function to get notification icon emoji based on type
function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    chat_message: '💬',
    brag_post: '🏆',
    forum_post: '📝',
    forum_reply: '↩️',
    equipment_listing: '🔧',
    like: '❤️',
    comment: '💭',
    new_video: '🎬',
    new_event: '📅',
    new_convention: '🏛️',
    event_reminder: '⏰',
    mention: '@',
    system: 'ℹ️',
  };
  return icons[type] || '🔔';
}

export default useNotifications;
