import { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../stores';
import { useWeather } from '../hooks';
import { getWeatherIcon } from '../services/weather';
import { WeatherWidget } from './Widgets/WeatherWidget';
import { cn } from '../utils';

interface CompactWeatherProps {
  className?: string;
}

/**
 * CompactWeather Component
 * A minimal header widget that expands to show detailed weather
 * Backend logic ready - awaiting frontend design from Gemini
 */
export function CompactWeather({ className }: CompactWeatherProps) {
  const { weatherSettings } = useSettingsStore();
  const { weather, isLoading, error } = useWeather();
  const [isExpanded, setIsExpanded] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExpanded]);


  if (!weather || isLoading || error) return null;

  const unitLabel = weatherSettings.unit === 'celsius' ? '°C' : '°F';
  const tempText = `${weather.current.temperature}${unitLabel}`;
  const WeatherIcon = getWeatherIcon(weather.current.conditionCode);

  return (
    <div className={cn('relative', className)}>
      {/* Compact Weather Button */}
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
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        title={`${weather.location.name} · ${weather.current.condition}`}
        aria-label={`Weather: ${weather.current.condition}, ${tempText}`}
        aria-expanded={isExpanded}
      >
        <WeatherIcon className="w-5 h-5 text-white drop-shadow-sm" aria-hidden="true" />
        <span className="text-sm font-medium drop-shadow-sm">{tempText}</span>
      </div>

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
              <WeatherWidget
                isExpanded={true}
                onToggleExpand={() => setIsExpanded(false)}
                hideHeader={true}
                className="!bg-transparent !border-none !rounded-none !shadow-none !p-0"
              />
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
