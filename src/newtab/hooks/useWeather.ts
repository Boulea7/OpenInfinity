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
import { hasOrigins, PERMISSION_GROUPS } from '../../shared/permissions';
import type { WeatherData } from '../services/weather/types';
import type { LocationData } from '../types';

const IS_DEV = !!(import.meta as any)?.env?.DEV;
function debugLog(...args: unknown[]) {
  if (!IS_DEV) return;
  // eslint-disable-next-line no-console
  console.debug(...args);
}

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
 * Module-level singleton interval to prevent duplicate polling
 * when multiple useWeather hook instances are mounted.
 */
let sharedIntervalId: ReturnType<typeof setInterval> | null = null;
let sharedIntervalMs = 0;
let activeHookCount = 0;
let sharedFetchCallback: (() => Promise<void>) | null = null;

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

    // Empty location name is acceptable (geocoding may fail due to network issues)
    // We'll display coordinates as fallback in the UI if name is missing

    if (isCacheExpired(cached)) {
      await db.weatherCache.delete(cacheKey);
      return null;
    }

    return cached;
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Failed to get cached weather:', msg);
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
  // 4. Coordinate-based fallback (e.g., "39.90°N, 116.40°E")
  const lat = location.latitude;
  const lon = location.longitude;
  const coordFallback = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;

  const resolvedName =
    (location.type === 'auto'
      ? weatherData.location.name?.trim()
      : location.name?.trim()) ||
    weatherData.location.name?.trim() ||
    location.name?.trim() ||
    coordFallback;

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

  debugLog('[useWeather] Upserting weather cache', {
    cacheKey,
    locationName: resolvedName,
    provider: weatherData.provider,
  });

  await db.weatherCache.put(cacheEntry);

  // Store active cache key for efficient lookup
  await db.settings.put({
    key: 'weather_active_cache_key',
    value: cacheKey
  });

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
  const weatherSettings = useSettingsStore((state) => state.weatherSettings);
  const { i18n, t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true); // Prevent setState after unmount
  const prevUnitRef = useRef<'celsius' | 'fahrenheit'>(weatherSettings.unit);
  const prevLangRef = useRef<string>(i18n.language);

  // Track mount state to prevent setState after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Real-time query for weather cache
  // Use primary key lookup for O(1) performance instead of full table scan
  const weather = useLiveQuery(async () => {
    try {
      // Get active cache key from settings
      const activeCacheSetting = await db.settings.get('weather_active_cache_key');
      if (!activeCacheSetting) return null;

      const cacheKey = activeCacheSetting.value as string;

      // Direct lookup by primary key - O(1) complexity
      const cached = await db.weatherCache.get(cacheKey);

      // Validate cache matches current unit (defensive check)
      if (cached && !cached.id.endsWith(`_${weatherSettings.unit}`)) {
        return null;
      }

      return cached || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Failed to query weather cache:', msg);
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
      if (isMountedRef.current) setError(null);

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
          const autoLocation = await getLocation();
          location = autoLocation;

          // Show one-time notification when using Beijing fallback
          if ('isFallback' in autoLocation && autoLocation.isFallback) {
            const { systemIconSettings, setSystemIconSettings } = useSettingsStore.getState();
            if (!systemIconSettings.locationDeniedPromptShown) {
              // Mark as shown to prevent repeat notifications
              setSystemIconSettings({ locationDeniedPromptShown: true });
              // Set a user-friendly error message instead of throwing
              if (isMountedRef.current) {
                setError(t('weather.locationDeniedUsingBeijing', '定位被拒绝，已使用北京作为默认位置。您可以在设置中手动修改。'));
              }
            }
          }
        }

        // Use cached data when available, but also respect updateInterval setting
        const cached = await getCachedWeather(location, weatherSettings.unit);
        const intervalMs = weatherSettings.updateInterval * 60 * 1000;
        const isStaleByInterval = cached && intervalMs > 0 && (Date.now() - cached.fetchedAt) >= intervalMs;

        if (cached && !isStaleByInterval) {
          return;
        }

        // Network fetch requires optional host permissions (minimal-install mode).
        // Do not request permissions here (no user gesture). Surface an error for UI to handle.
        const hasWeatherOrigins = await hasOrigins(PERMISSION_GROUPS.weather);
        if (!hasWeatherOrigins) {
          // No user gesture here: do not request permissions, and avoid noisy error logs.
          // Surface a stable, actionable message for UI to render.
          if (isMountedRef.current) {
            setError(t('weather.networkPermissionRequired', '需要授权天气网络权限，请点击天气组件进行授权。'));
          }
          return;
        }

        if (isMountedRef.current) setIsLoading(true);
        const weatherData = await weatherManager.fetchWeather(
          location.latitude,
          location.longitude,
          weatherSettings.unit,
          i18n.language === 'zh' ? 'zh-CN' : 'en-US'
        );
        await upsertWeatherCache(location, weatherSettings.unit, weatherData);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('weather.fetchError', 'Failed to fetch weather data');
        console.error('Weather fetch error:', err);
        if (isMountedRef.current) setError(message);
      } finally {
        if (isMountedRef.current) setIsLoading(false);
        isFetchingRef.current = false;
      }
    })();

    weatherFetchInFlight = task;
    try {
      await task;
    } finally {
      weatherFetchInFlight = null;
    }
  }, [weatherSettings, i18n.language, t]);

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
      const message = err instanceof Error ? err.message : t('weather.clearCacheError', 'Failed to clear cache');
      setError(message);
    }
  }, [fetchWeatherData, t]);

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
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

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

        // Do not request permissions here (might not be a direct user gesture).
        // If missing, surface an actionable error message.
        const hasWeatherOrigins = await hasOrigins(PERMISSION_GROUPS.weather);
        if (!hasWeatherOrigins) {
          throw new Error(t('weather.networkPermissionRequired', '需要授权天气网络权限，请点击天气组件进行授权。'));
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
        const message = err instanceof Error ? err.message : t('weather.refreshError', 'Failed to refresh weather data');
        if (isMountedRef.current) setError(message);
      } finally {
        if (isMountedRef.current) setIsLoading(false);
        isFetchingRef.current = false;
      }
    })();

    weatherFetchInFlight = task;
    try {
      await task;
    } finally {
      weatherFetchInFlight = null;
    }
  }, [weatherSettings, i18n.language, t]);

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
   * Setup periodic updates using module-level singleton interval
   * This prevents duplicate polling when multiple components use useWeather
   */
  useEffect(() => {
    const intervalMs = weatherSettings.updateInterval * 60 * 1000; // Convert minutes to ms

    // Increment active hook count
    activeHookCount++;

    // Update shared fetch callback to latest
    sharedFetchCallback = fetchWeatherData;

    // Setup or update shared interval
    const setupInterval = () => {
      if (intervalMs > 0) {
        // Only create interval if none exists or interval changed
        if (!sharedIntervalId || sharedIntervalMs !== intervalMs) {
          if (sharedIntervalId) {
            clearInterval(sharedIntervalId);
          }
          sharedIntervalMs = intervalMs;
          sharedIntervalId = setInterval(() => {
            if (sharedFetchCallback) {
              sharedFetchCallback();
            }
          }, intervalMs);
        }
      } else {
        // Clear interval if disabled
        if (sharedIntervalId) {
          clearInterval(sharedIntervalId);
          sharedIntervalId = null;
          sharedIntervalMs = 0;
        }
      }
    };

    setupInterval();

    // Cleanup
    return () => {
      activeHookCount--;

      // Only clear shared interval when no hooks are active
      if (activeHookCount === 0 && sharedIntervalId) {
        clearInterval(sharedIntervalId);
        sharedIntervalId = null;
        sharedIntervalMs = 0;
        sharedFetchCallback = null;
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
      debugLog('[useWeather] Location permission changed to:', state);
      if (state === 'granted') {
        // Permission granted, fetch weather data
        debugLog('[useWeather] Permission granted, fetching weather...');
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
