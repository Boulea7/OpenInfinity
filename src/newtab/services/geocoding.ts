/**
 * Geocoding service for reverse geocoding (coordinates to city name)
 * Uses OpenStreetMap Nominatim API
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const GEOCODE_TIMEOUT_MS = 5000;
const CACHE_KEY = 'geocode-cache-v1';
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
const FAILURE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes for failed requests

const IS_DEV = !!(import.meta as any)?.env?.DEV;
function debugLog(...args: unknown[]) {
  if (!IS_DEV) return;
  // eslint-disable-next-line no-console
  console.debug(...args);
}

// China's four municipalities (直辖市) have special administrative structure
// In Nominatim: state = city name, city = district name
const CHINA_MUNICIPALITIES = ['北京', '上海', '天津', '重庆'];

/**
 * Check if a state name represents a Chinese municipality
 */
function isChinaMunicipality(state: string): boolean {
  return CHINA_MUNICIPALITIES.some((m) => state.includes(m));
}

interface GeocodeCache {
  [key: string]: {
    cityName: string;
    cachedAt: number;
    failed?: boolean; // Mark failed requests to avoid repeated calls
  };
}

// In-memory cache layer to reduce localStorage reads
let memoryCache: GeocodeCache | null = null;
let memoryCacheLoadedAt = 0;
const MEMORY_CACHE_TTL_MS = 30 * 1000; // 30 seconds

// In-flight promise deduplication
const inFlightRequests = new Map<string, Promise<string>>();

/**
 * Load cache from localStorage with memory caching
 */
function loadCache(): GeocodeCache {
  const now = Date.now();
  if (memoryCache && now - memoryCacheLoadedAt < MEMORY_CACHE_TTL_MS) {
    return memoryCache;
  }

  try {
    memoryCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    memoryCacheLoadedAt = now;
    return memoryCache!;
  } catch {
    memoryCache = {};
    memoryCacheLoadedAt = now;
    return memoryCache;
  }
}

/**
 * Save cache to localStorage and update memory cache
 */
function saveCache(cache: GeocodeCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    memoryCache = cache;
    memoryCacheLoadedAt = Date.now();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Geocoding] Failed to save cache:', msg);
  }
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

  // Check cache first (using memory-cached version)
  const cache = loadCache();
  const entry = cache[cacheKey];
  const now = Date.now();

  if (entry) {
    const ttl = entry.failed ? FAILURE_CACHE_TTL_MS : CACHE_EXPIRATION_MS;
    if (now - entry.cachedAt < ttl) {
      if (entry.failed) {
        debugLog('[Geocoding] Skipping due to cached failure');
        return '';
      }
      debugLog('[Geocoding] Using cached city name:', entry.cityName);
      return entry.cityName;
    }
  }

  // Check for in-flight request to deduplicate
  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) {
    debugLog('[Geocoding] Reusing in-flight request');
    return inFlight;
  }

  // Create new request
  const requestPromise = fetchCityName(latitude, longitude, language, cacheKey);
  inFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

/**
 * Internal function to fetch city name from Nominatim API
 */
async function fetchCityName(
  latitude: number,
  longitude: number,
  language: string,
  cacheKey: string
): Promise<string> {
  debugLog('[Geocoding] Fetching from Nominatim API:', { latitude, longitude, language });

  try {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      format: 'json',
      'accept-language': language,
      zoom: '10', // City level
    });

    const url = `${NOMINATIM_BASE_URL}/reverse?${params}`;

    // Note: User-Agent header removed as browsers don't allow setting it in fetch
    // The Nominatim API will use the browser's default User-Agent
    const response = await fetch(url, {
      signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });

    if (!response.ok) {
      console.error('[Geocoding] Nominatim API error:', response.status, response.statusText);
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract location components from address
    const addr = data.address || {};

    // Raw values from Nominatim API
    const rawDistrict = addr.suburb || addr.district || addr.county || addr.borough || '';
    const rawCity = addr.city || addr.town || addr.village || addr.municipality || '';
    const state = addr.state || addr.province || '';
    const country = addr.country || '';
    const countryCode = (addr.country_code || '').toUpperCase();

    // Check if location is in Greater China (CN, HK, MO, TW)
    const isGreaterChina = ['CN', 'HK', 'MO', 'TW'].includes(countryCode);

    // Clean up "市/省" suffix for display (e.g., "北京市" -> "北京")
    const cleanState = state.replace(/[市省]$/, '');

    // Determine city and district based on administrative structure
    let city: string;
    let district: string;

    if (isGreaterChina && isChinaMunicipality(state)) {
      // For municipalities (直辖市): state = city, rawCity = district
      // e.g., state="北京市", rawCity="海淀区" → city="北京", district="海淀区"
      city = cleanState;
      district = rawCity; // rawCity is actually the district for municipalities
    } else if (isGreaterChina) {
      // For regular Chinese cities: use normal hierarchy
      city = rawCity || cleanState;
      district = rawDistrict;
    } else {
      // For non-Chinese locations
      city = rawCity;
      district = rawDistrict;
    }

    // Format location name with smart hierarchy
    let locationName = '';

    if (language.startsWith('zh')) {
      // Chinese formatting
      if (isGreaterChina) {
        // For China/HK/Macau/Taiwan: omit country, use "城市·区" format
        if (city && district) {
          // e.g., "北京·海淀区"
          locationName = `${city}·${district}`;
        } else if (city) {
          // e.g., "北京" (no district available)
          locationName = city;
        } else if (district) {
          // Fallback: just district if that's all we have
          locationName = district;
        } else if (state) {
          // Fallback: raw state name
          locationName = state;
        }
      } else {
        // For foreign countries: smart hierarchy
        if (city && district) {
          // City + district: "东京·涩谷区"
          locationName = `${city}·${district}`;
        } else if (state && city) {
          // State + city: "加利福尼亚·旧金山"
          locationName = `${state}·${city}`;
        } else if (country && city) {
          // Country + city: "日本·东京"
          locationName = `${country}·${city}`;
        } else if (country && state) {
          // Country + state: "美国·加利福尼亚"
          locationName = `${country}·${state}`;
        } else if (city) {
          locationName = city;
        } else if (country) {
          locationName = country;
        }
      }
    } else {
      // English formatting
      if (city && district) {
        // e.g., "Haidian, Beijing"
        locationName = `${district}, ${city}`;
      } else if (city && state) {
        // e.g., "San Francisco, California"
        locationName = `${city}, ${state}`;
      } else if (city && country) {
        // e.g., "Tokyo, Japan"
        locationName = `${city}, ${country}`;
      } else if (state && country) {
        // e.g., "California, USA"
        locationName = `${state}, ${country}`;
      } else if (city) {
        locationName = city;
      } else if (district && country) {
        locationName = `${district}, ${country}`;
      } else if (country) {
        locationName = country;
      }
    }

    // Fallback to first part of display_name if nothing else works
    if (!locationName) {
      locationName = data.display_name?.split(',')[0]?.trim() || '';
    }

    if (locationName) {
      // Cache the successful result
      const cache = loadCache();
      cache[cacheKey] = {
        cityName: locationName,
        cachedAt: Date.now(),
      };
      saveCache(cache);
      return locationName;
    }

    throw new Error('No city name found in response');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Geocoding] Failed:', msg);

    // Cache the failure to avoid repeated requests
    const cache = loadCache();
    cache[cacheKey] = {
      cityName: '',
      cachedAt: Date.now(),
      failed: true,
    };
    saveCache(cache);

    return '';
  }
}

/**
 * Clear expired geocode cache entries
 */
export function clearExpiredGeocodeCache(): void {
  try {
    const cache = loadCache();
    const now = Date.now();
    const updated: GeocodeCache = {};

    Object.entries(cache).forEach(([key, entry]) => {
      const ttl = entry.failed ? FAILURE_CACHE_TTL_MS : CACHE_EXPIRATION_MS;
      if (now - entry.cachedAt < ttl) {
        updated[key] = entry;
      }
    });

    saveCache(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Geocoding] Failed to clear expired cache:', msg);
  }
}
