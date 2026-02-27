import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreviewMode } from '../context/PreviewModeContext';
import { useProductTour } from '../hooks/useProductTour';
import { getAvailableTours, pageTours } from '../config/tourSteps';
import type { PageTourKey } from '../config/tourSteps';
import {
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
  QuestionMarkCircleIcon,
  BugAntIcon,
  PlayIcon,
  CheckCircleIcon,
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

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpGuide = ({ isOpen, onClose }: HelpGuideProps) => {
  const [search, setSearch] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { getEffectiveRole } = usePreviewMode();
  const effectiveRole = getEffectiveRole();
  const { startPageTour, completedPageTours, tourProgress } = useProductTour(user?._id, effectiveRole);
  const location = useLocation();
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ignore clicks on the navbar trigger button
      if ((e.target as HTMLElement).closest?.('[data-tour-guide-trigger]')) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) setSearch('');
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
    onClose();
    setSearch('');
    if (location.pathname !== route) {
      navigate(route);
    }
    setTimeout(() => {
      startPageTour(key);
    }, 800);
  };

  const CurrentIcon = tourIconMap[currentPageConfig.icon] || SparklesIcon;

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed right-4 sm:right-6 top-16 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Platform Guide</h2>
            <p className="text-sm text-white/80 mt-0.5">Interactive tours for every page</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Close help guide"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Progress Bar */}
        {tourProgress.total > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-white/90 mb-1.5">
              <span>{tourProgress.completed} of {tourProgress.total} tours completed</span>
              <span className="font-semibold">{tourProgress.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${tourProgress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current Page Tour Card */}
        <div className={`rounded-xl p-4 border ${
          completedPageTours.includes(currentPageKey)
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
            : 'bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              completedPageTours.includes(currentPageKey)
                ? 'bg-green-100 dark:bg-green-900/40'
                : 'bg-primary-100 dark:bg-primary-900/40'
            }`}>
              {completedPageTours.includes(currentPageKey) ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <CurrentIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${
                completedPageTours.includes(currentPageKey)
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-primary-600 dark:text-primary-400'
              }`}>
                {completedPageTours.includes(currentPageKey) ? 'Completed' : 'Current Page'}
              </p>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {currentPageConfig.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {currentPageConfig.description}
              </p>
              <button
                onClick={() => handleStartTour(currentPageKey, currentPageConfig.route)}
                className={`mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                  completedPageTours.includes(currentPageKey)
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                <PlayIcon className="h-4 w-4" />
                {completedPageTours.includes(currentPageKey) ? 'Replay Tour' : 'Start Interactive Tour'}
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
              const isCompleted = completedPageTours.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => handleStartTour(key, config.route)}
                  className={`relative flex flex-col items-center gap-2 p-3.5 rounded-xl border hover:shadow-sm transition-all text-center group ${
                    isCompleted
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                  }`}
                >
                  {isCompleted && (
                    <CheckCircleIcon className="absolute top-2 right-2 h-4 w-4 text-green-500 dark:text-green-400" />
                  )}
                  <Icon className={`h-6 w-6 group-hover:scale-110 transition-all ${
                    isCompleted
                      ? 'text-green-500 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                  }`} />
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
  );
};

export default HelpGuide;
