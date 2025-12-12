import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, generateId, type Wallpaper } from '../services/database';
import { compressImage, validateImageFile } from '../utils/imageCompression';
import { wallpaperManager } from '../services/wallpaper';

/**
 * Wallpaper source types
 */
export type WallpaperSource =
  | 'local'
  | 'preset'
  | 'unsplash'
  | 'pexels'
  | 'bing'
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

  // Collection
  favorites: Wallpaper[];

  // Loading state
  isLoading: boolean;
  error: string | null;
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

  // Favorites
  addToFavorites: (wallpaper: Wallpaper) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;

  // Random
  fetchRandomWallpaper: (source?: WallpaperSource) => Promise<void>;

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
 * Default gradient
 */
const defaultGradient: GradientConfig = {
  colors: ['#8b5cf6', '#6366f1', '#3b82f6'],
  direction: 'to-br',
};

/**
 * Wallpaper management store
 */
export const useWallpaperStore = create<WallpaperState & WallpaperActions>()(
  persist(
    (set, get) => ({
      // Initial state
      currentWallpaper: null,
      currentUrl: null,
      mode: 'full',
      activeSource: 'gradient',
      solidColor: '#1e293b',
      gradient: defaultGradient,
      effects: defaultEffects,
      autoChange: {
        enabled: false,
        interval: 'daily',
        sources: ['unsplash', 'bing'],
      },
      favorites: [],
      isLoading: false,
      error: null,

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
          }

          // Load favorites
          const favorites = await db.wallpapers.toArray();
          set({ favorites, isLoading: false });
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
        set({
          solidColor: color,
          activeSource: 'solid',
          currentUrl: null,
          currentWallpaper: null,
        });
      },

      setGradient: (config) => {
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
          // Use WallpaperManager for all API sources
          const result = await wallpaperManager.getRandomWallpaper(preferredSource, {
            query: 'nature', // TODO: Make this configurable from settings
            orientation: 'landscape',
            safeMode: true,
          });

          const wallpaper: Wallpaper = {
            id: generateId(),
            type: result.actualSource as Wallpaper['type'],
            source: result.url,
            metadata: result.metadata,
            effects: get().effects,
            createdAt: Date.now(),
          };

          await db.wallpapers.add(wallpaper);

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
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch wallpaper',
            isLoading: false,
          });
        }
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
      }),
    }
  )
);
