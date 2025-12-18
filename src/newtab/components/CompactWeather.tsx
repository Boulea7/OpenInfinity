import { useSettingsStore } from '../stores';
import { useWeather } from '../hooks';
import { getWeatherIcon } from '../services/weather';
import { cn } from '../utils';

interface CompactWeatherProps {
  className?: string;
}

/**
 * CompactWeather Component
 * A minimal header widget: [icon] 22°C
 * Silent failure: renders nothing during loading or error.
 */
export function CompactWeather({ className }: CompactWeatherProps) {
  const { weatherSettings } = useSettingsStore();
  const { weather, isLoading, error } = useWeather();

  if (!weather || isLoading || error) return null;

  const unitLabel = weatherSettings.unit === 'celsius' ? '°C' : '°F';
  const tempText = `${weather.current.temperature}${unitLabel}`;
  const icon = getWeatherIcon(weather.current.conditionCode);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-white/10 border border-white/15 backdrop-blur-md shadow-sm',
        'text-white/90 select-none',
        className
      )}
      title={`${weather.location.name} · ${weather.current.condition}`}
      aria-label={`Weather: ${weather.current.condition}, ${tempText}`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-sm font-medium">{tempText}</span>
    </div>
  );
}

export default CompactWeather;

