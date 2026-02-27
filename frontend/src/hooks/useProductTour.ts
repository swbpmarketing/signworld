import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAvailableTours } from '../config/tourSteps';
import type { PageTourKey } from '../config/tourSteps';

const TOUR_STORAGE_KEY = 'productTourCompleted';
const TOUR_ENABLED_KEY = 'productTourEnabled';
const PAGE_TOUR_COMPLETED_KEY = 'productTourPageCompleted';
const TOUR_VERSION = '2.0';

interface TourState {
  run: boolean;
  stepIndex: number;
}

export interface TourProgress {
  completed: number;
  total: number;
  percentage: number;
}

export const useProductTour = (userId?: string, userRole?: string) => {
  const [tourState, setTourState] = useState<TourState>({
    run: false,
    stepIndex: 0,
  });

  const [activePageKey, setActivePageKey] = useState<PageTourKey | null>(null);

  // Reactive tour-enabled state (fixes the bug where toggle didn't visually update)
  const [tourEnabled, setTourEnabledState] = useState<boolean>(() => {
    if (!userId) return false;
    try {
      const data = localStorage.getItem(TOUR_ENABLED_KEY);
      if (!data) return true;
      const parsed = JSON.parse(data);
      return parsed[userId] !== false;
    } catch {
      return true;
    }
  });

  // Re-sync tourEnabled when userId changes
  useEffect(() => {
    if (!userId) {
      setTourEnabledState(false);
      return;
    }
    try {
      const data = localStorage.getItem(TOUR_ENABLED_KEY);
      if (!data) {
        setTourEnabledState(true);
        return;
      }
      const parsed = JSON.parse(data);
      setTourEnabledState(parsed[userId] !== false);
    } catch {
      setTourEnabledState(true);
    }
  }, [userId]);

  // --- Per-page tour completion tracking ---
  const [completedPageTours, setCompletedPageTours] = useState<string[]>(() => {
    if (!userId) return [];
    try {
      const data = localStorage.getItem(PAGE_TOUR_COMPLETED_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed[userId]) ? parsed[userId] : [];
    } catch {
      return [];
    }
  });

  // Re-sync completedPageTours when userId changes
  useEffect(() => {
    if (!userId) {
      setCompletedPageTours([]);
      return;
    }
    try {
      const data = localStorage.getItem(PAGE_TOUR_COMPLETED_KEY);
      if (!data) {
        setCompletedPageTours([]);
        return;
      }
      const parsed = JSON.parse(data);
      setCompletedPageTours(Array.isArray(parsed[userId]) ? parsed[userId] : []);
    } catch {
      setCompletedPageTours([]);
    }
  }, [userId]);

  /**
   * Mark a specific page tour as completed
   */
  const markPageTourCompleted = useCallback((pageKey: PageTourKey) => {
    if (!userId) return;
    setCompletedPageTours(prev => {
      if (prev.includes(pageKey)) return prev;
      const updated = [...prev, pageKey];
      try {
        const data = localStorage.getItem(PAGE_TOUR_COMPLETED_KEY);
        const parsed = data ? JSON.parse(data) : {};
        parsed[userId] = updated;
        localStorage.setItem(PAGE_TOUR_COMPLETED_KEY, JSON.stringify(parsed));
      } catch (error) {
        console.error('Error saving page tour completion:', error);
      }
      // Notify other hook instances to re-sync
      window.dispatchEvent(new CustomEvent('pageTourCompleted', { detail: { userId, pageKey } }));
      return updated;
    });
  }, [userId]);

  // Listen for completion events from other hook instances to stay in sync
  useEffect(() => {
    const handleTourCompleted = (e: Event) => {
      const { userId: completedUserId } = (e as CustomEvent).detail;
      if (completedUserId !== userId) return;
      try {
        const data = localStorage.getItem(PAGE_TOUR_COMPLETED_KEY);
        if (!data) return;
        const parsed = JSON.parse(data);
        setCompletedPageTours(Array.isArray(parsed[userId]) ? parsed[userId] : []);
      } catch { /* ignore */ }
    };
    window.addEventListener('pageTourCompleted', handleTourCompleted);
    return () => window.removeEventListener('pageTourCompleted', handleTourCompleted);
  }, [userId]);

  /**
   * Tour progress calculation based on role-specific tours
   */
  const tourProgress: TourProgress = useMemo(() => {
    const available = getAvailableTours(userRole);
    const total = available.length;
    const completed = available.filter(({ key }) => completedPageTours.includes(key)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [userRole, completedPageTours]);

  const allToursCompleted = tourProgress.total > 0 && tourProgress.percentage === 100;

  /**
   * Toggle tour on/off — updates both React state and localStorage
   */
  const setTourEnabled = useCallback((enabled: boolean) => {
    if (!userId) return;
    setTourEnabledState(enabled);
    try {
      const data = localStorage.getItem(TOUR_ENABLED_KEY);
      const parsed = data ? JSON.parse(data) : {};
      parsed[userId] = enabled;
      localStorage.setItem(TOUR_ENABLED_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.error('Error saving tour enabled state:', error);
    }
  }, [userId]);

  /**
   * Check if user has completed the welcome tour
   */
  const hasCompletedTour = useCallback((): boolean => {
    if (!userId) return true;
    try {
      const completedData = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!completedData) return false;
      const parsed = JSON.parse(completedData);
      return parsed[userId] === TOUR_VERSION;
    } catch {
      return false;
    }
  }, [userId]);

  /**
   * Mark tour as completed for current user
   */
  const completeTour = useCallback(() => {
    if (userId) {
      try {
        const completedData = localStorage.getItem(TOUR_STORAGE_KEY);
        const parsed = completedData ? JSON.parse(completedData) : {};
        parsed[userId] = TOUR_VERSION;
        localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(parsed));
      } catch (error) {
        console.error('Error saving tour completion:', error);
      }
    }
    setTourState({ run: false, stepIndex: 0 });
    setActivePageKey(null);
  }, [userId]);

  /**
   * Start a specific page tour
   */
  const startPageTour = useCallback((pageKey: PageTourKey) => {
    setActivePageKey(pageKey);
    setTourState({ run: true, stepIndex: 0 });
    window.dispatchEvent(new CustomEvent('startPageTour', { detail: { pageKey } }));
  }, []);

  /**
   * Stop the tour
   */
  const stopTour = useCallback(() => {
    setTourState({ run: false, stepIndex: 0 });
    setActivePageKey(null);
  }, []);

  /**
   * Reset tour completion (for testing)
   */
  const resetTour = useCallback(() => {
    if (!userId) return;
    try {
      const completedData = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!completedData) return;
      const parsed = JSON.parse(completedData);
      delete parsed[userId];
      if (Object.keys(parsed).length === 0) {
        localStorage.removeItem(TOUR_STORAGE_KEY);
      } else {
        localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Error resetting tour:', error);
    }
  }, [userId]);

  /**
   * Listen for page tour trigger from other components (e.g., Settings page)
   */
  useEffect(() => {
    const handlePageTourStart = (e: Event) => {
      const { pageKey } = (e as CustomEvent).detail;
      setActivePageKey(pageKey);
      setTourState({ run: true, stepIndex: 0 });
    };

    window.addEventListener('startPageTour', handlePageTourStart);
    return () => window.removeEventListener('startPageTour', handlePageTourStart);
  }, []);

  return {
    tourState,
    setTourState,
    activePageKey,
    startPageTour,
    stopTour,
    completeTour,
    resetTour,
    hasCompletedTour: hasCompletedTour(),
    tourEnabled,
    setTourEnabled,
    completedPageTours,
    markPageTourCompleted,
    tourProgress,
    allToursCompleted,
  };
};
