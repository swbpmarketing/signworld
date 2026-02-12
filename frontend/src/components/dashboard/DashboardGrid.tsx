import { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
  isEditMode?: boolean;
  widgetOrder?: string[];
  onDragEnd?: (event: DragEndEvent) => void;
}

const DashboardGrid = ({
  children,
  className = '',
  isEditMode,
  widgetOrder,
  onDragEnd,
}: DashboardGridProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const grid = (
    <AnimatePresence mode="popLayout">
      <div className={`grid grid-cols-4 gap-6 ${className}`}>
        {children}
      </div>
    </AnimatePresence>
  );

  if (isEditMode && widgetOrder && onDragEnd) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
          {grid}
        </SortableContext>
      </DndContext>
    );
  }

  return grid;
};

export default DashboardGrid;
