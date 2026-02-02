import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
  className?: string;
}

/**
 * Reusable toggle/switch component with loading state
 *
 * @param checked - Whether the toggle is on or off
 * @param onChange - Callback when toggle state changes
 * @param label - Optional label text
 * @param description - Optional description text
 * @param disabled - Whether the toggle is disabled
 * @param loading - Whether to show loading spinner
 * @param id - Optional ID for the input
 * @param className - Additional CSS classes for container
 */
const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  loading = false,
  id,
  className = '',
}) => {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
  const isDisabled = disabled || loading;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {(label || description) && (
        <div className="flex-1 mr-4">
          {label && (
            <label
              htmlFor={toggleId}
              className={`font-medium text-gray-900 dark:text-gray-100 ${isDisabled ? 'opacity-50' : 'cursor-pointer'}`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={`text-sm text-gray-500 dark:text-gray-400 ${isDisabled ? 'opacity-50' : ''}`}>
              {description}
            </p>
          )}
        </div>
      )}

      <label className={`relative inline-flex items-center ${isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
        <input
          id={toggleId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={isDisabled}
          className="sr-only peer"
          aria-label={label || 'Toggle'}
          aria-describedby={description ? `${toggleId}-description` : undefined}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 peer-disabled:opacity-50 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400"></div>
            </div>
          )}
        </div>
      </label>

      {description && (
        <span id={`${toggleId}-description`} className="sr-only">
          {description}
        </span>
      )}
    </div>
  );
};

export default Toggle;
