/**
 * Bookmarks service for Chrome Bookmarks API integration
 * Handles permission management and bookmark operations
 */

import type { BookmarkItem } from '../types';

/**
 * Safely get Chrome API
 */
function getChrome() {
  return typeof chrome !== 'undefined' ? chrome : undefined;
}

/**
 * Check if bookmarks permission is granted
 */
export async function checkBookmarksPermission(): Promise<boolean> {
  const chromeApi = getChrome();
  if (!chromeApi?.permissions) {
    return false;
  }

  try {
    const hasPermission = await chromeApi.permissions.contains({
      permissions: ['bookmarks'],
    });
    return hasPermission;
  } catch (error) {
    console.error('Failed to check bookmarks permission:', error);
    return false;
  }
}

/**
 * Request bookmarks permission from user
 */
export async function requestBookmarksPermission(): Promise<boolean> {
  const chromeApi = getChrome();
  if (!chromeApi?.permissions) {
    throw new Error('Chrome permissions API not available');
  }

  try {
    const granted = await chromeApi.permissions.request({
      permissions: ['bookmarks'],
    });
    return granted;
  } catch (error) {
    console.error('Failed to request bookmarks permission:', error);
    throw error;
  }
}

/**
 * Flatten bookmark tree into a linear array
 */
function flattenBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[]): BookmarkItem[] {
  const result: BookmarkItem[] = [];

  function traverse(node: chrome.bookmarks.BookmarkTreeNode) {
    // Only add actual bookmarks (not folders)
    if (node.url) {
      result.push({
        id: node.id,
        title: node.title || 'Untitled',
        url: node.url,
        dateAdded: node.dateAdded || Date.now(),
        parentId: node.parentId,
      });
    }

    // Traverse children
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return result;
}

/**
 * Get recent bookmarks
 *
 * @param limit - Maximum number of bookmarks to return
 * @returns Array of recent bookmarks sorted by date added (newest first)
 */
export async function getRecentBookmarks(limit: number = 10): Promise<BookmarkItem[]> {
  const chromeApi = getChrome();
  if (!chromeApi?.bookmarks) {
    throw new Error('Chrome bookmarks API not available');
  }

  try {
    const tree = await chromeApi.bookmarks.getTree();
    const allBookmarks = flattenBookmarks(tree);

    // Sort by dateAdded descending and limit
    const recentBookmarks = allBookmarks
      .sort((a, b) => b.dateAdded - a.dateAdded)
      .slice(0, limit);

    return recentBookmarks;
  } catch (error) {
    console.error('Failed to get bookmarks:', error);
    throw error;
  }
}

/**
 * Get bookmark tree
 */
export async function getBookmarkTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  const chromeApi = getChrome();
  if (!chromeApi?.bookmarks) {
    throw new Error('Chrome bookmarks API not available');
  }

  try {
    const tree = await chromeApi.bookmarks.getTree();
    return tree;
  } catch (error) {
    console.error('Failed to get bookmark tree:', error);
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
 * Open bookmark in new or current tab
 *
 * @param url - Bookmark URL to open
 * @param behavior - Open behavior ('new_tab' or 'current_tab')
 */
export function openBookmark(url: string, behavior: 'new_tab' | 'current_tab'): void {
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
    console.error('Failed to open bookmark:', error);
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
