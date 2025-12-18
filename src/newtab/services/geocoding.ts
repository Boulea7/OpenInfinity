/**
 * Geocoding service for reverse geocoding (coordinates to city name)
 * Uses OpenStreetMap Nominatim API
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const GEOCODE_TIMEOUT_MS = 5000;
const CACHE_KEY = 'geocode-cache-v1';
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
      return entry.cityName;
    }
  } catch (error) {
    console.warn('Failed to read geocode cache:', error);
  }

  // Fetch from Nominatim API
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
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract city name from address
    const cityName =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      data.address?.state ||
      data.display_name?.split(',')[0] ||
      '';

    if (cityName) {
      // Cache the result
      try {
        const cache: GeocodeCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        cache[cacheKey] = {
          cityName,
          cachedAt: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch (error) {
        console.warn('Failed to cache geocode result:', error);
      }

      return cityName;
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
