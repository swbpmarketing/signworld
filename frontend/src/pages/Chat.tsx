import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolidIcon } from '@heroicons/react/24/solid';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  role: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  isTyping?: boolean;
}

interface Message {
  id: number;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

// Sample contacts data
const sampleContacts: Contact[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'SJ',
    role: 'Arizona Signs & Graphics',
    lastMessage: 'Thanks for the update on the project!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Michael Chen',
    avatar: 'MC',
    role: 'Pacific Coast Signage',
    lastMessage: 'The new equipment arrived yesterday.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 41), // 41 mins ago
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    avatar: 'ER',
    role: 'Miami Signs International',
    lastMessage: 'Can we schedule a call for tomorrow?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    unreadCount: 1,
    isOnline: false,
  },
  {
    id: '4',
    name: 'David Martinez',
    avatar: 'DM',
    role: 'Texas Premier Signs',
    lastMessage: 'Great work on the monument sign!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '5',
    name: 'Jessica Williams',
    avatar: 'JW',
    role: 'Denver Sign Solutions',
    lastMessage: 'I\'ll send over the designs shortly.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: '6',
    name: 'Robert Thompson',
    avatar: 'RT',
    role: 'Chicago Signs Pro',
    lastMessage: 'Meeting confirmed for next week.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '7',
    name: 'Amanda Foster',
    avatar: 'AF',
    role: 'Boston Sign Works',
    lastMessage: 'The client approved the final design!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    unreadCount: 0,
    isOnline: false,
  },
];

// Sample messages for conversations
const sampleMessages: Record<string, Message[]> = {
  '1': [
    { id: 1, senderId: '1', content: 'Hi! How is the Phoenix project going?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), read: true },
    { id: 2, senderId: 'current-user', content: 'Going great! We\'re about 80% complete on the installation.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), read: true },
    { id: 3, senderId: '1', content: 'That\'s fantastic news! The client will be thrilled.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22), read: true },
    { id: 4, senderId: 'current-user', content: 'Yes, the LED components are working perfectly. Should be done by Friday.', timestamp: new Date(Date.now() - 1000 * 60 * 30), read: true },
    { id: 5, senderId: '1', content: 'Thanks for the update on the project!', timestamp: new Date(Date.now() - 1000 * 60 * 5), read: false },
  ],
  '2': [
    { id: 1, senderId: '2', content: 'Hey, just wanted to let you know about the equipment order.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), read: true },
    { id: 2, senderId: 'current-user', content: 'Sure, what\'s the status?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 47), read: true },
    { id: 3, senderId: '2', content: 'The new equipment arrived yesterday.', timestamp: new Date(Date.now() - 1000 * 60 * 41), read: true },
  ],
  '3': [
    { id: 1, senderId: '3', content: 'Hello! I have some questions about the neon sign project.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), read: true },
    { id: 2, senderId: 'current-user', content: 'Of course! What would you like to know?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), read: true },
    { id: 3, senderId: '3', content: 'Can we schedule a call for tomorrow?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), read: false },
  ],
  '7': [
    { id: 1, senderId: '7', content: 'Hi there! Just finished the design review.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96), read: true },
    { id: 2, senderId: 'current-user', content: 'Great! What did the client think?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 95), read: true },
    { id: 3, senderId: '7', content: 'The client approved the final design!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), read: true },
  ],
};

const Chat = () => {
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = 'current-user';

  // Check for contact ID in URL params (for deep linking from Owners page)
  useEffect(() => {
    const contactId = searchParams.get('contact');
    if (contactId) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setSelectedContact(contact);
        // Hide sidebar on mobile/tablet when contact is selected from URL
        if (window.innerWidth < 1024) {
          setShowSidebar(false);
        }
      }
    } else if (contacts.length > 0 && !selectedContact) {
      setSelectedContact(contacts[0]);
    }
  }, [searchParams, contacts]);

  // Load messages when contact changes
  useEffect(() => {
    if (selectedContact) {
      setMessages(sampleMessages[selectedContact.id] || []);
      // Mark messages as read
      setContacts(prev => prev.map(c =>
        c.id === selectedContact.id ? { ...c, unreadCount: 0 } : c
      ));
    }
  }, [selectedContact]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    // Hide sidebar on mobile/tablet after selecting
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedContact) return;

    const newMessage: Message = {
      id: messages.length + 1,
      senderId: currentUserId,
      content: messageInput.trim(),
      timestamp: new Date(),
      read: false,
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');

    // Update last message in contacts list
    setContacts(prev => prev.map(c =>
      c.id === selectedContact.id
        ? { ...c, lastMessage: messageInput.trim(), lastMessageTime: new Date() }
        : c
    ));
  };

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

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchInput.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchInput.toLowerCase())
  );

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
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => handleSelectContact(contact)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                selectedContact?.id === contact.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                  : 'border-l-4 border-transparent'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold ${
                  selectedContact?.id === contact.id
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
                    selectedContact?.id === contact.id
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
                  {contact.lastMessage}
                </p>
              </div>
              {contact.unreadCount > 0 && (
                <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary-500 text-white text-xs font-medium">
                  {contact.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <header className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3 lg:gap-4">
                {/* Mobile/tablet back button */}
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
                {messages.length === 0 ? (
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
                    const isOwn = message.senderId === currentUserId;
                    const prevMessage = messages[index - 1];
                    const showTimestamp = index === 0 ||
                      (message.timestamp.getTime() - prevMessage.timestamp.getTime() > 1000 * 60 * 60);

                    return (
                      <div key={message.id}>
                        {showTimestamp && (
                          <div className="flex justify-center my-6">
                            <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                              {formatMessageTime(message.timestamp)}
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
                              <p className="text-sm leading-relaxed break-words">{message.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${
                                isOwn ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                <span className="text-xs">
                                  {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </span>
                                {isOwn && (
                                  <span className="flex items-center">
                                    {message.read ? (
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
            <form onSubmit={handleSendMessage} className="flex-shrink-0 px-3 py-3 lg:px-4 lg:py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2 lg:gap-3">
                <button
                  type="button"
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <PaperClipIcon className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Message..."
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
                  disabled={!messageInput.trim()}
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
              {/* Mobile/tablet: show button to open sidebar */}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose a contact to start messaging</p>
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
    </div>
  );
};

export default Chat;
