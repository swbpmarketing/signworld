import { useState, useEffect, useCallback, useRef } from 'react';

const TOUR_STORAGE_KEY = 'productTourCompleted';
const TOUR_SESSION_KEY = 'productTourSessionInit';
const TOUR_VERSION = '1.0'; // Increment this to show tour again after major updates

interface TourState {
  run: boolean;
  stepIndex: number;
}

export const useProductTour = (userId?: string) => {
  const [tourState, setTourState] = useState<TourState>({
    run: false,
    stepIndex: 0,
  });

  // Track if we've already checked tour on mount to prevent multiple checks
  // Using both ref AND sessionStorage to handle component remounts
  const hasInitialized = useRef(false);

  /**
   * Check if user has completed the tour
   */
  const hasCompletedTour = useCallback((): boolean => {
    if (!userId) {
      console.log('[ProductTour] hasCompletedTour: no userId, returning true');
      return true; // Don't show tour if no user
    }

    try {
      const completedData = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!completedData) {
        console.log('[ProductTour] hasCompletedTour: no data in localStorage, returning false');
        return false;
      }

      const parsed = JSON.parse(completedData);
      const completed = parsed[userId] === TOUR_VERSION;
      console.log('[ProductTour] hasCompletedTour for user:', userId, 'Completed:', completed, 'Data:', parsed);

      // Check if this specific user has completed the current version
      return completed;
    } catch (error) {
      console.error('Error checking tour completion:', error);
      return false;
    }
  }, [userId]);

  /**
   * Mark tour as completed for current user
   */
  const completeTour = useCallback(() => {
    if (!userId) {
      console.log('[ProductTour] completeTour called but no userId');
      return;
    }

    try {
      const completedData = localStorage.getItem(TOUR_STORAGE_KEY);
      const parsed = completedData ? JSON.parse(completedData) : {};

      // Mark current version as completed for this user
      parsed[userId] = TOUR_VERSION;

      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(parsed));
      console.log('[ProductTour] Tour marked as completed for user:', userId, 'Data:', parsed);

      setTourState({
        run: false,
        stepIndex: 0,
      });
    } catch (error) {
      console.error('Error saving tour completion:', error);
    }
  }, [userId]);

  /**
   * Start the tour manually (from Settings or other triggers)
   */
  const startTour = useCallback(() => {
    setTourState({
      run: true,
      stepIndex: 0,
    });
    // Dispatch custom event for other hook instances in the same window
    window.dispatchEvent(new CustomEvent('startProductTour'));
  }, []);

  /**
   * Stop the tour
   */
  const stopTour = useCallback(() => {
    setTourState({
      run: false,
      stepIndex: 0,
    });
  }, []);

  /**
   * Reset tour completion (for testing or if user wants to see it again)
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
   * Auto-start behavior for NEW users ONLY:
   * - NEW users (first login ever): Tour starts automatically ONCE
   * - RETURNING users (completed/skipped tour): Tour does NOT auto-start
   * - Only runs ONCE per session to prevent re-triggering
   * - Can always be manually started from Settings
   */
  useEffect(() => {
    // Don't run if no userId
    if (!userId) {
      console.log('[ProductTour] Auto-start: no userId, skipping');
      return;
    }

    // Check both ref AND sessionStorage to handle component remounts
    const sessionInitKey = `${TOUR_SESSION_KEY}_${userId}`;
    const alreadyInitializedInSession = sessionStorage.getItem(sessionInitKey) === 'true';

    console.log('[ProductTour] Auto-start check - hasInitialized:', hasInitialized.current, 'alreadyInitializedInSession:', alreadyInitializedInSession);

    if (hasInitialized.current || alreadyInitializedInSession) {
      console.log('[ProductTour] Already initialized this session, skipping auto-start');
      return;
    }

    // Mark as initialized in both ref and sessionStorage (prevents multiple auto-starts in same session)
    hasInitialized.current = true;
    sessionStorage.setItem(sessionInitKey, 'true');

    // Small delay to ensure the page is fully loaded
    const timer = setTimeout(() => {
      const completed = hasCompletedTour();
      console.log('[ProductTour] Auto-start: Tour completed?', completed);

      // Only auto-start for NEW users who haven't completed the tour yet
      if (!completed) {
        console.log('[ProductTour] NEW USER detected - Starting tour automatically (first login)');
        startTour();
      } else {
        console.log('[ProductTour] RETURNING USER - Tour already completed, not auto-starting');
      }
    }, 1000); // 1 second delay after login

    return () => clearTimeout(timer);
    // Only depend on userId - functions are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /**
   * Listen for tour trigger from other components (e.g., Settings page)
   */
  useEffect(() => {
    const handleTourStart = () => {
      setTourState({
        run: true,
        stepIndex: 0,
      });
    };

    window.addEventListener('startProductTour', handleTourStart);
    return () => window.removeEventListener('startProductTour', handleTourStart);
  }, []);

  return {
    tourState,
    setTourState,
    startTour,
    stopTour,
    completeTour,
    resetTour,
    hasCompletedTour: hasCompletedTour(),
  };
};
