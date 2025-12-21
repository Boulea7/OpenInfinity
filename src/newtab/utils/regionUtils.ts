/**
 * Region detection utilities
 * Shared functions for determining user location/region
 */

/**
 * Check if coordinates are within China's geographic boundaries
 * Used for weather provider selection
 */
export function isCoordinatesInChina(latitude: number, longitude: number): boolean {
  return latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135;
}

/**
 * Detect if user is in China region based on browser locale
 * Used for smart defaults (search engine, language, etc.)
 * Safe to call in non-DOM environments (service workers, tests)
 */
export function isUserLocaleChina(): boolean {
  // Check language (zh-CN, zh-TW, zh-HK, etc.) - with environment safety
  const lang = typeof navigator !== 'undefined' && navigator.language
    ? navigator.language.toLowerCase()
    : '';
  if (lang.startsWith('zh')) {
    return true;
  }

  // Check timezone as fallback - with environment safety
  const timezone = typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : '';
  const chinaTimezones = [
    'Asia/Shanghai',
    'Asia/Chongqing',
    'Asia/Harbin',
    'Asia/Urumqi',
    'Asia/Hong_Kong',
    'Asia/Macau',
    'Asia/Taipei',
  ];
  return timezone ? chinaTimezones.includes(timezone) : false;
}
