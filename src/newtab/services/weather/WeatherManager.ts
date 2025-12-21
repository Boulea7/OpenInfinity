/**
 * WeatherManager
 * Orchestrates multiple weather providers with region-based preference and fallback.
 */

import type { IWeatherProvider, WeatherData } from './types';
import { OpenMeteoProvider } from './providers/OpenMeteoProvider';
import { OpenWeatherMapProvider } from './providers/OpenWeatherMapProvider';
// import { QWeatherProvider } from './providers/QWeatherProvider'; // Temporarily disabled due to 403 errors
import { getCityName } from '../geocoding';
import { isCoordinatesInChina } from '../../utils/regionUtils';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export class WeatherManager {
  private static instance: WeatherManager | null = null;

  private readonly openMeteo = new OpenMeteoProvider();
  // private readonly qweather = new QWeatherProvider(); // Temporarily disabled due to 403 errors
  private readonly openWeatherMap = new OpenWeatherMapProvider();

  static getInstance(): WeatherManager {
    if (!WeatherManager.instance) {
      WeatherManager.instance = new WeatherManager();
    }
    return WeatherManager.instance;
  }

  private constructor() {
    // Enforce singleton
  }

  private getProviderChain(latitude: number, longitude: number): IWeatherProvider[] {
    // Temporarily disable QWeather due to 403 errors
    // TODO: Fix QWeather JWT authentication
    if (isCoordinatesInChina(latitude, longitude)) {
      return [this.openMeteo, this.openWeatherMap]; // Skip qweather
    }
    return [this.openMeteo, this.openWeatherMap]; // Skip qweather
  }

  async fetchWeather(
    latitude: number,
    longitude: number,
    unit: 'celsius' | 'fahrenheit',
    language: string = 'zh-CN'
  ): Promise<WeatherData> {
    const providers = this.getProviderChain(latitude, longitude);
    const errors: Array<{ provider: string; message: string }> = [];

    for (const provider of providers) {
      try {
        const weatherData = await provider.fetchWeather(latitude, longitude, unit);

        // Fetch city name via reverse geocoding (await to ensure it updates before return)
        console.log('[WeatherManager] Fetching city name for:', { latitude, longitude, language });
        try {
          const cityName = await getCityName(latitude, longitude, language);
          console.log('[WeatherManager] City name resolved:', cityName);
          if (cityName) {
            weatherData.location.name = cityName;
          } else {
            console.warn('[WeatherManager] getCityName returned empty string');
          }
        } catch (error) {
          console.error('[WeatherManager] Failed to get city name:', error);
          // Keep "Current Location" as fallback
        }

        return weatherData;
      } catch (error) {
        const message = toErrorMessage(error);
        errors.push({ provider: provider.name, message });
        console.warn(`[WeatherManager] Provider "${provider.name}" failed: ${message}`);
      }
    }

    const chain = providers.map((p) => p.name).join(' -> ');
    const details = errors.map((e) => `${e.provider}: ${e.message}`).join(' | ');
    throw new Error(`All weather providers failed (${chain}). ${details}`);
  }
}

export const weatherManager = WeatherManager.getInstance();

