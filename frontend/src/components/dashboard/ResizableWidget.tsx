import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { WidgetSize } from '../../hooks/useWidgetSizes';

const sizeClasses: Record<WidgetSize, string> = {
  sm: 'col-span-4 lg:col-span-1',
  md: 'col-span-4 lg:col-span-2',
  lg: 'col-span-4',
};

const sizeLabels: WidgetSize[] = ['sm', 'md', 'lg'];

interface ResizableWidgetProps {
  widgetId: string;
  size: WidgetSize;
  onSizeChange: (widgetId: string, size: WidgetSize) => void;
  children: ReactNode;
  className?: string;
}

const ResizableWidget = ({
  widgetId,
  size,
  onSizeChange,
  children,
  className = '',
}: ResizableWidgetProps) => {
  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`${sizeClasses[size]} relative group ${className}`}
    >
      {/* S/M/L toggle — visible on hover (desktop) or always (mobile) */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700 p-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
        {sizeLabels.map((s) => (
          <button
            key={s}
            onClick={() => onSizeChange(widgetId, s)}
            className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${
              size === s
                ? 'bg-primary-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label={`Resize widget to ${s === 'sm' ? 'small' : s === 'md' ? 'medium' : 'large'}`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="h-full [&>*]:h-full">
        {children}
      </div>
    </motion.div>
  );
};

export default ResizableWidget;
