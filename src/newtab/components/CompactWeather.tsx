import { useState } from 'react';
import { useSettingsStore } from '../stores';
import { useWeather } from '../hooks';
import { getWeatherIcon } from '../services/weather';
import { Modal } from './ui/Modal';
import { WeatherWidget } from './Widgets/WeatherWidget';
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
  const [showModal, setShowModal] = useState(false);

  if (!weather || isLoading || error) return null;

  const unitLabel = weatherSettings.unit === 'celsius' ? '°C' : '°F';
  const tempText = `${weather.current.temperature}${unitLabel}`;
  const WeatherIcon = getWeatherIcon(weather.current.conditionCode);

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-white/10 border border-white/15 backdrop-blur-md shadow-sm',
          'text-white/90 select-none',
          'cursor-pointer hover:bg-white/15 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
          className
        )}
        role="button"
        tabIndex={0}
        onClick={() => setShowModal(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowModal(true);
          }
        }}
        title={`${weather.location.name} · ${weather.current.condition}`}
        aria-label={`Weather: ${weather.current.condition}, ${tempText}`}
      >
        <WeatherIcon className="w-5 h-5 text-white/90" aria-hidden="true" />
        <span className="text-sm font-medium">{tempText}</span>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size="md"
        contentClassName="!bg-zinc-900/95 !backdrop-blur-xl p-4"
        overlayClassName="backdrop-blur-md"
      >
        <WeatherWidget isExpanded={true} onToggleExpand={() => { }} />
      </Modal>
    </>
  );
}

export default CompactWeather;
