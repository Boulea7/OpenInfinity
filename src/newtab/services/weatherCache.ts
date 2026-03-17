/**
 * Weather Cache Service
 *
 * Manages caching of weather data to minimize API calls and provide
 * offline-first weather display. Cache entries expire after 1 hour.
 *
 * Features:
 * - Automatic cache expiration (1 hour TTL)
 * - Location-based cache keys with coordinate rounding
 * - Temperature unit awareness (separate caches for Celsius/Fahrenheit)
 * - Graceful error handling with fallbacks
 *
 * Cache Key Format:
 * - Format: "{lat}_{lon}_{unit}" (e.g., "39.90_116.40_celsius")
 * - Coordinates rounded to 2 decimal places (~1km precision)
 * - Unit suffix prevents cache mismatches when switching units
 *
 * Usage Pattern:
 * 1. Call getWeatherWithCache() for automatic cache management
 * 2. Returns cached data if valid, otherwise fetches fresh data
 * 3. Periodically call clearExpiredCaches() for cleanup
 *
 * @module services/weatherCache
 * @see {@link ./weather} Weather API service
 * @see {@link ./database} WeatherCache type definition
 */

import { db, type WeatherCache } from './database';
import type { LocationData } from '../types';
import { fetchWeather } from './weather';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Cache expiration time: 1 hour in milliseconds.
 *
 * Weather data is considered stale after this duration and will be
 * automatically refreshed on next request.
 */
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Converts an unknown error to a readable string.
 *
 * Handles various error types including Error instances, DOMExceptions,
 * plain objects, and primitives.
 *
 * @param error - The error to convert
 * @returns Human-readable error message
 * @internal
 */
function toErrorString(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Generates a cache key from location coordinates and temperature unit.
 *
 * Coordinates are rounded to 2 decimal places (~1km precision) to group
 * nearby locations together and reduce duplicate cache entries.
 *
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param unit - Temperature unit for cache separation
 * @returns Cache key string (e.g., "39.90_116.40_celsius")
 * @internal
 */
function getCacheKey(latitude: number, longitude: number, unit: 'celsius' | 'fahrenheit'): string {
  // Round coordinates to 2 decimal places for cache key
  // This groups nearby locations together
  const lat = latitude.toFixed(2);
  const lon = longitude.toFixed(2);
  return `${lat}_${lon}_${unit}`;
}

/**
 * Checks if a cache entry has expired.
 *
 * @param cache - The cache entry to check
 * @returns True if cache has expired and should be refreshed
 * @internal
 */
function isCacheExpired(cache: WeatherCache): boolean {
  return Date.now() > cache.expiresAt;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Retrieves cached weather data for a location.
 *
 * Checks IndexedDB for a valid (non-expired) cache entry matching the
 * location and temperature unit. Automatically deletes expired entries.
 *
 * @param location - Location data with coordinates and name
 * @param unit - Temperature unit ('celsius' or 'fahrenheit')
 * @returns Promise resolving to cached weather data or null if not found/expired
 *
 * @example
 * ```ts
 * const location = { name: 'Beijing', latitude: 39.90, longitude: 116.40 };
 * const cached = await getCachedWeather(location, 'celsius');
 *
 * if (cached) {
 *   console.log(`Cached temp: ${cached.current.temperature}C`);
 *   console.log(`Fetched at: ${new Date(cached.fetchedAt)}`);
 * } else {
 *   console.log('No valid cache, need to fetch fresh data');
 * }
 * ```
 */
export async function getCachedWeather(
  location: LocationData,
  unit: 'celsius' | 'fahrenheit'
): Promise<WeatherCache | null> {
  try {
    const cacheKey = getCacheKey(location.latitude, location.longitude, unit);
    const cached = await db.weatherCache.get(cacheKey);

    if (!cached) {
      return null;
    }

    if (isCacheExpired(cached)) {
      // Delete expired cache
      await db.weatherCache.delete(cacheKey);
      return null;
    }

    return cached;
  } catch (error) {
    console.error('Failed to get cached weather:', toErrorString(error));
    return null;
  }
}

/**
 * Fetches fresh weather data and stores it in cache.
 *
 * Always fetches from the API regardless of existing cache. Use this
 * when you need to force a refresh.
 *
 * @param location - Location data with coordinates and name
 * @param unit - Temperature unit (default: 'celsius')
 * @returns Promise resolving to fresh weather data with cache metadata
 *
 * @throws {Error} When API fetch fails (network error, timeout, invalid response)
 *
 * @example
 * ```ts
 * try {
 *   const weather = await fetchAndCacheWeather(location, 'celsius');
 *   console.log(`Fresh data: ${weather.current.temperature}C`);
 *   console.log(`Expires at: ${new Date(weather.expiresAt)}`);
 * } catch (error) {
 *   console.error('Failed to fetch weather:', error);
 * }
 * ```
 */
export async function fetchAndCacheWeather(
  location: LocationData,
  unit: 'celsius' | 'fahrenheit' = 'celsius'
): Promise<WeatherCache> {
  try {
    // Fetch weather from API
    const weatherData = await fetchWeather(location.latitude, location.longitude, unit);

    // Update location name
    weatherData.location.name = location.name;

    // Create cache entry
    const now = Date.now();
    const cacheKey = getCacheKey(location.latitude, location.longitude, unit);

    const cacheEntry: WeatherCache = {
      id: cacheKey,
      ...weatherData,
      fetchedAt: now,
      expiresAt: now + CACHE_EXPIRATION_MS,
    };

    // Save to database
    await db.weatherCache.put(cacheEntry);

    return cacheEntry;
  } catch (error) {
    console.error('Failed to fetch and cache weather:', toErrorString(error));
    throw error;
  }
}

/**
 * Gets weather data with automatic cache management.
 *
 * This is the primary entry point for weather data. It implements a
 * cache-first strategy:
 * 1. Check for valid cached data
 * 2. If found, return immediately
 * 3. If not found or expired, fetch fresh data and cache it
 *
 * @param location - Location data with coordinates and name
 * @param unit - Temperature unit (default: 'celsius')
 * @returns Promise resolving to weather data (cached or fresh)
 *
 * @throws {Error} When API fetch fails and no cache is available
 *
 * @example
 * ```ts
 * // Recommended usage - automatic cache handling
 * const weather = await getWeatherWithCache(location, 'celsius');
 *
 * // Display current conditions
 * console.log(`Temperature: ${weather.current.temperature}C`);
 * console.log(`Condition: ${weather.current.condition}`);
 * console.log(`Feels like: ${weather.current.feelsLike}C`);
 *
 * // Display forecast
 * weather.forecast.forEach(day => {
 *   console.log(`${day.date}: ${day.low}-${day.high}C, ${day.condition}`);
 * });
 * ```
 */
export async function getWeatherWithCache(
  location: LocationData,
  unit: 'celsius' | 'fahrenheit' = 'celsius'
): Promise<WeatherCache> {
  // Try to get cached data first
  const cached = await getCachedWeather(location, unit);

  if (cached) {
    return cached;
  }

  // No valid cache, fetch fresh data
  return fetchAndCacheWeather(location, unit);
}

/**
 * Clears all expired weather cache entries.
 *
 * Should be called periodically (e.g., on app startup or via interval)
 * to prevent unbounded storage growth from stale entries.
 *
 * @returns Promise that resolves when cleanup is complete
 *
 * @example
 * ```ts
 * // Clear expired caches on app startup
 * await clearExpiredCaches();
 *
 * // Or schedule periodic cleanup
 * setInterval(clearExpiredCaches, 60 * 60 * 1000); // Every hour
 * ```
 */
export async function clearExpiredCaches(): Promise<void> {
  try {
    const now = Date.now();
    const allCaches = await db.weatherCache.toArray();

    const expiredKeys = allCaches
      .filter((cache) => cache.expiresAt < now)
      .map((cache) => cache.id);

    if (expiredKeys.length > 0) {
      await db.weatherCache.bulkDelete(expiredKeys);
    }
  } catch (error) {
    console.error('Failed to clear expired caches:', toErrorString(error));
  }
}

/**
 * Clears all weather cache entries.
 *
 * Use for debugging, user-initiated refresh, or when changing
 * weather data sources.
 *
 * @returns Promise that resolves when all caches are cleared
 * @throws {Error} When database operation fails
 *
 * @example
 * ```ts
 * // Clear all caches (e.g., from settings page)
 * async function handleForceRefresh() {
 *   await clearAllCaches();
 *   const freshWeather = await fetchAndCacheWeather(location, unit);
 *   updateUI(freshWeather);
 * }
 * ```
 */
export async function clearAllCaches(): Promise<void> {
  try {
    await db.weatherCache.clear();
  } catch (error) {
    console.error('Failed to clear all caches:', toErrorString(error));
    throw error;
  }
}

/**
 * Retrieves cache statistics for monitoring and debugging.
 *
 * Returns counts of total, expired, and valid cache entries.
 *
 * @returns Promise resolving to cache statistics
 * @returns total - Total number of cache entries
 * @returns expired - Number of expired entries awaiting cleanup
 * @returns valid - Number of currently valid entries
 *
 * @example
 * ```ts
 * const stats = await getCacheStats();
 * console.log(`Total entries: ${stats.total}`);
 * console.log(`Valid entries: ${stats.valid}`);
 * console.log(`Expired entries: ${stats.expired}`);
 *
 * // Check if cleanup is needed
 * if (stats.expired > 10) {
 *   await clearExpiredCaches();
 * }
 * ```
 */
export async function getCacheStats(): Promise<{
  /** Total number of cache entries */
  total: number;
  /** Number of expired entries awaiting cleanup */
  expired: number;
  /** Number of currently valid entries */
  valid: number;
}> {
  try {
    const now = Date.now();
    const allCaches = await db.weatherCache.toArray();

    const expired = allCaches.filter((cache) => cache.expiresAt < now).length;
    const valid = allCaches.length - expired;

    return {
      total: allCaches.length,
      expired,
      valid,
    };
  } catch (error) {
    console.error('Failed to get cache stats:', toErrorString(error));
    return { total: 0, expired: 0, valid: 0 };
  }
}
