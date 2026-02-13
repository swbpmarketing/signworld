import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';

function getKey(storageKey: string) {
  return `dashboard-card-order-${storageKey}`;
}

function loadOrder(storageKey: string, defaults: string[]): string[] {
  try {
    const stored = localStorage.getItem(getKey(storageKey));
    if (stored) {
      const parsed: string[] = JSON.parse(stored);
      const valid = parsed.filter((id) => defaults.includes(id));
      const added = defaults.filter((id) => !parsed.includes(id));
      return [...valid, ...added];
    }
  } catch {
    // ignore
  }
  return [...defaults];
}

function saveOrder(storageKey: string, order: string[]) {
  try {
    localStorage.setItem(getKey(storageKey), JSON.stringify(order));
  } catch {
    // ignore
  }
}

export function useCardOrder(storageKey: string, defaultOrder: string[]) {
  const [order, setOrder] = useState<string[]>(() => loadOrder(storageKey, defaultOrder));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        saveOrder(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const resetOrder = useCallback(() => {
    setOrder([...defaultOrder]);
    saveOrder(storageKey, defaultOrder);
  }, [storageKey, defaultOrder]);

  return { order, handleDragEnd, resetOrder };
}
