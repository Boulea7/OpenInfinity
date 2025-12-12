/**
 * Navigation Utilities
 * Unified URL opening behavior across the application
 */

import type { OpenBehavior } from '../stores/settingsStore';

/**
 * Open URL with specified behavior
 * Respects user settings for how links should open
 *
 * @param url - URL to open
 * @param behavior - How to open: 'current' | 'new-tab' | 'new-window'
 * @param settings - Optional open behavior settings from store
 */
export function openUrl(
  url: string,
  behavior: 'current' | 'new-tab' | 'new-window' = 'new-tab',
  settings?: OpenBehavior
): void {
  // If behavior is 'current' and settings exist, use the website default
  const finalBehavior = behavior === 'current' && settings
    ? settings.websites
    : behavior;

  // Map settings format to our behavior format
  const mappedBehavior = finalBehavior === 'new_tab'
    ? 'new-tab'
    : finalBehavior === 'current_tab'
      ? 'current'
      : finalBehavior;

  switch (mappedBehavior) {
    case 'current':
      window.location.href = url;
      break;

    case 'new-tab':
      window.open(url, '_blank', 'noopener,noreferrer');
      break;

    case 'new-window':
      // Open in new window with specific dimensions
      window.open(
        url,
        '_blank',
        'noopener,noreferrer,width=1200,height=800,menubar=no,toolbar=no,location=no,status=no'
      );
      break;

    default:
      // Fallback to new tab
      window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Open URL from icon/bookmark with settings
 * Convenience wrapper that reads from settings store
 */
export function openWebsite(url: string, openBehaviorSettings: OpenBehavior): void {
  openUrl(url, 'current', openBehaviorSettings);
}

/**
 * Check if URL is safe to open
 * Basic validation to prevent javascript: and data: schemes
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  const lower = url.toLowerCase().trim();

  // Block dangerous schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const scheme of dangerousSchemes) {
    if (lower.startsWith(scheme)) {
      return false;
    }
  }

  return true;
}

/**
 * Safe URL opener with validation
 */
export function openUrlSafe(
  url: string,
  behavior: 'current' | 'new-tab' | 'new-window' = 'new-tab',
  settings?: OpenBehavior
): boolean {
  if (!isSafeUrl(url)) {
    console.warn('Blocked potentially unsafe URL:', url);
    return false;
  }

  openUrl(url, behavior, settings);
  return true;
}
