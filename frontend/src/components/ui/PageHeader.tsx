import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ReactNode;
  variant?: 'default' | 'gradient';
  className?: string;
}

/**
 * Standardized page header component for consistent styling across all pages
 *
 * @param title - Main heading text
 * @param description - Optional subtitle/description text
 * @param icon - Optional icon component to display before title
 * @param actions - Optional action buttons to display on the right
 * @param variant - Visual variant: 'default' (blue background) or 'gradient' (custom gradient)
 * @param className - Additional CSS classes to apply
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  actions,
  variant = 'default',
  className = '',
}) => {
  const baseClasses = 'rounded-lg border p-4 sm:p-6 w-full max-w-full';

  const variantClasses = {
    default: 'bg-blue-50 dark:bg-blue-900 border-blue-100 dark:border-blue-900/30',
    gradient: 'bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/30 dark:to-blue-900/30 border-primary-100 dark:border-primary-900/30',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Title and Description */}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {Icon && <Icon className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />}
            <span>{title}</span>
          </h1>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {actions && (
          <div className="flex-shrink-0 flex gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
