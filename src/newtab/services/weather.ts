/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗ ██████╗ ███████╗███╗   ██╗    ██╗███╗   ██╗███████╗██╗███╗   ██║
 * ║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ██║████╗  ██║██╔════╝██║████╗  ██║
 * ║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║
 * ║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║
 * ║  ╚██████╔╝██║     ███████╗██║ ╚████║    ██║██║ ╚████║██║     ██║██║ ╚████║
 * ║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══║
 * ║                                                                           ║
 * ║  OpenInfinity - Your Infinite New Tab Experience                          ║
 * ║                                                                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Copyright (c) 2024-2026 OpenInfinity Team. All rights reserved.          ║
 * ║  Licensed under the MIT License                                           ║
 * ║  GitHub: https://github.com/OpenInfinity/OpenInfinity                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Weather Service
 *
 * Provides weather data fetching from the Open-Meteo API and WMO weather
 * code interpretation for displaying weather conditions.
 *
 * Features:
 * - Fetches current weather and 7-day forecast
 * - Supports both Celsius and Fahrenheit units
 * - Maps WMO weather codes to human-readable conditions
 * - Provides appropriate weather icons for each condition
 * - Privacy-focused: no referrer, no credentials
 *
 * API Integration:
 * - Uses Open-Meteo free API (no API key required)
 * - 8-second timeout for API requests
 * - Automatic timezone detection
 *
 * WMO Weather Codes:
 * - 0: Clear sky
 * - 1-3: Partly cloudy to overcast
 * - 45-48: Fog conditions
 * - 51-57: Drizzle variations
 * - 61-67: Rain variations
 * - 71-77: Snow variations
 * - 80-86: Shower variations
 * - 95-99: Thunderstorm conditions
 *
 * @module services/weather
 * @see {@link https://open-meteo.com/en/docs} Open-Meteo API Documentation
 * @see {@link https://codes.wmo.int/306/4501} WMO Weather Codes
 */

import type { WeatherCache } from './database';
import type { LucideIcon } from 'lucide-react';
import { Sun, Cloud, CloudSun, CloudFog, CloudRain, CloudSnow, CloudLightning, HelpCircle } from 'lucide-react';

// ============================================================================
// WMO Weather Code Mapping
// ============================================================================

/**
 * Mapping of WMO weather codes to condition descriptions and icons.
 *
 * WMO (World Meteorological Organization) defines standard weather codes
 * used by meteorological services worldwide. Open-Meteo API returns these
 * codes which we map to localized condition text and appropriate icons.
 *
 * @see {@link https://open-meteo.com/en/docs} for code definitions
 *
 * @example
 * ```ts
 * const { condition, icon: Icon } = WMO_CODES[0];
 * // condition: 'Clear sky'
 * // Icon: Sun component
 * ```
 */
export const WMO_CODES: Record<number, { condition: string; icon: LucideIcon }> = {
  // Clear sky
  0: { condition: '晴', icon: Sun },

  // Mainly clear, partly cloudy, and overcast
  1: { condition: '晴间多云', icon: CloudSun },
  2: { condition: '多云', icon: CloudSun },
  3: { condition: '阴', icon: Cloud },

  // Fog
  45: { condition: '雾', icon: CloudFog },
  48: { condition: '冻雾', icon: CloudFog },

  // Drizzle
  51: { condition: '小毛毛雨', icon: CloudRain },
  53: { condition: '毛毛雨', icon: CloudRain },
  55: { condition: '大毛毛雨', icon: CloudRain },
  56: { condition: '冻毛毛雨', icon: CloudRain },
  57: { condition: '大冻毛毛雨', icon: CloudRain },

  // Rain
  61: { condition: '小雨', icon: CloudRain },
  63: { condition: '中雨', icon: CloudRain },
  65: { condition: '大雨', icon: CloudRain },
  66: { condition: '小冻雨', icon: CloudRain },
  67: { condition: '大冻雨', icon: CloudRain },

  // Snow
  71: { condition: '小雪', icon: CloudSnow },
  73: { condition: '中雪', icon: CloudSnow },
  75: { condition: '大雪', icon: CloudSnow },
  77: { condition: '雪粒', icon: CloudSnow },

  // Showers
  80: { condition: '小阵雨', icon: CloudRain },
  81: { condition: '阵雨', icon: CloudRain },
  82: { condition: '大阵雨', icon: CloudRain },
  85: { condition: '小阵雪', icon: CloudSnow },
  86: { condition: '大阵雪', icon: CloudSnow },

  // Thunderstorm
  95: { condition: '雷暴', icon: CloudLightning },
  96: { condition: '雷暴冰雹', icon: CloudLightning },
  99: { condition: '强雷暴冰雹', icon: CloudLightning },
};

// ============================================================================
// Public API - WMO Code Utilities
// ============================================================================

/**
 * Retrieves the weather condition text for a WMO weather code.
 *
 * Returns a localized (Chinese) condition description based on the
 * WMO weather interpretation code returned by Open-Meteo API.
 *
 * @param code - WMO weather code (0-99)
 * @returns Localized condition text, or 'Unknown' if code not recognized
 *
 * @example
 * ```ts
 * getWeatherCondition(0);  // 'Clear sky'
 * getWeatherCondition(63); // 'Moderate rain'
 * getWeatherCondition(95); // 'Thunderstorm'
 * getWeatherCondition(999); // 'Unknown'
 * ```
 */
export function getWeatherCondition(code: number): string {
  return WMO_CODES[code]?.condition || '未知';
}

/**
 * Retrieves the appropriate weather icon for a WMO weather code.
 *
 * Returns a Lucide React icon component matching the weather condition.
 * Falls back to HelpCircle for unrecognized codes.
 *
 * @param code - WMO weather code (0-99)
 * @returns Lucide icon component for the weather condition
 *
 * @example
 * ```ts
 * const WeatherIcon = getWeatherIcon(0);  // Sun
 * const RainIcon = getWeatherIcon(63);    // CloudRain
 * const StormIcon = getWeatherIcon(95);   // CloudLightning
 *
 * // Usage in JSX
 * <WeatherIcon className="w-6 h-6" />
 * ```
 */
export function getWeatherIcon(code: number): LucideIcon {
  return WMO_CODES[code]?.icon || HelpCircle;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Current weather data from Open-Meteo API.
 * @internal
 */
interface OpenMeteoCurrentWeather {
  /** Temperature at 2 meters above ground */
  temperature_2m: number;
  /** WMO weather interpretation code */
  weather_code: number;
  /** Relative humidity at 2 meters */
  relative_humidity_2m: number;
  /** Wind speed at 10 meters */
  wind_speed_10m: number;
  /** Apparent (feels-like) temperature */
  apparent_temperature: number;
}

/**
 * Daily forecast data from Open-Meteo API.
 * @internal
 */
interface OpenMeteoDailyWeather {
  /** Array of date strings (YYYY-MM-DD) */
  time: string[];
  /** Maximum daily temperatures */
  temperature_2m_max: number[];
  /** Minimum daily temperatures */
  temperature_2m_min: number[];
  /** Daily weather codes */
  weather_code: number[];
}

/**
 * Complete Open-Meteo API response structure.
 * @internal
 */
interface OpenMeteoResponse {
  /** Current weather conditions */
  current: OpenMeteoCurrentWeather;
  /** Daily forecast data */
  daily: OpenMeteoDailyWeather;
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Converts a date string to day of week name.
 *
 * Uses local midnight to avoid timezone offset issues that can occur
 * when parsing date-only strings.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Day name (e.g., 'Monday', 'Tuesday')
 * @internal
 */
function getDayOfWeek(dateString: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Use local midnight to avoid timezone offset
  const date = new Date(`${dateString}T00:00:00`);
  return days[date.getDay()];
}

// ============================================================================
// Public API - Weather Data Fetching
// ============================================================================

/**
 * Fetches weather data from the Open-Meteo API.
 *
 * Retrieves current weather conditions and 7-day forecast for a given
 * location. Uses the free Open-Meteo API which requires no API key.
 *
 * @param latitude - Location latitude coordinate (-90 to 90)
 * @param longitude - Location longitude coordinate (-180 to 180)
 * @param unit - Temperature unit: 'celsius' (default) or 'fahrenheit'
 * @returns Promise resolving to weather data (excluding cache metadata)
 *
 * @throws {Error} When API request fails (network error, timeout)
 * @throws {Error} When API returns non-200 status
 * @throws {Error} When response data format is invalid
 *
 * @example
 * ```ts
 * // Fetch weather for Beijing in Celsius
 * const weather = await fetchWeather(39.9042, 116.4074);
 * console.log(`Current: ${weather.current.temperature}C`);
 * console.log(`Condition: ${weather.current.condition}`);
 *
 * // Fetch weather in Fahrenheit
 * const weatherF = await fetchWeather(40.7128, -74.0060, 'fahrenheit');
 * console.log(`New York: ${weatherF.current.temperature}F`);
 *
 * // Access 7-day forecast
 * weather.forecast.forEach(day => {
 *   console.log(`${day.date}: ${day.low}-${day.high}`);
 * });
 * ```
 *
 * @remarks
 * - Request timeout: 8 seconds
 * - Privacy: No referrer or credentials sent
 * - Location name is left empty (populated by caller via geocoding)
 * - All temperatures are rounded to nearest integer
 * - Timezone is automatically detected by Open-Meteo
 */
export async function fetchWeather(
  latitude: number,
  longitude: number,
  unit: 'celsius' | 'fahrenheit' = 'celsius'
): Promise<Omit<WeatherCache, 'id' | 'fetchedAt' | 'expiresAt'>> {
  try {
    // Build API URL with parameters
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,apparent_temperature',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      temperature_unit: unit,
      forecast_days: '7',
      timezone: 'auto',
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params}`;

    // Add timeout control and privacy headers
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenMeteoResponse = await response.json();

    // Validate response data
    if (!data.current || !data.daily || !data.daily.time || data.daily.time.length === 0) {
      throw new Error('Invalid weather data format');
    }

    // Parse current weather
    const current = {
      temperature: Math.round(data.current.temperature_2m),
      condition: getWeatherCondition(data.current.weather_code),
      conditionCode: data.current.weather_code,
      humidity: Math.round(data.current.relative_humidity_2m),
      windSpeed: Math.round(data.current.wind_speed_10m),
      feelsLike: Math.round(data.current.apparent_temperature),
    };

    // Parse forecast data
    const forecast = data.daily.time.map((date, index) => ({
      date,
      dayOfWeek: getDayOfWeek(date),
      high: Math.round(data.daily.temperature_2m_max[index]),
      low: Math.round(data.daily.temperature_2m_min[index]),
      condition: getWeatherCondition(data.daily.weather_code[index]),
      conditionCode: data.daily.weather_code[index],
    }));

    return {
      location: {
        name: '', // Empty - will be populated by geocoding or use i18n fallback
        latitude,
        longitude,
      },
      current,
      forecast,
    };
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    throw error;
  }
}
