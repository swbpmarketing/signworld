// Chat Service for API calls
import api from '../config/axios';

export interface ChatUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  companyName?: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: ChatUser;
  content: string;
  attachments?: Array<{
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }>;
  readBy: Array<{
    user: string;
    readAt: string;
  }>;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: ChatUser[];
  otherParticipant?: ChatUser;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: Message;
  lastMessageAt: string;
  lastMessagePreview?: string;
  unreadCount: number;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

// Get all conversations for current user
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await api.get('/chat/conversations');
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch conversations');
  }
};

// Get or create a conversation with a user
export const getOrCreateConversation = async (participantId: string): Promise<Conversation> => {
  try {
    const response = await api.post('/chat/conversations', { participantId });
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    throw new Error(error.response?.data?.error || 'Failed to create conversation');
  }
};

// Get messages for a conversation
export const getMessages = async (
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: Message[]; pagination: PaginationInfo }> => {
  try {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
    return {
      messages: response.data.data,
      pagination: response.data.pagination,
    };
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch messages');
  }
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<Message> => {
  try {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw new Error(error.response?.data?.error || 'Failed to send message');
  }
};

// Mark conversation as read
export const markAsRead = async (conversationId: string): Promise<void> => {
  try {
    await api.post(`/chat/conversations/${conversationId}/read`);
  } catch (error: any) {
    console.error('Error marking as read:', error);
    throw new Error(error.response?.data?.error || 'Failed to mark as read');
  }
};

// Get unread message count
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await api.get('/chat/unread');
    return response.data.data.unreadCount;
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

// Get users for starting new chat
export const getChatUsers = async (search?: string): Promise<ChatUser[]> => {
  try {
    const response = await api.get('/chat/users', {
      params: { search },
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch users');
  }
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  try {
    await api.delete(`/chat/messages/${messageId}`);
  } catch (error: any) {
    console.error('Error deleting message:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete message');
  }
};
