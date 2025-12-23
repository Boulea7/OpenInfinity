/**
 * Weather cache management service
 * Handles caching of weather data to minimize API calls
 * Cache expires after 1 hour
 */

import { db, type WeatherCache } from './database';
import type { LocationData } from '../types';
import { fetchWeather } from './weather';

/**
 * Cache expiration time: 1 hour in milliseconds
 */
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Convert error to readable string (handles DOMException, objects, etc.)
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
 * Generate cache key from location coordinates and temperature unit
 * Includes unit to prevent cache mismatches when switching between celsius/fahrenheit
 */
function getCacheKey(latitude: number, longitude: number, unit: 'celsius' | 'fahrenheit'): string {
  // Round coordinates to 2 decimal places for cache key
  // This groups nearby locations together
  const lat = latitude.toFixed(2);
  const lon = longitude.toFixed(2);
  return `${lat}_${lon}_${unit}`;
}

/**
 * Check if cache entry is expired
 */
function isCacheExpired(cache: WeatherCache): boolean {
  return Date.now() > cache.expiresAt;
}

/**
 * Get cached weather data for a location
 * Returns null if no valid cache exists
 *
 * @param location - Location to get weather for
 * @param unit - Temperature unit
 * @returns Cached weather data or null
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
 * Fetch fresh weather data and save to cache
 *
 * @param location - Location to fetch weather for
 * @param unit - Temperature unit
 * @returns Fresh weather data
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
 * Get weather data with caching
 * Returns cached data if available and not expired, otherwise fetches fresh data
 *
 * @param location - Location to get weather for
 * @param unit - Temperature unit
 * @returns Weather data (cached or fresh)
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
 * Clear expired weather caches
 * Should be called periodically to clean up old data
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
 * Clear all weather caches
 * Useful for debugging or force refresh
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
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  total: number;
  expired: number;
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
