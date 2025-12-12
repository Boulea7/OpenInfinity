/**
 * Location service for obtaining geographic coordinates
 * Supports both Geolocation API (preferred) and IP-based fallback
 */

import type { LocationData } from '../types';

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
        resolve({
          type: 'auto',
          name: 'Current Location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
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

    if (!data.latitude || !data.longitude) {
      throw new Error('Invalid location data from IP service');
    }

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
 * Tries Geolocation API first, falls back to IP-based location
 *
 * @returns LocationData with coordinates and name
 * @throws Error if both methods fail
 */
export async function getLocation(): Promise<LocationData> {
  try {
    // Try Geolocation API first (more accurate)
    console.log('Attempting to get location via Geolocation API...');
    const location = await getGeolocation();
    console.log('Location obtained via Geolocation API');
    return location;
  } catch (geoError) {
    console.warn('Geolocation API failed, falling back to IP location:', geoError);

    try {
      // Fall back to IP-based location
      const location = await getLocationByIP();
      console.log('Location obtained via IP location service');
      return location;
    } catch (ipError) {
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
