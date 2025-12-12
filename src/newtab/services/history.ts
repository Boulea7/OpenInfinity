/**
 * History service for Chrome History API integration
 * Handles permission management and history operations
 */

import type { HistoryItem, HistoryTimeRange } from '../types';

/**
 * Safely get Chrome API
 */
function getChrome() {
  return typeof chrome !== 'undefined' ? chrome : undefined;
}

/**
 * Check if history permission is granted
 */
export async function checkHistoryPermission(): Promise<boolean> {
  const chromeApi = getChrome();
  if (!chromeApi?.permissions) {
    return false;
  }

  try {
    const hasPermission = await chromeApi.permissions.contains({
      permissions: ['history'],
    });
    return hasPermission;
  } catch (error) {
    console.error('Failed to check history permission:', error);
    return false;
  }
}

/**
 * Request history permission from user
 */
export async function requestHistoryPermission(): Promise<boolean> {
  const chromeApi = getChrome();
  if (!chromeApi?.permissions) {
    throw new Error('Chrome permissions API not available');
  }

  try {
    const granted = await chromeApi.permissions.request({
      permissions: ['history'],
    });
    return granted;
  } catch (error) {
    console.error('Failed to request history permission:', error);
    throw error;
  }
}

/**
 * Get start time for history search based on time range
 */
function getStartTime(range: HistoryTimeRange): number {
  const now = Date.now();

  switch (range) {
    case 'today': {
      // Start of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.getTime();
    }

    case 'week':
      return now - 7 * 24 * 60 * 60 * 1000;

    case 'month':
      return now - 30 * 24 * 60 * 60 * 1000;

    case 'all':
      return 0;

    default:
      return now - 24 * 60 * 60 * 1000;
  }
}

/**
 * Get history items for a given time range
 *
 * @param timeRange - Time range filter ('today', 'week', 'month', 'all')
 * @param limit - Maximum number of items to return
 * @returns Array of history items sorted by last visit time (newest first)
 */
export async function getHistoryItems(
  timeRange: HistoryTimeRange = 'today',
  limit: number = 10
): Promise<HistoryItem[]> {
  const chromeApi = getChrome();
  if (!chromeApi?.history) {
    throw new Error('Chrome history API not available');
  }

  try {
    const results = await chromeApi.history.search({
      text: '',
      startTime: getStartTime(timeRange),
      maxResults: limit,
    });

    // Convert to HistoryItem format
    const historyItems: HistoryItem[] = results.map((item) => ({
      id: item.id || crypto.randomUUID(),
      title: item.title || 'Untitled',
      url: item.url || '',
      lastVisitTime: item.lastVisitTime || Date.now(),
      visitCount: item.visitCount || 0,
      typedCount: item.typedCount,
    }));

    return historyItems;
  } catch (error) {
    console.error('Failed to get history items:', error);
    throw error;
  }
}

/**
 * Delete a history item by URL
 *
 * @param url - URL of the history item to delete
 */
export async function deleteHistoryItem(url: string): Promise<void> {
  const chromeApi = getChrome();
  if (!chromeApi?.history) {
    throw new Error('Chrome history API not available');
  }

  try {
    await chromeApi.history.deleteUrl({ url });
  } catch (error) {
    console.error('Failed to delete history item:', error);
    throw error;
  }
}

/**
 * Delete all history items in a time range
 *
 * @param timeRange - Time range to delete
 */
export async function deleteHistoryRange(timeRange: HistoryTimeRange): Promise<void> {
  const chromeApi = getChrome();
  if (!chromeApi?.history) {
    throw new Error('Chrome history API not available');
  }

  try {
    const startTime = getStartTime(timeRange);
    const endTime = Date.now();

    await chromeApi.history.deleteRange({
      startTime,
      endTime,
    });
  } catch (error) {
    console.error('Failed to delete history range:', error);
    throw error;
  }
}

/**
 * Validate URL is safe to open
 */
function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Open history item in new or current tab
 *
 * @param url - History item URL to open
 * @param behavior - Open behavior ('new_tab' or 'current_tab')
 */
export function openHistoryItem(url: string, behavior: 'new_tab' | 'current_tab'): void {
  // Validate URL safety
  if (!isSafeUrl(url)) {
    console.warn('Unsafe URL blocked:', url);
    return;
  }

  const chromeApi = getChrome();

  try {
    if (chromeApi?.tabs) {
      if (behavior === 'new_tab') {
        chromeApi.tabs.create({ url, active: true });
      } else {
        chromeApi.tabs.update({ url });
      }
    } else {
      // Fallback to window.open
      window.open(url, behavior === 'new_tab' ? '_blank' : '_self');
    }
  } catch (error) {
    console.error('Failed to open history item:', error);
    // Fallback to window.open
    window.open(url, behavior === 'new_tab' ? '_blank' : '_self');
  }
}

/**
 * Get favicon URL for a given website URL
 */
export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `chrome://favicon/size/16@2x/${urlObj.origin}`;
  } catch {
    return '';
  }
}

/**
 * Format relative time for history items
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`;
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  }
}
