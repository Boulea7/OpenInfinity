/**
 * Preset Wallpaper Provider
 * Manages built-in wallpaper library (no API key required)
 */

import type { WallpaperProvider, WallpaperResult, WallpaperFetchOptions } from './types';

export interface PresetWallpaper {
  id: string;
  path: string;
  thumbnail?: string;
  width: number;
  height: number;
  category: string;
  author?: string;
  source?: string;
  license?: string;
  tags?: string[];
}

export interface WallpaperCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  wallpapers: PresetWallpaper[];
}

interface CategoriesData {
  version: number;
  lastUpdated: string;
  categories: WallpaperCategory[];
}

export class PresetWallpaperProvider implements WallpaperProvider {
  private categories: WallpaperCategory[] = [];
  private loaded: boolean = false;

  /**
   * Load categories from categories.json
   * Call this once on initialization
   */
  async loadCategories(): Promise<void> {
    if (this.loaded) return;

    try {
      const response = await fetch('/wallpapers/categories.json');

      if (!response.ok) {
        throw new Error(`Failed to load categories: ${response.status}`);
      }

      const data: CategoriesData = await response.json();
      this.categories = data.categories;
      this.loaded = true;

      console.info(`Loaded ${this.categories.length} preset wallpaper categories`);
    } catch (error) {
      // Fallback: no preset wallpapers available
      console.warn('Preset wallpapers not available:', error);
      this.categories = [];
      this.loaded = true;
    }
  }

  /**
   * Get a random wallpaper from preset library
   */
  async getRandomPhoto(options?: WallpaperFetchOptions): Promise<WallpaperResult> {
    // Ensure categories are loaded
    if (!this.loaded) {
      await this.loadCategories();
    }

    // Filter by category if specified
    let pool: PresetWallpaper[] = [];

    if (options?.category) {
      const category = this.categories.find(c => c.id === options.category);
      pool = category?.wallpapers || [];
    } else {
      // All wallpapers from all categories
      pool = this.categories.flatMap(c => c.wallpapers);
    }

    if (pool.length === 0) {
      throw new Error('No preset wallpapers available. Please configure wallpaper source or upload images.');
    }

    // Random selection
    const index = Math.floor(Math.random() * pool.length);
    const wallpaper = pool[index];

    return {
      url: wallpaper.path,
      thumbUrl: wallpaper.thumbnail,
      metadata: {
        author: wallpaper.author,
        source: wallpaper.source || 'Preset Library',
        license: wallpaper.license || 'CC0 / Free to use',
        width: wallpaper.width,
        height: wallpaper.height,
        tags: wallpaper.tags,
      },
    };
  }

  /**
   * Get all available categories
   */
  getAllCategories(): WallpaperCategory[] {
    return this.categories;
  }

  /**
   * Get wallpapers by category
   */
  getByCategory(categoryId: string): PresetWallpaper[] {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.wallpapers || [];
  }

  /**
   * Search wallpapers by tag
   */
  searchByTag(tag: string): PresetWallpaper[] {
    const allWallpapers = this.categories.flatMap(c => c.wallpapers);
    return allWallpapers.filter(w =>
      w.tags?.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  /**
   * Get total wallpaper count
   */
  getTotalCount(): number {
    return this.categories.reduce((sum, cat) => sum + cat.wallpapers.length, 0);
  }
}
