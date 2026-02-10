import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../config/axios';
import {
  MegaphoneIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  priority: number;
  isActive: boolean;
  createdAt: string;
}

const DISMISSED_KEY = 'dismissed-announcements';

function getDismissedIds(): string[] {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function dismissId(id: string) {
  try {
    const dismissed = getDismissedIds();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    }
  } catch {
    // ignore
  }
}

const typeStyles = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400',
    dismiss: 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200',
    nav: 'text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400',
    dismiss: 'text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200',
    nav: 'text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300',
  },
  urgent: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
    dismiss: 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200',
    nav: 'text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300',
  },
};

export default function AnnouncementBanner() {
  const [dismissedIds, setDismissedIds] = useState<string[]>(getDismissedIds);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data } = useQuery({
    queryKey: ['announcements-active'],
    queryFn: async () => {
      const res = await api.get('/announcements');
      return res.data.data as Announcement[];
    },
    refetchInterval: 60000,
  });

  const visible = data?.filter((a) => !dismissedIds.includes(a._id)) ?? [];

  useEffect(() => {
    if (currentIndex >= visible.length && visible.length > 0) {
      setCurrentIndex(visible.length - 1);
    }
  }, [visible.length, currentIndex]);

  if (visible.length === 0) return null;

  const current = visible[currentIndex];
  const styles = typeStyles[current.type];

  const handleDismiss = () => {
    dismissId(current._id);
    setDismissedIds(getDismissedIds());
  };

  const handlePrev = () => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : visible.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i < visible.length - 1 ? i + 1 : 0));
  };

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg px-4 py-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2.5 min-w-0 flex-1">
          <MegaphoneIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
          <div className="min-w-0">
            <span className={`text-sm font-semibold ${styles.text}`}>
              {current.title}
            </span>
            <p className={`text-sm mt-0.5 ${styles.text} opacity-80`}>
              {current.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {visible.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className={`p-0.5 rounded transition-colors ${styles.nav}`}
                aria-label="Previous announcement"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className={`text-xs tabular-nums ${styles.text} opacity-60`}>
                {currentIndex + 1}/{visible.length}
              </span>
              <button
                onClick={handleNext}
                className={`p-0.5 rounded transition-colors ${styles.nav}`}
                aria-label="Next announcement"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={handleDismiss}
            className={`p-0.5 rounded transition-colors ml-1 ${styles.dismiss}`}
            aria-label="Dismiss announcement"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
