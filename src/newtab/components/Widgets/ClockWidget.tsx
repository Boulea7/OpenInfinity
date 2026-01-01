import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';
import { useSettingsStore } from '../../stores';
import { getAutoTimezone } from '../../data/timezones';
import { cn } from '../../utils';

interface ClockWidgetProps {
  className?: string;
  showDate?: boolean;
  onClick?: () => void; // Callback when clock is clicked
}

/**
 * ClockWidget Component
 * Displays current time and optionally date
 * Click to open clock settings
 */
export function ClockWidget({ className, showDate = false, onClick }: ClockWidgetProps) {
  const { i18n, t } = useTranslation();
  // Precise subscriptions to prevent re-renders from unrelated settings changes
  const { viewSettings, fontSettings, clockSettings } = useSettingsStore(
    useShallow((s) => ({
      viewSettings: s.viewSettings,
      fontSettings: s.fontSettings,
      clockSettings: s.clockSettings,
    }))
  );
  const [time, setTime] = useState(new Date());

  // Dynamic tick interval: 1s when showing seconds, 60s otherwise (saves CPU)
  useEffect(() => {
    const interval = clockSettings.showSeconds ? 1000 : 60000;
    const timer = setInterval(() => {
      setTime(new Date());
    }, interval);

    return () => clearInterval(timer);
  }, [clockSettings.showSeconds]);

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
      className={cn(
        'flex flex-col items-start',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      style={{
        fontFamily: fontSettings.family,
        color: fontSettings.color,
        textShadow: fontSettings.shadow
          ? `0 2px 4px ${fontSettings.shadowColor}`
          : 'none',
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? t('settings.clock.ariaLabel', { time: timeString }) : undefined}
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
