// Notification Service for API calls
import api from '../config/axios';

export type NotificationType =
  | 'chat_message'
  | 'brag_post'
  | 'forum_post'
  | 'forum_reply'
  | 'equipment_listing'
  | 'like'
  | 'comment'
  | 'new_video'
  | 'new_event'
  | 'new_convention'
  | 'event_reminder'
  | 'mention'
  | 'system';

export type ReferenceType =
  | 'Message'
  | 'Brag'
  | 'ForumThread'
  | 'Equipment'
  | 'Video'
  | 'Event'
  | 'Convention'
  | 'Comment'
  | null;

export interface NotificationSender {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender?: NotificationSender;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: ReferenceType;
  referenceId?: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  timeAgo?: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  unreadCount: number;
  pagination: NotificationPagination;
}

// Get all notifications for current user
export const getNotifications = async (
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<NotificationResponse> => {
  try {
    const response = await api.get('/notifications', {
      params: { page, limit, unreadOnly },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch notifications');
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    throw new Error(error.response?.data?.error || 'Failed to mark notification as read');
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await api.put('/notifications/read-all');
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    throw new Error(error.response?.data?.error || 'Failed to mark all notifications as read');
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await api.delete(`/notifications/${notificationId}`);
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete notification');
  }
};

// Delete all notifications
export const deleteAllNotifications = async (): Promise<void> => {
  try {
    await api.delete('/notifications');
  } catch (error: any) {
    console.error('Error deleting all notifications:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete all notifications');
  }
};

// Get notification icon based on type
export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    chat_message: 'ChatBubbleLeftRightIcon',
    brag_post: 'TrophyIcon',
    forum_post: 'ChatBubbleBottomCenterTextIcon',
    forum_reply: 'ArrowUturnLeftIcon',
    equipment_listing: 'WrenchScrewdriverIcon',
    like: 'HeartIcon',
    comment: 'ChatBubbleOvalLeftIcon',
    new_video: 'VideoCameraIcon',
    new_event: 'CalendarIcon',
    new_convention: 'BuildingOfficeIcon',
    event_reminder: 'BellAlertIcon',
    mention: 'AtSymbolIcon',
    system: 'InformationCircleIcon',
  };
  return icons[type] || 'BellIcon';
};

// Get notification color based on type
export const getNotificationColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    chat_message: 'bg-blue-500',
    brag_post: 'bg-yellow-500',
    forum_post: 'bg-purple-500',
    forum_reply: 'bg-indigo-500',
    equipment_listing: 'bg-green-500',
    like: 'bg-red-500',
    comment: 'bg-cyan-500',
    new_video: 'bg-pink-500',
    new_event: 'bg-orange-500',
    new_convention: 'bg-teal-500',
    event_reminder: 'bg-amber-500',
    mention: 'bg-violet-500',
    system: 'bg-gray-500',
  };
  return colors[type] || 'bg-gray-500';
};

// Get route for notification link
export const getNotificationRoute = (notification: Notification): string => {
  // For forum and brag types, always generate URL dynamically to ensure modal behavior
  // This overrides any stored link in the database
  switch (notification.type) {
    case 'chat_message':
      // Use sender ID to navigate to specific conversation
      return notification.sender?._id ? `/chat?contact=${notification.sender._id}` : '/chat';
    case 'brag_post':
    case 'like':
    case 'comment':
      // Use query param to open modal instead of navigating to full page
      return notification.referenceId ? `/brags?view=${notification.referenceId}` : '/brags';
    case 'forum_post':
    case 'forum_reply':
      // Use query param to open modal instead of navigating to full page
      return notification.referenceId ? `/forum?thread=${notification.referenceId}` : '/forum';
    case 'equipment_listing':
      return notification.referenceId ? `/equipment/${notification.referenceId}` : '/equipment';
    case 'new_video':
      return notification.referenceId ? `/videos/${notification.referenceId}` : '/videos';
    case 'new_event':
    case 'event_reminder':
      return '/calendar';
    case 'new_convention':
      return notification.referenceId ? `/conventions/${notification.referenceId}` : '/conventions';
    case 'mention':
      return notification.link || '/';
    case 'system':
    default:
      // For other types, use stored link if available
      return notification.link || '/';
  }
};

// Format sender name
export const formatSenderName = (sender?: NotificationSender): string => {
  if (!sender) return 'Someone';
  if (sender.name) return sender.name;
  if (sender.firstName || sender.lastName) {
    return `${sender.firstName || ''} ${sender.lastName || ''}`.trim();
  }
  return 'Someone';
};

export default {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationIcon,
  getNotificationColor,
  getNotificationRoute,
  formatSenderName,
};
