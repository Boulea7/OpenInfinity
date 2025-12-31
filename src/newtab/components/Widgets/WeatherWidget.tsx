import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';
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
export function WeatherWidget({ isExpanded, onToggleExpand, className, hideHeader }: BaseWidgetProps) {
  const { t } = useTranslation();
  // Precise subscriptions to prevent re-renders from unrelated settings changes
  const { weatherSettings, setWeatherSettings, language } = useSettingsStore(
    useShallow((s) => ({
      weatherSettings: s.weatherSettings,
      setWeatherSettings: s.setWeatherSettings,
      language: s.language,
    }))
  );
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

  // Get forecast days to display - use useMemo to prevent unnecessary recalculations
  const forecastDays = useMemo(() => {
    if (!weatherSettings.showForecast || !weather?.forecast) return [];
    return weather.forecast.slice(0, weatherSettings.forecastDays);
  }, [weather?.forecast, weatherSettings.showForecast, weatherSettings.forecastDays]);

  // Format temperature
  const formatTemp = (temp: number) => {
    const unit = weatherSettings.unit === 'celsius' ? '°C' : '°F';
    return `${temp}${unit}`;
  };

  const renderConditionIcon = (code: number, className: string) => {
    const Icon = getWeatherIcon(code);
    return <Icon className={className} aria-hidden="true" />;
  };

  // ========== Detailed View (Popup) ==========
  if (hideHeader && isExpanded) {
    if (!weather && isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-white/50 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-xs font-medium tracking-wide">{t('weather.refresh')}...</span>
        </div>
      );
    }

    if (!weather && error) {
      return (
        <div className="flex flex-col items-center justify-center p-10 text-red-300 space-y-3">
          <AlertCircle className="w-8 h-8" />
          <span className="text-xs text-center">{error}</span>
          <button onClick={handleRefresh} className="px-4 py-1.5 bg-white/10 rounded-full text-xs hover:bg-white/20 transition-colors">
            {t('weather.refresh')}
          </button>
        </div>
      );
    }

    if (!weather) return null;

    return (
      <div className={cn('text-white select-none pb-4', className)}>
        {/* Header: Location & Actions */}
        <div className="flex items-start justify-between px-6 pt-6 mb-4">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight shadow-black/50 drop-shadow-sm">
              {weather.location.name || t('weather.currentLocation')}
            </span>
            <span className="text-sm text-white/60 font-medium">{getWeatherConditionI18n(weather.current.conditionCode, t)}</span>
          </div>
          <div className="flex items-center gap-1 -mr-2">
            <button
              onClick={toggleUnit}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-xs font-bold text-white/60 hover:text-white transition-all"
              title={t('settings.clock.format')}
            >
              {weatherSettings.unit === 'celsius' ? '°C' : '°F'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all",
                isRefreshing && "animate-spin"
              )}
              title={t('weather.refresh')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero: Temp & Icon */}
        <div className="flex items-center justify-between px-6 mb-8 relative">
          <div className="flex flex-col z-10">
            <span className="text-7xl font-extralight tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
              {Math.round(weather.current.temperature)}°
            </span>
            <div className="flex items-center gap-2 mt-1 text-white/50 text-xs font-medium uppercase tracking-wider pl-1">
              <span>H:{weather.forecast[0]?.high}°</span>
              <span>L:{weather.forecast[0]?.low}°</span>
            </div>
          </div>
          <div className="relative">
            {renderConditionIcon(weather.current.conditionCode, 'w-24 h-24 text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] animate-float-slow')}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-3 px-5 mb-6">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm shadow-sm group hover:bg-white/10 transition-colors">
            <Wind className="w-5 h-5 text-blue-300 mb-1.5 opacity-80 group-hover:opacity-100" />
            <span className="text-xs text-white/40 mb-0.5">{t('weather.wind')}</span>
            <span className="text-sm font-semibold">{weather.current.windSpeed} <span className="text-[10px] font-normal opacity-60">km/h</span></span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm shadow-sm group hover:bg-white/10 transition-colors">
            <Droplets className="w-5 h-5 text-cyan-300 mb-1.5 opacity-80 group-hover:opacity-100" />
            <span className="text-xs text-white/40 mb-0.5">{t('weather.humidity')}</span>
            <span className="text-sm font-semibold">{weather.current.humidity}%</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm shadow-sm group hover:bg-white/10 transition-colors">
            <Thermometer className="w-5 h-5 text-orange-300 mb-1.5 opacity-80 group-hover:opacity-100" />
            <span className="text-xs text-white/40 mb-0.5">{t('weather.feelsLike')}</span>
            <span className="text-sm font-semibold">{Math.round(weather.current.feelsLike)}°</span>
          </div>
        </div>

        {/* Forecast: Horizontal Scroll */}
        {forecastDays.length > 0 && (
          <div className="px-5">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-white/40 pl-1 uppercase tracking-wider">{t('weather.forecast')}</span>
              <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1 scrollbar-hide mask-fade-right">
                {forecastDays.map((day, i) => (
                  <div key={day.date} className="flex flex-col items-center min-w-[4.5rem] p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-xs font-medium text-white/60 mb-2">
                      {i === 0 ? t('common.today') : getDayNameI18n(day.dayIndex || 0, t).slice(0, 3)}
                    </span>
                    {renderConditionIcon(day.conditionCode, 'w-6 h-6 text-white/90 mb-2')}
                    <div className="flex flex-col items-center text-sm font-medium">
                      <span className="text-white">{Math.round(day.high)}°</span>
                      <span className="text-white/40 text-xs">{Math.round(day.low)}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== Original Sidebar / List View ==========
  return (
    <div className={cn('bg-white/5 rounded-lg overflow-hidden border border-white/10', className)}>
      {/* Original Header */}
      {!hideHeader && (
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
      )}

      {/* Content (List) */}
      {isExpanded && !hideHeader && (
        <div className="p-3 border-t border-white/10 space-y-3">
          {/* ... keeping original logic largely the same simplified ... */}
          {isLoading && !weather && (
            <div className="flex flex-col items-center justify-center py-6">
              <RefreshCw className="w-8 h-8 text-white/40 animate-spin mb-2" />
              <p className="text-sm text-white/60">Loading...</p>
            </div>
          )}

          {error && weather && (
            <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg"> <p className="text-xs text-red-400 text-center">Update failed</p> </div>
          )}

          {error && !weather && (
            <div className="flex flex-col items-center justify-center py-6 text-red-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm text-white/60 text-center mb-3">{error}</p>
              <button onClick={(e) => { e.stopPropagation(); forceRefresh(); }} className="px-4 py-2 bg-blue-600 rounded-lg text-sm text-white">Retry</button>
            </div>
          )}

          {weather && (
            <>
              {/* Current Weather List Style */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renderConditionIcon(weather.current.conditionCode, 'w-10 h-10 text-white/90')}
                    <div>
                      <button onClick={toggleUnit} className="text-3xl font-bold text-white hover:text-white/80 transition-colors">
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

                {/* Details Grid - Original */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-white/10">
                  <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                    <Thermometer className="w-4 h-4 text-white/60 mb-1" />
                    <span className="text-xs text-white/50">{t('weather.feelsLike')}</span>
                    <span className="text-sm text-white font-medium">{formatTemp(weather.current.feelsLike)}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                    <Droplets className="w-4 h-4 text-white/60 mb-1" />
                    <span className="text-xs text-white/50">{t('weather.humidity')}</span>
                    <span className="text-sm text-white font-medium">{weather.current.humidity}%</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                    <Wind className="w-4 h-4 text-white/60 mb-1" />
                    <span className="text-xs text-white/50">{t('weather.wind')}</span>
                    <span className="text-sm text-white font-medium">{weather.current.windSpeed} km/h</span>
                  </div>
                </div>
              </div>

              {/* Forecast List Style */}
              {weatherSettings.showForecast && forecastDays.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-xs text-white/60 font-medium mb-2">{t('weather.forecast')}</div>
                  <div className="space-y-1">
                    {forecastDays.map((day) => (
                      <div key={day.date} className="flex items-center justify-between text-sm py-1">
                        <div className="flex items-center gap-2 flex-1">
                          {renderConditionIcon(day.conditionCode, 'w-4 h-4 text-white/70')}
                          <span className="text-white/70 min-w-[4rem]">{getDayNameI18n(day.dayIndex || 0, t)}</span>
                          <span className="text-white/40 text-xs flex-1 truncate">{getWeatherConditionI18n(day.conditionCode, t)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 font-medium">
                          <span className="text-white/60">{Math.round(day.low)}°</span>
                          <span>/</span>
                          <span>{Math.round(day.high)}°</span>
                        </div>
                      </div>
                    ))}
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
