/**
 * Hook for managing weather data
 * Provides weather fetching, caching, and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WeatherCache } from '../services/database';
import { useSettingsStore } from '../stores';
import { getLocation } from '../services/location';
import { getWeatherWithCache, clearAllCaches, fetchAndCacheWeather } from '../services/weatherCache';

/**
 * Weather hook return interface
 */
export interface UseWeatherReturn {
  weather: WeatherCache | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => Promise<void>;
}

/**
 * Weather data management hook
 * Fetches and caches weather data, provides real-time updates
 */
export function useWeather(): UseWeatherReturn {
  const { weatherSettings } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval>>();

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
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('Weather fetch already in progress, skipping...');
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Get location (manual or auto)
      let location;

      if (weatherSettings.location.type === 'manual' &&
          weatherSettings.location.latitude &&
          weatherSettings.location.longitude) {
        // Use manual location from settings
        location = {
          type: 'manual' as const,
          name: weatherSettings.location.name,
          latitude: weatherSettings.location.latitude,
          longitude: weatherSettings.location.longitude,
        };
        console.log('Using manual location:', location.name);
      } else {
        // Auto-detect location
        console.log('Auto-detecting location...');
        location = await getLocation();
      }

      // Fetch weather with caching
      await getWeatherWithCache(location, weatherSettings.unit);

      console.log('Weather data fetched successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch weather data';
      console.error('Weather fetch error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [weatherSettings]);

  /**
   * Manual refetch
   */
  const refetch = useCallback(async () => {
    console.log('Manual weather refetch requested');
    await fetchWeatherData();
  }, [fetchWeatherData]);

  /**
   * Clear all weather caches
   */
  const clearCache = useCallback(async () => {
    try {
      await clearAllCaches();
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
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Get location
      let location;

      if (weatherSettings.location.type === 'manual' &&
          weatherSettings.location.latitude &&
          weatherSettings.location.longitude) {
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
      await fetchAndCacheWeather(location, weatherSettings.unit);

      console.log('Weather data force refreshed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh weather data';
      setError(message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
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

    // Setup periodic updates based on updateInterval
    const intervalMs = weatherSettings.updateInterval * 60 * 1000; // Convert minutes to ms

    if (intervalMs > 0) {
      updateIntervalRef.current = setInterval(() => {
        console.log('Periodic weather update triggered');
        fetchWeatherData();
      }, intervalMs);
    }

    // Cleanup
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [weatherSettings.updateInterval, weather, isLoading, error, fetchWeatherData]);

  /**
   * Re-fetch when location or unit settings change
   */
  useEffect(() => {
    if (weather) {
      // Check if location or unit changed
      const locationChanged =
        weatherSettings.location.type === 'manual' &&
        weatherSettings.location.latitude &&
        weatherSettings.location.longitude &&
        (weatherSettings.location.latitude !== weather.location.latitude ||
         weatherSettings.location.longitude !== weather.location.longitude);

      if (locationChanged) {
        console.log('Location changed, fetching new weather data');
        forceRefresh();
      }
    }
  }, [weatherSettings.location, weatherSettings.unit, weather, forceRefresh]);

  return {
    weather: weather || null,
    isLoading,
    error,
    refetch,
    clearCache,
  };
}
