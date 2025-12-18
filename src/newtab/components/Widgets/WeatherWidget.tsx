import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, RefreshCw, Droplets, Wind, Thermometer, ChevronDown, ChevronRight, AlertCircle, MapPin } from 'lucide-react';
import { useSettingsStore } from '../../stores';
import { useWeather } from '../../hooks';
import { cn } from '../../utils';
import { getWeatherIcon } from '../../services/weather';
import { getWeatherConditionI18n, getDayNameI18n } from '../../utils/weatherI18n';
import type { BaseWidgetProps } from '../../types';

/**
 * Weather Widget component
 * Displays current weather and forecast data
 */
export function WeatherWidget({ isExpanded, onToggleExpand, className }: BaseWidgetProps) {
  const { t } = useTranslation();
  const { weatherSettings, setWeatherSettings, language } = useSettingsStore();
  const { weather, isLoading, error, forceRefresh } = useWeather();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Handle manual refresh (P0-7: Force refresh bypassing cache)
  const handleRefresh = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      await forceRefresh(); // Force refresh bypasses cache
    } finally {
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      // Set new timeout
      refreshTimeoutRef.current = setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [forceRefresh]);

  // Toggle temperature unit
  const toggleUnit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newUnit = weatherSettings.unit === 'celsius' ? 'fahrenheit' : 'celsius';
    setWeatherSettings({ unit: newUnit });
  }, [weatherSettings.unit, setWeatherSettings]);

  // Get forecast days to display
  const forecastDays = weatherSettings.showForecast
    ? weather?.forecast.slice(0, weatherSettings.forecastDays) || []
    : [];

  // Format temperature
  const formatTemp = (temp: number) => {
    const unit = weatherSettings.unit === 'celsius' ? '°C' : '°F';
    return `${temp}${unit}`;
  };

  const renderConditionIcon = (code: number, className: string) => {
    const Icon = getWeatherIcon(code);
    return <Icon className={className} aria-hidden="true" />;
  };

  return (
    <div className={cn('bg-white/5 rounded-lg overflow-hidden border border-white/10', className)}>
      {/* Header */}
      <div
        role="button"
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        tabIndex={0}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-white/80" />
          <span className="font-medium text-white">{t('settings.layout.widgetSidebar.widgets.weather')}</span>
          {weather && !isLoading && (
            <span className="text-sm text-white/80 ml-1">
              {formatTemp(weather.current.temperature)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className={cn(
              'p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50',
              isRefreshing && 'animate-spin'
            )}
            title={t('weather.refresh')}
            aria-label={t('weather.refresh')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/60" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 border-t border-white/10 space-y-3">
          {/* Loading State */}
          {isLoading && !weather && (
            <div className="flex flex-col items-center justify-center py-6">
              <RefreshCw className="w-8 h-8 text-white/40 animate-spin mb-2" />
              <p className="text-sm text-white/60">正在获取天气数据...</p>
            </div>
          )}

          {/* Error State - show even with cached data */}
          {error && weather && (
            <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400 text-center">刷新失败，显示缓存数据</p>
            </div>
          )}

          {/* Error State - no cached data */}
          {error && !weather && (
            <div className="flex flex-col items-center justify-center py-6">
              <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
              <p className="text-sm text-white/60 text-center mb-3">{error}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  forceRefresh();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                重试
              </button>
            </div>
          )}

          {/* Weather Data */}
          {weather && (
            <>
              {/* Current Weather */}
              <div className="space-y-3">
                {/* Main Display */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renderConditionIcon(weather.current.conditionCode, 'w-10 h-10 text-white/90')}
                    <div>
                      <button
                        onClick={toggleUnit}
                        className="text-3xl font-bold text-white hover:text-white/80 transition-colors cursor-pointer"
                        title={t('settings.clock.format')}
                      >
                        {formatTemp(weather.current.temperature)}
                      </button>
                      <p className="text-sm text-white/60">{getWeatherConditionI18n(weather.current.conditionCode, t)}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="truncate">{weather.location.name || t('weather.currentLocation')}</span>
                </div>

                {/* Weather Details */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-white/10">
                  <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                    <Thermometer className="w-4 h-4 text-white/60 mb-1" />
                    <span className="text-xs text-white/50">{t('weather.feelsLike')}</span>
                    <span className="text-sm text-white font-medium">
                      {formatTemp(weather.current.feelsLike)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                    <Droplets className="w-4 h-4 text-white/60 mb-1" />
                    <span className="text-xs text-white/50">{t('weather.humidity')}</span>
                    <span className="text-sm text-white font-medium">
                      {weather.current.humidity}%
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                    <Wind className="w-4 h-4 text-white/60 mb-1" />
                    <span className="text-xs text-white/50">{t('weather.wind')}</span>
                    <span className="text-sm text-white font-medium">
                      {weather.current.windSpeed} km/h
                    </span>
                  </div>
                </div>
              </div>

              {/* Forecast */}
              {weatherSettings.showForecast && forecastDays.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-xs text-white/60 font-medium mb-2">{t('weather.forecast')}</div>
                  <div className="space-y-1">
                    {forecastDays.map((day) => {
                      const dayName = getDayNameI18n(day.dayIndex || 0, t);
                      const condition = getWeatherConditionI18n(day.conditionCode, t);
                      return (
                        <div key={day.date} className="flex items-center justify-between text-sm py-1">
                          <div className="flex items-center gap-2 flex-1">
                            {renderConditionIcon(day.conditionCode, 'w-4 h-4 text-white/70')}
                            <span className="text-white/70 min-w-[4rem]">{dayName}</span>
                            <span className="text-white/40 text-xs flex-1 truncate">{condition}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/80 font-medium">
                            <span className="text-white/60">{day.low}°</span>
                            <span>/</span>
                            <span>{day.high}°</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              <div className="text-xs text-white/40 text-center pt-2 border-t border-white/10">
                {t('weather.lastUpdated')}: {new Date(weather.fetchedAt).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
