import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * Reusable button component with consistent styling and loading state
 *
 * @param variant - Button style variant
 * @param size - Button size
 * @param loading - Show loading spinner
 * @param leftIcon - Icon component to show on the left
 * @param rightIcon - Icon component to show on the right
 * @param fullWidth - Make button full width
 * @param children - Button content
 * @param className - Additional CSS classes
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantClasses = {
      primary: `
        bg-primary-600 text-white
        hover:bg-primary-700 active:bg-primary-800
        focus:ring-primary-500
        shadow-sm hover:shadow-md
      `,
      secondary: `
        bg-gray-100 text-gray-900
        dark:bg-gray-700 dark:text-gray-100
        hover:bg-gray-200 dark:hover:bg-gray-600
        active:bg-gray-300 dark:active:bg-gray-500
        focus:ring-gray-400 dark:focus:ring-gray-500
        border border-gray-300 dark:border-gray-600
      `,
      outline: `
        bg-transparent text-primary-600 dark:text-primary-400
        border-2 border-primary-600 dark:border-primary-400
        hover:bg-primary-50 dark:hover:bg-primary-900/20
        active:bg-primary-100 dark:active:bg-primary-900/30
        focus:ring-primary-500
      `,
      ghost: `
        bg-transparent text-gray-700 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-700
        active:bg-gray-200 dark:active:bg-gray-600
        focus:ring-gray-400 dark:focus:ring-gray-500
      `,
      danger: `
        bg-red-600 text-white
        hover:bg-red-700 active:bg-red-800
        focus:ring-red-500
        shadow-sm hover:shadow-md
      `,
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const iconSizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <>
            <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSizeClasses[size]}`} />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {LeftIcon && <LeftIcon className={iconSizeClasses[size]} />}
            <span>{children}</span>
            {RightIcon && <RightIcon className={iconSizeClasses[size]} />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
