/**
 * Wallpaper Sources Configuration
 *
 * This file contains all supported wallpaper sources with their API configurations.
 * Some sources require API keys which can be obtained from their respective websites.
 */

export interface WallpaperSource {
  id: string;
  name: string;
  description: string;
  descriptionZh: string;
  logo: string; // URL or base64 data URI for the source logo
  website: string;
  apiKeyRequired: boolean;
  apiKeyUrl?: string; // Where to get the API key
  enabled: boolean;
  category: 'general' | 'nature' | 'anime' | 'photography' | 'startup';
}

export interface WallpaperSourceConfig {
  sources: WallpaperSource[];
  apiKeys: Record<string, string>;
}

// Default wallpaper sources configuration
export const WALLPAPER_SOURCES: WallpaperSource[] = [
  // === General / Popular Sources ===
  {
    id: 'bing',
    name: 'Bing Daily',
    description: 'Microsoft Bing daily wallpaper, high quality landscape photos',
    descriptionZh: '必应每日壁纸，高质量风景照片',
    logo: 'https://www.bing.com/favicon.ico',
    website: 'https://www.bing.com',
    apiKeyRequired: false,
    enabled: true,
    category: 'general',
  },
  {
    id: 'unsplash',
    name: 'Unsplash',
    description: 'Beautiful free photos from the world\'s most generous community',
    descriptionZh: '来自全球摄影师社区的高质量免费图片',
    logo: 'https://unsplash.com/favicon.ico',
    website: 'https://unsplash.com',
    apiKeyRequired: true,
    apiKeyUrl: 'https://unsplash.com/developers',
    enabled: true,
    category: 'general',
  },

  // === Anime Sources ===
  {
    id: 'anime',
    name: 'Anime Wallpapers',
    description: 'Beautiful anime and illustration wallpapers',
    descriptionZh: '精美动漫插画壁纸库',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZjY5YjQiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEyIDJMMi43IDE1LjFoMTguNkwxMiAyeiIvPjwvc3ZnPg==',
    website: 'https://wallhaven.cc',
    apiKeyRequired: false,
    enabled: false,
    category: 'anime',
  },

  // === Nature & Photography Sources ===
  {
    id: 'lifeofpix',
    name: 'Life of Pix',
    description: 'Free high resolution photography by LEEROY agency',
    descriptionZh: 'LEEROY 团队的免费高清摄影作品',
    logo: 'https://www.lifeofpix.com/favicon.ico',
    website: 'https://www.lifeofpix.com',
    apiKeyRequired: false,
    enabled: false,
    category: 'photography',
  },
  {
    id: 'mmt',
    name: 'MMT Stock',
    description: 'Free stock photos by Jeffrey Betts',
    descriptionZh: 'Jeffrey Betts 的免费图库',
    logo: 'https://mmtstock.com/favicon.ico',
    website: 'https://mmtstock.com',
    apiKeyRequired: false,
    enabled: false,
    category: 'photography',
  },
  {
    id: 'realisticshots',
    name: 'Realistic Shots',
    description: 'Free stock photos for personal and commercial use',
    descriptionZh: '可商用的免费图库',
    logo: 'https://realisticshots.com/favicon.ico',
    website: 'https://realisticshots.com',
    apiKeyRequired: false,
    enabled: false,
    category: 'photography',
  },
  {
    id: 'jaymantri',
    name: 'Jay Mantri',
    description: 'Free pics. Do anything (CC0). Make magic.',
    descriptionZh: 'CC0 协议免费图片，任意使用',
    logo: 'https://jaymantri.com/favicon.ico',
    website: 'https://jaymantri.com',
    apiKeyRequired: false,
    enabled: false,
    category: 'nature',
  },
  {
    id: 'freenaturestock',
    name: 'Free Nature Stock',
    description: 'Royalty-free nature stock photos',
    descriptionZh: '免版税自然风景图库',
    logo: 'https://freenaturestock.com/favicon.ico',
    website: 'https://freenaturestock.com',
    apiKeyRequired: false,
    enabled: false,
    category: 'nature',
  },
  {
    id: 'skitterphoto',
    name: 'Skitter Photo',
    description: 'A place to find, show and share public domain photos',
    descriptionZh: '公共领域图片分享平台',
    logo: 'https://skitterphoto.com/favicon.ico',
    website: 'https://skitterphoto.com',
    apiKeyRequired: false,
    enabled: false,
    category: 'photography',
  },

  // === Startup & Business Sources ===
  {
    id: 'startupstock',
    name: 'Startup Stock Photos',
    description: 'Free photos for startups, bloggers and publishers',
    descriptionZh: '面向创业公司的免费商业图片',
    logo: 'https://startupstockphotos.com/favicon.ico',
    website: 'https://startupstockphotos.com',
    apiKeyRequired: false,
    enabled: false,
    category: 'startup',
  },
  {
    id: 'barnimages',
    name: 'Barn Images',
    description: 'Free high-resolution non-stock photos',
    descriptionZh: '非库存风格的高清免费图片',
    logo: 'https://barnimages.com/favicon.ico',
    website: 'https://barnimages.com',
    apiKeyRequired: false,
    enabled: false,
    category: 'photography',
  },
  {
    id: 'picography',
    name: 'Picography',
    description: 'Gorgeous free photos by Dave Meier and others',
    descriptionZh: 'Dave Meier 等摄影师的精美作品',
    logo: 'https://picography.co/favicon.ico',
    website: 'https://picography.co',
    apiKeyRequired: false,
    enabled: false,
    category: 'photography',
  },
];

/**
 * Get wallpaper source by ID
 */
export function getSourceById(id: string): WallpaperSource | undefined {
  return WALLPAPER_SOURCES.find(source => source.id === id);
}

/**
 * Get all sources that require API keys
 */
export function getSourcesRequiringApiKey(): WallpaperSource[] {
  return WALLPAPER_SOURCES.filter(source => source.apiKeyRequired);
}

/**
 * Get sources by category
 */
export function getSourcesByCategory(category: WallpaperSource['category']): WallpaperSource[] {
  return WALLPAPER_SOURCES.filter(source => source.category === category);
}

/**
 * Wallpaper fetching functions for each source
 */

// Bing Daily Wallpaper
export async function fetchBingWallpaper(): Promise<string | null> {
  try {
    // Bing API endpoint for daily wallpaper
    const response = await fetch(
      'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US'
    );
    const data = await response.json();
    if (data.images && data.images[0]) {
      return `https://www.bing.com${data.images[0].url}`;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch Bing wallpaper:', error);
    return null;
  }
}

// Unsplash Random Wallpaper
export async function fetchUnsplashWallpaper(
  apiKey: string,
  query?: string
): Promise<string | null> {
  if (!apiKey) {
    console.error('Unsplash API key is required');
    return null;
  }

  try {
    const params = new URLSearchParams({
      client_id: apiKey,
      orientation: 'landscape',
      ...(query && { query }),
    });

    const response = await fetch(
      `https://api.unsplash.com/photos/random?${params.toString()}`
    );
    const data = await response.json();
    return data.urls?.full || data.urls?.regular || null;
  } catch (error) {
    console.error('Failed to fetch Unsplash wallpaper:', error);
    return null;
  }
}

// Generic wallpaper fetch for static sources
// These sources typically have RSS or simple page scraping
export async function fetchStaticSourceWallpaper(
  sourceId: string
): Promise<string | null> {
  // TODO: Implement scraping/RSS parsing for each static source
  // For now, return null as placeholder
  console.log(`Fetching from source: ${sourceId} (not implemented yet)`);
  return null;
}

/**
 * API Key management helpers
 */
export const API_KEY_INSTRUCTIONS: Record<string, { steps: string[]; stepsZh: string[] }> = {
  unsplash: {
    steps: [
      '1. Go to https://unsplash.com/developers',
      '2. Click "Your apps" and create a new application',
      '3. Accept the API Use and Guidelines',
      '4. Copy your "Access Key" (not Secret Key)',
      '5. Paste the key in the settings below',
    ],
    stepsZh: [
      '1. 访问 https://unsplash.com/developers',
      '2. 点击 "Your apps" 并创建新应用',
      '3. 同意 API 使用条款',
      '4. 复制你的 "Access Key"（不是 Secret Key）',
      '5. 将密钥粘贴到下方设置中',
    ],
  },
};

/**
 * Storage key for API keys
 */
export const WALLPAPER_API_KEYS_STORAGE_KEY = 'wallpaper-api-keys';

/**
 * Get stored API keys
 */
export function getStoredApiKeys(): Record<string, string> {
  try {
    const stored = localStorage.getItem(WALLPAPER_API_KEYS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Store an API key
 */
export function storeApiKey(sourceId: string, apiKey: string): void {
  const keys = getStoredApiKeys();
  keys[sourceId] = apiKey;
  localStorage.setItem(WALLPAPER_API_KEYS_STORAGE_KEY, JSON.stringify(keys));
}

/**
 * Remove an API key
 */
export function removeApiKey(sourceId: string): void {
  const keys = getStoredApiKeys();
  delete keys[sourceId];
  localStorage.setItem(WALLPAPER_API_KEYS_STORAGE_KEY, JSON.stringify(keys));
}
