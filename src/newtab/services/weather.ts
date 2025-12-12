/**
 * Weather service using Open-Meteo API
 * Provides weather data fetching and WMO weather code mapping
 */

import type { WeatherCache } from './database';

/**
 * WMO Weather Code mapping
 * Reference: https://open-meteo.com/en/docs
 */
export const WMO_CODES: Record<number, { condition: string; icon: string }> = {
  // Clear sky
  0: { condition: 'Clear', icon: '☀️' },

  // Mainly clear, partly cloudy, and overcast
  1: { condition: 'Mainly Clear', icon: '🌤️' },
  2: { condition: 'Partly Cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },

  // Fog
  45: { condition: 'Fog', icon: '🌫️' },
  48: { condition: 'Depositing Rime Fog', icon: '🌫️' },

  // Drizzle
  51: { condition: 'Light Drizzle', icon: '🌦️' },
  53: { condition: 'Moderate Drizzle', icon: '🌦️' },
  55: { condition: 'Dense Drizzle', icon: '🌦️' },
  56: { condition: 'Light Freezing Drizzle', icon: '🌦️' },
  57: { condition: 'Dense Freezing Drizzle', icon: '🌦️' },

  // Rain
  61: { condition: 'Slight Rain', icon: '🌧️' },
  63: { condition: 'Moderate Rain', icon: '🌧️' },
  65: { condition: 'Heavy Rain', icon: '🌧️' },
  66: { condition: 'Light Freezing Rain', icon: '🌧️' },
  67: { condition: 'Heavy Freezing Rain', icon: '🌧️' },

  // Snow
  71: { condition: 'Slight Snow', icon: '🌨️' },
  73: { condition: 'Moderate Snow', icon: '🌨️' },
  75: { condition: 'Heavy Snow', icon: '🌨️' },
  77: { condition: 'Snow Grains', icon: '🌨️' },

  // Showers
  80: { condition: 'Slight Rain Showers', icon: '🌦️' },
  81: { condition: 'Moderate Rain Showers', icon: '🌦️' },
  82: { condition: 'Violent Rain Showers', icon: '🌦️' },
  85: { condition: 'Slight Snow Showers', icon: '🌨️' },
  86: { condition: 'Heavy Snow Showers', icon: '🌨️' },

  // Thunderstorm
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm with Slight Hail', icon: '⛈️' },
  99: { condition: 'Thunderstorm with Heavy Hail', icon: '⛈️' },
};

/**
 * Get weather condition text from WMO code
 */
export function getWeatherCondition(code: number): string {
  return WMO_CODES[code]?.condition || 'Unknown';
}

/**
 * Get weather icon from WMO code
 */
export function getWeatherIcon(code: number): string {
  return WMO_CODES[code]?.icon || '❓';
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
        name: 'Current Location', // Will be updated by location service
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
