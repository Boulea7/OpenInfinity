/**
 * OpenWeatherMap provider (Free tier APIs)
 * Uses Current Weather API + 5 Day/3 Hour Forecast API
 * Reference: https://openweathermap.org/current
 * Reference: https://openweathermap.org/forecast5
 */

import { getWeatherCondition } from '../../weather';
import type { IWeatherProvider, WeatherData } from '../types';

const OWM_CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';
const OWM_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const OWM_TIMEOUT_MS = 10000;

function toNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid ${fieldName} value`);
  }
  return value;
}

function formatDateFromUnix(dtSeconds: number, timezoneOffset: number): string {
  // Apply timezone offset (in seconds) to get local date
  const localDate = new Date((dtSeconds + timezoneOffset) * 1000);
  return localDate.toISOString().slice(0, 10);
}

function getDayOfWeek(dateString: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(`${dateString}T00:00:00`);
  return days[date.getDay()];
}

/**
 * Maps OpenWeatherMap weather IDs to a best-effort WMO weather code for UI compatibility.
 */
function mapOwmWeatherIdToWmoCode(weatherId: number): number {
  if (!Number.isFinite(weatherId)) return 999;

  // Thunderstorm
  if (weatherId >= 200 && weatherId < 300) return 95;

  // Drizzle
  if (weatherId >= 300 && weatherId < 400) return 53;

  // Rain
  if (weatherId === 511) return 66;
  if (weatherId >= 500 && weatherId < 520) {
    if (weatherId <= 501) return 61;
    if (weatherId <= 503) return 63;
    return 65;
  }

  // Showers
  if (weatherId >= 520 && weatherId <= 531) {
    if (weatherId <= 521) return 80;
    if (weatherId <= 522) return 81;
    return 82;
  }

  // Snow
  if (weatherId >= 600 && weatherId < 700) {
    if (weatherId === 600) return 71;
    if (weatherId === 602) return 75;
    if (weatherId >= 620) return 85;
    return 73;
  }

  // Atmosphere (mist/fog/haze/dust/sand/etc.)
  if (weatherId >= 700 && weatherId < 800) return 45;

  // Clear
  if (weatherId === 800) return 0;

  // Clouds
  if (weatherId === 801) return 1;
  if (weatherId === 802) return 2;
  if (weatherId === 803 || weatherId === 804) return 3;

  return 999;
}

// Current Weather API response
interface OwmCurrentResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_max: number;
    temp_min: number;
  };
  wind: {
    speed: number;
  };
  weather: Array<{ id: number }>;
  timezone: number; // Shift in seconds from UTC
}

// 5 Day Forecast API response
interface OwmForecastItem {
  dt: number;
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
  };
  weather: Array<{ id: number }>;
}

interface OwmForecastResponse {
  list: OwmForecastItem[];
  city: {
    timezone: number;
  };
}

// Aggregated daily forecast
interface DailyForecast {
  date: string;
  high: number;
  low: number;
  weatherId: number;
}

export class OpenWeatherMapProvider implements IWeatherProvider {
  readonly name = 'openweathermap';

  /**
   * Check if API key is configured
   */
  static hasApiKey(): boolean {
    const key = import.meta.env.VITE_OPENWEATHER_API_KEY;
    return Boolean(key && key !== 'your-openweather-api-key-here');
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(OWM_TIMEOUT_MS),
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('OpenWeatherMap API key invalid');
      }
      throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Aggregate 3-hour forecast items into daily forecasts
   */
  private aggregateDailyForecasts(
    forecastItems: OwmForecastItem[],
    timezoneOffset: number
  ): DailyForecast[] {
    const dailyMap = new Map<string, { highs: number[]; lows: number[]; weatherIds: number[] }>();

    for (const item of forecastItems) {
      const date = formatDateFromUnix(item.dt, timezoneOffset);

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { highs: [], lows: [], weatherIds: [] });
      }

      const day = dailyMap.get(date)!;
      day.highs.push(item.main.temp_max);
      day.lows.push(item.main.temp_min);
      if (item.weather?.[0]?.id) {
        day.weatherIds.push(item.weather[0].id);
      }
    }

    const dailyForecasts: DailyForecast[] = [];

    for (const [date, data] of dailyMap) {
      dailyForecasts.push({
        date,
        high: Math.round(Math.max(...data.highs)),
        low: Math.round(Math.min(...data.lows)),
        // Use most common weather ID or first one
        weatherId: data.weatherIds[Math.floor(data.weatherIds.length / 2)] || 800,
      });
    }

    return dailyForecasts.slice(0, 7); // Return up to 7 days
  }

  async fetchWeather(
    latitude: number,
    longitude: number,
    unit: 'celsius' | 'fahrenheit'
  ): Promise<WeatherData> {
    const fetchedAt = Date.now();

    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

      if (!apiKey || apiKey === 'your-openweather-api-key-here') {
        throw new Error('OpenWeatherMap API key not configured');
      }

      const unitsParam = unit === 'fahrenheit' ? 'imperial' : 'metric';

      // Fetch current weather and forecast in parallel
      const currentParams = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        appid: apiKey,
        units: unitsParam,
      });

      const forecastParams = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        appid: apiKey,
        units: unitsParam,
      });

      const [currentData, forecastData] = await Promise.all([
        this.fetchJson<OwmCurrentResponse>(`${OWM_CURRENT_URL}?${currentParams}`),
        this.fetchJson<OwmForecastResponse>(`${OWM_FORECAST_URL}?${forecastParams}`),
      ]);

      // Process current weather
      const currentWeatherId = currentData.weather?.[0]?.id;
      const currentWmoCode =
        typeof currentWeatherId === 'number' ? mapOwmWeatherIdToWmoCode(currentWeatherId) : 999;

      const temp = Math.round(toNumber(currentData.main.temp, 'temp'));
      const feelsLike = Math.round(toNumber(currentData.main.feels_like, 'feels_like'));
      const humidity = Math.round(toNumber(currentData.main.humidity, 'humidity'));

      const windSpeedRaw = toNumber(currentData.wind.speed, 'wind.speed');

      // OWM wind speed: m/s (metric) or mph (imperial). Normalize to km/h for UI.
      const windSpeedKmh = unitsParam === 'metric' ? windSpeedRaw * 3.6 : windSpeedRaw * 1.60934;

      const current = {
        temperature: temp,
        condition: getWeatherCondition(currentWmoCode),
        conditionCode: currentWmoCode,
        humidity,
        windSpeed: Math.round(windSpeedKmh),
        feelsLike,
      };

      // Process forecast
      const timezoneOffset = forecastData.city?.timezone || currentData.timezone || 0;
      const dailyForecasts = this.aggregateDailyForecasts(forecastData.list, timezoneOffset);

      const forecast = dailyForecasts.map((day) => {
        const wmoCode = mapOwmWeatherIdToWmoCode(day.weatherId);
        const dayDate = new Date(`${day.date}T00:00:00`);

        return {
          date: day.date,
          dayOfWeek: getDayOfWeek(day.date),
          dayIndex: dayDate.getDay(),
          high: day.high,
          low: day.low,
          condition: getWeatherCondition(wmoCode),
          conditionCode: wmoCode,
        };
      });

      return {
        location: {
          name: '', // Will be updated by WeatherManager with geocoded name
          latitude,
          longitude,
        },
        current,
        forecast,
        provider: this.name,
        fetchedAt,
      };
    } catch (error) {
      console.error('[OpenWeatherMapProvider] Failed to fetch weather data:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch weather data');
    }
  }
}
