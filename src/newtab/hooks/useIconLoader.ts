/**
 * =====================================================================================
 *
 *    ██████╗ ██████╗ ███████╗███╗   ██╗    ██╗███╗   ██╗███████╗██╗███╗   ██╗██╗████████╗██╗   ██╗
 *   ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ██║████╗  ██║██╔════╝██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝
 *   ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║██║   ██║    ╚████╔╝
 *   ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║██║   ██║     ╚██╔╝
 *   ╚██████╔╝██║     ███████╗██║ ╚████║    ██║██║ ╚████║██║     ██║██║ ╚████║██║   ██║      ██║
 *    ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝
 *
 *   OpenInfinity - Your Infinite New Tab Experience
 *
 * =====================================================================================
 *   Copyright (c) 2024-2026 OpenInfinity Team. All rights reserved.
 *   Licensed under the MIT License
 *   GitHub: https://github.com/OpenInfinity/OpenInfinity
 * =====================================================================================
 */

/**
 * @fileoverview useIconLoader Hook - Website Icon Loading with Multi-Level Fallback
 *
 * A React hook for loading website icons (favicons) with intelligent multi-level
 * fallback mechanism and offline-first caching support. Designed for both WebsiteCard
 * (AddTab modal) and IconItem (main grid) components.
 *
 * ## Key Features
 *
 * - **Offline-First Architecture**: Uses IndexedDB cache via resourceCache service
 *   for instant icon display even without network connectivity.
 *
 * - **Multi-Level Fallback Chain**:
 *   1. Custom icon (user-defined or from presetWebsites)
 *   2. Site favicon.ico (direct fetch from website root)
 *   3. DuckDuckGo favicon service (reliable third-party fallback)
 *   4. Text fallback (first letter of website name)
 *
 * - **China-Friendly**: Deliberately avoids Google Favicon API which is blocked
 *   in mainland China. Uses DuckDuckGo as the CDN fallback instead.
 *
 * - **Non-Blocking Loading**: Returns cached results immediately while
 *   loading fresh icons in the background. No UI flicker.
 *
 * - **Memory-Safe**: Properly handles component unmounting to prevent
 *   memory leaks and state updates on unmounted components.
 *
 * ## Fallback Flow Diagram
 *
 * ```
 * customIcon provided? ──YES──> Use customIcon
 *        │
 *       NO
 *        │
 *        v
 * Try favicon.ico ──SUCCESS──> Cache & display
 *        │
 *      FAIL
 *        │
 *        v
 * Try DuckDuckGo ──SUCCESS──> Cache & display
 *        │
 *      FAIL
 *        │
 *        v
 * Use text fallback (first letter)
 * ```
 *
 * @module hooks/useIconLoader
 * @version 1.0.0
 * @author OpenInfinity Team
 * @see {@link UseIconLoaderOptions} for configuration options
 * @see {@link UseIconLoaderResult} for return value details
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { getCachedResource } from '../services/resourceCache';
import { extractDomain } from '../utils';

// =============================================================================
// Types & Interfaces
// =============================================================================

/**
 * Represents the current stage in the fallback loading chain.
 *
 * The hook progresses through these states sequentially when each
 * previous source fails to load:
 *
 * | State       | Description                                        |
 * |-------------|----------------------------------------------------|
 * | `custom`    | Using a pre-defined custom icon URL                |
 * | `favicon`   | Attempting to load /favicon.ico from the website   |
 * | `duckduckgo`| Using DuckDuckGo's favicon CDN service             |
 * | `text`      | All icon sources failed; use text fallback         |
 *
 * @internal This type is exported for debugging purposes only
 */
type FallbackState = 'custom' | 'favicon' | 'duckduckgo' | 'text';

/**
 * Configuration options for the useIconLoader hook.
 *
 * These options control the icon loading behavior including fallback
 * handling, caching strategy, and size optimization.
 *
 * @example Basic usage with defaults
 * ```ts
 * const options: UseIconLoaderOptions = {};
 * ```
 *
 * @example Full configuration
 * ```ts
 * const options: UseIconLoaderOptions = {
 *   customIcon: 'https://example.com/icon.png',
 *   size: 128,
 *   enableCache: true,
 *   skipLoad: false,
 * };
 * ```
 */
export interface UseIconLoaderOptions {
  /**
   * Pre-defined custom icon URL to use instead of auto-detection.
   *
   * When provided and valid, this URL takes highest priority and
   * bypasses the entire fallback chain. Commonly used for:
   * - Icons from presetWebsites configuration
   * - User-uploaded custom icons
   * - CDN-hosted brand icons
   *
   * @example 'https://cdn.example.com/github-icon.svg'
   * @default undefined
   */
  customIcon?: string;

  /**
   * Icon size in pixels for cache key differentiation.
   *
   * Different sizes are cached separately to avoid serving
   * inappropriately sized icons. This does NOT resize the icon;
   * it only affects the cache key generation for proper differentiation.
   *
   * @example 128 // For larger display contexts like hero sections
   * @default 64
   */
  size?: number;

  /**
   * Enable IndexedDB caching for offline-first experience.
   *
   * When enabled, successfully loaded icons are stored in IndexedDB
   * and served from cache on subsequent requests. Disable only for:
   * - Development/debugging scenarios
   * - When fresh icons are always required
   * - Testing fallback behavior
   *
   * @default true
   */
  enableCache?: boolean;

  /**
   * Skip all loading attempts and immediately use text fallback.
   *
   * Useful for performance optimization when you know the icon
   * won't be available, or for intentionally using text-based
   * icon display (e.g., user preference, bandwidth saving).
   *
   * @default false
   */
  skipLoad?: boolean;
}

/**
 * Return type of the useIconLoader hook.
 *
 * Contains the resolved icon source and loading state information
 * needed to properly render the icon in UI components.
 *
 * @example Typical usage pattern
 * ```tsx
 * const { iconSrc, isLoading, useFallbackText, fallbackState } = useIconLoader(url);
 *
 * // Debug: log current fallback state
 * console.log('Fallback state:', fallbackState);
 *
 * if (isLoading) return <Skeleton />;
 * if (useFallbackText) return <TextIcon>{name[0]}</TextIcon>;
 * return <img src={iconSrc!} alt={name} />;
 * ```
 */
export interface UseIconLoaderResult {
  /**
   * Resolved icon source URL or data URL from cache.
   *
   * This can be one of:
   * - The original `customIcon` URL (if provided and valid)
   * - A data URL from IndexedDB cache (base64 encoded)
   * - A direct URL to favicon.ico or DuckDuckGo service
   * - `null` if using text fallback or still in initial loading
   *
   * @important Always check `useFallbackText` before using this value.
   *            If `useFallbackText` is true, this may be null.
   */
  iconSrc: string | null;

  /**
   * Whether the icon is currently being loaded.
   *
   * Use this to show loading indicators or skeleton states.
   * Will be `false` when:
   * - Custom icon is provided (no network loading needed)
   * - Icon successfully loaded from cache or network
   * - All fallbacks exhausted (using text fallback)
   *
   * @example
   * ```tsx
   * if (isLoading) {
   *   return <div className="animate-pulse bg-gray-200 rounded" />;
   * }
   * ```
   */
  isLoading: boolean;

  /**
   * Whether to display text fallback instead of an image.
   *
   * When `true`, all icon loading attempts have failed and the
   * component should display a text-based fallback (typically
   * the first letter of the website name in a colored circle).
   *
   * @example
   * ```tsx
   * if (useFallbackText) {
   *   return (
   *     <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
   *       {siteName.charAt(0).toUpperCase()}
   *     </div>
   *   );
   * }
   * ```
   */
  useFallbackText: boolean;

  /**
   * Current position in the fallback chain (for debugging).
   *
   * Useful for debugging icon loading issues and understanding
   * which fallback source is currently being used or was successful.
   *
   * | Value       | Meaning                                     |
   * |-------------|---------------------------------------------|
   * | `custom`    | Using provided customIcon                   |
   * | `favicon`   | Trying/using site's favicon.ico             |
   * | `duckduckgo`| Trying/using DuckDuckGo favicon service     |
   * | `text`      | All fallbacks failed, using text            |
   *
   * @internal Primarily for development and debugging purposes
   */
  fallbackState: FallbackState;
}

// =============================================================================
// Internal Helper Functions
// =============================================================================

/**
 * Constructs the favicon.ico URL for a given website.
 *
 * Extracts the origin from the provided URL and appends /favicon.ico.
 * This is the standard location for website favicons per HTML specification.
 *
 * @param url - The full website URL (e.g., 'https://github.com/user/repo')
 * @returns The favicon URL (e.g., 'https://github.com/favicon.ico'),
 *          or empty string if URL parsing fails
 *
 * @example
 * ```ts
 * getFaviconIcoUrl('https://github.com/openai')
 * // Returns: 'https://github.com/favicon.ico'
 *
 * getFaviconIcoUrl('https://docs.google.com/document/d/xxx')
 * // Returns: 'https://docs.google.com/favicon.ico'
 *
 * getFaviconIcoUrl('invalid-url')
 * // Returns: ''
 * ```
 *
 * @internal
 */
function getFaviconIcoUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}/favicon.ico`;
  } catch {
    return '';
  }
}

/**
 * Constructs the DuckDuckGo favicon service URL for a domain.
 *
 * DuckDuckGo provides a reliable favicon CDN service that works
 * globally including in China (unlike Google's favicon service).
 * The service aggregates favicons for most popular websites.
 *
 * @param url - The website URL to get favicon for
 * @returns The DuckDuckGo favicon service URL
 *
 * @example
 * ```ts
 * getDuckDuckGoFaviconUrl('https://github.com')
 * // Returns: 'https://icons.duckduckgo.com/ip3/github.com.ico'
 *
 * getDuckDuckGoFaviconUrl('https://www.google.com/search?q=test')
 * // Returns: 'https://icons.duckduckgo.com/ip3/www.google.com.ico'
 * ```
 *
 * @see https://icons.duckduckgo.com - DuckDuckGo Icon Service
 * @internal
 */
function getDuckDuckGoFaviconUrl(url: string): string {
  const domain = extractDomain(url);
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

/**
 * Validates whether a string is a usable icon URL.
 *
 * Performs basic validation to filter out empty strings, undefined,
 * null, and obviously invalid URLs (like bare protocols).
 *
 * This is a type guard function that narrows the type from
 * `string | undefined | null` to `string` when returning true.
 *
 * @param url - The URL string to validate
 * @returns Type guard indicating if the URL is valid and usable
 *
 * @example
 * ```ts
 * isValidIconUrl('https://example.com/icon.png') // true
 * isValidIconUrl('data:image/png;base64,iVBOR...') // true
 * isValidIconUrl('') // false
 * isValidIconUrl(undefined) // false
 * isValidIconUrl(null) // false
 * isValidIconUrl('http://') // false (bare protocol)
 * isValidIconUrl('https://') // false (bare protocol)
 * ```
 *
 * @internal
 */
function isValidIconUrl(url: string | undefined | null): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Reject URLs that are just protocols or obviously invalid
  if (trimmed === 'http://' || trimmed === 'https://') return false;
  return true;
}

/**
 * Fetches a URL and converts its content to a base64 data URL.
 *
 * Used for loading icons when IndexedDB caching is disabled.
 * Uses browser fetch with cache hints and security-conscious
 * request options to minimize privacy exposure.
 *
 * @param url - The icon URL to fetch
 * @returns Promise resolving to a data URL string (e.g., 'data:image/png;base64,...'),
 *          or null if fetch fails for any reason
 *
 * @example
 * ```ts
 * const dataUrl = await fetchAsDataUrl('https://example.com/icon.png');
 * if (dataUrl) {
 *   // dataUrl: 'data:image/png;base64,iVBORw0KGgo...'
 *   imageElement.src = dataUrl;
 * }
 * ```
 *
 * @internal
 */
async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      // Use browser cache when available for performance
      cache: 'force-cache',
      // Don't send referrer for privacy protection
      referrerPolicy: 'no-referrer',
      // Don't send cookies for security
      credentials: 'omit',
    });

    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// =============================================================================
// Main Hook Implementation
// =============================================================================

/**
 * React hook for loading website icons with multi-level fallback and caching.
 *
 * Provides a unified interface for loading and displaying website favicons
 * with automatic fallback handling, offline caching, and loading state
 * management. Designed for seamless integration with icon display components.
 *
 * ## Fallback Chain
 *
 * The hook attempts to load icons in the following order:
 *
 * 1. **Custom Icon**: If `options.customIcon` is provided and valid,
 *    it's used immediately without any network requests.
 *
 * 2. **Favicon.ico**: Direct request to the website's /favicon.ico.
 *    Most websites provide this standard favicon location.
 *
 * 3. **DuckDuckGo**: Falls back to DuckDuckGo's favicon CDN service,
 *    which aggregates favicons for most popular websites.
 *
 * 4. **Text Fallback**: If all icon sources fail, `useFallbackText`
 *    becomes `true`, signaling the component to display text instead.
 *
 * ## Caching Behavior
 *
 * When `enableCache` is true (default), successfully loaded icons are:
 * - Stored in IndexedDB via the resourceCache service
 * - Served instantly on subsequent renders (no network delay)
 * - Persisted across browser sessions
 * - Keyed by domain and size for proper differentiation
 *
 * ## Memory Safety
 *
 * The hook properly handles component unmounting:
 * - Cancels pending async operations
 * - Prevents state updates after unmount
 * - Cleans up effect subscriptions
 *
 * @param url - The website URL to load the icon for. Should be a valid
 *              URL string (e.g., 'https://github.com'). Invalid URLs
 *              will gracefully fall back to text display.
 *
 * @param options - Configuration options for icon loading behavior
 * @param options.customIcon - Pre-defined icon URL to use instead of auto-detection
 * @param options.size - Icon size in pixels for cache key differentiation (default: 64)
 * @param options.enableCache - Enable IndexedDB caching (default: true)
 * @param options.skipLoad - Skip loading and use text fallback immediately (default: false)
 *
 * @returns Object containing icon source, loading state, and fallback indicators
 *
 * @example Basic Usage
 * ```tsx
 * function WebsiteIcon({ url, name }) {
 *   const { iconSrc, isLoading, useFallbackText } = useIconLoader(url);
 *
 *   if (isLoading) {
 *     return <Skeleton className="w-8 h-8 rounded" />;
 *   }
 *
 *   if (useFallbackText) {
 *     return (
 *       <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
 *         {name.charAt(0).toUpperCase()}
 *       </div>
 *     );
 *   }
 *
 *   return <img src={iconSrc!} alt={name} className="w-8 h-8 rounded" />;
 * }
 * ```
 *
 * @example With Custom Icon (Preset Websites)
 * ```tsx
 * function PresetWebsiteCard({ website }) {
 *   // customIcon takes priority - loading is instant, no network request
 *   const { iconSrc, useFallbackText } = useIconLoader(website.url, {
 *     customIcon: website.icon,
 *     size: 128,
 *   });
 *
 *   return <img src={iconSrc!} alt={website.name} className="w-16 h-16" />;
 * }
 * ```
 *
 * @example Conditional/Lazy Loading
 * ```tsx
 * function LazyIcon({ url, name, isVisible }) {
 *   // Don't load until the element becomes visible
 *   const { iconSrc, useFallbackText } = useIconLoader(url, {
 *     skipLoad: !isVisible,
 *   });
 *
 *   if (!isVisible || useFallbackText) {
 *     return <TextFallback>{name[0]}</TextFallback>;
 *   }
 *
 *   return <img src={iconSrc!} alt={name} />;
 * }
 * ```
 *
 * @example With Debugging
 * ```tsx
 * function DebugIcon({ url, name }) {
 *   const result = useIconLoader(url);
 *
 *   // Log fallback state for debugging
 *   useEffect(() => {
 *     console.log(`Icon for ${name}: ${result.fallbackState}`);
 *   }, [result.fallbackState, name]);
 *
 *   return result.useFallbackText
 *     ? <TextIcon>{name[0]}</TextIcon>
 *     : <img src={result.iconSrc!} alt={name} />;
 * }
 * ```
 *
 * @see {@link UseIconLoaderOptions} for configuration options
 * @see {@link UseIconLoaderResult} for return value details
 */
export function useIconLoader(
  url: string,
  options: UseIconLoaderOptions = {}
): UseIconLoaderResult {
  const {
    customIcon,
    size = 64,
    enableCache = true,
    skipLoad = false,
  } = options;

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  // Current position in the fallback chain
  const [fallbackState, setFallbackState] = useState<FallbackState>(
    isValidIconUrl(customIcon) ? 'custom' : 'favicon'
  );

  // Cached icon source (data URL from IndexedDB or fetch)
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);

  // Loading indicator - starts false if custom icon is provided
  const [isLoading, setIsLoading] = useState(!isValidIconUrl(customIcon));

  // Track component mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);

  // ---------------------------------------------------------------------------
  // Memoized URL Calculations
  // ---------------------------------------------------------------------------

  // Pre-compute fallback URLs to avoid recalculation on each render
  const faviconUrl = useMemo(() => getFaviconIcoUrl(url), [url]);
  const duckDuckGoUrl = useMemo(() => getDuckDuckGoFaviconUrl(url), [url]);

  // Generate unique cache key based on domain and size
  const cacheKey = useMemo(
    () => `icon_${extractDomain(url)}_${size}`,
    [url, size]
  );

  // ---------------------------------------------------------------------------
  // State Reset on Input Changes
  // ---------------------------------------------------------------------------

  // Reset state when URL or customIcon changes to trigger fresh loading
  useEffect(() => {
    setFallbackState(isValidIconUrl(customIcon) ? 'custom' : 'favicon');
    setCachedSrc(null);
    setIsLoading(!isValidIconUrl(customIcon));
  }, [url, customIcon]);

  // ---------------------------------------------------------------------------
  // Cleanup on Unmount
  // ---------------------------------------------------------------------------

  // Track mounted state for safe async state updates
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Icon Loading Effect
  // ---------------------------------------------------------------------------

  // Main loading logic with fallback chain progression
  useEffect(() => {
    // Skip loading if custom icon is provided or skipLoad flag is true
    if (isValidIconUrl(customIcon) || skipLoad) {
      setIsLoading(false);
      return;
    }

    // Skip if we've exhausted all fallbacks (reached text state)
    if (fallbackState === 'text') {
      setIsLoading(false);
      return;
    }

    // Cancellation flag for cleanup
    let cancelled = false;

    /**
     * Attempts to load the icon from the current fallback source.
     * On failure, advances to the next fallback in the chain.
     */
    async function loadIcon() {
      if (!mountedRef.current || cancelled) return;

      setIsLoading(true);

      // Determine which URL to try based on current fallback state
      const urlToTry = fallbackState === 'favicon' ? faviconUrl : duckDuckGoUrl;

      if (!urlToTry) {
        // No valid URL available, skip directly to text fallback
        if (mountedRef.current && !cancelled) {
          setFallbackState('text');
          setIsLoading(false);
        }
        return;
      }

      try {
        // Attempt to load from cache or network based on enableCache option
        const result = enableCache
          ? await getCachedResource(urlToTry, { customId: cacheKey })
          : await fetchAsDataUrl(urlToTry);

        // Check if still mounted and not cancelled before updating state
        if (!mountedRef.current || cancelled) return;

        if (result) {
          // Success - update state with cached/loaded icon
          setCachedSrc(result);
          setIsLoading(false);
        } else {
          // Failed - advance to next fallback in chain
          advanceFallback();
        }
      } catch {
        // Error occurred - advance to next fallback
        if (!mountedRef.current || cancelled) return;
        advanceFallback();
      }
    }

    /**
     * Advances to the next fallback source in the chain.
     * Progression: favicon -> duckduckgo -> text
     */
    function advanceFallback() {
      if (!mountedRef.current || cancelled) return;

      setFallbackState((prev) => {
        switch (prev) {
          case 'favicon':
            return 'duckduckgo';
          case 'duckduckgo':
            return 'text';
          default:
            return 'text';
        }
      });
    }

    loadIcon();

    // Cleanup function to cancel pending operations on unmount
    return () => {
      cancelled = true;
    };
  }, [
    url,
    customIcon,
    fallbackState,
    faviconUrl,
    duckDuckGoUrl,
    cacheKey,
    enableCache,
    skipLoad,
  ]);

  // ---------------------------------------------------------------------------
  // Final Icon Source Calculation
  // ---------------------------------------------------------------------------

  // Determine the final icon source with priority order
  const iconSrc = useMemo(() => {
    // Priority 1: Custom icon (highest priority, user-defined)
    if (isValidIconUrl(customIcon)) {
      return customIcon;
    }

    // Priority 2: Cached/loaded icon from previous successful load
    if (cachedSrc) {
      return cachedSrc;
    }

    // Priority 3: Current fallback URL for immediate display while loading
    // This allows showing something while the cache/network loads
    if (fallbackState === 'favicon' && faviconUrl) {
      return faviconUrl;
    }
    if (fallbackState === 'duckduckgo' && duckDuckGoUrl) {
      return duckDuckGoUrl;
    }

    // No valid source available
    return null;
  }, [customIcon, cachedSrc, fallbackState, faviconUrl, duckDuckGoUrl]);

  // ---------------------------------------------------------------------------
  // Return Value
  // ---------------------------------------------------------------------------

  return {
    iconSrc,
    isLoading,
    useFallbackText: fallbackState === 'text',
    fallbackState,
  };
}

export default useIconLoader;
