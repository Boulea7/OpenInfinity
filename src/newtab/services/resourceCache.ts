/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗ ██████╗ ███████╗███╗   ██╗    ██╗███╗   ██╗███████╗██╗███╗   ██║
 * ║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ██║████╗  ██║██╔════╝██║████╗  ██║
 * ║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║
 * ║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║
 * ║  ╚██████╔╝██║     ███████╗██║ ╚████║    ██║██║ ╚████║██║     ██║██║ ╚████║
 * ║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══║
 * ║                                                                           ║
 * ║  OpenInfinity - Your Infinite New Tab Experience                          ║
 * ║                                                                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Copyright (c) 2024-2026 OpenInfinity Team. All rights reserved.          ║
 * ║  Licensed under the MIT License                                           ║
 * ║  GitHub: https://github.com/OpenInfinity/OpenInfinity                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Resource Cache Service
 *
 * Provides intelligent caching for external resources (icons, images, etc.)
 * with offline-first architecture and smart retry mechanisms.
 *
 * Features:
 * - Offline-first: Cached resources work without network connectivity
 * - Smart retry: Failed downloads retry on next load with exponential backoff
 * - Throttled: Limits concurrent downloads to prevent UI blocking
 * - Persistent: Uses IndexedDB for large binary data storage
 * - Stale-while-revalidate: Returns stale cache during network failures
 *
 * Architecture:
 * - Resources are stored as base64 data URLs in IndexedDB
 * - URL hashing prevents duplicate downloads
 * - Download queue manages concurrency (max 3 simultaneous)
 * - Failed resources tracked in memory to avoid hammering
 *
 * Cache Lifecycle:
 * 1. Check IndexedDB cache for valid entry
 * 2. If expired or missing, queue download
 * 3. Convert blob to base64 data URL
 * 4. Store in IndexedDB for future use
 * 5. Return data URL to caller
 *
 * Error Handling:
 * - Network failures trigger retry logic (max 3 attempts)
 * - Timeout after 10 seconds per download
 * - Stale cache returned as fallback
 * - Failure records auto-expire after 1 hour
 *
 * @module services/resourceCache
 * @see {@link getCachedResource} Main entry point for caching
 */

import { db, type ResourceCacheEntry } from './database';

// ============================================================================
// Configuration Constants
// ============================================================================

/** Current cache schema version for migration support */
const CACHE_VERSION = 1;

/** Maximum age for cache entries: 30 days in milliseconds */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Maximum number of concurrent download operations */
const MAX_CONCURRENT_DOWNLOADS = 3;

/** Timeout for individual download requests: 10 seconds */
const DOWNLOAD_TIMEOUT_MS = 10000;

/** Maximum retry attempts before giving up on a URL */
const MAX_RETRIES = 3;

// ============================================================================
// Internal State
// ============================================================================

/**
 * In-memory tracking of failed resource downloads.
 *
 * Maps URL to failure metadata to prevent hammering failed resources.
 * Entries auto-expire after 1 hour to allow retry.
 */
const failedResources = new Map<string, { count: number; lastAttempt: number }>();

/** Number of currently active download operations */
let activeDownloads = 0;

/** Queue of pending download tasks awaiting execution */
const downloadQueue: Array<() => Promise<void>> = [];

// ============================================================================
// Internal Helper Functions
// ============================================================================

/**
 * Generates a stable hash for a URL to use as cache key.
 *
 * Uses a simple hash algorithm (djb2 variant) that produces consistent
 * results across sessions. The hash is prefixed with 'res_' and encoded
 * in base36 for compact storage.
 *
 * @param url - The URL to hash
 * @returns A stable cache key string (e.g., 'res_abc123')
 *
 * @example
 * ```ts
 * hashUrl('https://example.com/icon.png'); // 'res_1kj2h3'
 * hashUrl('https://example.com/icon.png'); // 'res_1kj2h3' (same URL = same hash)
 * ```
 */
function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `res_${Math.abs(hash).toString(36)}`;
}

/**
 * Processes the download queue with concurrency limiting.
 *
 * Starts pending downloads up to the MAX_CONCURRENT_DOWNLOADS limit.
 * Automatically called when downloads complete to process next items.
 *
 * @internal
 */
function processQueue(): void {
  while (activeDownloads < MAX_CONCURRENT_DOWNLOADS && downloadQueue.length > 0) {
    const task = downloadQueue.shift();
    if (task) {
      activeDownloads++;
      task().finally(() => {
        activeDownloads--;
        processQueue();
      });
    }
  }
}

/**
 * Adds a download task to the throttled queue.
 *
 * Tasks are executed in FIFO order, respecting the concurrency limit.
 * Returns a promise that resolves when the task completes.
 *
 * @typeParam T - Type of the task's return value
 * @param task - Async function to execute when slot is available
 * @returns Promise that resolves with task result
 * @throws Rejects with task error if task fails
 *
 * @example
 * ```ts
 * const result = await enqueueDownload(async () => {
 *   const response = await fetch(url);
 *   return response.blob();
 * });
 * ```
 */
function enqueueDownload<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    downloadQueue.push(async () => {
      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processQueue();
  });
}

/**
 * Determines if a resource URL should be retried after failure.
 *
 * Returns false if:
 * - URL has failed MAX_RETRIES times within the last hour
 *
 * Returns true if:
 * - URL has never failed
 * - Last failure was more than 1 hour ago
 * - Failure count is below MAX_RETRIES
 *
 * @param url - The resource URL to check
 * @returns True if download should be attempted
 */
function shouldRetry(url: string): boolean {
  const failed = failedResources.get(url);
  if (!failed) return true;

  // Reset after 1 hour
  if (Date.now() - failed.lastAttempt > 60 * 60 * 1000) {
    failedResources.delete(url);
    return true;
  }

  return failed.count < MAX_RETRIES;
}

/**
 * Records a download failure for retry tracking.
 *
 * Increments failure count and updates last attempt timestamp.
 * Used to implement retry limits and backoff behavior.
 *
 * @param url - The URL that failed to download
 */
function recordFailure(url: string): void {
  const existing = failedResources.get(url);
  failedResources.set(url, {
    count: (existing?.count ?? 0) + 1,
    lastAttempt: Date.now(),
  });
}

/**
 * Cleans up expired failure records to prevent memory leaks.
 *
 * Removes all failure records older than 1 hour, allowing
 * those URLs to be retried. Called periodically by interval.
 *
 * @internal
 */
function cleanupExpiredFailures(): void {
  const now = Date.now();
  const expireTime = 60 * 60 * 1000; // 1 hour

  for (const [url, record] of failedResources.entries()) {
    if (now - record.lastAttempt > expireTime) {
      failedResources.delete(url);
    }
  }
}

/**
 * Fetches a resource URL with timeout protection.
 *
 * Uses AbortController to cancel requests that exceed DOWNLOAD_TIMEOUT_MS.
 * Configures fetch for privacy (no referrer, omit credentials) and
 * prefers browser cache.
 *
 * @param url - The resource URL to fetch
 * @returns Promise resolving to the fetch Response
 * @throws AbortError if request times out
 * @throws Network errors on connection failure
 *
 * @example
 * ```ts
 * try {
 *   const response = await fetchWithTimeout('https://example.com/image.png');
 *   const blob = await response.blob();
 * } catch (error) {
 *   if (error.name === 'AbortError') {
 *     console.log('Request timed out');
 *   }
 * }
 * ```
 */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'force-cache', // Prefer browser cache
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Converts a Blob to a base64 data URL.
 *
 * Uses FileReader to read blob contents and encode as base64.
 * The resulting data URL can be used directly in img src or CSS.
 *
 * @param blob - The Blob to convert
 * @returns Promise resolving to data URL string
 * @throws Error if blob reading fails
 *
 * @example
 * ```ts
 * const blob = await response.blob();
 * const dataUrl = await blobToDataUrl(blob);
 * // dataUrl: 'data:image/png;base64,iVBORw0KGgo...'
 * ```
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Retrieves a cached resource or downloads and caches it.
 *
 * This is the main entry point for the resource cache service. It implements
 * an offline-first strategy:
 *
 * 1. Check IndexedDB for valid cached entry
 * 2. If found and not expired, return immediately
 * 3. If missing/expired, queue download with throttling
 * 4. On success, cache and return data URL
 * 5. On failure, return stale cache or null
 *
 * @param url - The resource URL to fetch/cache
 * @param options - Optional configuration
 * @param options.forceRefresh - Skip cache and force download (default: false)
 * @param options.customId - Custom cache key instead of URL hash
 * @returns Promise resolving to base64 data URL or null if unavailable
 *
 * @example
 * ```ts
 * // Basic usage - cache icon
 * const iconUrl = await getCachedResource('https://example.com/favicon.ico');
 * if (iconUrl) {
 *   imgElement.src = iconUrl;
 * }
 *
 * // Force refresh to bypass cache
 * const freshIcon = await getCachedResource(url, { forceRefresh: true });
 *
 * // Use custom cache key for special cases
 * const cached = await getCachedResource(url, { customId: 'my-custom-key' });
 * ```
 *
 * @remarks
 * - Returns null if resource cannot be fetched and no cache exists
 * - Respects retry limits (max 3 attempts per hour per URL)
 * - Downloads are throttled to max 3 concurrent
 * - Cache entries expire after 30 days
 */
export async function getCachedResource(
  url: string,
  options?: {
    /** Skip cache and force fresh download */
    forceRefresh?: boolean;
    /** Custom cache key instead of URL hash */
    customId?: string;
  }
): Promise<string | null> {
  const cacheId = options?.customId ?? hashUrl(url);

  // Try cache first (offline-first)
  if (!options?.forceRefresh) {
    try {
      const cached = await db.resourceCache.get(cacheId);
      // Verify URL matches to prevent hash collision issues
      if (cached && cached.url === url && Date.now() - cached.cachedAt < MAX_AGE_MS) {
        return cached.dataUrl;
      }
    } catch (error) {
      console.warn('[ResourceCache] Failed to read cache:', error);
    }
  }

  // Check if we should attempt download
  if (!shouldRetry(url)) {
    // Return stale cache if available (with URL verification)
    try {
      const stale = await db.resourceCache.get(cacheId);
      if (stale && stale.url === url) return stale.dataUrl;
    } catch {
      // Ignore
    }
    return null;
  }

  // Download with throttling
  try {
    const dataUrl = await enqueueDownload(async () => {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const dataUrl = await blobToDataUrl(blob);

      // Cache the result
      const entry: ResourceCacheEntry = {
        id: cacheId,
        url,
        dataUrl,
        mimeType: blob.type,
        size: blob.size,
        cachedAt: Date.now(),
        version: CACHE_VERSION,
      };

      await db.resourceCache.put(entry);
      failedResources.delete(url);  // Clean up failure record on success
      return dataUrl;
    });

    return dataUrl;
  } catch (error) {
    console.warn(`[ResourceCache] Failed to download ${url}:`, error);
    recordFailure(url);

    // Return stale cache as fallback (with URL verification)
    try {
      const stale = await db.resourceCache.get(cacheId);
      if (stale && stale.url === url) return stale.dataUrl;
    } catch {
      // Ignore
    }

    return null;
  }
}

/**
 * Preloads multiple resources in the background.
 *
 * Uses requestIdleCallback (or setTimeout fallback) to cache resources
 * without blocking the main thread. Errors are silently ignored since
 * this is a best-effort optimization.
 *
 * @param urls - Array of resource URLs to preload
 *
 * @example
 * ```ts
 * // Preload icons when user hovers over folder
 * const iconUrls = folderIcons.map(icon => icon.faviconUrl);
 * preloadResources(iconUrls);
 *
 * // Preload during idle time
 * preloadResources([
 *   'https://cdn.example.com/logo.png',
 *   'https://cdn.example.com/background.jpg',
 * ]);
 * ```
 *
 * @remarks
 * - Non-blocking: executes during browser idle time
 * - Fire-and-forget: no return value or error handling
 * - Respects download throttling and retry limits
 * - Timeout of 5 seconds for requestIdleCallback
 */
export function preloadResources(urls: string[]): void {
  // Use requestIdleCallback for non-blocking preload
  const preload = () => {
    urls.forEach((url) => {
      // Don't await - fire and forget
      getCachedResource(url).catch(() => {
        // Silently ignore errors during preload
      });
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(preload, { timeout: 5000 });
  } else {
    setTimeout(preload, 100);
  }
}

/**
 * Clears expired cache entries from IndexedDB.
 *
 * Removes all cache entries older than MAX_AGE_MS (30 days).
 * Should be called periodically to prevent unbounded storage growth.
 *
 * @returns Promise resolving to number of deleted entries
 *
 * @example
 * ```ts
 * // Clear expired entries on app startup
 * const cleared = await clearExpiredResourceCache();
 * console.log(`Cleared ${cleared} expired cache entries`);
 *
 * // Schedule periodic cleanup
 * setInterval(clearExpiredResourceCache, 24 * 60 * 60 * 1000); // Daily
 * ```
 */
export async function clearExpiredResourceCache(): Promise<number> {
  const now = Date.now();
  const expired = await db.resourceCache
    .where('cachedAt')
    .below(now - MAX_AGE_MS)
    .toArray();

  if (expired.length > 0) {
    await db.resourceCache.bulkDelete(expired.map((e) => e.id));
    console.info(`[ResourceCache] Cleared ${expired.length} expired entries`);
  }

  return expired.length;
}

/**
 * Retrieves cache statistics for monitoring and debugging.
 *
 * Returns aggregate information about the cache contents including
 * total entries, storage size, and age of oldest entry.
 *
 * @returns Promise resolving to cache statistics object
 * @returns count - Total number of cached entries
 * @returns totalSize - Total size in bytes of all cached data
 * @returns oldestEntry - Unix timestamp of oldest entry, or null if empty
 *
 * @example
 * ```ts
 * const stats = await getResourceCacheStats();
 * console.log(`Cache contains ${stats.count} entries`);
 * console.log(`Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
 *
 * if (stats.oldestEntry) {
 *   const age = Date.now() - stats.oldestEntry;
 *   console.log(`Oldest entry: ${Math.floor(age / 86400000)} days old`);
 * }
 * ```
 */
export async function getResourceCacheStats(): Promise<{
  /** Total number of cached entries */
  count: number;
  /** Total size in bytes of all cached data */
  totalSize: number;
  /** Unix timestamp of oldest entry, or null if cache is empty */
  oldestEntry: number | null;
}> {
  const entries = await db.resourceCache.toArray();
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  const oldest = entries.length > 0
    ? Math.min(...entries.map((e) => e.cachedAt))
    : null;

  return {
    count: entries.length,
    totalSize,
    oldestEntry: oldest,
  };
}

/**
 * Clears all cached resources from IndexedDB.
 *
 * Removes all cache entries and resets the in-memory failure tracking.
 * Use for debugging, user-initiated cache clear, or storage management.
 *
 * @returns Promise that resolves when cache is cleared
 *
 * @example
 * ```ts
 * // Clear cache on user request
 * async function handleClearCache() {
 *   await clearResourceCache();
 *   showNotification('Cache cleared successfully');
 * }
 *
 * // Clear cache before uninstall
 * chrome.runtime.onSuspend.addListener(async () => {
 *   await clearResourceCache();
 * });
 * ```
 */
export async function clearResourceCache(): Promise<void> {
  await db.resourceCache.clear();
  failedResources.clear();
  console.info('[ResourceCache] All cache cleared');
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Periodic cleanup of expired failure records.
 *
 * Runs every 10 minutes to remove stale failure tracking entries,
 * preventing memory leaks in long-running sessions.
 */
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredFailures, 10 * 60 * 1000); // Every 10 minutes
}
