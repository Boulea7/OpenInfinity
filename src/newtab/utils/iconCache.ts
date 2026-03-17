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
 * Icon Cache Utility
 *
 * This module provides caching functionality for search engine icons in localStorage.
 * It enables instant icon loading by converting external URLs to base64 data URLs
 * and storing them locally with automatic expiration.
 *
 * Key Features:
 * - LocalStorage-based caching for persistence across sessions
 * - Automatic cache expiration (30 days)
 * - CORS-bypass via background service worker
 * - Permission-aware fetching (respects host permission grants)
 * - Batch preloading for multiple engines
 *
 * Architecture:
 * - Cache entries stored as JSON in localStorage
 * - Icons fetched via background service worker to avoid CORS
 * - Graceful fallback to original URL on cache miss or error
 *
 * Cache Strategy:
 * 1. Check localStorage for cached entry
 * 2. Validate entry exists and is not expired
 * 3. On miss/expiry: fetch via background, convert to base64, cache
 * 4. Return data URL or fallback to original URL on error
 *
 * @module utils/iconCache
 */

import { hasOrigins, PERMISSION_GROUPS } from '../../shared/permissions';

// ============================================================================
// Constants
// ============================================================================

/**
 * Cache version identifier.
 * Increment this when cache structure changes to invalidate old entries.
 */
const CACHE_VERSION = 'v1';

/**
 * LocalStorage key for the icon cache.
 * Includes version to allow cache invalidation on format changes.
 */
const CACHE_KEY = `engine-icon-cache-${CACHE_VERSION}`;

/**
 * Maximum cache entry age in milliseconds (30 days).
 * Entries older than this are considered expired and will be refetched.
 */
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Structure of a single icon cache entry.
 *
 * @property {string} dataUrl - Base64-encoded data URL of the icon image
 * @property {number} cachedAt - Unix timestamp when the entry was cached
 *
 * @example
 * ```ts
 * const entry: IconCacheEntry = {
 *   dataUrl: 'data:image/png;base64,iVBORw0KGgo...',
 *   cachedAt: 1704067200000
 * };
 * ```
 */
export interface IconCacheEntry {
  /** Base64-encoded data URL of the icon */
  dataUrl: string;
  /** Unix timestamp when the icon was cached */
  cachedAt: number;
}

// ============================================================================
// Internal Functions - Cache Operations
// ============================================================================

/**
 * Safely parses a JSON string with a fallback value.
 *
 * Handles null input and JSON parse errors gracefully by returning
 * the provided fallback value instead of throwing.
 *
 * @template T - The expected type of the parsed result
 * @param {string | null} raw - The raw JSON string to parse, or null
 * @param {T} fallback - The value to return if parsing fails or input is null
 * @returns {T} The parsed value or fallback
 *
 * @example
 * ```ts
 * const data = safeJsonParse<{ name: string }>(rawJson, { name: 'default' });
 * ```
 */
function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Reads the icon cache from localStorage.
 *
 * Safely parses the cached JSON data, returning an empty object
 * if the cache doesn't exist or is corrupted.
 *
 * @returns {Record<string, IconCacheEntry>} The icon cache map (engineId -> entry)
 *
 * @example
 * ```ts
 * const cache = readIconCache();
 * const googleIcon = cache['google']?.dataUrl;
 * ```
 */
function readIconCache(): Record<string, IconCacheEntry> {
  return safeJsonParse<Record<string, IconCacheEntry>>(localStorage.getItem(CACHE_KEY), {});
}

/**
 * Fetches an image URL and converts it to a base64 data URL.
 *
 * Uses the background service worker to perform the fetch, bypassing
 * CORS restrictions that would prevent direct fetching from content scripts.
 *
 * @param {string} url - The image URL to fetch
 * @returns {Promise<string>} A promise resolving to the base64 data URL
 * @throws {Error} If the background fetch fails or returns no data
 *
 * @example
 * ```ts
 * const dataUrl = await fetchAndConvertToBase64('https://google.com/favicon.ico');
 * // Result: 'data:image/png;base64,iVBORw0KGgo...'
 * ```
 */
async function fetchAndConvertToBase64(url: string): Promise<string> {
  try {
    // Use background service worker to fetch (avoids CORS restrictions)
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_FAVICON',
      payload: { url },
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch icon');
  } catch (error) {
    console.error('Failed to fetch icon via background:', error);
    throw error;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Gets a cached engine icon or fetches and caches it.
 *
 * This is the primary function for retrieving search engine icons.
 * It implements a cache-first strategy with automatic fallback:
 *
 * 1. Check if user has granted favicon permissions
 * 2. Look up cached entry by engine ID
 * 3. Validate cache entry (exists, has valid data, not expired)
 * 4. On cache miss: fetch icon, convert to base64, cache, return
 * 5. On error: return original URL as fallback
 *
 * @description Retrieves a cached engine icon or fetches and caches it
 * @param {string} engineId - Unique identifier for the search engine (used as cache key)
 * @param {string} iconUrl - The original URL of the engine's icon
 * @returns {Promise<string>} A promise resolving to the icon URL (data URL if cached, original URL as fallback)
 *
 * @example
 * ```ts
 * // In a React component
 * const [iconSrc, setIconSrc] = useState<string>(defaultIconUrl);
 *
 * useEffect(() => {
 *   getCachedEngineIcon('google', 'https://www.google.com/favicon.ico')
 *     .then(setIconSrc);
 * }, []);
 *
 * return <img src={iconSrc} alt="Search engine icon" />;
 * ```
 */
export async function getCachedEngineIcon(
  engineId: string,
  iconUrl: string
): Promise<string> {
  // If the user hasn't granted host permissions, skip background fetching
  // and just use the URL. This avoids noisy errors in "minimal permissions
  // at install" mode.
  const permitted = await hasOrigins(PERMISSION_GROUPS.favicon);
  if (!permitted) {
    return iconUrl;
  }

  const cache = readIconCache();
  const entry = cache[engineId];

  // Cache hit: validate entry structure and check expiration
  if (
    entry &&
    typeof entry.dataUrl === 'string' &&
    typeof entry.cachedAt === 'number' &&
    Date.now() - entry.cachedAt < MAX_AGE
  ) {
    return entry.dataUrl;
  }

  // Cache miss or expired - fetch and cache
  try {
    const dataUrl = await fetchAndConvertToBase64(iconUrl);

    // Update cache with new entry
    cache[engineId] = {
      dataUrl,
      cachedAt: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    return dataUrl;
  } catch (error) {
    console.warn(`Icon cache miss for ${engineId}:`, error);
    // Graceful fallback to original URL on any error
    return iconUrl;
  }
}

/**
 * Clears expired entries from the icon cache.
 *
 * Iterates through all cache entries and removes those that are either
 * malformed (missing cachedAt) or older than MAX_AGE (30 days).
 * Call this periodically to prevent unbounded cache growth.
 *
 * @description Removes expired or invalid entries from the icon cache
 * @returns {void}
 *
 * @example
 * ```ts
 * // Run on app startup to clean stale entries
 * useEffect(() => {
 *   clearExpiredIconCache();
 * }, []);
 *
 * // Or schedule periodic cleanup
 * setInterval(() => {
 *   clearExpiredIconCache();
 * }, 24 * 60 * 60 * 1000); // Daily
 * ```
 */
export function clearExpiredIconCache(): void {
  const cache = readIconCache();
  const now = Date.now();

  // Remove entries that are expired or malformed
  Object.keys(cache).forEach((key) => {
    const entry = cache[key];
    if (!entry || typeof entry.cachedAt !== 'number' || now - entry.cachedAt > MAX_AGE) {
      delete cache[key];
    }
  });

  // Write cleaned cache back to localStorage
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/**
 * Preloads icons for multiple search engines in parallel.
 *
 * Fetches and caches icons for all provided engines concurrently.
 * Returns a map of engine IDs to their cached data URLs for immediate use.
 * Engines without icons are skipped.
 *
 * @description Batch preloads icons for multiple search engines
 * @param {Array<{ id: string; icon?: string }>} engines - Array of engine objects with id and optional icon URL
 * @returns {Promise<Record<string, string>>} A promise resolving to a map of engineId -> dataUrl
 *
 * @example
 * ```ts
 * const engines = [
 *   { id: 'google', icon: 'https://www.google.com/favicon.ico' },
 *   { id: 'bing', icon: 'https://www.bing.com/favicon.ico' },
 *   { id: 'custom' }, // No icon - will be skipped
 * ];
 *
 * const iconCache = await preloadEngineIcons(engines);
 * // Result: { google: 'data:image/...', bing: 'data:image/...' }
 *
 * // Use in component
 * return (
 *   <div>
 *     {engines.map(engine => (
 *       <img key={engine.id} src={iconCache[engine.id]} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export async function preloadEngineIcons(
  engines: Array<{ id: string; icon?: string }>
): Promise<Record<string, string>> {
  const cache: Record<string, string> = {};

  // Fetch all icons in parallel for performance
  await Promise.all(
    engines.map(async (engine) => {
      // Skip engines without icons
      if (engine.icon) {
        const dataUrl = await getCachedEngineIcon(engine.id, engine.icon);
        cache[engine.id] = dataUrl;
      }
    })
  );

  return cache;
}
