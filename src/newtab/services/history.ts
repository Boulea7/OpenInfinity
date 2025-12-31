/**
 * History service for Chrome History API integration
 * Handles permission management and history operations
 */

import type { HistoryItem } from '../types';
import { formatRelativeTime as formatRelativeTimeUtil } from '../utils';

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
 * Search history items with precise time control
 *
 * @param query - Text to search for
 * @param startTime - Start time (epoch ms) - required for efficient paging
 * @param endTime - End time (epoch ms) - optional, defaults to now
 * @param maxResults - Maximum number of items to return
 * @returns Array of history items sorted by last visit time (newest first)
 */
export async function searchHistoryItems(
  query: string = '',
  startTime: number,
  endTime?: number,
  maxResults: number = 100
): Promise<HistoryItem[]> {
  const chromeApi = getChrome();
  if (!chromeApi?.history) {
    throw new Error('Chrome history API not available');
  }

  try {
    // Note: chrome.history.search sorts by lastVisitTime descending automatically
    const results = await chromeApi.history.search({
      text: query,
      startTime: startTime,
      endTime: endTime || Date.now(),
      maxResults: maxResults,
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
 * Delete history items in a specific time range
 *
 * @param startTime - Start time in ms
 * @param endTime - End time in ms
 */
export async function deleteHistoryRange(startTime: number, endTime: number): Promise<void> {
  const chromeApi = getChrome();
  if (!chromeApi?.history) {
    throw new Error('Chrome history API not available');
  }

  try {
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
  return formatRelativeTimeUtil(timestamp);
}
