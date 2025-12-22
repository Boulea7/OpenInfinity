import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, generateId, type Wallpaper } from '../services/database';
import { compressImage, validateImageFile } from '../utils/imageCompression';
import { wallpaperManager, type WallpaperMetadata as ProviderWallpaperMetadata } from '../services/wallpaper';

// Module-level auto-change timer management
let autoChangeTimer: ReturnType<typeof setInterval> | null = null;

// Module-level next-wallpaper preloading state (avoid duplicate work across rapid triggers)
let nextPreloadToken = 0;

// Maximum number of wallpapers to keep in IndexedDB history
const MAX_WALLPAPER_HISTORY = 50;

/**
 * Stop auto-change timer safely
 */
function stopAutoChangeTimer(): void {
  if (autoChangeTimer) {
    clearInterval(autoChangeTimer);
    autoChangeTimer = null;
    console.info('Auto-change timer stopped');
  }
}

/**
 * Get interval milliseconds from AutoChangeInterval type
 */
function getIntervalMs(interval: AutoChangeInterval): number {
  const intervals: Record<AutoChangeInterval, number> = {
    hourly: 1 * 60 * 60 * 1000,      // 1 hour
    daily: 24 * 60 * 60 * 1000,      // 24 hours
    weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
    never: 0,
  };
  return intervals[interval];
}

/**
 * Best-effort image preloader (warms browser cache and validates URL).
 */
function preloadImageUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('Missing image URL'));
      return;
    }

    if (typeof Image === 'undefined') {
      // Non-browser environment (e.g. SSR/tests). Skip preloading.
      resolve();
      return;
    }

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to preload image'));
    img.src = url;
  });
}

function isPreloadableWallpaperSource(source: WallpaperSource): boolean {
  return source === 'unsplash' || source === 'pexels' || source === 'bing' || source === 'wallhaven' || source === 'preset';
}

/**
 * Trim wallpaper history to prevent unlimited IndexedDB growth.
 * Keeps the most recent MAX_WALLPAPER_HISTORY entries, deletes older ones.
 */
async function trimWallpaperHistory(): Promise<void> {
  try {
    const count = await db.wallpapers.count();
    if (count <= MAX_WALLPAPER_HISTORY) return;

    // Get oldest entries to delete
    const toDelete = count - MAX_WALLPAPER_HISTORY;
    const oldest = await db.wallpapers.orderBy('createdAt').limit(toDelete).toArray();

    // Delete in batch
    const idsToDelete = oldest.map((w) => w.id);
    await db.wallpapers.bulkDelete(idsToDelete);

    console.info(`[Wallpaper] Trimmed ${idsToDelete.length} old entries from history`);
  } catch (error) {
    console.warn('[Wallpaper] Failed to trim history:', error);
  }
}

/**
 * Wallpaper source types
 */
export type WallpaperSource =
  | 'local'
  | 'preset'
  | 'unsplash'
  | 'pexels'
  | 'bing'
  | 'wallhaven'
  | 'solid'
  | 'gradient'
  | 'custom';

/**
 * Wallpaper mode - full features or minimal
 */
export type WallpaperMode = 'full' | 'minimal';

/**
 * Gradient direction
 */
export type GradientDirection =
  | 'to-r'
  | 'to-l'
  | 'to-t'
  | 'to-b'
  | 'to-br'
  | 'to-bl'
  | 'to-tr'
  | 'to-tl';

/**
 * Auto-change interval options
 */
export type AutoChangeInterval = 'hourly' | 'daily' | 'weekly' | 'never';

/**
 * Wallpaper effects configuration
 */
export interface WallpaperEffects {
  blur: number; // 0-100
  maskOpacity: number; // 0-100
  brightness: number; // 0-100
  grayscale: boolean;
}

/**
 * Gradient configuration
 */
export interface GradientConfig {
  colors: string[];
  direction: GradientDirection;
}

/**
 * Wallpaper store state
 */
interface WallpaperState {
  // Current wallpaper
  currentWallpaper: Wallpaper | null;
  currentUrl: string | null;

  // Mode
  mode: WallpaperMode;

  // Source settings
  activeSource: WallpaperSource;
  solidColor: string;
  gradient: GradientConfig;

  // Effects
  effects: WallpaperEffects;

  // Auto-change
  autoChange: {
    enabled: boolean;
    interval: AutoChangeInterval;
    sources: WallpaperSource[];
  };

  // Search query for API-based wallpapers
  searchQuery: string;

  // Collection
  favorites: Wallpaper[];

  // User interactions for preset wallpapers
  likedWallpapers: string[];
  favoritedPresets: string[];

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Next wallpaper preloading (in-memory, not persisted)
  preloadedNext: {
    url: string;
    metadata: ProviderWallpaperMetadata;
    actualSource: WallpaperSource;
    requestedSource: WallpaperSource;
    searchQuery: string;
    preloadedAt: number;
  } | null;
  isPreloadingNext: boolean;
}

/**
 * Wallpaper store actions
 */
interface WallpaperActions {
  // Initialization
  loadWallpaper: () => Promise<void>;

  // Set wallpaper
  setWallpaperFromUrl: (url: string, metadata?: Wallpaper['metadata']) => Promise<void>;
  setWallpaperFromFile: (file: File) => Promise<void>;
  setSolidColor: (color: string) => void;
  setGradient: (config: GradientConfig) => void;

  // Mode
  setMode: (mode: WallpaperMode) => void;

  // Source
  setActiveSource: (source: WallpaperSource) => void;

  // Effects
  setEffects: (effects: Partial<WallpaperEffects>) => void;
  resetEffects: () => void;

  // Auto-change
  setAutoChange: (config: Partial<WallpaperState['autoChange']>) => void;

  // Auto-change timer management
  startAutoChange: () => void;
  stopAutoChange: () => void;

  // Search query configuration
  setSearchQuery: (query: string) => void;

  // Favorites
  addToFavorites: (wallpaper: Wallpaper) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;

  // Random
  fetchRandomWallpaper: (source?: WallpaperSource) => Promise<void>;
  preloadNextWallpaper: (source?: WallpaperSource) => Promise<void>;

  // Preset wallpaper interactions
  togglePresetLike: (id: string) => void;
  togglePresetFavorite: (id: string) => void;
  isPresetLiked: (id: string) => boolean;
  isPresetFavorited: (id: string) => boolean;

  // Reset
  resetWallpaper: () => void;
}

/**
 * Default wallpaper effects
 */
const defaultEffects: WallpaperEffects = {
  blur: 0,
  maskOpacity: 30,
  brightness: 100,
  grayscale: false,
};

/**
 * Default gradient (yellow theme)
 */
const defaultGradient: GradientConfig = {
  colors: ['#FCD34D', '#F59E0B', '#D97706'],
  direction: 'to-br',
};

/**
 * Wallpaper management store
 */
export const useWallpaperStore = create<WallpaperState & WallpaperActions>()(
  persist(
    (set, get) => ({
      // Initial state (read default source from environment)
      currentWallpaper: null,
      currentUrl: null,
      mode: 'full',
      activeSource: (import.meta.env.VITE_DEFAULT_WALLPAPER_SOURCE as WallpaperSource) || 'gradient',
      solidColor: '#1e293b',
      gradient: defaultGradient,
      effects: defaultEffects,
      autoChange: {
        enabled: false,
        interval: 'daily',
        sources: ['unsplash', 'bing'],
      },
      searchQuery: 'nature',
      favorites: [],
      likedWallpapers: [],
      favoritedPresets: [],
      isLoading: false,
      error: null,
      preloadedNext: null,
      isPreloadingNext: false,

      loadWallpaper: async () => {
        set({ isLoading: true, error: null });
        try {
          // Load the most recent wallpaper from DB
          const wallpapers = await db.wallpapers.orderBy('createdAt').reverse().first();

          if (wallpapers) {
            // P1-12: Release old ObjectURL before creating new one
            const oldUrl = get().currentUrl;
            if (oldUrl && oldUrl.startsWith('blob:')) {
              URL.revokeObjectURL(oldUrl);
            }

            let url: string | null = null;

            if (wallpapers.type === 'blob' && wallpapers.blob) {
              url = URL.createObjectURL(wallpapers.blob);
            } else if (['url', 'unsplash', 'pexels', 'pixabay', 'bing'].includes(wallpapers.type)) {
              url = wallpapers.source;
            }

            set({
              currentWallpaper: wallpapers,
              currentUrl: url,
              activeSource: wallpapers.type as WallpaperSource,
            });
          } else {
            // No saved wallpaper - auto-fetch if source is unsplash
            const currentSource = get().activeSource;
            if (currentSource === 'unsplash') {
              await get().fetchRandomWallpaper();
            }
          }

          // Load favorites
          const favorites = await db.wallpapers.toArray();
          set({ favorites, isLoading: false });

          // Warm up "next" wallpaper in background for API/preset sources
          const sourceToPreload = get().activeSource;
          if (isPreloadableWallpaperSource(sourceToPreload)) {
            void get().preloadNextWallpaper(sourceToPreload);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load wallpaper',
            isLoading: false,
          });
        }
      },

      setWallpaperFromUrl: async (url, metadata = {}) => {
        set({ isLoading: true, error: null });
        try {
          // Validate URL is loadable before switching (prevents setting a broken wallpaper).
          await preloadImageUrl(url);

          // P1-12: Release old ObjectURL
          const oldUrl = get().currentUrl;
          if (oldUrl && oldUrl.startsWith('blob:')) {
            URL.revokeObjectURL(oldUrl);
          }

          const wallpaper: Wallpaper = {
            id: generateId(),
            type: 'url',
            source: url,
            metadata,
            effects: get().effects,
            createdAt: Date.now(),
          };

          await db.wallpapers.add(wallpaper);
          await trimWallpaperHistory();

          set({
            currentWallpaper: wallpaper,
            currentUrl: url,
            activeSource: 'custom',
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to set wallpaper',
            isLoading: false,
          });
        }
      },

      setWallpaperFromFile: async (file) => {
        set({ isLoading: true, error: null });
        try {
          // P0-11: Validate image file
          const validation = validateImageFile(file);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          // P0-11: Compress image to reduce storage size
          const { blob: compressedBlob, width, height } = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.85,
            format: 'jpeg',
          });

          // Create blob URL for preview
          const blobUrl = URL.createObjectURL(compressedBlob);

          // P1-12: Release old ObjectURL before creating new one
          const oldUrl = get().currentUrl;
          if (oldUrl && oldUrl.startsWith('blob:')) {
            URL.revokeObjectURL(oldUrl);
          }

          const wallpaper: Wallpaper = {
            id: generateId(),
            type: 'blob',
            source: file.name,
            blob: compressedBlob, // Use compressed blob
            metadata: {
              width,
              height,
            },
            effects: get().effects,
            createdAt: Date.now(),
          };

          await db.wallpapers.add(wallpaper);
          await trimWallpaperHistory();

          set({
            currentWallpaper: wallpaper,
            currentUrl: blobUrl,
            activeSource: 'local',
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to set wallpaper',
            isLoading: false,
          });
        }
      },

      setSolidColor: (color) => {
        // Release old blob URL to prevent memory leak
        const oldUrl = get().currentUrl;
        if (oldUrl && oldUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldUrl);
        }

        set({
          solidColor: color,
          activeSource: 'solid',
          currentUrl: null,
          currentWallpaper: null,
        });
      },

      setGradient: (config) => {
        // Release old blob URL to prevent memory leak
        const oldUrl = get().currentUrl;
        if (oldUrl && oldUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldUrl);
        }

        set({
          gradient: config,
          activeSource: 'gradient',
          currentUrl: null,
          currentWallpaper: null,
        });
      },

      setMode: (mode) => {
        set({ mode });
      },

      setActiveSource: (source) => {
        set({ activeSource: source });
      },

      setEffects: (effects) => {
        set((state) => ({
          effects: { ...state.effects, ...effects },
        }));
      },

      resetEffects: () => {
        set({ effects: defaultEffects });
      },

      setAutoChange: (config) => {
        set((state) => ({
          autoChange: { ...state.autoChange, ...config },
        }));

        // Manage timer based on state changes
        const newState = get();

        if (config.enabled !== undefined || config.interval !== undefined) {
          if (newState.autoChange.enabled) {
            get().startAutoChange();
          } else {
            get().stopAutoChange();
          }
        }
      },

      startAutoChange: () => {
        const state = get();

        // Stop existing timer if any
        stopAutoChangeTimer();

        if (!state.autoChange.enabled) {
          console.info('Auto-change is disabled, not starting timer');
          return;
        }

        const intervalMs = getIntervalMs(state.autoChange.interval);

        if (intervalMs <= 0) {
          console.info('Auto-change interval is "never", not starting timer');
          return;
        }

        console.info(`Starting auto-change timer: ${state.autoChange.interval} (${intervalMs}ms)`);

        // Set up interval for automatic changes
        autoChangeTimer = setInterval(() => {
          void state.fetchRandomWallpaper();
        }, intervalMs);
      },

      stopAutoChange: () => {
        stopAutoChangeTimer();
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query || 'nature' });
      },

      addToFavorites: async (wallpaper) => {
        await db.wallpapers.put(wallpaper);
        set((state) => ({
          favorites: [...state.favorites, wallpaper],
        }));
      },

      removeFromFavorites: async (id) => {
        await db.wallpapers.delete(id);
        set((state) => ({
          favorites: state.favorites.filter((w) => w.id !== id),
        }));
      },

      fetchRandomWallpaper: async (source) => {
        const preferredSource = source || get().activeSource;
        set({ isLoading: true, error: null });

        try {
          const query = get().searchQuery || 'nature';

          // If we already have a compatible preloaded wallpaper, use it immediately.
          const preloaded = get().preloadedNext;
          const isPreloadedCompatible =
            !!preloaded &&
            preloaded.requestedSource === preferredSource &&
            preloaded.searchQuery === query &&
            Date.now() - preloaded.preloadedAt < 30 * 60 * 1000; // 30 min TTL

          const result = isPreloadedCompatible
            ? {
              url: preloaded!.url,
              metadata: preloaded!.metadata,
              actualSource: preloaded!.actualSource,
            }
            : await (async () => {
              // Use WallpaperManager for all API sources
              const fetched = await wallpaperManager.getRandomWallpaper(preferredSource, {
                query,
                orientation: 'landscape',
                safeMode: true,
              });

              // Ensure the image is loaded (cache-warmed) before switching currentUrl.
              await preloadImageUrl(fetched.url);

              return {
                url: fetched.url,
                metadata: fetched.metadata,
                actualSource: fetched.actualSource as WallpaperSource,
              };
            })();

          if (isPreloadedCompatible) {
            set({ preloadedNext: null });
          }

          const wallpaper: Wallpaper = {
            id: generateId(),
            type: result.actualSource as Wallpaper['type'],
            source: result.url,
            metadata: result.metadata,
            effects: get().effects,
            createdAt: Date.now(),
          };

          await db.wallpapers.add(wallpaper);
          await trimWallpaperHistory();

          // Release old ObjectURL
          const oldUrl = get().currentUrl;
          if (oldUrl && oldUrl.startsWith('blob:')) {
            URL.revokeObjectURL(oldUrl);
          }

          set({
            currentWallpaper: wallpaper,
            currentUrl: result.url,
            activeSource: result.actualSource as WallpaperSource,
            isLoading: false,
          });

          // Track download if needed (Unsplash requirement)
          if (result.metadata.downloadLocation) {
            void wallpaperManager.trackDownload(
              result.actualSource as WallpaperSource,
              result.metadata.downloadLocation
            ).catch(console.warn);
          }

          // Preload next wallpaper in background for a smoother next switch.
          if (isPreloadableWallpaperSource(preferredSource)) {
            void get().preloadNextWallpaper(preferredSource);
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch wallpaper',
            isLoading: false,
          });
        }
      },

      preloadNextWallpaper: async (source) => {
        const requestedSource = source || get().activeSource;
        if (!isPreloadableWallpaperSource(requestedSource)) return;

        const token = ++nextPreloadToken;
        const query = get().searchQuery || 'nature';

        set({ isPreloadingNext: true });

        try {
          const fetched = await wallpaperManager.getRandomWallpaper(requestedSource, {
            query,
            orientation: 'landscape',
            safeMode: true,
          });

          await preloadImageUrl(fetched.url);

          // Ignore outdated preloads (e.g. rapid user-triggered refresh).
          if (token !== nextPreloadToken) return;

          set({
            preloadedNext: {
              url: fetched.url,
              metadata: fetched.metadata,
              actualSource: fetched.actualSource as WallpaperSource,
              requestedSource,
              searchQuery: query,
              preloadedAt: Date.now(),
            },
            isPreloadingNext: false,
          });
        } catch (error) {
          if (token !== nextPreloadToken) return;
          console.warn('[Wallpaper] Failed to preload next wallpaper:', error);
          set({ isPreloadingNext: false });
        }
      },

      // Toggle like for preset wallpaper (one like per user per wallpaper)
      togglePresetLike: (id: string) => {
        set((state) => {
          const isCurrentlyLiked = state.likedWallpapers.includes(id);
          return {
            likedWallpapers: isCurrentlyLiked
              ? state.likedWallpapers.filter((wid) => wid !== id)
              : [...state.likedWallpapers, id],
          };
        });
      },

      // Toggle favorite for preset wallpaper
      togglePresetFavorite: (id: string) => {
        set((state) => {
          const isCurrentlyFavorited = state.favoritedPresets.includes(id);
          return {
            favoritedPresets: isCurrentlyFavorited
              ? state.favoritedPresets.filter((wid) => wid !== id)
              : [...state.favoritedPresets, id],
          };
        });
      },

      // Check if preset is liked
      isPresetLiked: (id: string) => {
        return get().likedWallpapers.includes(id);
      },

      // Check if preset is favorited
      isPresetFavorited: (id: string) => {
        return get().favoritedPresets.includes(id);
      },

      resetWallpaper: () => {
        set({
          currentWallpaper: null,
          currentUrl: null,
          activeSource: 'gradient',
          solidColor: '#1e293b',
          gradient: defaultGradient,
          effects: defaultEffects,
        });
      },
    }),
    {
      name: 'openinfinity-wallpaper',
      partialize: (state) => ({
        mode: state.mode,
        activeSource: state.activeSource,
        solidColor: state.solidColor,
        gradient: state.gradient,
        effects: state.effects,
        autoChange: state.autoChange,
        searchQuery: state.searchQuery,
        likedWallpapers: state.likedWallpapers,
        favoritedPresets: state.favoritedPresets,
      }),
    }
  )
);
