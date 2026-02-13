import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCardProps {
  cardId: string;
  children: ReactNode;
  isEditMode?: boolean;
}

const SortableCard = ({ cardId, children, isEditMode = false }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cardId, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${
        isEditMode ? 'ring-2 ring-dashed ring-primary-300 dark:ring-primary-600 rounded-xl' : ''
      } ${isDragging ? 'z-50 opacity-80 shadow-2xl' : ''}`}
    >
      {isEditMode && (
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
      )}
      {children}
    </div>
  );
};

export default SortableCard;
