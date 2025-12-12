/**
 * Wallpaper Source Manager
 * Coordinates multiple wallpaper providers with fallback strategy
 */

import { UnsplashProvider } from './unsplash';
import { PexelsProvider } from './pexels';
import { BingProvider } from './bing';
import { PresetWallpaperProvider } from './preset';
import type { WallpaperProvider, WallpaperResult, WallpaperFetchOptions, WallpaperSource } from './types';

/**
 * Wallpaper Manager
 * Manages multiple providers and implements fallback strategy
 */
export class WallpaperManager {
  private providers: Map<WallpaperSource, WallpaperProvider>;
  private fallbackOrder: WallpaperSource[] = ['preset', 'unsplash', 'pexels', 'bing'];
  private presetProvider: PresetWallpaperProvider;

  constructor() {
    this.presetProvider = new PresetWallpaperProvider();

    this.providers = new Map<WallpaperSource, WallpaperProvider>([
      ['preset' as WallpaperSource, this.presetProvider],
      ['unsplash' as WallpaperSource, new UnsplashProvider()],
      ['pexels' as WallpaperSource, new PexelsProvider()],
      ['bing' as WallpaperSource, new BingProvider()],
    ]);
  }

  /**
   * Get a random wallpaper with automatic fallback
   *
   * @param preferredSource - Preferred wallpaper source
   * @param options - Fetch options (query, orientation, etc.)
   * @returns Wallpaper result with actualSource indicating which provider succeeded
   */
  async getRandomWallpaper(
    preferredSource?: WallpaperSource,
    options?: WallpaperFetchOptions
  ): Promise<WallpaperResult & { actualSource: WallpaperSource }> {
    // Determine source order (preferred first, then fallbacks)
    const sources = preferredSource && preferredSource !== 'local'
      ? [preferredSource, ...this.fallbackOrder.filter(s => s !== preferredSource)]
      : this.fallbackOrder;

    let lastError: Error | null = null;

    // Try each source in order
    for (const source of sources) {
      try {
        const provider = this.providers.get(source);

        if (!provider) {
          console.warn(`Provider not found for source: ${source}`);
          continue;
        }

        console.info(`Attempting to fetch wallpaper from: ${source}`);

        const result = await provider.getRandomPhoto(options);

        console.info(`Successfully fetched wallpaper from: ${source}`);

        return {
          ...result,
          actualSource: source,
        };
      } catch (error) {
        console.warn(`Wallpaper source ${source} failed:`, error);
        lastError = error as Error;
        // Continue to next source
      }
    }

    // All sources failed
    throw new Error(
      `All wallpaper sources failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Get quota status for all providers
   */
  getAllQuotaStatus(): Record<string, ReturnType<NonNullable<WallpaperProvider['getQuotaStatus']>> | null> {
    const status: Record<string, any> = {};

    for (const [source, provider] of this.providers.entries()) {
      status[source] = provider.getQuotaStatus ? provider.getQuotaStatus() : null;
    }

    return status;
  }

  /**
   * Get quota status for a specific provider
   */
  getQuotaStatus(source: WallpaperSource): ReturnType<NonNullable<WallpaperProvider['getQuotaStatus']>> | null {
    const provider = this.providers.get(source);
    return provider && provider.getQuotaStatus ? provider.getQuotaStatus() : null;
  }

  /**
   * Track download for providers that require it
   */
  async trackDownload(source: WallpaperSource, downloadLocation: string): Promise<void> {
    const provider = this.providers.get(source);

    if (provider && 'trackDownload' in provider) {
      await (provider as any).trackDownload(downloadLocation);
    }
  }
}

// Export singleton instance
export const wallpaperManager = new WallpaperManager();
