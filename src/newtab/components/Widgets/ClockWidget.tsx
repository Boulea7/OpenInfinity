import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores';
import { cn } from '../../utils';

interface ClockWidgetProps {
  className?: string;
  showDate?: boolean;
}

/**
 * ClockWidget Component
 * Displays current time and optionally date
 */
export function ClockWidget({ className, showDate = false }: ClockWidgetProps) {
  const { viewSettings, fontSettings } = useSettingsStore();
  const [time, setTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!viewSettings.showClock) return null;

  // Format time
  const timeString = time.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Format date
  const dateString = time.toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={cn('flex flex-col items-start', className)}
      style={{
        fontFamily: fontSettings.family,
        color: fontSettings.color,
        textShadow: fontSettings.shadow
          ? `0 2px 4px ${fontSettings.shadowColor}`
          : 'none',
      }}
    >
      {/* Time */}
      <div
        className={cn(
          'font-semibold leading-none',
          fontSettings.weight === 'bold' && 'font-bold',
          fontSettings.weight === 'normal' && 'font-normal'
        )}
        style={{ fontSize: `${fontSettings.size * 3}px` }}
      >
        {timeString}
      </div>

      {/* Date */}
      {showDate && (
        <div
          className="mt-1 opacity-80"
          style={{ fontSize: `${fontSettings.size}px` }}
        >
          {dateString}
        </div>
      )}
    </div>
  );
}

export default ClockWidget;
