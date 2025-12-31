/**
 * Location service for obtaining geographic coordinates
 * Supports both Geolocation API (preferred) and IP-based fallback
 */

import type { LocationData } from '../types';
import { checkLocationPermission } from './locationPermission';

const IS_DEV = !!(import.meta as any)?.env?.DEV;
function debugLog(level: 'info' | 'warn', ...args: unknown[]) {
  if (!IS_DEV) return;
  // eslint-disable-next-line no-console
  console[level](...args);
}

/**
 * Validate coordinates are within valid ranges
 * Latitude: -90 to 90, Longitude: -180 to 180
 */
function validateCoordinates(latitude: number, longitude: number): void {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Invalid coordinates: not finite numbers');
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error(`Invalid latitude: ${latitude} (must be between -90 and 90)`);
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error(`Invalid longitude: ${longitude} (must be between -180 and 180)`);
  }
}

/**
 * IP-based location API response interface
 */
interface IPLocationResponse {
  city?: string;
  region?: string;
  country_name?: string;
  latitude?: number;
  longitude?: number;
  error?: boolean;
  reason?: string;
}

/**
 * Get location using browser's Geolocation API
 * Requires user permission
 *
 * @returns LocationData with precise coordinates
 * @throws Error if user denies permission or API fails
 */
async function getGeolocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Validate coordinates
        validateCoordinates(lat, lon);

        resolve({
          type: 'auto',
          name: '', // Empty - geocoding will populate, UI uses i18n fallback
          latitude: lat,
          longitude: lon,
        });
      },
      (error) => {
        let message = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
        enableHighAccuracy: false,
      }
    );
  });
}

/**
 * Get location using IP-based geolocation
 * No permissions required, less accurate
 *
 * @returns LocationData with approximate coordinates
 * @throws Error if API request fails
 */
async function getLocationByIP(): Promise<LocationData> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`IP location API error: ${response.status}`);
    }

    const data: IPLocationResponse = await response.json();

    if (data.error) {
      throw new Error(data.reason || 'IP location service error');
    }

    // Validate coordinates (use != null to allow 0 values for equator/prime meridian)
    if (data.latitude == null || data.longitude == null) {
      throw new Error('Invalid location data from IP service');
    }

    // Validate coordinate ranges
    validateCoordinates(data.latitude, data.longitude);

    // Build location name from available data
    const nameParts = [data.city, data.region, data.country_name].filter(Boolean);
    const name = nameParts.length > 0 ? nameParts.join(', ') : 'Unknown Location';

    return {
      type: 'auto',
      name,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error('Failed to get location by IP:', error);
    throw error;
  }
}

/**
 * Get user's current location
 * P0-8: Only uses Geolocation API, respects user privacy when denied
 *
 * @returns LocationData with coordinates and name
 * @throws Error if permission denied or geolocation fails
 */
// Beijing coordinates for fallback when location is denied
const BEIJING_FALLBACK: LocationData = {
  type: 'auto',
  name: '北京',
  latitude: 39.9042,
  longitude: 116.4074,
};

export async function getLocation(): Promise<LocationData & { isFallback?: boolean }> {
  // Check permission state first (does not trigger browser prompt)
  const permState = await checkLocationPermission();

  // If permission is not decided yet, use fallback to avoid triggering prompt without user gesture
  if (permState === 'prompt') {
    debugLog('info', 'Location permission not decided - using fallback');
    return { ...BEIJING_FALLBACK, isFallback: true };
  }

  // If permission is denied, use fallback
  if (permState === 'denied') {
    debugLog('info', 'Location permission denied - using Beijing as fallback');
    return { ...BEIJING_FALLBACK, isFallback: true };
  }

  // Permission is granted, safe to call geolocation API
  try {
    const location = await getGeolocation();
    return location;
  } catch (geoError) {
    // Even with permission granted, geolocation can fail (timeout, unavailable, etc.)
    debugLog('warn', 'Geolocation failed, using Beijing fallback:', geoError);
    return { ...BEIJING_FALLBACK, isFallback: true };
  }
}

/**
 * Get location with IP fallback option (for settings/manual override)
 * Only use this when user explicitly opts in to IP-based location
 */
export async function getLocationWithIPFallback(): Promise<LocationData> {
  try {
    // Try Geolocation API first (more accurate)
    const location = await getGeolocation();
    return location;
  } catch (geoError) {
    console.warn('Geolocation API failed, falling back to IP location:', geoError);

    try {
      // Fall back to IP-based location
      const location = await getLocationByIP();
      return location;
    } catch {
      console.error('Both location methods failed');
      throw new Error('Failed to obtain location. Please check your network connection.');
    }
  }
}

/**
 * Check if Geolocation API is available
 */
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Request location permission (for Geolocation API)
 * This will trigger the browser's permission prompt
 *
 * @returns true if permission granted, false otherwise
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!isGeolocationAvailable()) {
    return false;
  }

  try {
    await getGeolocation();
    return true;
  } catch {
    return false;
  }
}
