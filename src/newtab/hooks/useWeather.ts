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
import { watchLocationPermission } from '../services/locationPermission';
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

    // If cache is missing location name, treat as invalid to force refresh
    // This ensures we don't keep showing "当前位置" when geocoding should have worked
    if (!cached.location?.name?.trim()) {
      console.warn('[useWeather] Cached weather missing location name, forcing refresh:', cacheKey);
      await db.weatherCache.delete(cacheKey);
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

  // Priority for location name:
  // 1. For auto-location: use geocoded name from weatherData (set by WeatherManager)
  // 2. For manual location: use user-provided name
  // 3. Fallback to weatherData.location.name or location.name
  const resolvedName =
    (location.type === 'auto'
      ? weatherData.location.name?.trim()
      : location.name?.trim()) ||
    weatherData.location.name?.trim() ||
    location.name?.trim() ||
    '';

  // Sync back to weatherData for consistency in the call chain
  weatherData.location.name = resolvedName;

  const cacheEntry: WeatherCache = {
    id: cacheKey,
    location: {
      name: resolvedName,
      latitude: location.latitude,
      longitude: location.longitude,
    },
    current: weatherData.current,
    forecast: weatherData.forecast,
    fetchedAt: now,
    expiresAt: now + CACHE_EXPIRATION_MS,
  };

  console.log('[useWeather] Upserting weather cache', {
    cacheKey,
    locationName: resolvedName,
    provider: weatherData.provider,
  });

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
  const prevLangRef = useRef<string>(i18n.language);

  // Real-time query for weather cache
  // Filter by current unit to prevent showing data with wrong temperature unit
  const weather = useLiveQuery(async () => {
    try {
      // Get the most recent weather cache entry matching current unit
      const caches = await db.weatherCache
        .filter((item) => item.id.endsWith(`_${weatherSettings.unit}`))
        .sortBy('fetchedAt');
      return caches.length > 0 ? caches[caches.length - 1] : null;
    } catch (err) {
      console.error('Failed to query weather cache:', err);
      return null;
    }
  }, [weatherSettings.unit]);

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

        // Use cached data when available, but also respect updateInterval setting
        const cached = await getCachedWeather(location, weatherSettings.unit);
        const intervalMs = weatherSettings.updateInterval * 60 * 1000;
        const isStaleByInterval = cached && intervalMs > 0 && (Date.now() - cached.fetchedAt) >= intervalMs;

        if (cached && !isStaleByInterval) {
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
  }, [weatherSettings, i18n.language]);

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
    // If another fetch is running, wait for it then proceed so manual refresh always triggers a real request
    if (weatherFetchInFlight) {
      try {
        await weatherFetchInFlight;
      } catch {
        // Ignore and retry
      }
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
  }, [weatherSettings, i18n.language]);

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

  /**
   * Re-fetch when language changes (weather descriptions are localized)
   */
  useEffect(() => {
    if (!weather) return;

    if (prevLangRef.current !== i18n.language) {
      prevLangRef.current = i18n.language;
      forceRefresh();
    }
  }, [i18n.language, weather, forceRefresh]);

  /**
   * Watch for location permission changes
   * If user initially denied but later granted permission, automatically retry
   */
  useEffect(() => {
    // Only watch if using auto-detect location
    if (weatherSettings.location.type !== 'auto') {
      return;
    }

    const cleanup = watchLocationPermission((state) => {
      console.log('[useWeather] Location permission changed to:', state);
      if (state === 'granted') {
        // Permission granted, fetch weather data
        console.log('[useWeather] Permission granted, fetching weather...');
        forceRefresh();
      }
    });

    return cleanup;
  }, [weatherSettings.location.type, forceRefresh]);

  return {
    weather: weather || null,
    isLoading,
    error,
    refetch,
    forceRefresh, // P0-7: Export force refresh
    clearCache,
  };
}
