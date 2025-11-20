import { useState, useEffect } from 'react';
import calendarService, { type CalendarEvent } from '../services/calendarService';
import toast from 'react-hot-toast';

export interface EventNotification {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  type: '24h' | '1h';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NOTIFICATION_STORAGE_KEY = 'eventNotifications';
const DISMISSED_NOTIFICATIONS_KEY = 'dismissedEventNotifications';

export const useEventNotifications = () => {
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage
  const loadNotifications = (): EventNotification[] => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((n: any) => ({
          ...n,
          eventDate: new Date(n.eventDate),
          createdAt: new Date(n.createdAt),
        }));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
    return [];
  };

  // Save notifications to localStorage
  const saveNotifications = (notifs: EventNotification[]) => {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifs));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  // Get dismissed notification IDs
  const getDismissedNotifications = (): Set<string> => {
    try {
      const stored = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.error('Error loading dismissed notifications:', error);
      return new Set();
    }
  };

  // Save dismissed notification ID
  const saveDismissedNotification = (notificationId: string) => {
    try {
      const dismissed = getDismissedNotifications();
      dismissed.add(notificationId);
      localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify([...dismissed]));
    } catch (error) {
      console.error('Error saving dismissed notification:', error);
    }
  };

  // Check events and create notifications
  const checkEvents = async () => {
    try {
      const events = await calendarService.getEvents();
      const now = new Date();
      const dismissed = getDismissedNotifications();
      const existingNotifs = loadNotifications();
      const newNotifications: EventNotification[] = [...existingNotifs];

      events.forEach((event: CalendarEvent) => {
        const eventDate = new Date(event.startDate);
        const timeDiff = eventDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Check if event is within 24 hours (23-25 hours range for tolerance)
        if (hoursDiff >= 23 && hoursDiff <= 25) {
          const notifId = `${event._id}-24h`;
          if (!dismissed.has(notifId) && !existingNotifs.find(n => n.id === notifId)) {
            const notification: EventNotification = {
              id: notifId,
              eventId: event._id,
              eventTitle: event.title,
              eventDate,
              type: '24h',
              message: `Event "${event.title}" starts in 24 hours`,
              isRead: false,
              createdAt: now,
            };
            newNotifications.unshift(notification);

            // Show toast notification
            toast(`📅 ${event.title} starts in 24 hours!`, {
              icon: '🔔',
              duration: 5000,
            });
          }
        }

        // Check if event is within 1 hour (0.5-1.5 hours range for tolerance)
        if (hoursDiff >= 0.5 && hoursDiff <= 1.5) {
          const notifId = `${event._id}-1h`;
          if (!dismissed.has(notifId) && !existingNotifs.find(n => n.id === notifId)) {
            const notification: EventNotification = {
              id: notifId,
              eventId: event._id,
              eventTitle: event.title,
              eventDate,
              type: '1h',
              message: `Event "${event.title}" starts in 1 hour!`,
              isRead: false,
              createdAt: now,
            };
            newNotifications.unshift(notification);

            // Show toast notification
            toast(`⏰ ${event.title} starts in 1 hour!`, {
              icon: '🔔',
              duration: 6000,
            });
          }
        }
      });

      // Remove old notifications (older than 7 days)
      const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      const filteredNotifications = newNotifications.filter(
        n => n.createdAt.getTime() > sevenDaysAgo
      );

      saveNotifications(filteredNotifications);
      setNotifications(filteredNotifications);
      setUnreadCount(filteredNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error checking events for notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    saveNotifications(updated);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.isRead).length);
  };

  // Mark all as read
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updated);
    setNotifications(updated);
    setUnreadCount(0);
  };

  // Dismiss notification
  const dismissNotification = (notificationId: string) => {
    saveDismissedNotification(notificationId);
    const updated = notifications.filter(n => n.id !== notificationId);
    saveNotifications(updated);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.isRead).length);
  };

  // Clear all notifications
  const clearAll = () => {
    notifications.forEach(n => saveDismissedNotification(n.id));
    setNotifications([]);
    setUnreadCount(0);
    saveNotifications([]);
  };

  // Load notifications on mount
  useEffect(() => {
    const loaded = loadNotifications();
    setNotifications(loaded);
    setUnreadCount(loaded.filter(n => !n.isRead).length);

    // Initial check
    checkEvents();

    // Check every 5 minutes
    const interval = setInterval(checkEvents, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    refreshNotifications: checkEvents,
  };
};
