/**
 * Bing Daily Wallpaper Provider
 * Bing's Image of the Day (official wallpaper)
 *
 * API: Peapix Bing Feed (unofficial but stable)
 * Rate Limits: None (public feed)
 */

import type { WallpaperProvider, WallpaperResult, WallpaperFetchOptions } from './types';

const BING_FEED_API = 'https://peapix.com/bing/feed';

/**
 * Bing feed response interface
 */
interface BingFeedItem {
  title: string;
  copyright: string;
  copyrightlink: string;
  date: string;
  fullUrl: string; // Full resolution (usually 1920x1080)
  url: string; // Regular size
  thumbnail: string;
}

export class BingProvider implements WallpaperProvider {
  private country: string;

  constructor(country: string = 'cn') {
    this.country = country;
  }

  /**
   * Get Bing's Image of the Day
   * Note: Bing doesn't support query/orientation options
   */
  async getRandomPhoto(_options?: WallpaperFetchOptions): Promise<WallpaperResult> {
    try {
      const params = new URLSearchParams({
        country: this.country,
      });

      const response = await fetch(`${BING_FEED_API}?${params}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Bing API error: ${response.status}`);
      }

      const data: BingFeedItem[] = await response.json();

      if (!data || data.length === 0) {
        throw new Error('No Bing wallpapers available');
      }

      // Get today's wallpaper (first item) or random from recent
      const photo = data[0];

      // Extract author from copyright string
      // Example: "© Photographer Name/Getty Images"
      const authorMatch = photo.copyright.match(/©\s*([^/]+)/);
      const author = authorMatch ? authorMatch[1].trim() : 'Bing';

      return {
        url: photo.fullUrl || photo.url,
        thumbUrl: photo.thumbnail,
        metadata: {
          author,
          authorUrl: photo.copyrightlink,
          source: 'Bing Daily',
          license: 'Bing Wallpaper License',
          description: photo.title,
        },
      };
    } catch (error) {
      console.error('Bing API failed:', error);
      throw error;
    }
  }

  /**
   * Get quota status (Bing has no limits)
   */
  getQuotaStatus() {
    return {
      remaining: Infinity,
      limit: Infinity,
      resetAt: 0,
      canMakeRequest: true,
    };
  }

  /**
   * Change country for regional wallpapers
   */
  setCountry(country: string): void {
    this.country = country;
  }
}
