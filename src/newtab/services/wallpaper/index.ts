/**
 * Wallpaper Services
 * Unified exports for all wallpaper providers and utilities
 */

export * from './types';
export * from './unsplash';
export * from './pexels';
export * from './bing';
export * from './preset';
export * from './manager';

// Re-export singleton for convenience
export { wallpaperManager } from './manager';
