import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { useWidgetSizes, type WidgetSize, type WidgetSizesMap } from './useWidgetSizes';

function getOrderKey(dashboardId: string) {
  return `dashboard-widget-order-${dashboardId}`;
}

function loadOrder(dashboardId: string, defaultOrder: string[]): string[] {
  try {
    const stored = localStorage.getItem(getOrderKey(dashboardId));
    if (stored) {
      const parsed: string[] = JSON.parse(stored);
      // Filter out removed widgets, append newly-added ones
      const valid = parsed.filter((id) => defaultOrder.includes(id));
      const added = defaultOrder.filter((id) => !parsed.includes(id));
      return [...valid, ...added];
    }
  } catch {
    // Ignore parse errors
  }
  return [...defaultOrder];
}

function saveOrder(dashboardId: string, order: string[]) {
  try {
    localStorage.setItem(getOrderKey(dashboardId), JSON.stringify(order));
  } catch {
    // Ignore storage errors
  }
}

export function useWidgetLayout(
  dashboardId: string,
  defaultSizes: WidgetSizesMap,
  defaultOrder: string[]
) {
  const { sizes, setWidgetSize, resetSizes } = useWidgetSizes(dashboardId, defaultSizes);
  const [order, setOrder] = useState<string[]>(() => loadOrder(dashboardId, defaultOrder));
  const [isEditMode, setIsEditMode] = useState(false);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        saveOrder(dashboardId, next);
        return next;
      });
    },
    [dashboardId]
  );

  const resetLayout = useCallback(() => {
    setOrder([...defaultOrder]);
    saveOrder(dashboardId, defaultOrder);
    resetSizes();
  }, [dashboardId, defaultOrder, resetSizes]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  return {
    sizes,
    setWidgetSize,
    order,
    isEditMode,
    toggleEditMode,
    handleDragEnd,
    resetLayout,
  };
}
