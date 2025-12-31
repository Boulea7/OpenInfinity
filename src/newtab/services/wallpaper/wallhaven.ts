/**
 * Wallhaven API Provider
 * Free anime/illustration wallpaper source
 *
 * API Documentation: https://wallhaven.cc/help/api
 * Rate Limits: 45 requests/minute (public, no API key)
 * Categories: 010 = anime only
 */

import type { WallpaperProvider, WallpaperResult, WallpaperFetchOptions } from './types';

const WALLHAVEN_API_BASE = 'https://wallhaven.cc/api/v1';

/**
 * Wallhaven search result interface
 */
interface WallhavenSearchResult {
  data: WallhavenWallpaper[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface WallhavenWallpaper {
  id: string;
  url: string;
  short_url: string;
  views: number;
  favorites: number;
  source: string;
  purity: string;
  category: string;
  dimension_x: number;
  dimension_y: number;
  resolution: string;
  ratio: string;
  file_size: number;
  file_type: string;
  created_at: string;
  colors: string[];
  path: string; // Full resolution image URL
  thumbs: {
    large: string;
    original: string;
    small: string;
  };
}

export class WallhavenProvider implements WallpaperProvider {
  private apiKey: string;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private readonly RATE_LIMIT = 45; // requests per minute

  constructor(apiKey?: string) {
    // Optional API key for NSFW content access
    this.apiKey = apiKey || import.meta.env.VITE_WALLHAVEN_API_KEY || '';
  }

  /**
   * Get a random anime wallpaper from Wallhaven
   */
  async getRandomPhoto(options?: WallpaperFetchOptions): Promise<WallpaperResult> {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastRequestTime > 60000) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    if (this.requestCount >= this.RATE_LIMIT) {
      throw new Error('Wallhaven rate limit exceeded. Please wait a minute.');
    }

    try {
      // Build search parameters
      const params = new URLSearchParams({
        // Categories: 100=general, 010=anime, 001=people
        // Default to anime only
        categories: '010',
        // Purity: 100=sfw, 010=sketchy, 001=nsfw
        // Default to SFW only
        purity: options?.safeMode !== false ? '100' : '110',
        // Sort randomly
        sorting: 'random',
        // Minimum resolution for quality
        atleast: '1920x1080',
      });

      // Add search query if provided
      if (options?.query) {
        params.set('q', options.query);
      }

      // Add orientation filter (requires translation)
      if (options?.orientation === 'landscape') {
        params.set('ratios', '16x9,16x10,21x9');
      } else if (options?.orientation === 'portrait') {
        params.set('ratios', '9x16,10x16,9x21');
      }

      // Add API key for extended access
      if (this.apiKey) {
        params.set('apikey', this.apiKey);
      }

      const response = await fetch(
        `${WALLHAVEN_API_BASE}/search?${params}`,
        {
          signal: AbortSignal.timeout(15000), // 15s timeout
          referrerPolicy: 'no-referrer',
          credentials: 'omit',
        }
      );

      this.requestCount++;

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Wallhaven rate limit exceeded');
        }
        throw new Error(`Wallhaven API error: ${response.status}`);
      }

      const data: WallhavenSearchResult = await response.json();

      if (!data.data || data.data.length === 0) {
        throw new Error('No wallpapers found on Wallhaven');
      }

      // Pick a random wallpaper from results
      const photo = data.data[Math.floor(Math.random() * data.data.length)];

      return {
        url: photo.path,
        fullUrl: photo.path,
        thumbUrl: photo.thumbs.large,
        metadata: {
          author: 'Wallhaven Community',
          authorUrl: photo.url,
          source: 'Wallhaven',
          license: 'Various (see original)',
          width: photo.dimension_x,
          height: photo.dimension_y,
          description: `${photo.category} wallpaper - ${photo.resolution}`,
          tags: photo.colors,
        },
      };
    } catch (error) {
      console.error('Wallhaven API failed:', error);
      throw error;
    }
  }

  /**
   * Get quota status
   */
  getQuotaStatus() {
    const now = Date.now();
    const resetAt = this.lastRequestTime + 60000;

    return {
      remaining: Math.max(0, this.RATE_LIMIT - this.requestCount),
      limit: this.RATE_LIMIT,
      resetAt: resetAt > now ? resetAt : 0,
      canMakeRequest: this.requestCount < this.RATE_LIMIT,
    };
  }
}
