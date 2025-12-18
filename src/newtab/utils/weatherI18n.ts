/**
 * Weather i18n utilities
 * Provides internationalized weather condition names and day names
 */

import type { TFunction } from 'i18next';

/**
 * Get internationalized weather condition from WMO code
 */
export function getWeatherConditionI18n(code: number, t: TFunction): string {
  const conditionMap: Record<number, string> = {
    0: 'weather.conditions.clear',
    1: 'weather.conditions.mainlyClear',
    2: 'weather.conditions.partlyCloudy',
    3: 'weather.conditions.overcast',
    45: 'weather.conditions.fog',
    48: 'weather.conditions.depositingRimeFog',
    51: 'weather.conditions.lightDrizzle',
    53: 'weather.conditions.moderateDrizzle',
    55: 'weather.conditions.denseDrizzle',
    56: 'weather.conditions.lightFreezingDrizzle',
    57: 'weather.conditions.denseFreezingDrizzle',
    61: 'weather.conditions.slightRain',
    63: 'weather.conditions.moderateRain',
    65: 'weather.conditions.heavyRain',
    66: 'weather.conditions.lightFreezingRain',
    67: 'weather.conditions.heavyFreezingRain',
    71: 'weather.conditions.slightSnow',
    73: 'weather.conditions.moderateSnow',
    75: 'weather.conditions.heavySnow',
    77: 'weather.conditions.snowGrains',
    80: 'weather.conditions.slightRainShowers',
    81: 'weather.conditions.moderateRainShowers',
    82: 'weather.conditions.violentRainShowers',
    85: 'weather.conditions.slightSnowShowers',
    86: 'weather.conditions.heavySnowShowers',
    95: 'weather.conditions.thunderstorm',
    96: 'weather.conditions.thunderstormWithSlightHail',
    99: 'weather.conditions.thunderstormWithHeavyHail',
  };

  const key = conditionMap[code];
  return key ? t(key) : t('weather.conditions.unknown');
}

/**
 * Get internationalized day name from day index (0-6)
 */
export function getDayNameI18n(dayIndex: number, t: TFunction): string {
  const dayKeys = [
    'weather.days.sunday',
    'weather.days.monday',
    'weather.days.tuesday',
    'weather.days.wednesday',
    'weather.days.thursday',
    'weather.days.friday',
    'weather.days.saturday',
  ];

  return t(dayKeys[dayIndex] || dayKeys[0]);
}

/**
 * Get day index from date string
 */
export function getDayIndex(dateString: string): number {
  const date = new Date(`${dateString}T00:00:00`);
  return date.getDay();
}
