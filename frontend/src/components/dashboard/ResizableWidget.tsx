import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  isEditMode?: boolean;
}

const ResizableWidget = ({
  widgetId,
  size,
  onSizeChange,
  children,
  className = '',
  isEditMode = false,
}: ResizableWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widgetId, disabled: !isEditMode });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={sortableStyle}
      layout={!isDragging}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`${sizeClasses[size]} relative group ${
        isEditMode ? 'ring-2 ring-dashed ring-primary-300 dark:ring-primary-600 rounded-xl' : ''
      } ${isDragging ? 'z-50 opacity-80 shadow-2xl' : ''} ${className}`}
    >
      {/* Edit mode controls */}
      {isEditMode && (
        <>
          {/* Drag handle — top left */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Drag to reorder"
          >
            <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="4" cy="3" r="1.5" />
              <circle cx="12" cy="3" r="1.5" />
              <circle cx="4" cy="8" r="1.5" />
              <circle cx="12" cy="8" r="1.5" />
              <circle cx="4" cy="13" r="1.5" />
              <circle cx="12" cy="13" r="1.5" />
            </svg>
          </div>

          {/* S/M/L toggle — top right */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-0.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700 p-0.5">
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
        </>
      )}

      {/* S/M/L toggle — hover only when NOT in edit mode */}
      {!isEditMode && (
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
      )}

      <div className="h-full [&>*]:h-full">
        {children}
      </div>
    </motion.div>
  );
};

export default ResizableWidget;
