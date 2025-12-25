/**
 * Weather service using Open-Meteo API
 * Provides weather data fetching and WMO weather code mapping
 */

import type { WeatherCache } from './database';
import type { LucideIcon } from 'lucide-react';
import { Sun, Cloud, CloudSun, CloudFog, CloudRain, CloudSnow, CloudLightning, HelpCircle } from 'lucide-react';

/**
 * WMO Weather Code mapping
 * Reference: https://open-meteo.com/en/docs
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

/**
 * Get weather condition text from WMO code
 */
export function getWeatherCondition(code: number): string {
  return WMO_CODES[code]?.condition || '未知';
}

/**
 * Get weather icon from WMO code
 */
export function getWeatherIcon(code: number): LucideIcon {
  return WMO_CODES[code]?.icon || HelpCircle;
}

/**
 * Open-Meteo API response interfaces
 */
interface OpenMeteoCurrentWeather {
  temperature_2m: number;
  weather_code: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  apparent_temperature: number;
}

interface OpenMeteoDailyWeather {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrentWeather;
  daily: OpenMeteoDailyWeather;
}

/**
 * Get day of week from date string
 * Uses local midnight to avoid timezone offset issues
 */
function getDayOfWeek(dateString: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Use local midnight to avoid timezone offset
  const date = new Date(`${dateString}T00:00:00`);
  return days[date.getDay()];
}

/**
 * Fetch weather data from Open-Meteo API
 *
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param unit - Temperature unit ('celsius' or 'fahrenheit')
 * @returns Weather data conforming to WeatherCache interface
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
