import { useState, useEffect, useCallback } from 'react';
import type { PageTourKey } from '../config/tourSteps';

const TOUR_STORAGE_KEY = 'productTourCompleted';
const TOUR_ENABLED_KEY = 'productTourEnabled';
const TOUR_VERSION = '2.0';

interface TourState {
  run: boolean;
  stepIndex: number;
}

export const useProductTour = (userId?: string) => {
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
  };
};
