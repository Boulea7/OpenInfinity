/**
 * Hook for managing weather data
 * Provides weather fetching, caching, and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db, type WeatherCache } from '../services/database';
import { useSettingsStore } from '../stores';
import { getLocation } from '../services/location';
import { weatherManager } from '../services/weather/WeatherManager';
import type { WeatherData } from '../services/weather/types';
import type { LocationData } from '../types';

/**
 * Cache expiration time: 1 hour in milliseconds
 */
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Module-level single-flight lock to prevent concurrent location/API requests
 * across multiple useWeather hook instances.
 */
let weatherFetchInFlight: Promise<void> | null = null;

/**
 * Generate cache key from location coordinates and temperature unit
 * Includes unit to prevent cache mismatches when switching between celsius/fahrenheit
 */
function getCacheKey(latitude: number, longitude: number, unit: 'celsius' | 'fahrenheit'): string {
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

async function getCachedWeather(
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
      await db.weatherCache.delete(cacheKey);
      return null;
    }

    return cached;
  } catch (error) {
    console.error('Failed to get cached weather:', error);
    return null;
  }
}

async function upsertWeatherCache(
  location: LocationData,
  unit: 'celsius' | 'fahrenheit',
  weatherData: WeatherData
): Promise<WeatherCache> {
  const now = weatherData.fetchedAt;
  const cacheKey = getCacheKey(location.latitude, location.longitude, unit);

  const cacheEntry: WeatherCache = {
    id: cacheKey,
    location: {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    },
    current: weatherData.current,
    forecast: weatherData.forecast,
    fetchedAt: now,
    expiresAt: now + CACHE_EXPIRATION_MS,
  };

  await db.weatherCache.put(cacheEntry);
  return cacheEntry;
}

/**
 * Weather hook return interface
 */
export interface UseWeatherReturn {
  weather: WeatherCache | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  forceRefresh: () => Promise<void>; // P0-7: Force refresh bypassing cache
  clearCache: () => Promise<void>;
}

/**
 * Weather data management hook
 * Fetches and caches weather data, provides real-time updates
 */
export function useWeather(): UseWeatherReturn {
  const { weatherSettings } = useSettingsStore();
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const prevUnitRef = useRef<'celsius' | 'fahrenheit'>(weatherSettings.unit);

  // Real-time query for weather cache
  // This will automatically update when cache changes
  const weather = useLiveQuery(async () => {
    try {
      // Get the most recent weather cache entry
      const caches = await db.weatherCache.orderBy('fetchedAt').reverse().limit(1).toArray();
      return caches.length > 0 ? caches[0] : null;
    } catch (err) {
      console.error('Failed to query weather cache:', err);
      return null;
    }
  }, []);

  /**
   * Fetch weather data
   */
  const fetchWeatherData = useCallback(async () => {
    if (weatherFetchInFlight) {
      await weatherFetchInFlight;
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    const task = (async () => {
      isFetchingRef.current = true;
      setError(null);

      try {
        // Get location (manual or auto)
        let location: LocationData;

        // Use != null to allow 0 values for equator/prime meridian
        if (weatherSettings.location.type === 'manual' &&
            weatherSettings.location.latitude != null &&
            weatherSettings.location.longitude != null) {
          // Use manual location from settings
          location = {
            type: 'manual' as const,
            name: weatherSettings.location.name,
            latitude: weatherSettings.location.latitude,
            longitude: weatherSettings.location.longitude,
          };
        } else {
          // Auto-detect location
          location = await getLocation();
        }

        // Use cached data when available, otherwise fetch via WeatherManager
        const cached = await getCachedWeather(location, weatherSettings.unit);

        if (cached) {
          return;
        }

        setIsLoading(true);
        const weatherData = await weatherManager.fetchWeather(
          location.latitude,
          location.longitude,
          weatherSettings.unit,
          i18n.language === 'zh' ? 'zh-CN' : 'en-US'
        );
        await upsertWeatherCache(location, weatherSettings.unit, weatherData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch weather data';
        console.error('Weather fetch error:', err);
        setError(message);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    })();

    weatherFetchInFlight = task;
    try {
      await task;
    } finally {
      weatherFetchInFlight = null;
    }
  }, [weatherSettings]);

  /**
   * Manual refetch
   */
  const refetch = useCallback(async () => {
    await fetchWeatherData();
  }, [fetchWeatherData]);

  /**
   * Clear all weather caches
   */
  const clearCache = useCallback(async () => {
    try {
      await db.weatherCache.clear();
      setError(null);
      // Fetch fresh data after clearing cache
      await fetchWeatherData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear cache';
      setError(message);
    }
  }, [fetchWeatherData]);

  /**
   * Force refresh weather data (ignore cache)
   */
  const forceRefresh = useCallback(async () => {
    if (weatherFetchInFlight) {
      await weatherFetchInFlight;
      return;
    }

    if (isFetchingRef.current) return;

    const task = (async () => {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Get location
        let location: LocationData;

        // Use != null to allow 0 values for equator/prime meridian
        if (weatherSettings.location.type === 'manual' &&
            weatherSettings.location.latitude != null &&
            weatherSettings.location.longitude != null) {
          location = {
            type: 'manual' as const,
            name: weatherSettings.location.name,
            latitude: weatherSettings.location.latitude,
            longitude: weatherSettings.location.longitude,
          };
        } else {
          location = await getLocation();
        }

        // Force fetch (bypass cache)
        const weatherData = await weatherManager.fetchWeather(
          location.latitude,
          location.longitude,
          weatherSettings.unit,
          i18n.language === 'zh' ? 'zh-CN' : 'en-US'
        );
        await upsertWeatherCache(location, weatherSettings.unit, weatherData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to refresh weather data';
        setError(message);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    })();

    weatherFetchInFlight = task;
    try {
      await task;
    } finally {
      weatherFetchInFlight = null;
    }
  }, [weatherSettings]);

  /**
   * Initial fetch and periodic updates
   */
  useEffect(() => {
    // Initial fetch if no weather data
    if (!weather && !isLoading && !error) {
      fetchWeatherData();
    }
  }, [weather, isLoading, error, fetchWeatherData]);

  /**
   * Setup periodic updates
   */
  useEffect(() => {
    const intervalMs = weatherSettings.updateInterval * 60 * 1000; // Convert minutes to ms

    if (intervalMs > 0) {
      updateIntervalRef.current = setInterval(() => {
        fetchWeatherData();
      }, intervalMs);
    }

    // Cleanup
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [weatherSettings.updateInterval, fetchWeatherData]);

  /**
   * Re-fetch when location settings change
   */
  useEffect(() => {
    if (!weather) return;

    // Check if location changed
    const hasManualCoords =
      weatherSettings.location.latitude != null &&
      weatherSettings.location.longitude != null;

    const locationChanged =
      weatherSettings.location.type === 'manual' &&
      hasManualCoords &&
      (weatherSettings.location.latitude !== weather.location.latitude ||
       weatherSettings.location.longitude !== weather.location.longitude);

    if (locationChanged) {
      forceRefresh();
    }
  }, [weatherSettings.location, weather, forceRefresh]);

  /**
   * Re-fetch when temperature unit changes
   */
  useEffect(() => {
    if (!weather) return;

    if (prevUnitRef.current !== weatherSettings.unit) {
      prevUnitRef.current = weatherSettings.unit;
      forceRefresh();
    }
  }, [weatherSettings.unit, weather, forceRefresh]);

  return {
    weather: weather || null,
    isLoading,
    error,
    refetch,
    forceRefresh, // P0-7: Export force refresh
    clearCache,
  };
}
