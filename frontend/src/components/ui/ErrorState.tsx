import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

/**
 * Reusable error state component for displaying errors with retry functionality
 *
 * @param title - Error title/heading (default: "Something went wrong")
 * @param message - Error description message
 * @param onRetry - Optional retry callback function
 * @param retryLabel - Label for retry button (default: "Try Again")
 * @param icon - Optional custom icon component
 * @param className - Additional CSS classes
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this content. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  icon: CustomIcon,
  className = '',
}) => {
  const Icon = CustomIcon || ExclamationTriangleIcon;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* Error Icon */}
      <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>

      {/* Error Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      {/* Error Message */}
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
          {message}
        </p>
      )}

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          <ArrowPathIcon className="h-5 w-5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
