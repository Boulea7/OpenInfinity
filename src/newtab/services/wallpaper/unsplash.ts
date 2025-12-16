/**
 * Unsplash API Provider
 * Official Unsplash API integration with quota management
 *
 * API Documentation: https://unsplash.com/documentation
 * Rate Limits:
 * - Demo: 50 requests/hour
 * - Production: 5000 requests/hour (requires approval)
 */

import type { WallpaperProvider, WallpaperResult, WallpaperFetchOptions, QuotaStatus } from './types';

const UNSPLASH_API_BASE = 'https://api.unsplash.com';

/**
 * Unsplash photo response interface
 */
interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string; // 1080px width
    small: string; // 400px width
    thumb: string; // 200px width
  };
  width: number;
  height: number;
  description: string | null;
  alt_description: string | null;
  user: {
    name: string;
    username: string;
    links: { html: string };
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
}

export class UnsplashProvider implements WallpaperProvider {
  private accessKey: string;
  private rateLimitRemaining: number = 50;
  private rateLimitReset: number = 0;

  constructor(accessKey?: string) {
    // Get from environment variable
    this.accessKey = accessKey || import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';

    if (!this.accessKey) {
      // console.warn('Unsplash API key not configured. Using demo endpoint (limited to 50/hour).');
    }
  }

  /**
   * Get a random wallpaper from Unsplash
   */
  async getRandomPhoto(options?: WallpaperFetchOptions): Promise<WallpaperResult> {
    // If no API key, fallback to source.unsplash.com
    if (!this.accessKey) {
      return this.getRandomPhotoDemo(options);
    }

    // Check quota
    if (!this.canMakeRequest()) {
      const waitTime = Math.ceil((this.rateLimitReset - Date.now()) / 1000 / 60);
      throw new Error(`Unsplash rate limit exceeded. Resets in ${waitTime} minutes.`);
    }

    try {
      // Map orientation: 'square' -> 'squarish' for Unsplash API
      const orientation = options?.orientation === 'square' ? 'squarish' : (options?.orientation || 'landscape');

      const params = new URLSearchParams({
        orientation,
        ...(options?.query && { query: options.query }),
        content_filter: options?.safeMode ? 'high' : 'low',
      });

      const response = await fetch(
        `${UNSPLASH_API_BASE}/photos/random?${params}`,
        {
          headers: {
            Authorization: `Client-ID ${this.accessKey}`,
          },
          signal: AbortSignal.timeout(10000), // 10s timeout
        }
      );

      // Update quota from response headers
      this.updateQuotaFromHeaders(response.headers);

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
      }

      const data: UnsplashPhoto = await response.json();

      // Note: Download tracking is handled by wallpaperStore, not here
      // This avoids duplicate tracking

      return {
        url: data.urls.regular, // 1080px width, good balance
        fullUrl: data.urls.full,
        thumbUrl: data.urls.thumb,
        metadata: {
          author: data.user.name,
          authorUrl: data.user.links.html,
          source: 'Unsplash',
          license: 'Unsplash License (Free to use)',
          width: data.width,
          height: data.height,
          description: data.description || data.alt_description || undefined,
          downloadLocation: data.links.download_location,
        },
      };
    } catch (error) {
      console.error('Unsplash API failed:', error);
      throw error;
    }
  }

  /**
   * Fallback to demo endpoint (source.unsplash.com)
   * No API key required, but limited features
   */
  private async getRandomPhotoDemo(options?: WallpaperFetchOptions): Promise<WallpaperResult> {
    const query = options?.query || '';
    const url = query
      ? `https://source.unsplash.com/random/1920x1080/?${query}`
      : 'https://source.unsplash.com/random/1920x1080';

    return {
      url,
      metadata: {
        source: 'Unsplash (Demo)',
        license: 'Unsplash License',
      },
    };
  }

  /**
   * Track download (required by Unsplash API guidelines)
   * Must be called when user views the photo
   */
  async trackDownload(downloadLocation: string): Promise<void> {
    if (!this.accessKey) return;

    try {
      await fetch(downloadLocation, {
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
      });
    } catch (error) {
      console.warn('Failed to track Unsplash download:', error);
    }
  }

  /**
   * Get current quota status
   */
  getQuotaStatus(): QuotaStatus {
    return {
      remaining: this.rateLimitRemaining,
      limit: 50, // Demo limit, production is 5000
      resetAt: this.rateLimitReset,
      canMakeRequest: this.canMakeRequest(),
    };
  }

  /**
   * Check if we can make a request
   */
  private canMakeRequest(): boolean {
    // Check if quota has reset
    if (Date.now() > this.rateLimitReset) {
      this.rateLimitRemaining = 50; // Reset to demo limit
      return true;
    }

    return this.rateLimitRemaining > 0;
  }

  /**
   * Update quota from response headers
   */
  private updateQuotaFromHeaders(headers: Headers): void {
    const remaining = headers.get('X-Ratelimit-Remaining');
    const reset = headers.get('X-Ratelimit-Reset');

    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining, 10);
    }

    if (reset) {
      // Convert to milliseconds
      this.rateLimitReset = parseInt(reset, 10) * 1000;
    }
  }
}
