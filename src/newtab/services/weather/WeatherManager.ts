/**
 * WeatherManager
 * Orchestrates multiple weather providers with region-based preference and fallback.
 */

import type { IWeatherProvider, WeatherData } from './types';
import { OpenMeteoProvider } from './providers/OpenMeteoProvider';
import { OpenWeatherMapProvider } from './providers/OpenWeatherMapProvider';
import { QWeatherProvider } from './providers/QWeatherProvider';
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
  private readonly qweather = new QWeatherProvider();
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
    const providers: IWeatherProvider[] = [];

    // For China region: prioritize QWeather (better local data coverage)
    if (isCoordinatesInChina(latitude, longitude) && QWeatherProvider.hasApiKey()) {
      providers.push(this.qweather);
    }

    // Primary fallback: Open-Meteo (free, no API key required, global coverage)
    providers.push(this.openMeteo);

    // Secondary fallback: OpenWeatherMap (if API key is configured)
    if (OpenWeatherMapProvider.hasApiKey()) {
      providers.push(this.openWeatherMap);
    }

    return providers;
  }

  async fetchWeather(
    latitude: number,
    longitude: number,
    unit: 'celsius' | 'fahrenheit',
    language: string = 'zh-CN'
  ): Promise<WeatherData> {
    const providers = this.getProviderChain(latitude, longitude);
    const errors: Array<{ provider: string; message: string }> = [];

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const isLastProvider = i === providers.length - 1;

      try {
        const weatherData = await provider.fetchWeather(latitude, longitude, unit);

        // Log success with provider info (helpful for debugging)
        if (i > 0) {
          console.log(`[WeatherManager] Successfully fetched weather using fallback provider: ${provider.name}`);
        }

        // Fetch city name via reverse geocoding
        try {
          const cityName = await getCityName(latitude, longitude, language);
          if (cityName) {
            weatherData.location.name = cityName;
          }
        } catch (error) {
          // Silently use default location name
          console.debug('[WeatherManager] Geocoding failed, using default location name');
        }

        return weatherData;
      } catch (error) {
        const message = toErrorMessage(error);
        errors.push({ provider: provider.name, message });

        // Only log warning if not the last provider (since fallback will handle it)
        if (!isLastProvider) {
          console.debug(`[WeatherManager] Provider "${provider.name}" failed, trying next provider...`);
        } else {
          console.warn(`[WeatherManager] All providers failed. Last error: ${message}`);
        }
      }
    }

    const chain = providers.map((p) => p.name).join(' -> ');
    const details = errors.map((e) => `${e.provider}: ${e.message}`).join(' | ');
    throw new Error(`All weather providers failed (${chain}). ${details}`);
  }
}

export const weatherManager = WeatherManager.getInstance();

