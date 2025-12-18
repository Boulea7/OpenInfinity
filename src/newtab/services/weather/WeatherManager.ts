/**
 * WeatherManager
 * Orchestrates multiple weather providers with region-based preference and fallback.
 */

import type { IWeatherProvider, WeatherData } from './types';
import { OpenMeteoProvider } from './providers/OpenMeteoProvider';
import { OpenWeatherMapProvider } from './providers/OpenWeatherMapProvider';
import { QWeatherProvider } from './providers/QWeatherProvider';

function isInChinaRegion(latitude: number, longitude: number): boolean {
  return latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135;
}

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
    if (isInChinaRegion(latitude, longitude)) {
      return [this.qweather, this.openMeteo, this.openWeatherMap];
    }
    return [this.openMeteo, this.openWeatherMap, this.qweather];
  }

  async fetchWeather(
    latitude: number,
    longitude: number,
    unit: 'celsius' | 'fahrenheit'
  ): Promise<WeatherData> {
    const providers = this.getProviderChain(latitude, longitude);
    const errors: Array<{ provider: string; message: string }> = [];

    for (const provider of providers) {
      try {
        return await provider.fetchWeather(latitude, longitude, unit);
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

