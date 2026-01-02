/**
 * Permission utilities for Chrome Extension MV3
 *
 * Provides functions to request optional permissions and host permissions on demand.
 * This enables a "minimal permissions at install" approach where we only ask
 * for permissions when the user actually needs a feature.
 */

const IS_DEV = !!(import.meta as any)?.env?.DEV;

function debugLog(...args: unknown[]) {
  if (!IS_DEV) return;
  // eslint-disable-next-line no-console
  console.debug(...args);
}

/**
 * Check if the extension has specific permissions
 */
export async function hasPermissions(permissions: readonly string[]): Promise<boolean> {
  try {
    return await chrome.permissions.contains({ permissions: [...permissions] });
  } catch (error) {
    console.warn('[Permissions] Failed to check permissions:', error);
    return false;
  }
}

/**
 * Check if the extension has access to specific origins
 */
export async function hasOrigins(origins: readonly string[]): Promise<boolean> {
  try {
    return await chrome.permissions.contains({ origins: [...origins] });
  } catch (error) {
    console.warn('[Permissions] Failed to check origins:', error);
    return false;
  }
}

/**
 * Request optional permissions and/or origins from the user.
 *
 * IMPORTANT:
 * - This MUST be called from a user gesture (click, keypress) to trigger the prompt.
 * - Do NOT pre-check with chrome.permissions.contains() before calling request().
 *   The async boundary can break the user-gesture requirement in some browsers.
 * - Requesting already-granted permissions returns true without prompting.
 */
export async function requestOptionalAccess(params: {
  permissions?: readonly string[];
  origins?: readonly string[];
}): Promise<boolean> {
  try {
    const permissions = params.permissions ? [...params.permissions] : [];
    const origins = params.origins ? [...params.origins] : [];

    if (permissions.length === 0 && origins.length === 0) return true;

    const granted = await chrome.permissions.request({
      permissions: permissions.length ? permissions : undefined,
      origins: origins.length ? origins : undefined,
    });

    debugLog('[Permissions] Request result:', { granted, permissions, origins });
    return granted;
  } catch (error) {
    console.error('[Permissions] Failed to request optional access:', error);
    return false;
  }
}

/**
 * Request optional permissions from the user
 * Returns true if granted, false otherwise
 *
 * Note: This must be called from a user gesture (click, keypress)
 * to trigger the permission prompt.
 */
export async function ensureOptionalPermissions(permissions: readonly string[]): Promise<boolean> {
  return requestOptionalAccess({ permissions });
}

/**
 * Request optional host permissions (origins) from the user
 * Returns true if granted, false otherwise
 *
 * Note: This must be called from a user gesture (click, keypress)
 * to trigger the permission prompt.
 */
export async function ensureOptionalOrigins(origins: readonly string[]): Promise<boolean> {
  return requestOptionalAccess({ origins });
}

/**
 * Remove optional permissions (useful for cleanup or privacy)
 */
export async function removePermissions(permissions: readonly string[]): Promise<boolean> {
  try {
    return await chrome.permissions.remove({ permissions: [...permissions] });
  } catch (error) {
    console.warn('[Permissions] Failed to remove permissions:', error);
    return false;
  }
}

/**
 * Remove optional host permissions
 */
export async function removeOrigins(origins: readonly string[]): Promise<boolean> {
  try {
    return await chrome.permissions.remove({ origins: [...origins] });
  } catch (error) {
    console.warn('[Permissions] Failed to remove origins:', error);
    return false;
  }
}

// Common permission groups for features
export const PERMISSION_GROUPS = {
  // Weather feature - all provider origins consolidated
  // This includes Open-Meteo (free), QWeather (China), and OpenWeatherMap (global fallback)
  weather: [
    'https://api.open-meteo.com/*',
    'https://nominatim.openstreetmap.org/*',
    'https://devapi.qweather.com/*',
    'https://*.qweatherapi.com/*',
    'https://api.openweathermap.org/*',
  ],

  // Legacy: kept for backward compatibility (may be removed in future)
  weatherQWeather: [
    'https://devapi.qweather.com/*',
    'https://*.qweatherapi.com/*',
  ],

  weatherOpenWeatherMap: ['https://api.openweathermap.org/*'],

  // Wallpaper feature requires these origins
  wallpaper: [
    'https://api.unsplash.com/*',
    'https://images.unsplash.com/*',
    'https://source.unsplash.com/*',
    'https://api.pexels.com/*',
    'https://images.pexels.com/*',
    'https://peapix.com/*',
    'https://pixabay.com/*',
    'https://wallhaven.cc/*',
    'https://w.wallhaven.cc/*',
  ],

  // More granular wallpaper origins (better consent UX)
  wallpaperUnsplash: [
    'https://api.unsplash.com/*',
    'https://images.unsplash.com/*',
    'https://source.unsplash.com/*',
  ],

  wallpaperPexels: [
    'https://api.pexels.com/*',
    'https://images.pexels.com/*',
  ],

  wallpaperBing: ['https://peapix.com/*'],

  wallpaperWallhaven: ['https://wallhaven.cc/*', 'https://w.wallhaven.cc/*'],

  // Gmail feature requires these permissions
  gmail: ['identity', 'identity.email', 'notifications'],

  // Gmail feature also requires these origins
  gmailOrigins: ['https://www.googleapis.com/*'],

  // Favicon fetching requires these origins
  favicon: [
    'https://www.google.com/*',
    'https://icons.duckduckgo.com/*',
    'https://*.gstatic.com/*',
  ],

  // Bookmarks import requires this permission
  bookmarks: ['bookmarks'],

  // History access requires this permission
  history: ['history'],

  // Context menu requires this permission
  contextMenu: ['contextMenus'],

  // Tab operations require these permissions
  tabs: ['tabs', 'activeTab'],

  // Extension management requires this permission
  management: ['management'],
} as const;

/**
 * Ensure all permissions required for a feature are granted
 * Combines both API permissions and host origins
 */
export async function ensureFeaturePermissions(
  permissions: readonly string[] = [],
  origins: readonly string[] = []
): Promise<boolean> {
  return requestOptionalAccess({ permissions, origins });
}
