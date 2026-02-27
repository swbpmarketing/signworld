import React, { useCallback } from 'react';
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import type { CallBackProps } from 'react-joyride';
import { useProductTour } from '../hooks/useProductTour';
import { getPageTourSteps } from '../config/tourSteps';

interface ProductTourProps {
  userId?: string;
  userRole?: string;
}

const ProductTour: React.FC<ProductTourProps> = ({ userId }) => {
  const { tourState, setTourState, activePageKey, completeTour, markPageTourCompleted } = useProductTour(userId);

  const steps = getPageTourSteps(activePageKey).map(step => ({ ...step, disableBeacon: true }));

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, action, index } = data;

    const finishTour = () => {
      if (activePageKey) markPageTourCompleted(activePageKey);
      completeTour();
    };

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      finishTour();
      return;
    }

    if (action === ACTIONS.CLOSE) {
      finishTour();
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      if (nextStepIndex >= steps.length) {
        finishTour();
        return;
      }
      if (nextStepIndex < 0) return;
      setTourState((prev) => ({ ...prev, stepIndex: nextStepIndex }));
    }
  }, [activePageKey, markPageTourCompleted, completeTour, setTourState, steps.length]);

  if (!activePageKey || steps.length === 0) return null;

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
          overlayColor: 'rgba(0, 0, 0, 0.3)',
          primaryColor: '#3b82f6',
          textColor: '#1f2937',
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
          padding: 12,
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
      disableOverlayClose={false}
    />
  );
};

export default ProductTour;
