import { useState, useEffect, useCallback } from 'react';

const TOUR_STORAGE_KEY = 'productTourCompleted';
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

  /**
   * Check if user has completed the tour
   */
  const hasCompletedTour = useCallback((): boolean => {
    if (!userId) return true; // Don't show tour if no user

    try {
      const completedData = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!completedData) return false;

      const parsed = JSON.parse(completedData);

      // Check if this specific user has completed the current version
      return parsed[userId] === TOUR_VERSION;
    } catch (error) {
      console.error('Error checking tour completion:', error);
      return false;
    }
  }, [userId]);

  /**
   * Mark tour as completed for current user
   */
  const completeTour = useCallback(() => {
    if (!userId) return;

    try {
      const completedData = localStorage.getItem(TOUR_STORAGE_KEY);
      const parsed = completedData ? JSON.parse(completedData) : {};

      // Mark current version as completed for this user
      parsed[userId] = TOUR_VERSION;

      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(parsed));

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
   * Check on mount if this is the user's first login
   * Show tour automatically if they haven't completed it
   */
  useEffect(() => {
    if (!userId) return;

    // Small delay to ensure the page is fully loaded
    const timer = setTimeout(() => {
      if (!hasCompletedTour()) {
        startTour();
      }
    }, 1000); // 1 second delay after login

    return () => clearTimeout(timer);
  }, [userId, hasCompletedTour, startTour]);

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
