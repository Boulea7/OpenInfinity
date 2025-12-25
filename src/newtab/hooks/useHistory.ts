/**
 * Hook for managing history with infinite scroll
 * Provides history fetching, pagination, and permission management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkHistoryPermission,
  requestHistoryPermission,
  searchHistoryItems,
  deleteHistoryItem,
  deleteHistoryRange,
} from '../services/history';
import type { HistoryItem } from '../types';

const CHUNK_SIZE_MS = 14 * 24 * 60 * 60 * 1000; // 2 Weeks

export interface UseHistoryReturn {
  historyItems: HistoryItem[];
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  deleteItem: (url: string) => Promise<void>;
  deleteRange: (startTime: number, endTime: number) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  searchHistory: (query: string, rangeMs: number) => Promise<void>;
  isSearching: boolean;
}

export function useHistory(): UseHistoryReturn {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  // We track the "oldestLoadedTime" to load from [Now] back to [Now - 2weeks], then [Now - 2weeks] back to [Now - 4weeks].
  const [oldestLoadedTime, setOldestLoadedTime] = useState(Date.now() - CHUNK_SIZE_MS);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [currentSearchRange, setCurrentSearchRange] = useState(CHUNK_SIZE_MS);

  // Prevent duplicate loads
  const isLoadingRef = useRef(false);

  /**
   * Fetch initial history (or search result)
   */
  const fetchInitial = useCallback(async () => {
    if (!hasPermission) return;

    setIsLoading(true);
    setError(null);
    isLoadingRef.current = true;

    try {
      const now = Date.now();
      let start = now - CHUNK_SIZE_MS;

      if (isSearching) {
        start = now - currentSearchRange;
      }

      // Load standard chunk or search range
      const items = await searchHistoryItems(
        isSearching ? currentSearchQuery : '',
        start,
        now,
        isSearching ? 500 : 200 // Higher limit for search to find relevant items
      );

      setHistoryItems(items);
      setOldestLoadedTime(start);
      // If we got fewer items than requested/expected, maybe we reached the end? 
      // It's hard to know with history API without trying to fetch usage. 
      // For now, assume if we are not searching, we can always try to load more.
      // If result is empty, maybe we are done.
      if (!isSearching && items.length === 0) {
        // Keep hasMore true to allow trying further back? Or maybe false.
        // Let's rely on user scrolling to try again if they want, but typically empty matches end.
        // But a 2 week gap might just be empty.
      }
    } catch (err) {
      console.error('History fetch error:', err);
      setError('Failed to fetch history');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [hasPermission, isSearching, currentSearchQuery, currentSearchRange]);

  /**
   * Load more history (Infinite Scroll)
   */
  const loadMore = useCallback(async () => {
    if (!hasPermission || isSearching || isLoadingRef.current) return;

    isLoadingRef.current = true;
    // Don't set main isLoading to true to avoid full screen spinner, maybe add a "loading more" indicator state if needed
    // But for now we just append.

    try {
      const end = oldestLoadedTime;
      const start = end - CHUNK_SIZE_MS;

      const newItems = await searchHistoryItems('', start, end, 200);

      if (newItems.length > 0) {
        setHistoryItems(prev => {
          // Use url+lastVisitTime as unique key for reliable deduplication
          // (id is randomUUID, unreliable across pagination)
          const uniqueKey = (item: HistoryItem) => `${item.url}:${item.lastVisitTime}`;
          const existingKeys = new Set(prev.map(uniqueKey));
          const uniqueNew = newItems.filter(i => !existingKeys.has(uniqueKey(i)));
          return [...prev, ...uniqueNew];
        });
      } else {
        // If 2 weeks empty, maybe user hasn't browsed. We still move the time back?
        // Yes, otherwise we get stuck.
      }

      setOldestLoadedTime(start);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      isLoadingRef.current = false;
    }
  }, [hasPermission, isSearching, oldestLoadedTime]);

  /**
   * Run a specific search
   */
  const searchHistory = useCallback(async (query: string, rangeMs: number) => {
    // If query is empty, we go back to normal "recent" view
    if (!query.trim()) {
      setIsSearching(false);
      setCurrentSearchQuery('');
      // Reset to default chunk
      setOldestLoadedTime(Date.now() - CHUNK_SIZE_MS);
      return; // The effect will trigger re-fetch because isSearching changes
    }

    setIsSearching(true);
    setCurrentSearchQuery(query);
    setCurrentSearchRange(rangeMs);
    // The effect will trigger re-fetch
  }, []);

  /**
   * Delete item
   */
  const deleteItem = useCallback(async (url: string) => {
    try {
      await deleteHistoryItem(url);
      setHistoryItems(prev => prev.filter(item => item.url !== url));
    } catch (err) {
      console.error('Delete error', err);
    }
  }, []);

  /**
   * Delete range
   */
  const deleteRange = useCallback(async (start: number, end: number) => {
    try {
      await deleteHistoryRange(start, end);
      // Refresh list completely
      await fetchInitial();
    } catch (err) {
      console.error('Delete range error', err);
      throw err;
    }
  }, [fetchInitial]);

  /**
   * Request Permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestHistoryPermission();
      setHasPermission(granted);
      return granted;
    } catch (err) {
      setError('Permission request failed');
      return false;
    }
  }, []);

  /**
   * Check permission on mount
   */
  useEffect(() => {
    checkHistoryPermission().then(setHasPermission);
  }, []);

  /**
   * Fetch when permission granted or search state changes
   */
  useEffect(() => {
    if (hasPermission) {
      fetchInitial();
    }
  }, [hasPermission, isSearching, currentSearchQuery, currentSearchRange]); // Removed fetchInitial from dep to avoid loop, added specific deps

  return {
    historyItems,
    hasPermission,
    isLoading,
    error,
    requestPermission,
    deleteItem,
    deleteRange,
    refresh: fetchInitial,
    loadMore,
    searchHistory,
    isSearching
  };
}
