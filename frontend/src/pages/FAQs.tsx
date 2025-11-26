import { useState } from 'react';
import {
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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
} from '@heroicons/react/24/outline';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
  views: number;
}

const faqs: FAQ[] = [
  // Getting Started
  {
    id: 1,
    question: "What is Sign Company and how does it work?",
    answer: "Sign Company is a national sign franchise network that provides franchise owners with the tools, resources, and support needed to run a successful sign business. We offer comprehensive training, marketing support, preferred vendor relationships, and a proven business model without ongoing royalty fees.",
    category: "Getting Started",
    helpful: 156,
    notHelpful: 12,
    views: 2341
  },
  {
    id: 2,
    question: "How do I access the owner portal for the first time?",
    answer: "To access the owner portal, you'll receive login credentials via email after your franchise agreement is finalized. Visit the portal URL, enter your credentials, and follow the first-time setup wizard to configure your profile and preferences. If you haven't received your credentials, contact support at support@signcompany.com.",
    category: "Getting Started",
    helpful: 98,
    notHelpful: 5,
    views: 1876
  },
  {
    id: 3,
    question: "What training resources are available for new owners?",
    answer: "New owners have access to our comprehensive training program including: 1) Initial 2-week on-site training at our headquarters, 2) Online video library with 100+ training modules, 3) Monthly webinars on various topics, 4) One-on-one mentorship program, 5) Annual convention with advanced workshops, and 6) 24/7 access to our resource library.",
    category: "Getting Started",
    helpful: 134,
    notHelpful: 8,
    views: 1654
  },
  // Technical Support
  {
    id: 4,
    question: "How do I troubleshoot issues with my Roland printer?",
    answer: "Common Roland printer issues can be resolved by: 1) Checking ink levels and replacing if low, 2) Running the automatic cleaning cycle, 3) Verifying media is loaded correctly, 4) Updating firmware through the control panel, 5) Checking for clogged print heads. For persistent issues, contact Roland support at 1-800-542-2307 or access our video troubleshooting guides in the resource library.",
    category: "Technical Support",
    helpful: 87,
    notHelpful: 3,
    views: 1234
  },
  {
    id: 5,
    question: "What file formats are best for sign production?",
    answer: "For optimal quality, use vector formats like AI (Adobe Illustrator), EPS, or PDF for logos and text. For photos and complex graphics, use high-resolution (300 DPI minimum) TIFF or PNG files. Avoid JPEG for text-heavy designs as compression can cause artifacts. Always convert text to outlines and use CMYK color mode for print production.",
    category: "Technical Support",
    helpful: 112,
    notHelpful: 7,
    views: 1456
  },
  // Pricing & Finance
  {
    id: 6,
    question: "How does Sign Company's no-royalty model work?",
    answer: "Unlike traditional franchises, Sign Company charges no ongoing royalty fees. You pay a one-time franchise fee for lifetime access to our brand, training, and support systems. Your only ongoing costs are optional: attending conventions, purchasing from preferred vendors (at discounted rates), and any additional training you choose. This model allows you to keep more of your profits.",
    category: "Pricing & Finance",
    helpful: 245,
    notHelpful: 15,
    views: 3456
  },
  {
    id: 7,
    question: "What financing options are available for equipment purchases?",
    answer: "We offer several financing options through our preferred partners: 1) 0% financing for up to 60 months on select equipment, 2) Lease-to-own programs with tax benefits, 3) Bulk purchase discounts when buying multiple items, 4) Trade-in programs for upgrading equipment. Contact our equipment team for personalized financing solutions.",
    category: "Pricing & Finance",
    helpful: 167,
    notHelpful: 9,
    views: 2134
  },
  // Business Operations
  {
    id: 8,
    question: "How do I find and hire qualified sign installers?",
    answer: "Finding qualified installers: 1) Post on industry-specific job boards like SignJobs.com, 2) Network at local sign association meetings, 3) Partner with vocational schools offering sign programs, 4) Use our installer network directory, 5) Consider subcontracting initially. Always verify insurance, check references, and ensure they're certified for electrical work if needed.",
    category: "Business Operations",
    helpful: 93,
    notHelpful: 6,
    views: 1345
  },
  {
    id: 9,
    question: "What insurance coverage do I need for my sign business?",
    answer: "Essential insurance coverage includes: 1) General Liability ($2M minimum), 2) Professional Liability/E&O, 3) Commercial Auto with hired/non-owned coverage, 4) Workers' Compensation, 5) Equipment/Inland Marine coverage, 6) Installation Floater policy. Our preferred insurance partner offers package deals specifically designed for sign shops with competitive rates.",
    category: "Business Operations",
    helpful: 178,
    notHelpful: 11,
    views: 2567
  },
  // Training & Resources
  {
    id: 10,
    question: "How often are new training videos added to the library?",
    answer: "We add new training content weekly, including: technique tutorials, equipment reviews, business development strategies, and case studies. All owners receive email notifications for new content in their interest areas. You can also request specific topics through the portal, and popular requests are prioritized for content creation.",
    category: "Training & Resources",
    helpful: 76,
    notHelpful: 4,
    views: 987
  },
  {
    id: 11,
    question: "Can I download resources for offline access?",
    answer: "Yes, most resources can be downloaded for offline access. PDFs, templates, and forms are freely downloadable. Video content can be downloaded through our mobile app for offline viewing. Some proprietary content may have download restrictions but can be accessed online 24/7.",
    category: "Training & Resources",
    helpful: 89,
    notHelpful: 5,
    views: 1123
  }
];

const categories = [
  { name: "All Topics", icon: BookOpenIcon, count: 47 },
  { name: "Getting Started", icon: LightBulbIcon, count: 8 },
  { name: "Technical Support", icon: CpuChipIcon, count: 12 },
  { name: "Pricing & Finance", icon: CurrencyDollarIcon, count: 7 },
  { name: "Business Operations", icon: UserGroupIcon, count: 10 },
  { name: "Training & Resources", icon: AcademicCapIcon, count: 6 },
  { name: "Legal & Compliance", icon: ShieldCheckIcon, count: 4 }
];

const popularSearches = [
  "printer troubleshooting",
  "financing options",
  "insurance requirements",
  "training videos",
  "vendor discounts",
  "installation guides"
];

const FAQs = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQs, setExpandedFAQs] = useState<number[]>([]);
  const [helpfulVotes, setHelpfulVotes] = useState<{ [key: number]: 'helpful' | 'not-helpful' | null }>({});

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

  const toggleFAQ = (faqId: number) => {
    setExpandedFAQs(prev =>
      prev.includes(faqId)
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

  const handleHelpfulVote = (faqId: number, vote: 'helpful' | 'not-helpful') => {
    setHelpfulVotes(prev => ({
      ...prev,
      [faqId]: prev[faqId] === vote ? null : vote
    }));
  };

  const filteredFAQs = faqs.filter(faq => {
    if (selectedCategory !== 'All Topics' && faq.category !== selectedCategory) return false;
    if (searchQuery && !faq.question.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !faq.answer.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
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
            <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              Contact Support
            </button>
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
                <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-14 pr-12 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 focus:border-primary-500 dark:focus:border-primary-400 shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="submit"
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
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200 ${
                      selectedCategory === category.name
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <category.icon className={`h-5 w-5 mr-3 ${
                        selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <span>{category.name}</span>
                    </div>
                    <span className={`text-sm ${
                      selectedCategory === category.name ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
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
                Showing {filteredFAQs.length} results for "<span className="font-medium text-gray-900 dark:text-gray-100">{searchQuery}</span>"
              </p>
            </div>
          )}

          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 pr-4">
                        {faq.question}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {faq.category}
                        </span>
                        <span>{faq.views.toLocaleString()} views</span>
                      </div>
                    </div>
                    <div className={`transform transition-transform duration-200 ${
                      expandedFAQs.includes(faq.id) ? 'rotate-180' : ''
                    }`}>
                      <ChevronDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </button>

                {expandedFAQs.includes(faq.id) && (
                  <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="pt-4">
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{faq.answer}</p>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Was this helpful?</p>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleHelpfulVote(faq.id, 'helpful')}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                helpfulVotes[faq.id] === 'helpful'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Yes ({faq.helpful + (helpfulVotes[faq.id] === 'helpful' ? 1 : 0)})
                            </button>
                            <button
                              onClick={() => handleHelpfulVote(faq.id, 'not-helpful')}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                helpfulVotes[faq.id] === 'not-helpful'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              No ({faq.notHelpful + (helpfulVotes[faq.id] === 'not-helpful' ? 1 : 0)})
                            </button>
                          </div>
                        </div>
                        <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                          Contact Support →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <QuestionMarkCircleIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No FAQs found matching your search</p>
              <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                Contact Support
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Still Need Help */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-primary-900 mb-3">Still need help?</h2>
        <p className="text-primary-700 mb-6 max-w-2xl mx-auto">
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
    </div>
  );
};

export default FAQs;