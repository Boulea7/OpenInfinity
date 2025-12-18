/**
 * Shared weather types for multi-provider architecture
 */

export interface IWeatherProvider {
  readonly name: string;
  fetchWeather(lat: number, lon: number, unit: 'celsius' | 'fahrenheit'): Promise<WeatherData>;
}

export interface WeatherData {
  location: {
    name: string; // City name from geocoding or fallback
    latitude: number;
    longitude: number;
  };
  current: {
    temperature: number;
    condition: string; // English condition (for backward compatibility)
    conditionCode: number; // WMO code for icon and i18n
    humidity: number;
    windSpeed: number;
    feelsLike: number;
  };
  forecast: Array<{
    date: string; // YYYY-MM-DD format
    dayOfWeek: string; // DEPRECATED: Use dayIndex instead
    dayIndex: number; // Day index 0-6 for i18n
    high: number;
    low: number;
    condition: string; // English condition (for backward compatibility)
    conditionCode: number; // WMO code for icon and i18n
  }>;
  provider: string;
  fetchedAt: number;
}
