/**
 * Geocoding service for reverse geocoding (coordinates to city name)
 * Uses OpenStreetMap Nominatim API
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const GEOCODE_TIMEOUT_MS = 5000;
const CACHE_KEY = 'geocode-cache-v1';
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes (reduced from 7 days for fresher data)

interface GeocodeCache {
  [key: string]: {
    cityName: string;
    cachedAt: number;
  };
}

/**
 * Get cached city name or fetch from Nominatim API
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param language Language code (zh-CN, en-US, etc.)
 * @returns City name or fallback string
 */
export async function getCityName(
  latitude: number,
  longitude: number,
  language: string = 'zh-CN'
): Promise<string> {
  const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${language}`;

  // Check cache first
  try {
    const cache: GeocodeCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const entry = cache[cacheKey];

    if (entry && Date.now() - entry.cachedAt < CACHE_EXPIRATION_MS) {
      console.log('[Geocoding] Using cached city name:', entry.cityName);
      return entry.cityName;
    } else if (entry) {
      console.log('[Geocoding] Cache expired, fetching fresh data');
    }
  } catch (error) {
    console.warn('[Geocoding] Failed to read cache:', error);
  }

  // Fetch from Nominatim API
  console.log('[Geocoding] Fetching from Nominatim API:', { latitude, longitude, language });
  try {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      format: 'json',
      'accept-language': language,
      zoom: '10', // City level
    });

    const url = `${NOMINATIM_BASE_URL}/reverse?${params}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
      headers: {
        'User-Agent': 'OpenInfinity/1.0',
      },
    });

    if (!response.ok) {
      console.error('[Geocoding] Nominatim API error:', response.status, response.statusText);
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Geocoding] Nominatim response:', data);

    // Extract city and country name from address
    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      data.address?.state ||
      '';

    const country = data.address?.country || '';

    console.log('[Geocoding] Extracted location:', { city, country });

    // Format: "Country, City" or just "City" if no country
    let locationName = '';
    if (city && country) {
      locationName = language.startsWith('zh') ? `${country} ${city}` : `${city}, ${country}`;
    } else if (city) {
      locationName = city;
    } else if (country) {
      locationName = country;
    } else {
      // Fallback to first part of display_name
      locationName = data.display_name?.split(',')[0] || '';
    }

    console.log('[Geocoding] Final location name:', locationName);

    if (locationName) {
      // Cache the result
      try {
        const cache: GeocodeCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        cache[cacheKey] = {
          cityName: locationName,
          cachedAt: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch (error) {
        console.warn('Failed to cache geocode result:', error);
      }

      return locationName;
    }

    throw new Error('No city name found in response');
  } catch (error) {
    console.warn('Geocoding failed:', error);
    return ''; // Return empty string, will use fallback in UI
  }
}

/**
 * Clear expired geocode cache entries
 */
export function clearExpiredGeocodeCache(): void {
  try {
    const cache: GeocodeCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const now = Date.now();
    const updated: GeocodeCache = {};

    Object.entries(cache).forEach(([key, entry]) => {
      if (now - entry.cachedAt < CACHE_EXPIRATION_MS) {
        updated[key] = entry;
      }
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to clear expired geocode cache:', error);
  }
}
