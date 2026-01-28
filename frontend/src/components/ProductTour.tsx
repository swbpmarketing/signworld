import React, { useCallback, useEffect } from 'react';
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import type { CallBackProps } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProductTour } from '../hooks/useProductTour';
import { getFilteredSteps } from '../config/tourSteps';

interface ProductTourProps {
  userId?: string;
  userRole?: string;
}

const ProductTour: React.FC<ProductTourProps> = ({ userId, userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tourState, setTourState, completeTour, stopTour } = useProductTour(userId);

  // Get steps filtered by user role
  const steps = getFilteredSteps(userRole);

  /**
   * Handle route changes during the tour
   * Navigate to the appropriate page based on the current step
   */
  const handleRouteChange = useCallback((stepIndex: number) => {
    const step = steps[stepIndex];
    const target = step?.target as string;

    if (!target || target === 'body') return;

    // Map data-tour attributes to routes
    const routeMap: { [key: string]: string } = {
      'nav-dashboard': '/dashboard',
      'nav-reports': '/reports',
      'nav-user-management': '/users',
      'nav-calendar': '/calendar',
      'nav-convention': '/convention',
      'nav-brags': '/brags',
      'nav-forum': '/forum',
      'nav-chat': '/chat',
      'nav-library': '/library',
      'nav-owners': '/owners',
      'nav-map': '/map',
      'nav-partners': '/partners',
      'nav-videos': '/videos',
      'nav-equipment': '/equipment',
      'nav-vendor-equipment': '/vendor-equipment',
      'nav-vendor-inquiries': '/vendor-inquiries',
      'nav-vendor-profile': '/vendor-profile',
      'nav-faqs': '/faqs',
      'nav-bug-reports': '/bug-reports',
    };

    // Check if we need to navigate to a different page
    for (const [tourAttr, route] of Object.entries(routeMap)) {
      if (target.includes(tourAttr) && location.pathname !== route) {
        navigate(route);
        break;
      }
    }
  }, [steps, location.pathname, navigate]);

  /**
   * Handle Joyride callback events
   */
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, action, index } = data;
    console.log('[ProductTour] Joyride callback:', { status, type, action, index });

    // Handle tour completion
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      console.log('[ProductTour] Tour ended with status:', status);
      completeTour();
      return;
    }

    // Handle step changes
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

      // Update step index
      setTourState((prev) => ({
        ...prev,
        stepIndex: nextStepIndex,
      }));

      // Navigate to the next page if needed
      if (action === ACTIONS.NEXT || action === ACTIONS.PREV) {
        handleRouteChange(nextStepIndex);
      }
    }

    // Handle close button - treat as completion/skip
    if (action === ACTIONS.CLOSE) {
      console.log('[ProductTour] Close button clicked, marking as completed');
      completeTour();
    }
  }, [completeTour, stopTour, setTourState, handleRouteChange]);

  /**
   * When tour starts, ensure we're on the right page for the current step
   */
  useEffect(() => {
    if (tourState.run) {
      handleRouteChange(tourState.stepIndex);
    }
  }, [tourState.run, tourState.stepIndex, handleRouteChange]);

  return (
    <Joyride
      steps={steps}
      run={tourState.run}
      stepIndex={tourState.stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#fff',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.3)', // Reduced opacity for better visibility
          primaryColor: '#3b82f6', // primary-600
          textColor: '#1f2937', // gray-800
          width: 380,
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: 8,
        },
        tooltipContent: {
          fontSize: '14px',
          padding: '10px 0',
          lineHeight: 1.6,
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          fontSize: '14px',
          padding: '8px 16px',
          fontWeight: 500,
        },
        buttonBack: {
          color: '#6b7280',
          fontSize: '14px',
          marginRight: 8,
        },
        buttonSkip: {
          color: '#9ca3af',
          fontSize: '14px',
        },
        buttonClose: {
          display: 'none', // Hide the X button, use Skip instead
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      floaterProps={{
        disableAnimation: false,
      }}
      disableScrolling={false}
      spotlightClicks={false}
      disableOverlayClose={true}
    />
  );
};

export default ProductTour;
