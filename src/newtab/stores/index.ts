/**
 * Zustand stores index
 * Re-exports all stores for convenient imports
 */

export { useSettingsStore } from './settingsStore';
export type {
  Theme,
  SearchEngine,
  OpenBehavior,
  IconStyle,
  SearchSettings,
  ViewSettings,
  FontSettings,
} from './settingsStore';

export { useIconStore } from './iconStore';

export { useWallpaperStore } from './wallpaperStore';
export type {
  WallpaperSource,
  WallpaperMode,
  GradientDirection,
  AutoChangeInterval,
  WallpaperEffects,
  GradientConfig,
} from './wallpaperStore';
