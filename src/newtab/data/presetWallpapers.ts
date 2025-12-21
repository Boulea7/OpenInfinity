/**
 * Preset Wallpapers - Curated high-quality wallpapers from Unsplash
 *
 * Each wallpaper has:
 * - Unique ID for tracking likes/favorites
 * - Full resolution URL and optimized thumbnail
 * - Author attribution (required by Unsplash)
 * - Tags for filtering
 * - Base like count (simulated community engagement)
 */

export interface PresetWallpaper {
  id: string;
  url: string;
  thumbnailUrl: string;
  author: string;
  authorUrl?: string;
  source: 'unsplash' | 'pexels';
  tags: string[];
  primaryColor: string;
  baseLikes: number;
}

/**
 * Curated collection of high-quality wallpapers
 * Categories: Nature, Ocean, City, Animals
 */
export const PRESET_WALLPAPERS: PresetWallpaper[] = [
  // === Nature / Landscapes ===
  {
    id: 'preset-1',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=75',
    author: 'Luca Bravo',
    authorUrl: 'https://unsplash.com/@lucabravo',
    source: 'unsplash',
    tags: ['nature', 'landscape', 'mountain', 'fog'],
    primaryColor: 'green',
    baseLikes: 1842,
  },
  {
    id: 'preset-2',
    url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=75',
    author: 'Matthew Smith',
    authorUrl: 'https://unsplash.com/@whale',
    source: 'unsplash',
    tags: ['nature', 'landscape', 'mountain', 'green'],
    primaryColor: 'green',
    baseLikes: 2156,
  },
  {
    id: 'preset-3',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75',
    author: 'Samuel Ferrara',
    authorUrl: 'https://unsplash.com/@samferrara',
    source: 'unsplash',
    tags: ['nature', 'mountain', 'snow', 'alps'],
    primaryColor: 'blue',
    baseLikes: 3421,
  },
  {
    id: 'preset-4',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=75',
    author: 'Kellen Riggin',
    authorUrl: 'https://unsplash.com/@kellenriggin',
    source: 'unsplash',
    tags: ['nature', 'landscape', 'autumn', 'forest'],
    primaryColor: 'orange',
    baseLikes: 1567,
  },

  // === Ocean / Beach ===
  {
    id: 'preset-5',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=75',
    author: 'Cristina Gottardi',
    authorUrl: 'https://unsplash.com/@cristina_gottardi',
    source: 'unsplash',
    tags: ['ocean', 'beach', 'blue', 'summer'],
    primaryColor: 'blue',
    baseLikes: 2893,
  },
  {
    id: 'preset-6',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=75',
    author: 'Tran Mau Tri Tam',
    authorUrl: 'https://unsplash.com/@tranmautritam',
    source: 'unsplash',
    tags: ['ocean', 'wave', 'blue', 'water'],
    primaryColor: 'blue',
    baseLikes: 1934,
  },

  // === City / Architecture ===
  {
    id: 'preset-7',
    url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&q=75',
    author: 'Matteo Catanese',
    authorUrl: 'https://unsplash.com/@matteocatanese',
    source: 'unsplash',
    tags: ['city', 'architecture', 'night', 'skyline'],
    primaryColor: 'black',
    baseLikes: 2567,
  },
  {
    id: 'preset-8',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&q=75',
    author: 'Denys Nevozhai',
    authorUrl: 'https://unsplash.com/@dnevozhai',
    source: 'unsplash',
    tags: ['city', 'street', 'japan', 'neon'],
    primaryColor: 'purple',
    baseLikes: 3102,
  },

  // === Animals / Wildlife ===
  {
    id: 'preset-9',
    url: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&q=75',
    author: 'David Clode',
    authorUrl: 'https://unsplash.com/@davidclode',
    source: 'unsplash',
    tags: ['animal', 'bird', 'nature', 'wildlife'],
    primaryColor: 'yellow',
    baseLikes: 1423,
  },
  {
    id: 'preset-10',
    url: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=400&q=75',
    author: 'Wexor Tmg',
    authorUrl: 'https://unsplash.com/@wexor',
    source: 'unsplash',
    tags: ['animal', 'turtle', 'ocean', 'underwater'],
    primaryColor: 'blue',
    baseLikes: 1876,
  },

  // === Abstract / Minimal ===
  {
    id: 'preset-11',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=75',
    author: 'Gradienta',
    authorUrl: 'https://unsplash.com/@gradienta',
    source: 'unsplash',
    tags: ['abstract', 'gradient', 'minimal', 'colorful'],
    primaryColor: 'purple',
    baseLikes: 2341,
  },
  {
    id: 'preset-12',
    url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=400&q=75',
    author: 'Gradienta',
    authorUrl: 'https://unsplash.com/@gradienta',
    source: 'unsplash',
    tags: ['abstract', 'gradient', 'minimal', 'pink'],
    primaryColor: 'red',
    baseLikes: 1987,
  },
];

/**
 * Get wallpapers filtered by tag
 */
export function getWallpapersByTag(tag: string): PresetWallpaper[] {
  return PRESET_WALLPAPERS.filter(w => w.tags.includes(tag));
}

/**
 * Get wallpapers filtered by primary color
 */
export function getWallpapersByColor(color: string): PresetWallpaper[] {
  return PRESET_WALLPAPERS.filter(w => w.primaryColor === color);
}

export default PRESET_WALLPAPERS;
