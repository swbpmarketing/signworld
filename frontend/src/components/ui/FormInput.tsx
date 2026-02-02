import React, { forwardRef, InputHTMLAttributes } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  leadingIcon?: React.ComponentType<{ className?: string }>;
  trailingIcon?: React.ComponentType<{ className?: string }>;
  variant?: 'input' | 'textarea';
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
}

/**
 * Enhanced form input component with validation states, icons, and character counting
 *
 * @param label - Input label text
 * @param error - Error message to display (sets error state)
 * @param helperText - Helper text below input
 * @param success - Whether input is in success state
 * @param leadingIcon - Icon component to display at start of input
 * @param trailingIcon - Icon component to display at end of input
 * @param variant - Input type: 'input' or 'textarea'
 * @param rows - Number of rows for textarea (default: 4)
 * @param maxLength - Maximum character count
 * @param showCharCount - Whether to show character counter
 * @param className - Additional CSS classes for input
 * @param containerClassName - Additional CSS classes for container
 * @param labelClassName - Additional CSS classes for label
 */
const FormInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormInputProps>(
  (
    {
      label,
      error,
      helperText,
      success,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      variant = 'input',
      rows = 4,
      maxLength,
      showCharCount,
      className = '',
      containerClassName = '',
      labelClassName = '',
      value,
      id,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Character count
    const charCount = typeof value === 'string' ? value.length : 0;

    // Base input classes
    const baseClasses = `
      w-full px-4 py-2.5
      bg-white dark:bg-gray-700
      border rounded-lg
      text-gray-900 dark:text-gray-100
      placeholder-gray-500 dark:placeholder-gray-400
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    // State-specific classes
    const stateClasses = hasError
      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
      : hasSuccess
      ? 'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-green-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';

    // Padding adjustments for icons
    const paddingClasses = `${LeadingIcon ? 'pl-10' : ''} ${TrailingIcon || hasError || hasSuccess ? 'pr-10' : ''}`;

    const inputClasses = `${baseClasses} ${stateClasses} ${paddingClasses} ${className}`;

    // Status icon
    const StatusIcon = hasError ? ExclamationCircleIcon : hasSuccess ? CheckCircleIcon : TrailingIcon;
    const statusIconColor = hasError
      ? 'text-red-500 dark:text-red-400'
      : hasSuccess
      ? 'text-green-500 dark:text-green-400'
      : 'text-gray-400 dark:text-gray-500';

    return (
      <div className={`w-full ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ${labelClassName}`}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Leading Icon */}
          {LeadingIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <LeadingIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
          )}

          {/* Input or Textarea */}
          {variant === 'textarea' ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={inputId}
              rows={rows}
              maxLength={maxLength}
              value={value}
              className={inputClasses}
              aria-invalid={hasError}
              aria-describedby={
                error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
              }
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={inputId}
              maxLength={maxLength}
              value={value}
              className={inputClasses}
              aria-invalid={hasError}
              aria-describedby={
                error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
              }
              {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}

          {/* Trailing Icon / Status Icon */}
          {StatusIcon && (
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${variant === 'textarea' ? 'top-3 translate-y-0' : ''}`}>
              <StatusIcon className={`h-5 w-5 ${statusIconColor}`} />
            </div>
          )}
        </div>

        {/* Character Count */}
        {(showCharCount || maxLength) && (
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${charCount > (maxLength || Infinity) * 0.9 ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {charCount}
              {maxLength && ` / ${maxLength}`}
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <InformationCircleIcon className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
