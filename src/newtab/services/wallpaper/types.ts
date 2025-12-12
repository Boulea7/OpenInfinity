/**
 * Wallpaper Service Type Definitions
 * Common interfaces for all wallpaper providers
 */

/**
 * Wallpaper result from any provider
 */
export interface WallpaperResult {
  url: string; // Main display URL (usually 1080p or regular size)
  fullUrl?: string; // Full resolution URL (optional)
  thumbUrl?: string; // Thumbnail URL (optional)
  metadata: WallpaperMetadata;
  actualSource?: string; // Which provider actually provided this (for fallback tracking)
}

/**
 * Wallpaper metadata
 */
export interface WallpaperMetadata {
  author?: string; // Photographer/artist name
  authorUrl?: string; // Link to author profile
  source: string; // Source name: 'Unsplash', 'Pexels', 'Bing', etc.
  license?: string; // License information
  width?: number;
  height?: number;
  description?: string;
  tags?: string[];
  downloadLocation?: string; // For API tracking (Unsplash requirement)
}

/**
 * Common options for fetching wallpapers
 */
export interface WallpaperFetchOptions {
  query?: string; // Search query: 'nature', 'city', 'anime', etc.
  orientation?: 'landscape' | 'portrait' | 'square';
  category?: string; // Category filter
  safeMode?: boolean; // Filter NSFW content
}

/**
 * Provider quota status
 */
export interface QuotaStatus {
  remaining: number;
  limit: number;
  resetAt: number; // Unix timestamp
  canMakeRequest: boolean;
}

/**
 * Base wallpaper provider interface
 * All providers must implement this
 */
export interface WallpaperProvider {
  /**
   * Get a random wallpaper
   */
  getRandomPhoto(options?: WallpaperFetchOptions): Promise<WallpaperResult>;

  /**
   * Check quota status
   */
  getQuotaStatus?(): QuotaStatus;

  /**
   * Track download (if required by provider terms)
   */
  trackDownload?(downloadLocation: string): Promise<void>;
}

/**
 * Wallpaper source type (matching database schema)
 */
export type WallpaperSource =
  | 'local'
  | 'unsplash'
  | 'pexels'
  | 'pixabay'
  | 'bing'
  | 'solid'
  | 'gradient'
  | 'custom';
