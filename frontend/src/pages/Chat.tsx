import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import socketService from '../services/socketService';
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  EllipsisHorizontalIcon,
  PhoneIcon,
  VideoCameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  Bars3Icon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import {
  getConversations,
  getMessages,
  sendMessage,
  sendMessageWithFile,
  markAsRead,
  getOrCreateConversation,
  getChatUsers,
} from '../services/chatService';
import type { Conversation, Message, ChatUser } from '../services/chatService';
import toast from 'react-hot-toast';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  role: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  conversationId?: string;
}

const Chat = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'partner'>('all');
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; filename: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = user?._id || user?.id || '';

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Polling for new messages as a fallback (less frequent since we have sockets)
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedContact?.conversationId) {
        fetchMessagesQuietly(selectedContact.conversationId);
      }
      fetchConversationsQuietly();
    }, 15000); // Reduced to 15 seconds since we have real-time socket updates

    return () => clearInterval(interval);
  }, [selectedContact]);

  // Socket.io real-time updates for chat
  useEffect(() => {
    if (!currentUserId) return;

    // Connect to socket and join user's chat room
    socketService.connect();
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('join:chat', currentUserId);
    }

    // Handle new message event
    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      console.log('New message received:', data);

      // If we're viewing this conversation, add the message
      if (selectedContact?.conversationId === data.conversationId) {
        setMessages(prevMessages => {
          // Check if message already exists
          if (prevMessages.some(m => m._id === data.message._id)) {
            return prevMessages;
          }
          return [...prevMessages, data.message];
        });
      }

      // Update contact list with new message
      setContacts(prevContacts =>
        prevContacts.map(contact => {
          if (contact.conversationId === data.conversationId) {
            return {
              ...contact,
              lastMessage: data.message.content,
              lastMessageTime: new Date(data.message.createdAt),
              unreadCount: selectedContact?.conversationId === data.conversationId
                ? contact.unreadCount
                : contact.unreadCount + 1
            };
          }
          return contact;
        })
      );
    };

    // Handle conversation update event (for sidebar updates)
    const handleConversationUpdate = (data: { conversationId: string; lastMessage: string; lastMessageAt: string; senderId: string }) => {
      console.log('Conversation update received:', data);
      // Only update if this message is from someone else
      if (data.senderId !== currentUserId) {
        setContacts(prevContacts =>
          prevContacts.map(contact => {
            if (contact.conversationId === data.conversationId) {
              return {
                ...contact,
                lastMessage: data.lastMessage,
                lastMessageTime: new Date(data.lastMessageAt),
                unreadCount: selectedContact?.conversationId === data.conversationId
                  ? 0
                  : contact.unreadCount + 1
              };
            }
            return contact;
          })
        );
      }
    };

    // Subscribe to events
    socketService.on('message:new', handleNewMessage);
    socketService.on('conversation:update', handleConversationUpdate);

    // Cleanup on unmount
    return () => {
      socketService.off('message:new', handleNewMessage);
      socketService.off('conversation:update', handleConversationUpdate);
      if (socket) {
        socket.emit('leave:chat', currentUserId);
      }
    };
  }, [currentUserId, selectedContact?.conversationId]);

  // Join/leave conversation room when selected contact changes
  useEffect(() => {
    const socket = socketService.getSocket();

    if (selectedContact?.conversationId && socket) {
      socket.emit('join:conversation', selectedContact.conversationId);
    }

    return () => {
      if (selectedContact?.conversationId && socket) {
        socket.emit('leave:conversation', selectedContact.conversationId);
      }
    };
  }, [selectedContact?.conversationId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      const formattedContacts = data.map(conv => formatConversationToContact(conv));
      setContacts(formattedContacts);

      // Handle deep linking from URL
      const contactId = searchParams.get('contact');
      if (contactId) {
        // Try to find existing conversation or create new one
        await handleDeepLink(contactId);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationsQuietly = async () => {
    try {
      const data = await getConversations();
      const formattedContacts = data.map(conv => formatConversationToContact(conv));
      setContacts(formattedContacts);
    } catch (error) {
      // Silent fail for background refresh
    }
  };

  const handleDeepLink = async (userId: string) => {
    try {
      const conversation = await getOrCreateConversation(userId);
      const contact = formatConversationToContact(conversation);

      // Add to contacts if not already there
      setContacts(prev => {
        const exists = prev.find(c => c.conversationId === conversation._id);
        if (!exists) {
          return [contact, ...prev];
        }
        return prev;
      });

      setSelectedContact(contact);
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const formatConversationToContact = (conv: Conversation): Contact => {
    const otherUser = conv.otherParticipant || conv.participants.find(p => p._id !== currentUserId);
    const initials = otherUser?.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';

    return {
      id: otherUser?._id || conv._id,
      name: otherUser?.name || 'Unknown User',
      avatar: initials,
      role: otherUser?.companyName || otherUser?.role || '',
      lastMessage: conv.lastMessagePreview || '',
      lastMessageTime: new Date(conv.lastMessageAt),
      unreadCount: conv.unreadCount,
      isOnline: false, // Would need WebSocket for real-time status
      conversationId: conv._id,
    };
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const { messages: data } = await getMessages(conversationId);
      setMessages(data);

      // Mark as read
      await markAsRead(conversationId);

      // Update unread count in contacts
      setContacts(prev =>
        prev.map(c =>
          c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchMessagesQuietly = async (conversationId: string) => {
    try {
      const { messages: data } = await getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      // Silent fail for background refresh
    }
  };

  // Load messages when contact changes
  useEffect(() => {
    if (selectedContact?.conversationId) {
      fetchMessages(selectedContact.conversationId);
    } else {
      setMessages([]);
    }
  }, [selectedContact?.conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedContact?.conversationId || sendingMessage) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSendingMessage(true);

    try {
      const newMessage = await sendMessage(selectedContact.conversationId, content);
      setMessages(prev => [...prev, newMessage]);

      // Update last message in contacts list
      setContacts(prev =>
        prev.map(c =>
          c.conversationId === selectedContact.conversationId
            ? { ...c, lastMessage: content, lastMessageTime: new Date() }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setMessageInput(content); // Restore message on failure
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file upload and send
  const handleSendWithFile = async () => {
    if (!selectedFile || !selectedContact?.conversationId || uploadingFile) return;

    setUploadingFile(true);
    const file = selectedFile;
    const content = messageInput.trim();
    setSelectedFile(null);
    setMessageInput('');

    try {
      toast.loading('Uploading file...', { id: 'file-upload' });
      const newMessage = await sendMessageWithFile(
        selectedContact.conversationId,
        file,
        content || undefined
      );
      toast.success('File sent!', { id: 'file-upload' });
      setMessages(prev => [...prev, newMessage]);

      // Update last message in contacts list
      setContacts(prev =>
        prev.map(c =>
          c.conversationId === selectedContact.conversationId
            ? { ...c, lastMessage: `Sent a file: ${file.name}`, lastMessageTime: new Date() }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to send file:', error);
      toast.error('Failed to send file', { id: 'file-upload' });
      setSelectedFile(file); // Restore file on failure
      setMessageInput(content);
    } finally {
      setUploadingFile(false);
    }
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType === 'text/plain') return '📃';
    if (fileType.includes('zip')) return '📦';
    return '📎';
  };

  const handleNewChat = async (targetUser: ChatUser) => {
    try {
      const conversation = await getOrCreateConversation(targetUser._id);
      const contact = formatConversationToContact(conversation);

      // Add to contacts if not already there
      setContacts(prev => {
        const exists = prev.find(c => c.conversationId === conversation._id);
        if (!exists) {
          return [contact, ...prev];
        }
        return prev;
      });

      setSelectedContact(contact);
      setShowNewChatModal(false);
      setNewChatSearch('');

      if (window.innerWidth < 1024) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const searchUsers = useCallback(async (search: string) => {
    if (!search.trim()) {
      setAvailableUsers([]);
      return;
    }

    try {
      setLoadingUsers(true);
      const users = await getChatUsers(search);
      setAvailableUsers(users);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(newChatSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [newChatSearch, searchUsers]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    if (diffDays === 0) return timeStr;
    if (diffDays === 1) return `Yesterday @ ${timeStr}`;
    return `${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} @ ${timeStr}`;
  };

  const filteredContacts = contacts.filter(contact => {
    // Search filter
    const matchesSearch = contact.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchInput.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === 'all' || contact.role.toLowerCase() === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-7rem)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
      {/* Contacts Sidebar */}
      <aside
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } absolute lg:relative z-50 w-full sm:w-80 lg:w-80 h-full border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 lg:bg-gray-50 lg:dark:bg-gray-900 transition-transform duration-300 ease-in-out flex-shrink-0`}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              title="New Chat"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          {/* Role Filter Pills */}
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                roleFilter === 'all'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 ring-1 ring-green-500/50'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('owner')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                roleFilter === 'owner'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 ring-1 ring-green-500/50'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Owners
            </button>
            <button
              onClick={() => setRoleFilter('partner')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                roleFilter === 'partner'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 ring-1 ring-green-500/50'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Partners
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Start a new chat
              </button>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.conversationId || contact.id}
                onClick={() => handleSelectContact(contact)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  selectedContact?.conversationId === contact.conversationId
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                    : 'border-l-4 border-transparent'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold ${
                    selectedContact?.conversationId === contact.conversationId
                      ? 'bg-primary-500'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700'
                  }`}>
                    {contact.avatar}
                  </div>
                  {contact.isOnline && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold truncate ${
                      selectedContact?.conversationId === contact.conversationId
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {contact.name}
                    </h4>
                    <span className={`text-xs flex-shrink-0 ml-2 ${
                      contact.unreadCount > 0
                        ? 'text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(contact.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {contact.lastMessage || 'No messages yet'}
                  </p>
                </div>
                {contact.unreadCount > 0 && (
                  <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary-500 text-white text-xs font-medium">
                    {contact.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <header className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3 lg:gap-4">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="relative">
                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm lg:text-lg">
                    {selectedContact.avatar}
                  </div>
                  {selectedContact.isOnline && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 lg:h-3 lg:w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {selectedContact.name}
                  </h3>
                  <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {selectedContact.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 lg:gap-2">
                <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <PhoneIcon className="h-5 w-5" />
                </button>
                <button className="hidden sm:block p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <VideoCameraIcon className="h-5 w-5" />
                </button>
                <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto scroll-smooth">
              <div className="px-4 py-8 sm:px-6 lg:px-8 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No messages yet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start the conversation by sending a message</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwn = message.sender._id === currentUserId;
                    const prevMessage = messages[index - 1];
                    const msgDate = new Date(message.createdAt);
                    const showTimestamp = index === 0 ||
                      (msgDate.getTime() - new Date(prevMessage.createdAt).getTime() > 1000 * 60 * 60);

                    return (
                      <div key={message._id}>
                        {showTimestamp && (
                          <div className="flex justify-center my-6">
                            <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                              {formatMessageTime(msgDate)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {!isOwn && (
                              <div className="hidden sm:flex h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {selectedContact.avatar}
                              </div>
                            )}
                            <div
                              className={`px-4 py-3 rounded-2xl ${
                                isOwn
                                  ? 'bg-primary-600 text-white rounded-br-md'
                                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-600'
                              }`}
                            >
                              {/* File Attachments */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mb-2 space-y-2">
                                  {message.attachments.map((attachment, idx) => (
                                    attachment.fileType.startsWith('image/') ? (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setPreviewImage({ url: attachment.url, filename: attachment.filename })}
                                        className={`block p-2 rounded-lg transition-colors cursor-pointer ${
                                          isOwn
                                            ? 'bg-primary-500/50 hover:bg-primary-500/70'
                                            : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
                                        }`}
                                      >
                                        <img
                                          src={attachment.url}
                                          alt={attachment.filename}
                                          className="max-w-[200px] max-h-[150px] rounded object-cover"
                                        />
                                      </button>
                                    ) : (
                                      <a
                                        key={idx}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                                          isOwn
                                            ? 'bg-primary-500/50 hover:bg-primary-500/70'
                                            : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
                                        }`}
                                      >
                                        <span className="text-xl">{getFileIcon(attachment.fileType)}</span>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium truncate">{attachment.filename}</p>
                                          <p className={`text-xs ${isOwn ? 'text-primary-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {formatFileSize(attachment.fileSize)}
                                          </p>
                                        </div>
                                      </a>
                                    )
                                  ))}
                                </div>
                              )}
                              {/* Message Content */}
                              {message.content && !message.content.startsWith('Sent a file:') && (
                                <p className="text-sm leading-relaxed break-words">{message.content}</p>
                              )}
                              <div className={`flex items-center justify-end gap-1 mt-1 ${
                                isOwn ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                <span className="text-xs">
                                  {msgDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </span>
                                {isOwn && (
                                  <span className="flex items-center">
                                    {message.readBy.length > 1 ? (
                                      <span className="flex -space-x-1">
                                        <CheckSolidIcon className="h-3 w-3" />
                                        <CheckSolidIcon className="h-3 w-3" />
                                      </span>
                                    ) : (
                                      <CheckIcon className="h-3 w-3" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </main>

            {/* Input Area */}
            <form onSubmit={selectedFile ? (e) => { e.preventDefault(); handleSendWithFile(); } : handleSendMessage} className="flex-shrink-0 px-3 py-3 lg:px-4 lg:py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {/* Selected File Preview */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(selectedFile.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 lg:gap-3">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Attach file"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={selectedFile ? "Add a message (optional)..." : "Message..."}
                    className="w-full px-4 py-2.5 lg:py-3 pr-10 lg:pr-12 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaceSmileIcon className="h-5 w-5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={(!messageInput.trim() && !selectedFile) || sendingMessage || uploadingFile}
                  className="p-2.5 lg:p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center px-4">
              <button
                onClick={() => setShowSidebar(true)}
                className="lg:hidden mb-4 p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Select a conversation</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose a contact to start messaging</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile/tablet overlay when sidebar is open */}
      {showSidebar && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Chat</h3>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setNewChatSearch('');
                  setAvailableUsers([]);
                }}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {newChatSearch ? 'No users found' : 'Type to search users'}
                  </div>
                ) : (
                  availableUsers.map(user => (
                    <button
                      key={user._id}
                      onClick={() => handleNewChat(user)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold">
                        {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.companyName || user.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Image */}
            <img
              src={previewImage.url}
              alt={previewImage.filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Footer with filename and download button */}
            <div className="mt-4 flex items-center gap-4">
              <span className="text-white/80 text-sm truncate max-w-xs">
                {previewImage.filename}
              </span>
              <a
                href={previewImage.url}
                download={previewImage.filename}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
