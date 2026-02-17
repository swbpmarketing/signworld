import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreviewMode } from '../context/PreviewModeContext';
import { useProductTour } from '../hooks/useProductTour';
import { getAvailableTours, pageTours } from '../config/tourSteps';
import type { PageTourKey } from '../config/tourSteps';
import {
  QuestionMarkCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  BuildingOffice2Icon,
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleLeftIcon,
  FolderIcon,
  UserGroupIcon,
  MapIcon,
  VideoCameraIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  InboxIcon,
  BuildingStorefrontIcon,
  BugAntIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

const tourIconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  SparklesIcon,
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  BuildingOffice2Icon,
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleLeftIcon,
  FolderIcon,
  UserGroupIcon,
  MapIcon,
  VideoCameraIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  InboxIcon,
  BuildingStorefrontIcon,
  QuestionMarkCircleIcon,
  BugAntIcon,
};

const HelpGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { user } = useAuth();
  const { getEffectiveRole } = usePreviewMode();
  const { startPageTour } = useProductTour(user?._id);
  const location = useLocation();
  const navigate = useNavigate();

  const effectiveRole = getEffectiveRole();

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

  // Detect current page tour
  const currentPageTourEntry = Object.entries(pageTours).find(
    ([, config]) => config.route === location.pathname && config.roles.includes(effectiveRole || '')
  ) as [PageTourKey, typeof pageTours[PageTourKey]] | undefined;

  const currentPageKey = currentPageTourEntry?.[0] || 'welcome';
  const currentPageConfig = currentPageTourEntry?.[1] || pageTours.welcome;

  // Available tours filtered by role + search
  const availableTours = getAvailableTours(effectiveRole);
  const filteredTours = availableTours.filter(({ key, config }) => {
    if (key === currentPageKey) return false; // exclude current page from grid
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return config.label.toLowerCase().includes(q) || config.description.toLowerCase().includes(q);
  });

  const handleStartTour = (key: PageTourKey, route: string) => {
    setIsOpen(false);
    setSearch('');
    if (location.pathname !== route) {
      navigate(route);
    }
    setTimeout(() => {
      startPageTour(key);
    }, 800);
  };

  const CurrentIcon = tourIconMap[currentPageConfig.icon] || SparklesIcon;

  return (
    <>
      {/* Floating Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-[70] w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label="Open help guide"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <QuestionMarkCircleIcon className="h-6 w-6" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-20 right-6 z-[70] w-[calc(100vw-3rem)] sm:w-[480px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-blue-600 px-6 py-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Platform Guide</h2>
                <p className="text-sm text-white/80 mt-0.5">Interactive tours for every page</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Close help guide"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Current Page Tour Card */}
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex-shrink-0">
                  <CurrentIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-0.5">
                    Current Page
                  </p>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {currentPageConfig.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {currentPageConfig.description}
                  </p>
                  <button
                    onClick={() => handleStartTour(currentPageKey, currentPageConfig.route)}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <PlayIcon className="h-4 w-4" />
                    Start Interactive Tour
                  </button>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search tours..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            {/* Tour Card Grid */}
            {filteredTours.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredTours.map(({ key, config }) => {
                  const Icon = tourIconMap[config.icon] || SparklesIcon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleStartTour(key, config.route)}
                      className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:shadow-sm transition-all text-center group"
                    >
                      <Icon className="h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:scale-110 transition-all" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-2">
                        {config.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : search.trim() ? (
              <div className="text-center py-6">
                <MagnifyingGlassIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No tours match "{search}"</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};

export default HelpGuide;
