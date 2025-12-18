/**
 * Chrome Bookmarks Import Service
 * Handles importing user bookmarks from Chrome into OpenInfinity home page
 */

import { db, generateId, type Icon } from './database';
import { useIconStore, useSettingsStore } from '../stores';
import { syncBookmarks } from '../utils/sync';

export interface ImportProgress {
  total: number;
  processed: number;
  current: string;
  status: 'reading' | 'fetching' | 'saving' | 'complete';
}

export interface ImportResult {
  success: boolean;
  imported: number;
  duplicates: number;
  errors: string[];
  duration: number;
}

/**
 * Import bookmarks from Chrome with progress tracking
 * @param options Import configuration options
 * @param onProgress Callback for progress updates
 * @returns Import result with statistics
 */
export async function importBookmarks(
  options: {
    maxIcons?: number;
    deduplicateByUrl?: boolean;
  } = {},
  onProgress?: (p: ImportProgress) => void
): Promise<ImportResult> {
  const { maxIcons = 500, deduplicateByUrl = true } = options;
  const startTime = Date.now();

  try {
    // Step 1: Check and request bookmarks permission
    const hasPermission = await chrome.permissions.contains({
      permissions: ['bookmarks'],
    });

    if (!hasPermission) {
      const granted = await chrome.permissions.request({
        permissions: ['bookmarks'],
      });
      if (!granted) {
        throw new Error('Bookmark permission denied by user');
      }
    }

    // Step 2: Read bookmark tree
    onProgress?.({
      total: 0,
      processed: 0,
      current: 'Reading bookmarks...',
      status: 'reading',
    });

    const tree = await chrome.bookmarks.getTree();
    const allBookmarks = flattenBookmarks(tree).slice(0, maxIcons);

    // Step 3: Deduplicate URLs (existing + within import set) and compute start position
    const [existingIcons, existingFolders] = await Promise.all([
      db.icons.toArray(),
      db.folders.toArray(),
    ]);

    const existingUrls = new Set(existingIcons.map((icon) => normalizeUrl(icon.url)));
    const columns = useSettingsStore.getState().viewSettings.columns || 6;
    const rootIcons = existingIcons.filter((icon) => !icon.folderId);
    const existingRootItems = [...rootIcons, ...existingFolders];
    const importStartIndex = getImportStartIndex(existingRootItems, columns);

    const seenImportUrls = new Set<string>();
    const toImport: Array<{ url: string; title: string }> = [];

    for (const bookmark of allBookmarks) {
      if (!deduplicateByUrl) {
        toImport.push(bookmark);
        continue;
      }

      const key = normalizeUrl(bookmark.url);
      if (existingUrls.has(key) || seenImportUrls.has(key)) {
        continue;
      }

      seenImportUrls.add(key);
      toImport.push(bookmark);
    }

    const duplicates = deduplicateByUrl ? allBookmarks.length - toImport.length : 0;

    // Step 4: Batch fetch favicons
    const icons: Icon[] = [];

    for (let i = 0; i < toImport.length; i++) {
      const bookmark = toImport[i];

      onProgress?.({
        total: toImport.length,
        processed: i,
        current: bookmark.title || 'Untitled',
        status: 'fetching',
      });

      try {
        const favicon = await getFaviconForUrl(bookmark.url);
        const positionIndex = importStartIndex + icons.length;

        icons.push({
          id: generateId(),
          type: 'icon',
          url: bookmark.url,
          title: bookmark.title || new URL(bookmark.url).hostname,
          icon: favicon,
          position: {
            x: positionIndex % columns,
            y: Math.floor(positionIndex / columns),
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } catch (error) {
        console.warn(`Failed to process bookmark: ${bookmark.url}`, error);
      }

      // Delay every 5 items to avoid blocking UI
      if (i % 5 === 0 && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Step 5: Bulk save to database
    onProgress?.({
      total: icons.length,
      processed: 0,
      current: 'Saving to database...',
      status: 'saving',
    });

    await db.transaction('rw', db.icons, async () => {
      await db.icons.bulkAdd(icons);
    });

    // Step 6: Refresh current tab once, then notify other tabs once
    if (icons.length > 0) {
      await useIconStore.getState().loadIcons();
      syncBookmarks.imported(icons.length);
    }

    onProgress?.({
      total: icons.length,
      processed: icons.length,
      current: 'Import completed',
      status: 'complete',
    });

    return {
      success: true,
      imported: icons.length,
      duplicates,
      errors: [],
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      duplicates: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      duration: Date.now() - startTime,
    };
  }
}

function getImportStartIndex(
  items: Array<{ position: { x: number; y: number } }>,
  columns: number
): number {
  if (items.length === 0) return 0;

  const maxY = Math.max(...items.map((item) => item.position.y));
  const itemsInLastRow = items.filter((item) => item.position.y === maxY);
  const maxX = Math.max(...itemsInLastRow.map((item) => item.position.x));

  if (maxX >= columns - 1) {
    return (maxY + 1) * columns;
  }

  return maxY * columns + (maxX + 1);
}

/**
 * Flatten Chrome bookmark tree into a simple array
 * @param nodes Bookmark tree nodes
 * @returns Array of bookmarks with URL and title
 */
function flattenBookmarks(
  nodes: chrome.bookmarks.BookmarkTreeNode[]
): Array<{ url: string; title: string }> {
  const result: Array<{ url: string; title: string }> = [];

  function traverse(node: chrome.bookmarks.BookmarkTreeNode) {
    // Only add nodes with URLs (exclude folders)
    if (node.url && (node.url.startsWith('http://') || node.url.startsWith('https://'))) {
      result.push({ url: node.url, title: node.title || '' });
    }
    // Recursively traverse children
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return result;
}

/**
 * Normalize URL by removing query params and hash
 * @param url Original URL
 * @returns Normalized URL (origin + pathname)
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
  } catch {
    return url; // Return original if parsing fails
  }
}

/**
 * Fetch favicon for URL with fallback to text icon
 * @param url Website URL
 * @returns Icon object with favicon or text fallback
 */
async function getFaviconForUrl(url: string): Promise<Icon['icon']> {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

    // Use Background Service Worker to fetch (avoids CORS)
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_FAVICON',
      payload: { url: faviconUrl },
    });

    if (response.success && response.data) {
      return {
        type: 'favicon',
        value: response.data, // Data URL (base64)
      };
    }
  } catch (error) {
    console.warn(`Favicon fetch failed for ${url}, using text fallback`);
  }

  // Fallback: Use first 2 letters of domain
  const domain = new URL(url).hostname.replace(/^www\./, '');
  const letters = domain.slice(0, 2).toUpperCase();

  return {
    type: 'text',
    value: letters,
    color: '#FF6B35', // Brand orange color
  };
}
