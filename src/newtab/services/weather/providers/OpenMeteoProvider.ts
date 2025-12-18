/**
 * Open-Meteo weather provider
 * Implements the shared provider interface
 */

import { getWeatherCondition } from '../../weather';
import type { IWeatherProvider, WeatherData } from '../types';

/**
 * Open-Meteo API response interfaces
 * Reference: https://open-meteo.com/en/docs
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
  const date = new Date(`${dateString}T00:00:00`);
  return days[date.getDay()];
}

export class OpenMeteoProvider implements IWeatherProvider {
  readonly name = 'open-meteo';

  async fetchWeather(
    latitude: number,
    longitude: number,
    unit: 'celsius' | 'fahrenheit'
  ): Promise<WeatherData> {
    const fetchedAt = Date.now();

    try {
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

      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        referrerPolicy: 'no-referrer',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenMeteoResponse = await response.json();

      if (!data.current || !data.daily || !data.daily.time || data.daily.time.length === 0) {
        throw new Error('Invalid weather data format');
      }

      const currentCode = data.current.weather_code;
      const current = {
        temperature: Math.round(data.current.temperature_2m),
        condition: getWeatherCondition(currentCode),
        conditionCode: currentCode,
        humidity: Math.round(data.current.relative_humidity_2m),
        windSpeed: Math.round(data.current.wind_speed_10m),
        feelsLike: Math.round(data.current.apparent_temperature),
      };

      const forecast = data.daily.time.map((date, index) => {
        const code = data.daily.weather_code[index];
        const dayDate = new Date(`${date}T00:00:00`);
        return {
          date,
          dayOfWeek: getDayOfWeek(date),
          dayIndex: dayDate.getDay(), // 0-6 for i18n
          high: Math.round(data.daily.temperature_2m_max[index]),
          low: Math.round(data.daily.temperature_2m_min[index]),
          condition: getWeatherCondition(code),
          conditionCode: code,
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
      console.error('[OpenMeteoProvider] Failed to fetch weather data:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch weather data');
    }
  }
}
