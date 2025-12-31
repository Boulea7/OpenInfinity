import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, MapPinOff } from 'lucide-react';
import { useSettingsStore } from '../stores';
import { useWeatherUiStore } from '../stores/weatherUiStore';
import { useWeather } from '../hooks';
import type { WeatherCache } from '../services/database';
import { getWeatherIcon } from '../services/weather';
import { WeatherWidget } from './Widgets/WeatherWidget';
import { cn } from '../utils';
import { ensureFeaturePermissions, PERMISSION_GROUPS } from '../../shared/permissions';
import { getWeatherConditionI18n } from '../utils/weatherI18n';

interface CompactWeatherProps {
  className?: string;
}

/**
 * CompactWeather Component
 * A minimal header widget that expands to show detailed weather
 * Backend logic ready - awaiting frontend design from Gemini
 */
export function CompactWeather({ className }: CompactWeatherProps) {
  const { t } = useTranslation();
  const { weatherSettings } = useSettingsStore();
  const { weather, isLoading, error, forceRefresh } = useWeather();
  const { isExpanded, setExpanded, toggle } = useWeatherUiStore();
  const buttonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Anti-flicker: preserve last valid weather data during refetch
  // This prevents UI from flickering when cache is temporarily unavailable
  const prevWeatherRef = useRef<WeatherCache | null>(null);
  if (weather) {
    prevWeatherRef.current = weather;
  }
  const displayWeather = weather || prevWeatherRef.current;

  // Close on click outside
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInPanel = !!panelRef.current?.contains(target);
      const clickedInButton = !!buttonRef.current?.contains(target);

      if (!clickedInPanel && !clickedInButton) {
        setExpanded(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExpanded]);


  // Common pill styles for all states
  const pillBaseStyles = cn(
    'flex items-center gap-2 px-3 py-1.5 rounded-full',
    'bg-black/20 dark:bg-white/10 border border-white/15 backdrop-blur-md shadow-sm',
    'text-white select-none',
    '[text-shadow:0_1px_3px_rgba(0,0,0,0.5)]'
  );

  const requestWeatherNetworkAccess = async () => {
    const ok = await ensureFeaturePermissions([], PERMISSION_GROUPS.weather);
    if (!ok) return false;
    await forceRefresh();
    return true;
  };

  // No data and not expanded - initial state, hide component
  if (!displayWeather && !isLoading && !error && !isExpanded) return null;

  const unitLabel = weatherSettings.unit === 'celsius' ? '°C' : '°F';
  const tempText = displayWeather ? `${displayWeather.current.temperature}${unitLabel}` : '';
  const WeatherIcon = displayWeather ? getWeatherIcon(displayWeather.current.conditionCode) : null;
  const conditionText = displayWeather ? getWeatherConditionI18n(displayWeather.current.conditionCode, t) : '';

  return (
    <div className={cn('relative', className)}>
      {/* Compact Weather Button */}
      {error && !displayWeather ? (
        <div
          ref={buttonRef}
          className={cn(
            pillBaseStyles,
            'cursor-pointer hover:bg-black/30 dark:hover:bg-white/15 transition-colors duration-200',
            isExpanded && 'bg-black/30 dark:bg-white/20'
          )}
          role="button"
          tabIndex={0}
          onClick={requestWeatherNetworkAccess}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              void requestWeatherNetworkAccess();
            }
          }}
          title={t('weather.clickToRetry')}
          aria-label={t('weather.locationError')}
          aria-expanded={isExpanded}
        >
          <MapPinOff className="w-4 h-4 text-white/70" />
          <span className="text-sm text-white/70">{t('weather.locationFailed')}</span>
        </div>
      ) : isLoading && !displayWeather ? (
        <div ref={buttonRef} className={pillBaseStyles} title={t('weather.loading')}>
          <RefreshCw className="w-4 h-4 text-white/80 animate-spin" />
          <span className="text-sm text-white/80">{t('weather.loading')}</span>
        </div>
      ) : (
        <div
          ref={buttonRef}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            'bg-black/20 dark:bg-white/10 border border-white/15 backdrop-blur-md shadow-sm',
            'text-white select-none',
            'cursor-pointer hover:bg-black/30 dark:hover:bg-white/15 transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
            // Text shadow for readability on any wallpaper
            '[text-shadow:0_1px_3px_rgba(0,0,0,0.5)]',
            isExpanded && 'bg-black/30 dark:bg-white/20'
          )}
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          }}
          title={displayWeather ? `${displayWeather.location.name} · ${conditionText}` : t('weather.loading')}
          aria-label={displayWeather ? `${conditionText}, ${tempText}` : t('weather.loading')}
          aria-expanded={isExpanded}
        >
          {WeatherIcon ? (
            <WeatherIcon className="w-5 h-5 text-white drop-shadow-sm" aria-hidden="true" />
          ) : (
            <RefreshCw className="w-4 h-4 text-white/70" aria-hidden="true" />
          )}
          <span className="text-sm font-medium drop-shadow-sm">{displayWeather ? tempText : t('weather.loading')}</span>
        </div>
      )}

      {/* Expanded Weather Panel */}
      {isExpanded && (
        <div
          ref={panelRef}
          className={cn(
            'absolute top-full mt-3 left-0',
            'w-96 z-50 origin-top-left', // Increased width (384px)
            'animate-weather-expand'
          )}
        >
          {/* Decorative Arrow (Speech Bubble Tail) */}
          <svg
            className="absolute -top-2.5 left-6 w-5 h-3 text-zinc-900/80 fill-current z-10"
            viewBox="0 0 20 10"
            preserveAspectRatio="none"
          >
            <path
              d="M10 0L20 10H0L10 0Z"
              className="stroke-white/10"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            {/* Cover the bottom border line of the arrow to merge with container */}
            <path d="M0 10H20" stroke="transparent" strokeWidth="2" />
          </svg>

          {/* Main Card Container */}
          <div className={cn(
            'relative overflow-hidden',
            'bg-zinc-900/80 backdrop-filter backdrop-blur-xl', // Immediate blur
            'border border-white/10 ring-1 ring-black/20',
            'rounded-3xl shadow-2xl shadow-black/50',
            'flex flex-col'
          )}>
            {/* Top Gloss Highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            {/* Weather Content */}
            <div className="relative z-10">
              {displayWeather ? (
                <WeatherWidget
                  isExpanded={true}
                  onToggleExpand={() => setExpanded(false)}
                  hideHeader={true}
                  className="!bg-transparent !border-none !rounded-none !shadow-none !p-0"
                />
              ) : (
                <div className="p-6 text-white/80">
                  <div className="text-sm font-medium mb-2">{t('weather.locationError')}</div>
                  <div className="text-xs text-white/60 mb-4">{error || t('weather.loading')}</div>
                  <button
                    type="button"
                    onClick={requestWeatherNetworkAccess}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-sm"
                  >
                    {t('weather.authorizeAndRetry', '授权并重试')}
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Accent Glow */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none mix-blend-screen" />
          </div>
        </div>
      )}
    </div>
  );
}

export default CompactWeather;
