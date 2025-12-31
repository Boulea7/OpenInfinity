/**
 * WeatherSidebar Component
 *
 * Detailed weather information sidebar with forecasts and conditions.
 */

import { Cloud, Droplets, Wind, RefreshCw, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWeather } from '../../hooks';
import { cn } from '../../utils';
import { getWeatherConditionI18n } from '../../utils/weatherI18n';

/**
 * Weather condition icons based on WMO code
 * Reference: https://open-meteo.com/en/docs
 */
const WMO_ICONS: Record<number, string> = {
  // Clear
  0: '☀️',
  // Mainly clear, partly cloudy
  1: '🌤️',
  2: '⛅',
  // Overcast
  3: '☁️',
  // Fog
  45: '🌫️',
  48: '🌫️',
  // Drizzle
  51: '🌧️',
  53: '🌧️',
  55: '🌧️',
  56: '🌧️',
  57: '🌧️',
  // Rain
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  66: '🌧️',
  67: '🌧️',
  // Snow
  71: '🌨️',
  73: '🌨️',
  75: '❄️',
  77: '🌨️',
  // Showers
  80: '🌧️',
  81: '🌧️',
  82: '⛈️',
  85: '🌨️',
  86: '❄️',
  // Thunderstorm
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

function getWeatherIcon(conditionCode?: number): string {
  if (conditionCode === undefined) return '🌤️';
  return WMO_ICONS[conditionCode] || '🌤️';
}

export function WeatherSidebar() {
  const { t } = useTranslation();
  const { weather, isLoading, error, forceRefresh } = useWeather();

  if (isLoading && !weather) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="p-8 text-center">
        <Cloud className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={forceRefresh}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{t('weather.noData', 'No weather data')}</p>
      </div>
    );
  }

  const { current, forecast, location } = weather;

  return (
    <div className="p-4 space-y-6">
      {/* Current Weather */}
      <div className="text-center">
        {/* Location */}
        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
          <MapPin className="w-4 h-4" />
          <span>{location.name}</span>
          <button
            onClick={forceRefresh}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* Temperature */}
        <div className="text-6xl mb-2">
          {getWeatherIcon(current.conditionCode)}
        </div>
        <div className="text-5xl font-light text-gray-900 dark:text-gray-100 mb-1">
          {Math.round(current.temperature)}°
        </div>
        <div className="text-lg text-gray-600 dark:text-gray-300">
          {getWeatherConditionI18n(current.conditionCode, t)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('weather.feelsLike', 'Feels like')} {Math.round(current.feelsLike)}°
        </div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <Droplets className="w-4 h-4" />
            <span>{t('weather.humidity', 'Humidity')}</span>
          </div>
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {current.humidity}%
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <Wind className="w-4 h-4" />
            <span>{t('weather.windSpeed', 'Wind')}</span>
          </div>
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {current.windSpeed} km/h
          </div>
        </div>

      </div>

      {/* Forecast */}
      {forecast && forecast.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            {t('weather.forecast', 'Forecast')}
          </h3>
          <div className="space-y-2">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getWeatherIcon(day.conditionCode)}</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(day.date, t)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {getWeatherConditionI18n(day.conditionCode, t)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {Math.round(day.high)}°
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round(day.low)}°
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Update */}
      <div className="text-center text-xs text-gray-400">
        {t('weather.lastUpdate', 'Last update')}: {new Date(weather.fetchedAt).toLocaleString()}
      </div>
    </div>
  );
}

function formatDate(dateStr: string, t: (key: string, fallback: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) {
    return t('weather.today', 'Today');
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return t('weather.tomorrow', 'Tomorrow');
  }

  // Use locale-aware date formatting
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
}

export default WeatherSidebar;
