import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { chatWithAI, extractSuggestions } from '../services/openRouterService';
import toast from 'react-hot-toast';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userName?: string;
  userCompany?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Array<{ title: string; href: string; description: string }>;
  error?: boolean;
}

// Conversation history for AI context
const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

const AISearchModal = ({ isOpen, onClose, userRole = 'owner', userName, userCompany }: AISearchModalProps) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setMessages([]);
      // Clear conversation history when modal closes
      conversationHistory.length = 0;
    } else {
      // Personalized welcome message
      setMessages([{
        role: 'assistant',
        content: getWelcomeMessage()
      }]);
    }
  }, [isOpen, userName, userRole]);

  const generateAIResponse = async (userQuery: string): Promise<Message> => {
    try {
      // Add user message to conversation history
      conversationHistory.push({ role: 'user', content: userQuery });

      // Call OpenRouter API with user context
      const aiResponse = await chatWithAI(conversationHistory, {
        role: userRoleRef.current,
        name: userNameRef.current,
        company: userCompanyRef.current
      });

      // Add AI response to conversation history
      conversationHistory.push({ role: 'assistant', content: aiResponse });

      // Extract suggestions from the response (filtered by user role)
      const suggestions = extractSuggestions(aiResponse, userRoleRef.current);

      return {
        role: 'assistant',
        content: aiResponse,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };
    } catch (error: any) {
      console.error('AI Error:', error);

      // Return error message
      return {
        role: 'assistant',
        content: error.message.includes('API key')
          ? "⚠️ OpenRouter API key not configured. Please add your API key to the .env file (VITE_OPENROUTER_API_KEY)."
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
      // Get AI response
      const aiResponse = await generateAIResponse(currentQuery);
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

  const handleSuggestionClick = (href: string) => {
    navigate(href);
    onClose();
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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all border border-gray-200 dark:border-gray-700 flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ask me anything about the portal</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
                <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask me anything..."
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
                    Press Enter to send • Powered by OpenRouter AI
                  </p>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AISearchModal;
