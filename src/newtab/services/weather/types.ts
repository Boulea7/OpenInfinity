/**
 * Shared weather types for multi-provider architecture
 */

export interface IWeatherProvider {
  readonly name: string;
  fetchWeather(lat: number, lon: number, unit: 'celsius' | 'fahrenheit'): Promise<WeatherData>;
}

export interface WeatherData {
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  current: {
    temperature: number;
    condition: string;
    conditionCode: number;
    humidity: number;
    windSpeed: number;
    feelsLike: number;
  };
  forecast: Array<{
    date: string;
    dayOfWeek: string;
    high: number;
    low: number;
    condition: string;
    conditionCode: number;
  }>;
  provider: string;
  fetchedAt: number;
}
