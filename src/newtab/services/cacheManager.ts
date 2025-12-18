/**
 * Cache Management Service
 * Provides utilities to clear various caches
 */

import { db } from './database';
import { clearExpiredIconCache } from '../utils/iconCache';
import { clearExpiredGeocodeCache } from './geocoding';

export interface CacheStats {
  weatherCache: number;
  iconCache: number;
  geocodeCache: number;
  searchEngineIconCache: number;
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
  clearGeocodeCache();
  clearSearchEngineIconCache();
  console.log('[CacheManager] All caches cleared');
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  const weatherCount = await db.weatherCache.count();

  const engineIconCache = localStorage.getItem('engine-icon-cache-v1');
  const engineIconCount = engineIconCache
    ? Object.keys(JSON.parse(engineIconCache) || {}).length
    : 0;

  const geocodeCache = localStorage.getItem('geocode-cache-v1');
  const geocodeCount = geocodeCache
    ? Object.keys(JSON.parse(geocodeCache) || {}).length
    : 0;

  return {
    weatherCache: weatherCount,
    iconCache: 0, // Reserved for future use
    geocodeCache: geocodeCount,
    searchEngineIconCache: engineIconCount,
  };
}

/**
 * Clear expired caches (maintenance)
 */
export function clearExpiredCaches(): void {
  clearExpiredIconCache();
  clearExpiredGeocodeCache();
  console.log('[CacheManager] Expired caches cleared');
}
