/**
 * Pexels API Provider
 * Free stock photos and videos
 *
 * API Documentation: https://www.pexels.com/api/documentation/
 * Rate Limits: 200 requests/hour (free tier)
 */

import type { WallpaperProvider, WallpaperResult, WallpaperFetchOptions, QuotaStatus } from './types';

const PEXELS_API_BASE = 'https://api.pexels.com/v1';

/**
 * Pexels photo response interface
 */
interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string; // Pexels page URL
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string; // 1920px width
    large: string; // 940px width
    medium: string; // 350px width
    small: string; // 130px width
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
}

export class PexelsProvider implements WallpaperProvider {
  private apiKey: string;
  private requestCount: number = 0;
  private resetAt: number = Date.now() + 3600000; // 1 hour from now

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_PEXELS_API_KEY || '';

    if (!this.apiKey) {
      console.warn('Pexels API key not configured. Provider will not work.');
    }
  }

  /**
   * Get a random wallpaper from Pexels
   */
  async getRandomPhoto(options?: WallpaperFetchOptions): Promise<WallpaperResult> {
    if (!this.apiKey) {
      throw new Error('Pexels API key not configured');
    }

    // Check quota
    if (!this.canMakeRequest()) {
      const waitTime = Math.ceil((this.resetAt - Date.now()) / 1000 / 60);
      throw new Error(`Pexels rate limit exceeded. Resets in ${waitTime} minutes.`);
    }

    try {
      const query = options?.query || 'nature';
      const orientation = options?.orientation || 'landscape';

      // Random page between 1-80 (Pexels typical max for quality results)
      const page = Math.floor(Math.random() * 80) + 1;

      const params = new URLSearchParams({
        query,
        orientation,
        per_page: '1',
        page: page.toString(),
      });

      const response = await fetch(
        `${PEXELS_API_BASE}/search?${params}`,
        {
          headers: {
            Authorization: this.apiKey,
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
      }

      const data: PexelsSearchResponse = await response.json();

      if (!data.photos || data.photos.length === 0) {
        throw new Error('No photos found for query: ' + query);
      }

      const photo = data.photos[0];

      // Track request
      this.requestCount++;

      return {
        url: photo.src.large2x, // 1920px width
        fullUrl: photo.src.original,
        thumbUrl: photo.src.medium,
        metadata: {
          author: photo.photographer,
          authorUrl: photo.photographer_url,
          source: 'Pexels',
          license: 'Pexels License (Free to use)',
          width: photo.width,
          height: photo.height,
          description: photo.alt,
        },
      };
    } catch (error) {
      console.error('Pexels API failed:', error);
      throw error;
    }
  }

  /**
   * Get current quota status
   */
  getQuotaStatus(): QuotaStatus {
    return {
      remaining: 200 - this.requestCount,
      limit: 200,
      resetAt: this.resetAt,
      canMakeRequest: this.canMakeRequest(),
    };
  }

  /**
   * Check if we can make a request
   */
  private canMakeRequest(): boolean {
    // Reset quota if time has passed
    if (Date.now() > this.resetAt) {
      this.requestCount = 0;
      this.resetAt = Date.now() + 3600000; // Reset to 1 hour from now
      return true;
    }

    return this.requestCount < 200;
  }
}
