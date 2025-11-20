import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  CalendarIcon,
  HomeIcon,
  UserGroupIcon,
  VideoCameraIcon,
  MapIcon,
  ShoppingBagIcon,
  QuestionMarkCircleIcon,
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

const searchableItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'owner', 'vendor'], description: 'View your dashboard and analytics' },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['admin', 'owner'], description: 'Business intelligence and reports' },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon, roles: ['admin', 'owner'], description: 'View and manage events' },
  { name: 'Convention', href: '/convention', icon: CalendarIcon, roles: ['admin', 'owner'], description: 'Convention information and schedule' },
  { name: 'Success Stories', href: '/brags', icon: NewspaperIcon, roles: ['admin', 'owner'], description: 'Share and read success stories' },
  { name: 'Forum', href: '/forum', icon: ChatBubbleLeftRightIcon, roles: ['admin', 'owner'], description: 'Community discussions and forums' },
  { name: 'Library', href: '/library', icon: FolderIcon, roles: ['admin', 'owner'], description: 'Resource library and documents' },
  { name: 'Owners Roster', href: '/owners', icon: UserGroupIcon, roles: ['admin', 'owner'], description: 'Directory of franchise owners' },
  { name: 'Map Search', href: '/map', icon: MapIcon, roles: ['admin', 'owner'], description: 'Search locations on map' },
  { name: 'Partners', href: '/partners', icon: UsersIcon, roles: ['admin', 'owner', 'vendor'], description: 'Partner and vendor directory' },
  { name: 'Videos', href: '/videos', icon: VideoCameraIcon, roles: ['admin', 'owner'], description: 'Training videos and tutorials' },
  { name: 'Equipment', href: '/equipment', icon: ShoppingBagIcon, roles: ['admin', 'owner'], description: 'Equipment catalog and orders' },
  { name: 'FAQs', href: '/faqs', icon: QuestionMarkCircleIcon, roles: ['admin', 'owner', 'vendor'], description: 'Frequently asked questions' },
];

const SearchModal = ({ isOpen, onClose, userRole }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Filter items based on user role and search query
  const filteredItems = searchableItems.filter(item => {
    const matchesRole = !userRole || item.roles.includes(userRole);
    const matchesQuery = query === '' ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase());
    return matchesRole && matchesQuery;
  });

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Reset query when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (href: string) => {
    navigate(href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter' && filteredItems.length > 0) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex].href);
    }
  };

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
          <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
                {/* Search Input */}
                <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-lg"
                    placeholder="Search pages and content..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Search Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No results found</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {filteredItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.href}
                            onClick={() => handleSelect(item.href)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                              index === selectedIndex
                                ? 'bg-primary-50 dark:bg-primary-900/30'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                              index === selectedIndex
                                ? 'bg-primary-100 dark:bg-primary-800/50'
                                : 'bg-gray-100 dark:bg-gray-700'
                            }`}>
                              <Icon className={`h-5 w-5 ${
                                index === selectedIndex
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} />
                            </div>
                            <div className="ml-4 flex-1">
                              <p className={`text-sm font-medium ${
                                index === selectedIndex
                                  ? 'text-primary-900 dark:text-primary-100'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer with keyboard hints */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-semibold">↑</kbd>
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-semibold">↓</kbd>
                        <span className="ml-1">to navigate</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-semibold">Enter</kbd>
                        <span className="ml-1">to select</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-semibold">Esc</kbd>
                      <span className="ml-1">to close</span>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SearchModal;
