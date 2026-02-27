import { useState, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
  ClockIcon,
  BellIcon,
  BellSlashIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { chatWithAI, extractSuggestions } from '../services/openRouterService';
import toast from 'react-hot-toast';

interface AISearchModalProps {
  userRole?: string;
  userName?: string;
  userCompany?: string;
}

interface SearchResult {
  id: string;
  type: string;
  category: string;
  title: string;
  description?: string;
  link: string;
  metadata?: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Array<{ title: string; href: string; description: string }>;
  searchResults?: SearchResult[];
  error?: boolean;
}

// Data type filter options
const DATA_TYPE_FILTERS = [
  { id: 'all', label: 'All', value: [] },
  { id: 'files', label: 'Documents', value: ['files'] },
  { id: 'videos', label: 'Videos', value: ['videos'] },
  { id: 'forum', label: 'Forum', value: ['forum'] },
  { id: 'stories', label: 'Stories', value: ['stories'] },
  { id: 'events', label: 'Events', value: ['events'] },
  { id: 'owners', label: 'Owners', value: ['owners'] },
  { id: 'suppliers', label: 'Vendors', value: ['suppliers'] },
  { id: 'equipment', label: 'Equipment', value: ['equipment'] },
];

// Conversation history for AI context (includes searchResults for saving/restoring)
const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; searchResults?: SearchResult[] }> = [];

const AISearchModal = ({ userRole = 'owner', userName, userCompany }: AISearchModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{
    _id: string;
    query: string;
    conversation: Array<{ role: 'user' | 'assistant'; content: string; searchResults?: SearchResult[] }>;
    timestamp: string;
  }>>([]);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Store user info in refs to use in generateAIResponse
  const userRoleRef = useRef(userRole);
  const userNameRef = useRef(userName);
  const userCompanyRef = useRef(userCompany);

  // Update refs when props change
  useEffect(() => {
    userRoleRef.current = userRole;
    userNameRef.current = userName;
    userCompanyRef.current = userCompany;
  }, [userRole, userName, userCompany]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcut for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Fetch search history
  const fetchSearchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
      const response = await fetch(`${API_URL}/search/recent?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data.searches || []);
      }
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    }
  };

  // Generate personalized welcome message based on user info
  const getWelcomeMessage = () => {
    const greeting = userName ? `Hi ${userName}!` : 'Hi there!';

    const roleIntro = {
      vendor: "I'm your AI assistant. I can help you manage your vendor profile, check inquiries, view your sales stats, and navigate the portal.",
      owner: "I'm your AI assistant. I can help you navigate the portal, find resources, check reports, connect with vendors, and more.",
      admin: "I'm your AI assistant. I can help you manage users, moderate content, configure settings, and navigate all portal features."
    };

    const intro = roleIntro[userRole as keyof typeof roleIntro] || roleIntro.owner;
    return `${greeting} ${intro} What can I help you with today?`;
  };

  // Reset state when panel closes, initialize when it opens
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setMessages([]);
      setIsSidebarOpen(false);
      conversationHistory.length = 0;
    } else {
      setMessages([{
        role: 'assistant',
        content: getWelcomeMessage()
      }]);
      fetchSearchHistory();
    }
  }, [isOpen, userName, userRole]);

  const generateAIResponse = async (userQuery: string, filters?: string[]): Promise<Message> => {
    try {
      // Add user message to conversation history
      conversationHistory.push({ role: 'user', content: userQuery });

      // Call OpenRouter API with user context and optional filters
      const response = await chatWithAI(conversationHistory, {
        role: userRoleRef.current,
        name: userNameRef.current,
        company: userCompanyRef.current
      }, filters);

      // Add AI response to conversation history (with searchResults if present)
      conversationHistory.push({
        role: 'assistant',
        content: response.message,
        searchResults: response.searchResults
      });

      // Extract suggestions from the response (filtered by user role)
      const suggestions = extractSuggestions(response.message, userRoleRef.current);

      return {
        role: 'assistant',
        content: response.message,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        searchResults: response.searchResults,
      };
    } catch (error: any) {
      console.error('AI Error:', error);

      // Return error message
      return {
        role: 'assistant',
        content: error.message.includes('API key')
          ? "OpenRouter API key not configured. Please add your API key to the .env file (VITE_OPENROUTER_API_KEY)."
          : "I'm having trouble connecting right now. Please try again or contact support if the issue persists.",
        error: true
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: query };
    const currentQuery = query;
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      // Get AI response with selected filters
      const aiResponse = await generateAIResponse(currentQuery, selectedFilters.length > 0 ? selectedFilters : undefined);
      setMessages(prev => [...prev, aiResponse]);

      // Show error toast if there was an error
      if (aiResponse.error) {
        toast.error('Failed to get AI response. Please check your API key configuration.');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again.",
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterToggle = (filterValue: string[]) => {
    setSelectedFilters(filterValue);
  };

  const handleSearchResultClick = (link: string) => {
    navigate(link);
    setIsOpen(false);
  };

  const handleSuggestionClick = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  const handleHistoryClick = (historyItem: {
    _id: string;
    query: string;
    conversation: Array<{ role: 'user' | 'assistant'; content: string; searchResults?: SearchResult[] }>;
    timestamp: string;
  }) => {
    // Restore the conversation
    if (historyItem.conversation && historyItem.conversation.length > 0) {
      // Clear current conversation history
      conversationHistory.length = 0;

      // Convert conversation to Message format and restore conversation history
      const restoredMessages: Message[] = historyItem.conversation.map(msg => {
        // Add to conversation history for AI context (with searchResults)
        conversationHistory.push({
          role: msg.role,
          content: msg.content,
          searchResults: msg.searchResults
        });

        return {
          role: msg.role,
          content: msg.content,
          searchResults: msg.searchResults
        };
      });

      setMessages(restoredMessages);
    } else {
      // If no conversation, just fill the query
      setQuery(historyItem.query);
    }

    setIsSidebarOpen(false);
  };

  // Role-specific quick prompts
  const getQuickPrompts = () => {
    const prompts = {
      vendor: [
        "How do I update my business profile?",
        "Where can I see my inquiries?",
        "How do I view my sales stats?",
        "What can I do on this portal?"
      ],
      owner: [
        "How do I view reports?",
        "Where can I find training videos?",
        "Show me the vendor directory",
        "How do I connect with other owners?"
      ],
      admin: [
        "How do I manage users?",
        "Where do I approve vendors?",
        "How do I moderate content?",
        "Show me system settings"
      ]
    };
    return prompts[userRole as keyof typeof prompts] || prompts.owner;
  };

  const quickPrompts = getQuickPrompts();

  // Nudge animation every 5 minutes when closed and not muted
  const [nudge, setNudge] = useState(false);
  const [nudgeMuted, setNudgeMuted] = useState(() => {
    try { return localStorage.getItem('ai-nudge-muted') === 'true'; } catch { return false; }
  });

  const nudgeMessages = [
    "Need help? I'm here!",
    "Got a question? Ask away!",
    "I can help you find anything",
    "Try asking me something!",
    "Need directions? Just ask!",
  ];
  const [nudgeText, setNudgeText] = useState('');

  useEffect(() => {
    if (isOpen || nudgeMuted) return;
    const interval = setInterval(() => {
      setNudgeText(nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)]);
      setNudge(true);
      setTimeout(() => setNudge(false), 3000);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isOpen, nudgeMuted]);

  const toggleNudgeMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNudgeMuted(prev => {
      const next = !prev;
      try { localStorage.setItem('ai-nudge-muted', String(next)); } catch {}
      if (next) setNudge(false);
      return next;
    });
  };

  return (
    <>
      {/* Nudge tooltip */}
      {nudge && !isOpen && (
        <div className="fixed bottom-[4.5rem] right-6 z-[80] animate-fade-in flex items-center gap-1.5">
          <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 whitespace-nowrap flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-primary-500 flex-shrink-0" />
            {nudgeText}
            <button
              onClick={toggleNudgeMute}
              className="ml-1 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Mute nudge reminders"
              title="Don't show these reminders"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Arrow pointing to button */}
          <div className="w-2.5 h-2.5 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 rotate-[-45deg] -ml-[0.4rem] mr-3" />
        </div>
      )}

      {/* Floating Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(prev => !prev)}
        className={`fixed bottom-6 right-6 z-[80] w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${nudge && !isOpen ? 'animate-ai-nudge' : ''}`}
        aria-label="Toggle AI Assistant (Ctrl+K)"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <SparklesIcon className={`h-6 w-6 ${nudge ? 'animate-spin-slow' : ''}`} />
        )}
        {nudge && !isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping-slow bg-primary-400/40" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-20 right-6 z-[80] w-[calc(100vw-3rem)] sm:w-[480px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              {/* Hamburger Menu */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ask me anything about the portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleNudgeMute}
                className={`p-2 transition-colors rounded-lg ${
                  nudgeMuted
                    ? 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                }`}
                title={nudgeMuted ? 'Unmute reminders' : 'Mute reminders'}
                aria-label={nudgeMuted ? 'Unmute reminders' : 'Mute reminders'}
              >
                {nudgeMuted ? <BellSlashIcon className="h-5 w-5" /> : <BellIcon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Content with Sidebar */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0`}>
              <div className="p-4 w-64">
                <div className="flex items-center gap-2 mb-4">
                  <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Searches</h4>
                </div>
                <div className="space-y-1">
                  {searchHistory.length > 0 ? (
                    searchHistory.map((historyItem, index) => (
                      <button
                        key={historyItem._id || index}
                        onClick={() => handleHistoryClick(historyItem)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors truncate"
                      >
                        {historyItem.query}
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">No recent searches</p>
                  )}
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : message.error
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}>
                        {message.error && (
                          <div className="flex items-start space-x-2 mb-2">
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* Search Results */}
                      {message.searchResults && message.searchResults.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Search Results:</p>
                          {message.searchResults.slice(0, 5).map((result, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSearchResultClick(result.link)}
                              className="w-full flex items-start justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group text-left"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-700 dark:group-hover:text-primary-400">
                                    {result.title}
                                  </p>
                                  <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
                                    {result.category}
                                  </span>
                                </div>
                                {result.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                              <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1 ml-2" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion.href)}
                              className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
                            >
                              <div className="text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-700 dark:group-hover:text-primary-400">
                                  {suggestion.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {suggestion.description}
                                </p>
                              </div>
                              <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              {messages.length === 1 && (
                <div className="px-6 pb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(prompt)}
                        className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                {/* Filter Chips */}
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Search in:</p>
                  <div className="flex flex-wrap gap-2">
                    {DATA_TYPE_FILTERS.map((filter) => {
                      const isSelected = selectedFilters.length === 0
                        ? filter.id === 'all'
                        : filter.value.length > 0 && filter.value.every(v => selectedFilters.includes(v));

                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => handleFilterToggle(filter.value)}
                          className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask me anything or search for specific content..."
                      className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-700 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!query.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      <MagnifyingGlassIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Press Enter to send • Ctrl+K to toggle
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AISearchModal;
