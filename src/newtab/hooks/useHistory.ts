/**
 * Hook for managing history
 * Provides history fetching, deletion, and permission management
 */

import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../stores';
import {
  checkHistoryPermission,
  requestHistoryPermission,
  getHistoryItems,
  deleteHistoryItem,
} from '../services/history';
import type { HistoryItem, HistoryTimeRange } from '../types';

/**
 * History hook return interface
 */
export interface UseHistoryReturn {
  historyItems: HistoryItem[];
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  timeRange: HistoryTimeRange;
  setTimeRange: (range: HistoryTimeRange) => void;
  requestPermission: () => Promise<boolean>;
  deleteItem: (url: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * History data management hook
 */
export function useHistory(): UseHistoryReturn {
  const { widgetSettings } = useSettingsStore();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<HistoryTimeRange>(
    widgetSettings.historyWidget.timeRange
  );

  /**
   * Fetch history items
   */
  const fetchHistory = useCallback(async () => {
    if (!hasPermission) {
      setHistoryItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const items = await getHistoryItems(timeRange, widgetSettings.historyWidget.maxItems);
      setHistoryItems(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch history';
      console.error('History fetch error:', err);
      setError(message);
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, timeRange, widgetSettings.historyWidget.maxItems]);

  /**
   * Request permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestHistoryPermission();
      setHasPermission(granted);

      if (granted) {
        // Fetch history after permission granted
        await fetchHistory();
      }

      return granted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      return false;
    }
  }, [fetchHistory]);

  /**
   * Delete history item
   */
  const deleteItem = useCallback(async (url: string) => {
    try {
      await deleteHistoryItem(url);
      // Refresh history list after deletion
      await fetchHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete history item';
      setError(message);
      throw err;
    }
  }, [fetchHistory]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    await fetchHistory();
  }, [fetchHistory]);

  /**
   * Check permission on mount only
   */
  useEffect(() => {
    const checkPermission = async () => {
      setIsLoading(true);

      try {
        const permitted = await checkHistoryPermission();
        setHasPermission(permitted);
      } catch (err) {
        console.error('Failed to check permission:', err);
        setHasPermission(false);
        setError(err instanceof Error ? err.message : 'Permission check failed');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, []);

  /**
   * Fetch history when permission granted or settings change
   */
  useEffect(() => {
    if (hasPermission) {
      fetchHistory();
    }
  }, [hasPermission, timeRange, widgetSettings.historyWidget.maxItems, fetchHistory]);

  /**
   * Listen for history changes
   */
  useEffect(() => {
    if (!hasPermission) return;

    const chromeApi = typeof chrome !== 'undefined' ? chrome : undefined;
    if (!chromeApi?.history) return;

    const handleVisited = () => {
      fetchHistory();
    };

    const handleRemoved = () => {
      fetchHistory();
    };

    chromeApi.history.onVisited.addListener(handleVisited);
    chromeApi.history.onVisitRemoved.addListener(handleRemoved);

    return () => {
      chromeApi.history.onVisited.removeListener(handleVisited);
      chromeApi.history.onVisitRemoved.removeListener(handleRemoved);
    };
  }, [hasPermission, fetchHistory]);

  return {
    historyItems,
    hasPermission,
    isLoading,
    error,
    timeRange,
    setTimeRange,
    requestPermission,
    deleteItem,
    refresh,
  };
}
