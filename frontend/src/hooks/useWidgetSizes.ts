import { useState, useCallback } from 'react';

export type WidgetSize = 'sm' | 'md' | 'lg';

export interface WidgetSizesMap {
  [widgetId: string]: WidgetSize;
}

function getStorageKey(dashboardId: string) {
  return `dashboard-widget-sizes-${dashboardId}`;
}

function loadSizes(dashboardId: string, defaultSizes: WidgetSizesMap): WidgetSizesMap {
  try {
    const stored = localStorage.getItem(getStorageKey(dashboardId));
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults so new widgets get their default size
      return { ...defaultSizes, ...parsed };
    }
  } catch (e) {
    // Ignore parse errors, fall through to defaults
  }
  return { ...defaultSizes };
}

function saveSizes(dashboardId: string, sizes: WidgetSizesMap) {
  try {
    localStorage.setItem(getStorageKey(dashboardId), JSON.stringify(sizes));
  } catch (e) {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

export function useWidgetSizes(dashboardId: string, defaultSizes: WidgetSizesMap) {
  const [sizes, setSizes] = useState<WidgetSizesMap>(() =>
    loadSizes(dashboardId, defaultSizes)
  );

  const setWidgetSize = useCallback(
    (widgetId: string, size: WidgetSize) => {
      setSizes((prev) => {
        const next = { ...prev, [widgetId]: size };
        saveSizes(dashboardId, next);
        return next;
      });
    },
    [dashboardId]
  );

  const resetSizes = useCallback(() => {
    setSizes({ ...defaultSizes });
    saveSizes(dashboardId, defaultSizes);
  }, [dashboardId, defaultSizes]);

  return { sizes, setWidgetSize, resetSizes };
}
