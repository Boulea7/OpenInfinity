/**
 * Hook for managing bookmarks
 * Provides bookmark fetching and permission management
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores';
import {
  checkBookmarksPermission,
  requestBookmarksPermission,
  getRecentBookmarks,
} from '../services/bookmarks';
import type { BookmarkItem } from '../types';

// Precise selector to only subscribe to widgetSettings
const selectWidgetSettings = (s: ReturnType<typeof useSettingsStore.getState>) => s.widgetSettings;

/**
 * Bookmarks hook return interface
 */
export interface UseBookmarksReturn {
  bookmarks: BookmarkItem[];
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Bookmarks data management hook
 */
export function useBookmarks(): UseBookmarksReturn {
  const { t } = useTranslation();
  // Precise subscription to prevent re-renders from unrelated settings changes
  const widgetSettings = useSettingsStore(selectWidgetSettings);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch bookmarks
   */
  const fetchBookmarks = useCallback(async () => {
    if (!hasPermission) {
      setBookmarks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const items = await getRecentBookmarks(widgetSettings.bookmarksWidget.maxItems);
      setBookmarks(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('bookmarks.fetchError', 'Failed to fetch bookmarks');
      console.error('Bookmarks fetch error:', err);
      setError(message);
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, widgetSettings.bookmarksWidget.maxItems, t]);

  /**
   * Request permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestBookmarksPermission();
      setHasPermission(granted);

      if (granted) {
        // Fetch bookmarks after permission granted
        await fetchBookmarks();
      }

      return granted;
    } catch (err) {
      const message = err instanceof Error ? err.message : t('bookmarks.permissionError', 'Failed to request permission');
      setError(message);
      return false;
    }
  }, [fetchBookmarks, t]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    await fetchBookmarks();
  }, [fetchBookmarks]);

  /**
   * Check permission and fetch bookmarks on mount
   */
  useEffect(() => {
    const checkAndFetch = async () => {
      setIsLoading(true);

      try {
        const permitted = await checkBookmarksPermission();
        setHasPermission(permitted);

        if (permitted) {
          await fetchBookmarks();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to check permission:', err);
        setHasPermission(false);
        setIsLoading(false);
      }
    };

    checkAndFetch();
  }, [fetchBookmarks]);

  /**
   * Listen for bookmark changes
   */
  useEffect(() => {
    if (!hasPermission) return;

    const chromeApi = typeof chrome !== 'undefined' ? chrome : undefined;
    if (!chromeApi?.bookmarks) return;

    const handleCreated = () => {
      fetchBookmarks();
    };

    const handleRemoved = () => {
      fetchBookmarks();
    };

    const handleChanged = () => {
      fetchBookmarks();
    };

    const handleMoved = () => {
      fetchBookmarks();
    };

    chromeApi.bookmarks.onCreated.addListener(handleCreated);
    chromeApi.bookmarks.onRemoved.addListener(handleRemoved);
    chromeApi.bookmarks.onChanged.addListener(handleChanged);
    chromeApi.bookmarks.onMoved.addListener(handleMoved);

    return () => {
      chromeApi.bookmarks.onCreated.removeListener(handleCreated);
      chromeApi.bookmarks.onRemoved.removeListener(handleRemoved);
      chromeApi.bookmarks.onChanged.removeListener(handleChanged);
      chromeApi.bookmarks.onMoved.removeListener(handleMoved);
    };
  }, [hasPermission, fetchBookmarks]);

  return {
    bookmarks,
    hasPermission,
    isLoading,
    error,
    requestPermission,
    refresh,
  };
}
