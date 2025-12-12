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
import type { LocationData } from '../types';

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
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
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

      // Fetch weather with caching
      await getWeatherWithCache(location, weatherSettings.unit);
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
      await fetchAndCacheWeather(location, weatherSettings.unit);
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
    clearCache,
  };
}
