/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗ ██████╗ ███████╗███╗   ██╗    ██╗███╗   ██╗███████╗██╗███╗   ██║
 * ║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ██║████╗  ██║██╔════╝██║████╗  ██║
 * ║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║
 * ║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║
 * ║  ╚██████╔╝██║     ███████╗██║ ╚████║    ██║██║ ╚████║██║     ██║██║ ╚████║
 * ║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══║
 * ║                                                                           ║
 * ║  OpenInfinity - Your Infinite New Tab Experience                          ║
 * ║                                                                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Copyright (c) 2024-2026 OpenInfinity Team. All rights reserved.          ║
 * ║  Licensed under the MIT License                                           ║
 * ║  GitHub: https://github.com/OpenInfinity/OpenInfinity                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * SearchBar Component
 *
 * A modern search bar with glassmorphism design following Windows 11 Fluent style.
 * Serves as the primary search interface on the new tab page with support for
 * multiple search engines and search types.
 *
 * Features:
 * - Multiple search engines (Google, Bing, DuckDuckGo, Baidu, etc.)
 * - Search type tabs (Web, Images, Videos, Maps)
 * - Auto-suggestions dropdown (placeholder for future implementation)
 * - View switcher integration (icons/notes toggle)
 * - Notes mode with in-page search functionality
 * - Engine icon caching with permission-aware favicon loading
 * - Keyboard navigation (arrows, enter, escape)
 * - Responsive sizing (small/medium/large)
 * - Dark mode support
 *
 * Security:
 * - URL validation before navigation to prevent XSS
 * - Favicon loading requires explicit user permission
 *
 * @module components/SearchBar/SearchBar
 */

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Search, ChevronDown, Monitor, Image, Video, Map, StickyNote } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores';
import { useSearchStore } from '../../stores/searchStore';
import { useDebounce } from '../../hooks';
import { preloadEngineIcons } from '../../utils/iconCache';
import { cn } from '../../utils';
import { isSafeUrl } from '../../utils/navigation';
import { ViewSwitcher } from '../ViewSwitcher/ViewSwitcher';
import { ensureFeaturePermissions, hasOrigins, PERMISSION_GROUPS } from '../../../shared/permissions';

/**
 * Props for the SearchBar component
 */
interface SearchBarProps {
  /** Additional CSS classes to apply */
  className?: string;
  /** Callback fired when search query changes (debounced) */
  onQueryChange?: (query: string) => void;
  /** External query value for controlled input (e.g., clearing from parent) */
  externalQuery?: string;
  /** Whether to show the view switcher (icons/notes toggle). Default: true */
  showViewSwitcher?: boolean;
}

/**
 * Represents a search suggestion item
 */
interface SearchSuggestion {
  /** The suggestion text to display and search for */
  text: string;
  /** Type of suggestion: from API or from user's search history */
  type: 'suggestion' | 'history';
}

// ============================================================================
// Search Engine Configuration
// ============================================================================

/**
 * Maps search engine IDs to their supported search types.
 * Used to determine which search type tabs are available for each engine.
 */
const ENGINE_TYPE_SUPPORT: Record<string, string[]> = {
  google: ['web', 'images', 'videos', 'maps'],
  bing: ['web', 'images', 'videos', 'maps'],
  duckduckgo: ['web', 'images', 'videos', 'maps'],
  baidu: ['web', 'images', 'videos', 'maps'],
  yahoo: ['web', 'images', 'videos', 'maps'],
  yandex: ['web', 'images', 'videos', 'maps'],
  yandexru: ['web', 'images', 'videos', 'maps'],
  sogou: ['web', 'images', 'videos', 'maps'],
  '360': ['web', 'images', 'videos', 'maps'],
};

/** Default supported search types for unknown/custom engines */
const DEFAULT_SUPPORTED_TYPES = ['web'];

/**
 * Maps search engine IDs to their search URLs for each search type.
 * Each engine can have different URL patterns for web, images, videos, and maps.
 */
const SEARCH_TYPE_URLS: Record<string, Record<string, string>> = {
  google: {
    web: 'https://www.google.com/search?q=',
    images: 'https://www.google.com/search?tbm=isch&q=',
    videos: 'https://www.google.com/search?tbm=vid&q=',
    maps: 'https://www.google.com/maps/search/',
  },
  bing: {
    web: 'https://www.bing.com/search?q=',
    images: 'https://www.bing.com/images/search?q=',
    videos: 'https://www.bing.com/videos/search?q=',
    maps: 'https://www.bing.com/maps?q=',
  },
  duckduckgo: {
    web: 'https://duckduckgo.com/?q=',
    images: 'https://duckduckgo.com/?iax=images&ia=images&q=',
    videos: 'https://duckduckgo.com/?iax=videos&ia=videos&q=',
    maps: 'https://www.openstreetmap.org/search?query=',
  },
  baidu: {
    web: 'https://www.baidu.com/s?wd=',
    images: 'https://image.baidu.com/search/index?tn=baiduimage&word=',
    videos: 'https://www.baidu.com/sf/vsearch?pd=video&wd=',
    maps: 'https://map.baidu.com/search/',
  },
  yahoo: {
    web: 'https://search.yahoo.com/search?p=',
    images: 'https://images.search.yahoo.com/search/images?p=',
    videos: 'https://video.search.yahoo.com/search/video?p=',
    maps: 'https://www.google.com/maps/search/',
  },
  yandex: {
    web: 'https://yandex.com/search/?text=',
    images: 'https://yandex.com/images/search?text=',
    videos: 'https://yandex.com/video/search?text=',
    maps: 'https://yandex.com/maps/?text=',
  },
  yandexru: {
    web: 'https://yandex.ru/search/?text=',
    images: 'https://yandex.ru/images/search?text=',
    videos: 'https://yandex.ru/video/search?text=',
    maps: 'https://yandex.ru/maps/?text=',
  },
  sogou: {
    web: 'https://www.sogou.com/web?query=',
    images: 'https://pic.sogou.com/pics?query=',
    videos: 'https://v.sogou.com/v?query=',
    maps: 'https://map.sogou.com/#city=%u5317%u4eac&query=',
  },
  '360': {
    web: 'https://www.so.com/s?q=',
    images: 'https://image.so.com/i?q=',
    videos: 'https://www.so.com/s?q=',
    maps: 'https://ditu.so.com/?k=',
  },
};

/**
 * Renders a modern search bar with multiple engine and search type support.
 *
 * The search bar operates in two modes:
 * - Normal mode: External web search via selected engine
 * - Notes mode: In-page search for notes (when view is 'notes')
 *
 * Layout Structure:
 * - Top bar: Search type tabs (Web/Images/Videos/Maps) + ViewSwitcher
 * - Main input: Engine selector + search input + submit button
 * - Dropdown: Engine selection menu and/or suggestions
 *
 * @param props - Component props
 * @returns The rendered search bar with all controls
 *
 * @example
 * ```tsx
 * <SearchBar
 *   className="mt-4"
 *   onQueryChange={(q) => setSearchQuery(q)}
 *   showViewSwitcher={true}
 * />
 * ```
 */
export function SearchBar({ className, onQueryChange, externalQuery, showViewSwitcher = true }: SearchBarProps) {
  const { t, i18n } = useTranslation();
  const { searchSettings, setSearchSettings, viewSettings } = useSettingsStore(
    useShallow((state) => ({
      searchSettings: state.searchSettings,
      setSearchSettings: state.setSearchSettings,
      viewSettings: state.viewSettings,
    }))
  );

  // ============================================================================
  // Component State
  // ============================================================================

  /** Local input value, synced with externalQuery prop when provided */
  const [query, setQuery] = useState(externalQuery || '');

  // Sync local query with external prop when it changes (e.g., cleared from parent)
  useEffect(() => {
    if (externalQuery !== undefined) {
      setQuery((prev) => (prev !== externalQuery ? externalQuery : prev));
    }
  }, [externalQuery]);

  /** Search suggestion items to display in dropdown */
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  /** Whether the suggestions dropdown is visible */
  const [showSuggestions, setShowSuggestions] = useState(false);
  /** Currently selected suggestion index (-1 = none) */
  const [selectedIndex, setSelectedIndex] = useState(-1);
  /** Whether the engine selector dropdown is open */
  const [showEngineSelector, setShowEngineSelector] = useState(false);
  /** Whether the current engine's icon failed to load */
  const [iconLoadFailed, setIconLoadFailed] = useState(false);
  /** Cache of preloaded engine icons (base64 data URLs) */
  const [iconCache, setIconCache] = useState<Record<string, string>>({});
  /** Whether user has granted favicon host permissions */
  const [hasFaviconOrigins, setHasFaviconOrigins] = useState(false);

  /** Ref for the search input element */
  const inputRef = useRef<HTMLInputElement>(null);
  /** Ref for click-outside detection container */
  const suggestionsRef = useRef<HTMLDivElement>(null);
  /** Ref for the search type tabs container (for indicator positioning) */
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  /** Refs for individual tab buttons (for indicator positioning) */
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** Style for the sliding tab indicator */
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  /** Base width for the tab indicator animation */
  const indicatorBaseWidth = 100;

  /** Whether the current view is notes mode (changes search behavior) */
  const isNotesMode = viewSettings.currentView === 'notes';

  // ============================================================================
  // Effects
  // ============================================================================

  // Preload and cache search engine icons on mount or when engines change.
  // Only loads icons if user has granted favicon host permissions.
  useEffect(() => {
    const loadIcons = async () => {
      const permitted = await hasOrigins(PERMISSION_GROUPS.favicon);
      setHasFaviconOrigins(permitted);
      if (!permitted) {
        setIconCache({});
        return;
      }
      const cache = await preloadEngineIcons(searchSettings.engines);
      setIconCache(cache);
    };

    loadIcons();
  }, [searchSettings.engines]);

  // Close dropdowns when clicking outside the search bar container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
        setShowEngineSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Debounced query value for performance (200ms delay) */
  const debouncedQuery = useDebounce(query, 200);
  /** Store action to update global search query */
  const setSearchQuery = useSearchStore((s) => s.setQuery);

  // Update global search store with debounced query.
  // This enables Notes search without prop drilling through App component.
  useEffect(() => {
    setSearchQuery(debouncedQuery);
    if (onQueryChange) {
      onQueryChange(debouncedQuery);
    }
  }, [debouncedQuery, setSearchQuery, onQueryChange]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  /** List of available search engines from settings */
  const engines = searchSettings.engines ?? [];
  /** Currently selected search engine */
  const currentEngine =
    engines.find((e) => e.id === searchSettings.defaultEngine) || engines[0];

  /** Search types supported by the current engine */
  const supportedTypes = currentEngine
    ? ENGINE_TYPE_SUPPORT[currentEngine.id] || DEFAULT_SUPPORTED_TYPES
    : DEFAULT_SUPPORTED_TYPES;

  // Reset search type to 'web' if current type is not supported by the new engine
  useEffect(() => {
    if (currentEngine && !supportedTypes.includes(searchSettings.searchType)) {
      setSearchSettings({ searchType: 'web' });
    }
  }, [currentEngine?.id, supportedTypes, searchSettings.searchType, setSearchSettings]);

  /**
   * Fetches search suggestions from API (placeholder implementation).
   * TODO: Implement actual suggestion fetching from search engine APIs.
   */
  const fetchSuggestions = useCallback(async () => {
    setSuggestions([]);
  }, []);

  // Show/hide suggestions based on query and settings
  useEffect(() => {
    if (isNotesMode) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debouncedQuery && searchSettings.showSuggestions) {
      fetchSuggestions();
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }, [debouncedQuery, fetchSuggestions, searchSettings.showSuggestions, isNotesMode]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Performs the search action with the given query.
   * - In notes mode: just blurs the input (search happens via query change)
   * - In web mode: constructs URL and navigates (same tab or new tab based on settings)
   * - Validates URL for security before navigation
   */
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      if (isNotesMode) {
        // In notes mode, input change handles search via onQueryChange
        // Pressing enter might just blur or do nothing
        inputRef.current?.blur();
        return;
      }

      if (!currentEngine) return;

      const searchType = searchSettings.searchType || 'web';
      const engineUrls = SEARCH_TYPE_URLS[currentEngine.id];
      const baseUrl = engineUrls
        ? (engineUrls[searchType] || engineUrls.web || currentEngine.url)
        : currentEngine.url;

      const url = baseUrl + encodeURIComponent(searchQuery);

      // Security: Validate URL before navigation to prevent XSS from malicious custom engines
      if (!isSafeUrl(url)) {
        console.error('[SearchBar] Blocked unsafe search URL:', url);
        return;
      }

      if (searchSettings.openInNewTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }

      if (searchSettings.clearAfterSearch) {
        setQuery('');
      }

      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      setShowEngineSelector(false);
    },
    [currentEngine, searchSettings.searchType, searchSettings.openInNewTab, searchSettings.clearAfterSearch, isNotesMode]
  );

  /**
   * Handles keyboard navigation in the search bar.
   * - ArrowUp/Down: Navigate suggestions
   * - Enter: Execute search (selected suggestion or current query)
   * - Escape: Close dropdowns
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        if (isNotesMode) break;
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        if (isNotesMode) break;
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          performSearch(suggestions[selectedIndex].text);
        } else {
          performSearch(query);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        setShowEngineSelector(false);
        break;
    }
  };

  /** Handles clicking a suggestion item - performs search with suggestion text */
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    performSearch(suggestion.text);
  };

  /**
   * Changes the active search engine.
   * Resets icon load state and refocuses the input.
   */
  const handleEngineChange = (engineId: string) => {
    setSearchSettings({ defaultEngine: engineId });
    setShowEngineSelector(false);
    setIconLoadFailed(false);
    inputRef.current?.focus();
  };

  // ============================================================================
  // Styling Helpers
  // ============================================================================

  /** CSS class mappings for search bar width based on size setting */
  const maxWidthClasses: Record<'small' | 'medium' | 'large', string> = {
    small: 'max-w-md',
    medium: 'max-w-xl',
    large: 'max-w-2xl',
  };

  /** Current max-width class based on search bar size setting */
  const currentMaxWidth = maxWidthClasses[searchSettings.size as keyof typeof maxWidthClasses] || maxWidthClasses.medium;

  /** Search type tab configuration with icons and labels */
  const SEARCH_TYPES = [
    { id: 'web', label: t('searchBar.types.web'), icon: Monitor },
    { id: 'images', label: t('searchBar.types.images'), icon: Image },
    { id: 'videos', label: t('searchBar.types.videos'), icon: Video },
    { id: 'maps', label: t('searchBar.types.maps'), icon: Map },
  ] as const;

  /** Maps search type ID to tab index for indicator positioning */
  const searchTypeToIndex: Record<string, number> = {
    web: 0,
    images: 1,
    videos: 2,
    maps: 3,
  };

  /** Currently active tab index for the indicator animation */
  const [activeTabIndex, setActiveTabIndex] = useState(
    searchTypeToIndex[searchSettings.searchType] ?? 0
  );

  // Sync tab index with settings when search type changes
  useEffect(() => {
    setActiveTabIndex(searchTypeToIndex[searchSettings.searchType] ?? 0);
  }, [searchSettings.searchType]);

  /**
   * Updates the sliding indicator position and width based on active tab.
   * Called on tab change, resize, and language change.
   */
  const updateIndicator = useCallback(() => {
    const container = tabsContainerRef.current;

    // Safety check - if container is hidden or refs are missing
    if (!container || !tabRefs.current[activeTabIndex]) {
      setIndicatorStyle({ width: 0, left: 0 });
      return;
    }

    const activeButton = tabRefs.current[activeTabIndex];
    if (!activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setIndicatorStyle({
      width: buttonRect.width,
      left: buttonRect.left - containerRect.left,
    });
  }, [activeTabIndex]);

  // Update indicator immediately on mount and when dependencies change
  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, i18n.language, isNotesMode]);

  // Update indicator on window resize and container size changes
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateIndicator);
    };

    window.addEventListener('resize', schedule);

    // Use ResizeObserver for more accurate container size tracking
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    ro?.observe(container);

    return () => {
      window.removeEventListener('resize', schedule);
      ro?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [updateIndicator]);

  // ============================================================================
  // Render
  // ============================================================================

  // Don't render if search bar is hidden in settings
  if (searchSettings.hidden) return null;
  // Don't render if no search engine is configured
  if (!currentEngine) return null;

  return (
    <div
      className={cn('relative w-full z-20 flex flex-col items-center gap-4', className)}
      ref={suggestionsRef}
      role="search"
      aria-label={i18n.language === 'zh' ? '搜索' : 'Search'}
    >
      {/* Top Bar: Search Types (Left) + View Switcher (Right) */}
      {/* Use grid layout for precise alignment with the search bar below */}
      <div className={cn(
        'w-full grid grid-cols-[1fr_auto] items-center gap-4',
        currentMaxWidth
      )}>
        {/* Search Type Tabs - Hide if in Notes Mode? Or just disable? */}
        {/* User said "and switcher... on same horizontal line". */}
        {/* We keep it visible but maybe disabled or just visible. */}
        <div className={cn(
          'relative flex justify-start gap-1 p-1 rounded-full',
          'bg-white/20 dark:bg-black/10 backdrop-blur-xl',
          'border border-white/20 dark:border-white/5',
          'transition-all duration-300',
          isNotesMode && 'opacity-0 pointer-events-none'
        )} ref={tabsContainerRef}
        >
          {/* If hidden, ViewSwitcher (justify-between) moves to left? No. justify-between spreads them. */}
          {/* If left side is missing, single child goes to... start? */}
          {/* We should wrap ViewSwitcher in a div to ensure right alignment if left is gone. */}

          <div
            className="absolute inset-y-1 left-0 bg-black dark:bg-white rounded-full transition-transform duration-300 ease-out"
            style={{
              width: `${indicatorBaseWidth}px`,
              transformOrigin: 'left center',
              transform: `translateX(${indicatorStyle.left}px) scaleX(${indicatorStyle.width ? indicatorStyle.width / indicatorBaseWidth : 0})`,
            }}
            aria-hidden="true"
          />
          {SEARCH_TYPES.map((type, index) => {
            const isActive = searchSettings.searchType === type.id;
            const isSupported = supportedTypes.includes(type.id);
            const isDisabled = isNotesMode || !isSupported;
            const Icon = type.icon;
            return (
              <button
                type="button"
                key={type.id}
                onClick={() => {
                  if (isDisabled) return;
                  setActiveTabIndex(index);
                  setSearchSettings({ searchType: type.id });
                }}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                className={cn(
                  'relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/30',
                  isDisabled && 'opacity-40 cursor-not-allowed',
                  isActive
                    ? 'text-white dark:text-black'
                    : 'text-gray-700 dark:text-gray-300 hover:text-white/90 dark:hover:text-black/80'
                )}
                aria-pressed={isActive}
                aria-disabled={isDisabled}
                disabled={isDisabled}
                title={!isSupported ? t('searchBar.typeNotSupported', { engine: currentEngine?.name }) : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Switcher Integrated Here - conditionally rendered */}
        <div className={cn(
          'view-switcher-transition',
          !showViewSwitcher && 'view-switcher-hidden'
        )}>
          <ViewSwitcher />
        </div>

      </div>

      {/* Main Search Input Container */}
      <div
        className={cn(
          'relative w-full h-14 pl-4 pr-4 flex items-center gap-3',
          'rounded-full border border-white/40 dark:border-white/10',
          'bg-white/70 dark:bg-black/40 backdrop-blur-2xl',
          'shadow-glass hover:shadow-glass-hover',
          'hover:bg-white/80 dark:hover:bg-black/50',
          'transition-all duration-300 group',
          'ring-1 ring-transparent focus-within:ring-brand-orange/50 focus-within:border-brand-orange/30',
          currentMaxWidth
        )}
      >
        {/* Search Engine Selector - Hide in Notes Mode, replace with Note Icon */}
        <div className="relative shrink-0">
          {isNotesMode ? (
            <div className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-full text-brand-orange-500">
              <StickyNote className="w-6 h-6" />
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                // Request favicon host permissions only when user opens the engine selector.
                // If denied, we still open the selector but will use direct icon URLs.
                if (!hasFaviconOrigins) {
                  const granted = await ensureFeaturePermissions([], PERMISSION_GROUPS.favicon);
                  setHasFaviconOrigins(granted);
                  if (granted) {
                    const cache = await preloadEngineIcons(searchSettings.engines);
                    setIconCache(cache);
                  }
                }
                setShowEngineSelector(!showEngineSelector);
              }}
              className={cn(
                "flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-full transition-colors",
                "hover:bg-black/5 dark:hover:bg-white/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/30"
              )}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {currentEngine.icon && !iconLoadFailed ? (
                  <img
                    src={iconCache[currentEngine.id] || currentEngine.icon}
                    alt={currentEngine.name}
                    className="w-5 h-5 object-contain mix-blend-normal"
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                    onError={() => setIconLoadFailed(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Search className="w-4 h-4 text-zinc-500" />
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>
          )}

          {/* Engine Dropdown */}
          {!isNotesMode && showEngineSelector && (
            <div
              className="absolute top-full left-0 mt-3 py-2 w-48 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 z-50 overflow-hidden animate-scale-in origin-top-left"
              role="menu"
            >
              <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                选择引擎
              </div>
              {searchSettings.engines.map((engine) => (
                <button
                  type="button"
                  key={engine.id}
                  onClick={() => handleEngineChange(engine.id)}
                  className={cn(
                    'w-full px-4 py-2.5 flex items-center gap-3 text-sm text-left transition-colors',
                    'hover:bg-brand-orange/10 dark:hover:bg-brand-orange/20',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/30',
                    engine.id === currentEngine.id
                      ? 'text-brand-orange-600 dark:text-brand-orange-400 font-medium bg-brand-orange/5'
                      : 'text-zinc-700 dark:text-zinc-300'
                  )}
                >
                  {engine.icon ? (
                    <img
                      src={iconCache[engine.id] || engine.icon}
                      alt=""
                      className="w-4 h-4 object-contain"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                    />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {engine.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-zinc-300/50 dark:bg-zinc-700/50" />

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          data-search-input="true"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Propagate change immediately or through debounce effect above
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!isNotesMode && searchSettings.showSuggestions && suggestions.length > 0) setShowSuggestions(true)
          }}
          placeholder={isNotesMode ? t('notes.searchPlaceholder') : t('searchBar.placeholder')}
          className={cn(
            'flex-1 bg-transparent border-none outline-none',
            'text-zinc-800 dark:text-zinc-100 placeholder-zinc-400',
            'text-lg font-medium tracking-wide',
            'selection:bg-brand-orange/20 selection:text-brand-orange-700'
          )}
          aria-label={i18n.language === 'zh' ? '搜索' : 'Search'}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Action Button (Search Icon) */}
        {!isNotesMode && (
          <button
            type="button"
            onClick={() => performSearch(query)}
            className={cn(
              'p-2.5 rounded-full transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40',
              query.trim()
                ? 'bg-brand-orange text-white shadow-glow-orange hover:bg-brand-orange-600 transform hover:scale-105'
                : 'text-zinc-400 hover:text-brand-orange hover:bg-brand-orange/10'
            )}
            aria-label={i18n.language === 'zh' ? '搜索' : 'Search'}
          >
            <Search className={cn("w-5 h-5", query.trim() && "stroke-[2.5px]")} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown (Only for Web) */}
      {!isNotesMode && showSuggestions && suggestions.length > 0 && (
        <div
          className={cn(
            'absolute top-full mt-2 w-full',
            currentMaxWidth,
            'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl',
            'rounded-2xl shadow-glass-hover border border-white/20 dark:border-white/5',
            'overflow-hidden z-50 animate-slide-up origin-top'
          )}
        >
          {suggestions.map((suggestion, index) => (
            <button
              type="button"
              key={suggestion.text}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'w-full px-5 py-3 flex items-center gap-3 text-left',
                'text-zinc-700 dark:text-zinc-200',
                'transition-all duration-200',
                index === selectedIndex
                  ? 'bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange-700 dark:text-brand-orange-300 pl-7'
                  : 'hover:bg-white/50 dark:hover:bg-white/5 pl-5 hover:pl-6'
              )}
            >
              <Search className={cn(
                "w-4 h-4 transition-colors",
                index === selectedIndex ? "text-brand-orange-500" : "text-zinc-400"
              )} />
              <span className="flex-1 truncate font-medium">{suggestion.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
