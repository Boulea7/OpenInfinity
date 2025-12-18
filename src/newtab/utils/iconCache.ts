/**
 * Icon Cache Utility
 * Cache search engine icons to localStorage for instant loading
 */

const CACHE_VERSION = 'v1';
const CACHE_KEY = `engine-icon-cache-${CACHE_VERSION}`;
const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface IconCacheEntry {
  dataUrl: string;
  cachedAt: number;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readIconCache(): Record<string, IconCacheEntry> {
  return safeJsonParse<Record<string, IconCacheEntry>>(localStorage.getItem(CACHE_KEY), {});
}

/**
 * Get cached engine icon or fetch and cache it
 */
export async function getCachedEngineIcon(
  engineId: string,
  iconUrl: string
): Promise<string> {
  const cache = readIconCache();

  const entry = cache[engineId];

  // Cache hit and not expired
  if (
    entry &&
    typeof entry.dataUrl === 'string' &&
    typeof entry.cachedAt === 'number' &&
    Date.now() - entry.cachedAt < MAX_AGE
  ) {
    return entry.dataUrl;
  }

  // Cache miss or expired - fetch and cache
  try {
    const dataUrl = await fetchAndConvertToBase64(iconUrl);

    cache[engineId] = {
      dataUrl,
      cachedAt: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    return dataUrl;
  } catch (error) {
    console.warn(`Icon cache miss for ${engineId}:`, error);
    return iconUrl; // Fallback to original URL
  }
}

/**
 * Convert image URL to Base64 data URL
 */
async function fetchAndConvertToBase64(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: 'image/*',
    },
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch icon: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error(`Invalid icon content-type: ${contentType || 'unknown'}`);
  }

  const blob = await response.blob();
  if (blob.type && !blob.type.toLowerCase().startsWith('image/')) {
    throw new Error(`Invalid icon mime type: ${blob.type}`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Clear expired cache entries
 */
export function clearExpiredIconCache(): void {
  const cache = readIconCache();

  const now = Date.now();

  Object.keys(cache).forEach((key) => {
    const entry = cache[key];
    if (!entry || typeof entry.cachedAt !== 'number' || now - entry.cachedAt > MAX_AGE) {
      delete cache[key];
    }
  });

  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/**
 * Preload icons for all engines
 */
export async function preloadEngineIcons(
  engines: Array<{ id: string; icon?: string }>
): Promise<Record<string, string>> {
  const cache: Record<string, string> = {};

  await Promise.all(
    engines.map(async (engine) => {
      if (engine.icon) {
        const dataUrl = await getCachedEngineIcon(engine.id, engine.icon);
        cache[engine.id] = dataUrl;
      }
    })
  );

  return cache;
}
