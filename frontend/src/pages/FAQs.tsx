import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  BookOpenIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  LightBulbIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { getFAQs, getFAQStats, voteFAQHelpful, incrementFAQView, createFAQ } from '../services/faqService';
import type { FAQ } from '../services/faqService';
import { useAuth } from '../context/AuthContext';

// Icon type from heroicons
type HeroIcon = typeof BookOpenIcon;

// Category mapping from backend to frontend display
const categoryConfig: { [key: string]: { name: string; icon: HeroIcon } } = {
  'all': { name: 'All Topics', icon: BookOpenIcon },
  'general': { name: 'Getting Started', icon: LightBulbIcon },
  'technical': { name: 'Technical Support', icon: CpuChipIcon },
  'billing': { name: 'Pricing & Finance', icon: CurrencyDollarIcon },
  'equipment': { name: 'Equipment', icon: WrenchScrewdriverIcon },
  'materials': { name: 'Materials', icon: CubeIcon },
  'operations': { name: 'Business Operations', icon: UserGroupIcon },
  'training': { name: 'Training & Resources', icon: AcademicCapIcon },
  'other': { name: 'Legal & Compliance', icon: ShieldCheckIcon },
};

// Category options for the form (excluding 'all')
const categoryOptions = [
  { value: 'general', label: 'Getting Started' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'billing', label: 'Pricing & Finance' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'materials', label: 'Materials' },
  { value: 'operations', label: 'Business Operations' },
  { value: 'training', label: 'Training & Resources' },
  { value: 'other', label: 'Legal & Compliance' },
];

// Default popular searches when no data
const defaultPopularSearches = [
  "printer troubleshooting",
  "financing options",
  "insurance requirements",
  "training videos",
  "vendor discounts",
  "installation guides"
];

const FAQs = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([]);
  const [helpfulVotes, setHelpfulVotes] = useState<{ [key: string]: 'helpful' | 'not-helpful' | null }>({});

  // Add FAQ modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFAQ, setNewFAQ] = useState({
    question: '',
    answer: '',
    category: 'general',
    tags: '',
  });

  // Search suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch FAQs
  const { data: faqsData, isLoading: faqsLoading } = useQuery({
    queryKey: ['faqs', selectedCategory, searchQuery],
    queryFn: () => getFAQs({
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchQuery || undefined,
      limit: 50
    }),
    staleTime: 30000,
  });

  // Fetch FAQ stats
  const { data: statsData } = useQuery({
    queryKey: ['faqs-stats'],
    queryFn: getFAQStats,
    staleTime: 60000,
  });

  // Fetch all FAQs for suggestions (cached)
  const { data: allFaqsData } = useQuery({
    queryKey: ['faqs-all'],
    queryFn: () => getFAQs({ limit: 100 }),
    staleTime: 300000, // Cache for 5 minutes
  });

  // Compute search suggestions based on input
  const searchSuggestions = useMemo(() => {
    if (!searchInput.trim() || searchInput.length < 2) return [];

    const allFaqs = allFaqsData?.data || [];
    const input = searchInput.toLowerCase();

    const suggestions: { type: 'question' | 'tag'; text: string; faqId?: string; category?: string }[] = [];
    const seenTexts = new Set<string>();

    // Search through FAQ questions
    allFaqs.forEach((faq) => {
      const question = faq.question.toLowerCase();
      if (question.includes(input) && !seenTexts.has(faq.question)) {
        seenTexts.add(faq.question);
        suggestions.push({
          type: 'question',
          text: faq.question,
          faqId: faq._id,
          category: faq.category
        });
      }

      // Search through tags
      if (faq.tags) {
        faq.tags.forEach((tag) => {
          const tagLower = tag.toLowerCase();
          if (tagLower.includes(input) && !seenTexts.has(tag)) {
            seenTexts.add(tag);
            suggestions.push({
              type: 'tag',
              text: tag
            });
          }
        });
      }
    });

    // Sort by relevance (exact matches first, then starts with, then contains)
    suggestions.sort((a, b) => {
      const aText = a.text.toLowerCase();
      const bText = b.text.toLowerCase();
      const aExact = aText === input;
      const bExact = bText === input;
      const aStarts = aText.startsWith(input);
      const bStarts = bText.startsWith(input);

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }, [searchInput, allFaqsData]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: ({ id, isHelpful }: { id: string; isHelpful: boolean }) =>
      voteFAQHelpful(id, isHelpful),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });

  // View increment mutation
  const viewMutation = useMutation({
    mutationFn: (id: string) => incrementFAQView(id),
  });

  // Create FAQ mutation
  const createMutation = useMutation({
    mutationFn: createFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faqs-stats'] });
      setShowAddModal(false);
      setNewFAQ({ question: '', answer: '', category: 'general', tags: '' });
    },
  });

  const faqs = faqsData?.data || [];
  const stats = statsData?.data;

  // Build categories from stats
  const categories = useMemo(() => {
    const cats: { key: string; name: string; icon: HeroIcon; count: number }[] = [
      { key: 'all', name: 'All Topics', icon: BookOpenIcon, count: stats?.totalFAQs || 0 }
    ];

    if (stats?.categoryCounts) {
      Object.entries(stats.categoryCounts).forEach(([key, count]) => {
        const config = categoryConfig[key];
        if (config) {
          cats.push({
            key,
            name: config.name,
            icon: config.icon,
            count: count as number
          });
        }
      });
    }

    return cats;
  }, [stats]);

  const popularSearches = stats?.popularSearches?.length ? stats.popularSearches : defaultPopularSearches;

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handlePopularSearch = (search: string) => {
    setSearchInput(search);
    setSearchQuery(search);
  };

  const toggleFAQ = (faqId: string) => {
    const isExpanding = !expandedFAQs.includes(faqId);

    setExpandedFAQs(prev =>
      prev.includes(faqId)
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );

    // Increment view count when expanding
    if (isExpanding) {
      viewMutation.mutate(faqId);
    }
  };

  const handleHelpfulVote = (faqId: string, vote: 'helpful' | 'not-helpful') => {
    const currentVote = helpfulVotes[faqId];
    const newVote = currentVote === vote ? null : vote;

    setHelpfulVotes(prev => ({
      ...prev,
      [faqId]: newVote
    }));

    if (newVote !== null) {
      voteMutation.mutate({ id: faqId, isHelpful: newVote === 'helpful' });
    }
  };

  const getCategoryDisplay = (category: string) => {
    return categoryConfig[category]?.name || category;
  };

  const handleCreateFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) return;

    createMutation.mutate({
      question: newFAQ.question.trim(),
      answer: newFAQ.answer.trim(),
      category: newFAQ.category,
      tags: newFAQ.tags ? newFAQ.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    });
  };

  // Add FAQ Modal
  const AddFAQModal = () => {
    if (!showAddModal) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowAddModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <PlusIcon className="h-6 w-6 text-primary-600" />
                Add New FAQ
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateFAQ} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFAQ.question}
                  onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                  placeholder="Enter the question..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Answer <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                  placeholder="Enter the answer..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newFAQ.category}
                  onChange={(e) => setNewFAQ({ ...newFAQ, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags <span className="text-gray-400 font-normal">(comma-separated, optional)</span>
                </label>
                <input
                  type="text"
                  value={newFAQ.tags}
                  onChange={(e) => setNewFAQ({ ...newFAQ, tags: e.target.value })}
                  placeholder="e.g., printer, troubleshooting, maintenance"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Error message */}
              {createMutation.isError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Failed to create FAQ. Please try again.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !newFAQ.question.trim() || !newFAQ.answer.trim()}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5" />
                      Create FAQ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-6 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
                <QuestionMarkCircleIcon className="h-8 w-8 mr-3" />
                Help Center & FAQs
              </h1>
              <p className="mt-3 text-lg text-primary-100">
                Find answers to common questions and get the support you need
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add FAQ
                </button>
              )}
              <button
                onClick={() => navigate('/chat?support=true')}
                className="inline-flex items-center px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors duration-200 border border-white/30"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-750 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-600/50 p-8 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/30 dark:bg-primary-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-3xl mx-auto">
          {/* Search header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">How can we help you?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Search our knowledge base or browse popular topics below</p>
          </div>

          {/* Search input */}
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 blur transition-all duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors duration-200 z-10" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for answers..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSuggestions(true);
                    setSelectedSuggestionIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
                        e.preventDefault();
                        const suggestion = searchSuggestions[selectedSuggestionIndex];
                        setSearchInput(suggestion.text);
                        setSearchQuery(suggestion.text);
                        setShowSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      } else {
                        handleSearch();
                        setShowSuggestions(false);
                      }
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedSuggestionIndex(prev =>
                        prev < searchSuggestions.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false);
                      setSelectedSuggestionIndex(-1);
                    }
                  }}
                  className="w-full pl-14 pr-12 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 focus:border-primary-500 dark:focus:border-primary-400 shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClearSearch();
                      setShowSuggestions(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors z-10"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Search Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                  >
                    <ul className="py-2 max-h-80 overflow-y-auto">
                      {searchSuggestions.map((suggestion, index) => (
                        <li key={`${suggestion.type}-${suggestion.text}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchInput(suggestion.text);
                              setSearchQuery(suggestion.text);
                              setShowSuggestions(false);
                              setSelectedSuggestionIndex(-1);
                            }}
                            className={`w-full px-5 py-3 text-left flex items-center gap-3 transition-colors ${
                              index === selectedSuggestionIndex
                                ? 'bg-primary-50 dark:bg-primary-900/30'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            {suggestion.type === 'question' ? (
                              <QuestionMarkCircleIcon className="h-5 w-5 text-primary-500 flex-shrink-0" />
                            ) : (
                              <span className="flex items-center justify-center h-5 w-5 rounded bg-gray-200 dark:bg-gray-600 text-xs font-medium text-gray-600 dark:text-gray-300 flex-shrink-0">
                                #
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${
                                index === selectedSuggestionIndex
                                  ? 'text-primary-700 dark:text-primary-300 font-medium'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {suggestion.text}
                              </p>
                              {suggestion.type === 'question' && suggestion.category && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {getCategoryDisplay(suggestion.category)}
                                </p>
                              )}
                              {suggestion.type === 'tag' && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  Search by tag
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 font-mono text-xs">↑</kbd>{' '}
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 font-mono text-xs">↓</kbd> to navigate,{' '}
                        <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 font-mono text-xs">Enter</kbd> to select
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                onClick={() => setShowSuggestions(false)}
                className="px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          {/* Popular searches */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
              <LightBulbIcon className="h-4 w-4 text-amber-500" />
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handlePopularSearch(search)}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 shadow-sm hover:shadow transition-all duration-200"
                >
                  <MagnifyingGlassIcon className="h-3.5 w-3.5 mr-1.5 opacity-50" />
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-20">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200 ${
                      selectedCategory === category.key
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <category.icon className={`h-5 w-5 mr-3 ${
                        selectedCategory === category.key ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <span>{category.name}</span>
                    </div>
                    <span className={`text-sm ${
                      selectedCategory === category.key ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* FAQs List */}
        <div className="lg:col-span-3">
          {searchQuery && (
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {faqs.length} results for "<span className="font-medium text-gray-900 dark:text-gray-100">{searchQuery}</span>"
              </p>
            </div>
          )}

          {faqsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq: FAQ) => (
                <div
                  key={faq._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFAQ(faq._id)}
                    className="w-full px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 pr-4">
                          {faq.question}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {getCategoryDisplay(faq.category)}
                          </span>
                          <span>{faq.views.toLocaleString()} views</span>
                        </div>
                      </div>
                      <div className={`transform transition-transform duration-200 ${
                        expandedFAQs.includes(faq._id) ? 'rotate-180' : ''
                      }`}>
                        <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                  </button>

                  {expandedFAQs.includes(faq._id) && (
                    <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
                      <div className="pt-4">
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{faq.answer}</p>

                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Was this helpful?</p>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleHelpfulVote(faq._id, 'helpful')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                  helpfulVotes[faq._id] === 'helpful'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                Yes ({faq.helpful + (helpfulVotes[faq._id] === 'helpful' ? 1 : 0)})
                              </button>
                              <button
                                onClick={() => handleHelpfulVote(faq._id, 'not-helpful')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                  helpfulVotes[faq._id] === 'not-helpful'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                No ({faq.notHelpful + (helpfulVotes[faq._id] === 'not-helpful' ? 1 : 0)})
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate('/chat?support=true')}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                          >
                            Contact Support →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!faqsLoading && faqs.length === 0 && (
            <div className="text-center py-12">
              <QuestionMarkCircleIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No FAQs found matching your search</p>
              <button
                onClick={() => navigate('/chat?support=true')}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Contact Support
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <PhoneIcon className="h-10 w-10 text-primary-600 dark:text-primary-500 mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Call Support</h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4">Speak directly with our support team</p>
          <p className="text-primary-600 dark:text-primary-400 font-medium">1-800-SIGNWORLD</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mon-Fri 8AM-6PM EST</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <EnvelopeIcon className="h-10 w-10 text-primary-600 dark:text-primary-500 mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Email Support</h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4">Get help via email</p>
          <p className="text-primary-600 dark:text-primary-400 font-medium">support@signcompany.com</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Response within 24 hours</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <DocumentTextIcon className="h-10 w-10 text-primary-600 dark:text-primary-500 mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Documentation</h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4">Browse our resource library</p>
          <p className="text-primary-600 dark:text-primary-400 font-medium">View Resources →</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Guides, templates & more</p>
        </div>
      </div>

      {/* Still Need Help */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-primary-900 dark:text-primary-100 mb-3">Still need help?</h2>
        <p className="text-primary-700 dark:text-primary-300 mb-6 max-w-2xl mx-auto">
          Our support team is standing by to assist you with any questions or issues you may have.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Start Live Chat
          </button>
          <button className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors border border-primary-200">
            <PhoneIcon className="h-5 w-5 mr-2" />
            Schedule a Call
          </button>
        </div>
      </div>

      {/* Add FAQ Modal */}
      <AddFAQModal />
    </div>
  );
};

export default FAQs;
