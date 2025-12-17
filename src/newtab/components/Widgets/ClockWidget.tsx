import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores';
import { getAutoTimezone } from '../../data/timezones';
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
  const { i18n } = useTranslation();
  const { viewSettings, fontSettings, clockSettings } = useSettingsStore();
  const [time, setTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!viewSettings.showClock) return null;

  // Get timezone (auto-detect or manual)
  const timezone = clockSettings.autoDetect ? getAutoTimezone() : clockSettings.timezone;
  const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US';

  // Format time with timezone support
  const timeString = time.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: clockSettings.showSeconds ? '2-digit' : undefined,
    hour12: clockSettings.format === '12h',
    timeZone: timezone === 'auto' ? undefined : timezone,
  });

  // Format date with timezone support
  const dateString = time.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: timezone === 'auto' ? undefined : timezone,
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
