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
          'bg-white/10 border border-white/15 backdrop-blur-md shadow-sm',
          'text-white/90 select-none',
          'cursor-pointer hover:bg-white/15 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
          isExpanded && 'bg-white/20'
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
        <WeatherIcon className="w-5 h-5 text-white/90" aria-hidden="true" />
        <span className="text-sm font-medium">{tempText}</span>
      </div>

      {/* Expanded Weather Panel - TO BE DESIGNED BY GEMINI */}
      {/* Expanded Weather Panel */}
      {isExpanded && (
        <div
          ref={panelRef}
          className={cn(
            'absolute top-full mt-3 left-0',
            'w-[22rem] z-50 origin-top-left', // Width ~352px
            'animate-weather-expand' // Custom animation
          )}
        >
          {/* Decorative Arrow (pointing to button center) */}
          <div
            className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 bg-zinc-900/95 border-t border-l border-white/10"
            aria-hidden="true"
          />

          {/* Main Card Container */}
          <div className={cn(
            'relative overflow-hidden',
            'bg-zinc-900/95 backdrop-blur-2xl', // Deep elegant dark glass
            'border border-white/10 ring-1 ring-black/20', // Subtle borders
            'rounded-2xl shadow-2xl shadow-black/50', // Deep depth
            'flex flex-col'
          )}>
            {/* Top Gloss Highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            {/* Weather Content */}
            <div className="relative z-10">
              <WeatherWidget
                isExpanded={true}
                onToggleExpand={() => { }}
                className="!bg-transparent !border-none !rounded-none !shadow-none"
              />
            </div>

            {/* Bottom Accent Glow (Subtle Brand Color) */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-orange-500/10 blur-[50px] rounded-full pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}

export default CompactWeather;
