/**
 * OpenWeatherMap provider (One Call API 3.0)
 * Reference: https://openweathermap.org/api/one-call-3
 */

import { getWeatherCondition } from '../../weather';
import type { IWeatherProvider, WeatherData } from '../types';

const OWM_BASE_URL = 'https://api.openweathermap.org/data/3.0/onecall';
const OWM_TIMEOUT_MS = 8000;

function toNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid ${fieldName} value`);
  }
  return value;
}

function formatDateFromUnix(dtSeconds: number, timeZone?: string): string {
  const date = new Date(dtSeconds * 1000);

  if (timeZone) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      // Ignore invalid timezone
    }
  }

  return date.toISOString().slice(0, 10);
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

interface OwmWeather {
  id: number;
}

interface OwmCurrent {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  weather: OwmWeather[];
}

interface OwmDailyTemp {
  max: number;
  min: number;
}

interface OwmDaily {
  dt: number;
  temp: OwmDailyTemp;
  weather: OwmWeather[];
}

interface OwmResponse {
  timezone?: string;
  current?: OwmCurrent;
  daily?: OwmDaily[];
}

export class OpenWeatherMapProvider implements IWeatherProvider {
  readonly name = 'openweathermap';

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(OWM_TIMEOUT_MS),
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async fetchWeather(
    latitude: number,
    longitude: number,
    unit: 'celsius' | 'fahrenheit'
  ): Promise<WeatherData> {
    const fetchedAt = Date.now();

    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

      if (!apiKey) {
        throw new Error('Missing VITE_OPENWEATHER_API_KEY');
      }

      const unitsParam = unit === 'fahrenheit' ? 'imperial' : 'metric';

      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        appid: apiKey,
        units: unitsParam,
        exclude: 'minutely,hourly,alerts',
        lang: 'en',
      });

      const url = `${OWM_BASE_URL}?${params}`;
      const data: OwmResponse = await this.fetchJson<OwmResponse>(url);

      if (!data.current || !data.daily || data.daily.length === 0) {
        throw new Error('Invalid OpenWeatherMap data format');
      }

      const currentWeatherId = data.current.weather?.[0]?.id;
      const currentWmoCode =
        typeof currentWeatherId === 'number' ? mapOwmWeatherIdToWmoCode(currentWeatherId) : 999;

      const temp = Math.round(toNumber(data.current.temp, 'temp'));
      const feelsLike = Math.round(toNumber(data.current.feels_like, 'feels_like'));
      const humidity = Math.round(toNumber(data.current.humidity, 'humidity'));

      const windSpeedRaw = toNumber(data.current.wind_speed, 'wind_speed');

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

      const forecast = data.daily.slice(0, 7).map((day) => {
        const date = formatDateFromUnix(day.dt, data.timezone);
        const weatherId = day.weather?.[0]?.id;
        const wmoCode = typeof weatherId === 'number' ? mapOwmWeatherIdToWmoCode(weatherId) : 999;
        const dayDate = new Date(`${date}T00:00:00`);

        return {
          date,
          dayOfWeek: getDayOfWeek(date),
          dayIndex: dayDate.getDay(), // 0-6 for i18n
          high: Math.round(toNumber(day.temp.max, 'temp.max')),
          low: Math.round(toNumber(day.temp.min, 'temp.min')),
          condition: getWeatherCondition(wmoCode),
          conditionCode: wmoCode,
        };
      });

      return {
        location: {
          name: 'Current Location',
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

