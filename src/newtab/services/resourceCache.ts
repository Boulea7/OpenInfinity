/**
 * Resource Cache Service
 *
 * Intelligent caching for external resources (icons, images, etc.)
 * Features:
 * - Offline-first: Cached resources work without network
 * - Smart retry: Failed downloads retry on next load
 * - Throttled: Prevents UI blocking with concurrent limits
 * - Persistent: Uses IndexedDB for large binary data
 */

import { db, type ResourceCacheEntry } from './database';

// Cache configuration
const CACHE_VERSION = 1;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CONCURRENT_DOWNLOADS = 3;
const DOWNLOAD_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 3;

// Track failed resources to avoid hammering
const failedResources = new Map<string, { count: number; lastAttempt: number }>();

// Download queue for throttling
let activeDownloads = 0;
const downloadQueue: Array<() => Promise<void>> = [];

/**
 * Generate a stable hash for URL as cache key
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
 * Process download queue with concurrency limit
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
 * Add download task to throttled queue
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
 * Check if resource should be retried
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
 * Record failed download
 */
function recordFailure(url: string): void {
  const existing = failedResources.get(url);
  failedResources.set(url, {
    count: (existing?.count ?? 0) + 1,
    lastAttempt: Date.now(),
  });
}

/**
 * Cleanup expired failure records to prevent memory leaks
 * Removes entries older than 1 hour
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
 * Fetch resource with timeout
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
 * Convert blob to base64 data URL
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Get cached resource or download and cache it
 * Returns cached data URL if available, otherwise fetches and caches
 */
export async function getCachedResource(
  url: string,
  options?: {
    forceRefresh?: boolean;
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
 * Preload multiple resources in background
 * Non-blocking, best-effort caching
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
 * Clear expired cache entries
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
 * Get cache statistics
 */
export async function getResourceCacheStats(): Promise<{
  count: number;
  totalSize: number;
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
 * Clear all resource cache
 */
export async function clearResourceCache(): Promise<void> {
  await db.resourceCache.clear();
  failedResources.clear();
  console.info('[ResourceCache] All cache cleared');
}

// Periodic cleanup of expired failure records
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredFailures, 10 * 60 * 1000); // Every 10 minutes
}
