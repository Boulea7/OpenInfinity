/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗ ██████╗ ███████╗███╗   ██╗    ██╗███╗   ██╗███████╗██╗███╗   ██║
 * ║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ██║████╗  ██║██╔════╝██║████╗  ██║
 * ║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║
 * ║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║
 * ║  ╚██████╔╝██║     ███████╗██║ ╚████║    ██║██║ ╚████║██║     ██║██║ ╚████║
 * ║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══║
 * ║                                                                           ║
 * ║  OpenInfinity - Your Infinite New Tab Experience                          ║
 * ║                                                                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Copyright (c) 2024-2026 OpenInfinity Team. All rights reserved.          ║
 * ║  Licensed under the MIT License                                           ║
 * ║  GitHub: https://github.com/OpenInfinity/OpenInfinity                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Icon Preloader Service
 *
 * Preloads website icons in the background for faster display.
 * Uses requestIdleCallback for non-blocking loading.
 *
 * Features:
 * - Prioritizes popular websites
 * - Non-blocking background loading
 * - Integrates with resourceCache for persistence
 * - Respects browser idle time
 */

import { preloadResources } from './resourceCache';
import { PRESET_WEBSITES } from '../data/presetWebsites';
import type { PresetWebsite } from './database';

// Configuration
const PRELOAD_BATCH_SIZE = 20; // Number of icons per batch
const PRELOAD_PRIORITY_THRESHOLD = 8000; // Minimum popularity to preload

// Track preload state
let isPreloading = false;
let hasPreloaded = false;

/**
 * Get icons to preload, sorted by popularity
 */
function getIconsToPreload(): string[] {
  // Filter websites with predefined icons and high popularity
  const priorityWebsites = PRESET_WEBSITES
    .filter((site: PresetWebsite) => {
      // Must have an icon defined
      if (!site.icon) return false;
      // Must meet popularity threshold
      if (site.popularity < PRELOAD_PRIORITY_THRESHOLD) return false;
      // Skip data URLs (already embedded)
      if (site.icon.startsWith('data:')) return false;
      return true;
    })
    .sort((a: PresetWebsite, b: PresetWebsite) => b.popularity - a.popularity);

  // Return icon URLs
  return priorityWebsites.map((site: PresetWebsite) => site.icon as string);
}

/**
 * Preload popular website icons in the background
 *
 * Call this on app startup for better performance.
 * Icons will be cached in IndexedDB for offline access.
 *
 * @example
 * ```ts
 * // In App.tsx or main entry point
 * useEffect(() => {
 *   preloadPopularIcons();
 * }, []);
 * ```
 */
export function preloadPopularIcons(): void {
  // Prevent multiple preloads
  if (isPreloading || hasPreloaded) return;
  isPreloading = true;

  const icons = getIconsToPreload();

  if (icons.length === 0) {
    isPreloading = false;
    hasPreloaded = true;
    return;
  }

  // Split into batches for gradual loading
  const batches: string[][] = [];
  for (let i = 0; i < icons.length; i += PRELOAD_BATCH_SIZE) {
    batches.push(icons.slice(i, i + PRELOAD_BATCH_SIZE));
  }

  // Process batches during idle time
  let batchIndex = 0;

  function processNextBatch() {
    if (batchIndex >= batches.length) {
      isPreloading = false;
      hasPreloaded = true;
      console.info(`[IconPreloader] Preloaded ${icons.length} icons`);
      return;
    }

    const batch = batches[batchIndex];
    batchIndex++;

    // Use preloadResources which internally uses requestIdleCallback
    preloadResources(batch);

    // Schedule next batch
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => processNextBatch(), { timeout: 10000 });
    } else {
      setTimeout(processNextBatch, 1000);
    }
  }

  // Start processing
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => processNextBatch(), { timeout: 5000 });
  } else {
    setTimeout(processNextBatch, 500);
  }
}

/**
 * Preload icons for a specific category
 *
 * Call this when user navigates to a category for faster loading.
 *
 * @param category - Category name to preload
 */
export function preloadCategoryIcons(category: string): void {
  const icons = PRESET_WEBSITES
    .filter((site: PresetWebsite) => site.category === category && site.icon && !site.icon.startsWith('data:'))
    .map((site: PresetWebsite) => site.icon as string);

  if (icons.length > 0) {
    preloadResources(icons);
  }
}

/**
 * Reset preload state (for testing)
 */
export function resetPreloadState(): void {
  isPreloading = false;
  hasPreloaded = false;
}

export default {
  preloadPopularIcons,
  preloadCategoryIcons,
  resetPreloadState,
};
