/**
 * Cache Management Service
 * Provides utilities to clear various caches
 */

import { db } from './database';
import { clearExpiredIconCache } from '../utils/iconCache';
import { clearExpiredGeocodeCache } from './geocoding';
import {
  clearExpiredResourceCache,
  clearResourceCache,
  getResourceCacheStats,
} from './resourceCache';

/**
 * Safely parse JSON from localStorage
 * Returns empty object on parse failure to prevent crashes from corrupted data
 */
function safeJsonParse(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    console.warn('[CacheManager] Failed to parse cached data, treating as empty');
    return {};
  }
}

export interface CacheStats {
  weatherCache: number;
  iconCache: number;
  geocodeCache: number;
  searchEngineIconCache: number;
  resourceCache: {
    count: number;
    totalSize: number;
  };
}

/**
 * Clear weather cache from IndexedDB
 */
export async function clearWeatherCache(): Promise<void> {
  await db.weatherCache.clear();
  console.log('[CacheManager] Weather cache cleared');
}

/**
 * Clear geocode cache from localStorage
 */
export function clearGeocodeCache(): void {
  localStorage.removeItem('geocode-cache-v1');
  console.log('[CacheManager] Geocode cache cleared');
}

/**
 * Clear search engine icon cache from localStorage
 */
export function clearSearchEngineIconCache(): void {
  localStorage.removeItem('engine-icon-cache-v1');
  console.log('[CacheManager] Search engine icon cache cleared');
}

/**
 * Clear all icon-related cache
 */
export async function clearAllIconCaches(): Promise<void> {
  clearSearchEngineIconCache();
  clearGeocodeCache();
  console.log('[CacheManager] All icon caches cleared');
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  await clearWeatherCache();
  await clearResourceCache();
  clearGeocodeCache();
  clearSearchEngineIconCache();
  console.log('[CacheManager] All caches cleared');
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  const weatherCount = await db.weatherCache.count();

  // Use safe JSON parsing to prevent crashes from corrupted localStorage
  const engineIconCache = safeJsonParse(localStorage.getItem('engine-icon-cache-v1'));
  const engineIconCount = Object.keys(engineIconCache).length;

  const geocodeCache = safeJsonParse(localStorage.getItem('geocode-cache-v1'));
  const geocodeCount = Object.keys(geocodeCache).length;

  // Resource cache stats
  const resourceStats = await getResourceCacheStats();

  return {
    weatherCache: weatherCount,
    iconCache: 0, // Reserved for future use
    geocodeCache: geocodeCount,
    searchEngineIconCache: engineIconCount,
    resourceCache: {
      count: resourceStats.count,
      totalSize: resourceStats.totalSize,
    },
  };
}

/**
 * Clear expired caches (maintenance)
 */
export async function clearExpiredCaches(): Promise<void> {
  clearExpiredIconCache();
  clearExpiredGeocodeCache();
  await clearExpiredResourceCache();
  console.log('[CacheManager] Expired caches cleared');
}
