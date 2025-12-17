import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useSettingsStore } from '../../stores';
import { useDebounce } from '../../hooks';
import { cn } from '../../utils';

interface SearchBarProps {
  className?: string;
}

interface SearchSuggestion {
  text: string;
  type: 'suggestion' | 'history';
}

/**
 * SearchBar Component
 * Multi-engine search with suggestions and keyboard navigation
 */
export function SearchBar({ className }: SearchBarProps) {
  const { searchSettings, openBehavior, setSearchSettings } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showEngineSelector, setShowEngineSelector] = useState(false);
  const [iconLoadFailed, setIconLoadFailed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search type URLs for different engines
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
      maps: 'https://www.google.com/maps/search/',  // Yahoo doesn't have maps, fallback to Google
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
      maps: 'https://map.sogou.com/#city=%u5317%u4eac&query=',  // Sogou Maps
    },
    '360': {
      web: 'https://www.so.com/s?q=',
      images: 'https://image.so.com/i?q=',
      videos: 'https://www.so.com/s?q=',  // 360 uses same URL for videos
      maps: 'https://ditu.so.com/?k=',
    },
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedQuery = useDebounce(query, 200);

  // Get current search engine
  const currentEngine = searchSettings.engines.find(
    (e) => e.id === searchSettings.defaultEngine
  ) || searchSettings.engines[0];

  // Fetch suggestions (disabled - CORS issues with all APIs)
  const fetchSuggestions = useCallback(async () => {
    // Disabled due to CORS restrictions
    // Google suggestions API does not support CORS even in Background Service Worker
    setSuggestions([]);
  }, []);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions();
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery, fetchSuggestions]);

  // Perform search with search type support
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      const searchType = searchSettings.searchType || 'web';
      const engineUrls = SEARCH_TYPE_URLS[currentEngine.id] || SEARCH_TYPE_URLS.google;
      const baseUrl = engineUrls[searchType] || engineUrls.web || currentEngine.url;

      const url = baseUrl + encodeURIComponent(searchQuery);
      const target = openBehavior.searchResults === 'new_tab' ? '_blank' : '_self';
      window.open(url, target);

      setQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
    },
    [currentEngine, openBehavior.searchResults, searchSettings.searchType, SEARCH_TYPE_URLS]
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
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
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    performSearch(suggestion.text);
  };

  // Handle engine change
  const handleEngineChange = (engineId: string) => {
    useSettingsStore.getState().setSearchSettings({ defaultEngine: engineId });
    setShowEngineSelector(false);
    setIconLoadFailed(false); // Reset icon load state when engine changes
    inputRef.current?.focus();
  };

  // Hidden if setting enabled
  if (searchSettings.hidden) return null;

  // Size classes
  const sizeClasses: Record<'small' | 'medium' | 'large', string> = {
    small: 'max-w-md py-2 px-4',
    medium: 'max-w-xl py-3 px-5',
    large: 'max-w-2xl py-4 px-6',
  };

  // Get max-width classes for alignment
  const maxWidthClasses: Record<'small' | 'medium' | 'large', string> = {
    small: 'max-w-md',
    medium: 'max-w-xl',
    large: 'max-w-2xl',
  };

  // Get size class safely
  const currentSizeClass = sizeClasses[searchSettings.size as keyof typeof sizeClasses] || sizeClasses.medium;
  const currentMaxWidth = maxWidthClasses[searchSettings.size as keyof typeof maxWidthClasses] || maxWidthClasses.medium;

  return (
    <div className={cn('relative w-full', className)} ref={suggestionsRef}>
      {/* Search type tabs */}
      <div className={cn(
        'mx-auto mb-2 flex justify-start gap-3 text-sm',
        currentMaxWidth  // Use dedicated max-width class for alignment
      )}>
        {(['web', 'images', 'videos', 'maps'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSearchSettings({ searchType: type })}
            className={cn(
              'px-3 py-1 rounded transition-colors duration-200',
              searchSettings.searchType === type
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-black/20 backdrop-blur-sm text-white/90 hover:bg-black/30 hover:text-white'
            )}
          >
            {type === 'web' && '网页'}
            {type === 'images' && '图片'}
            {type === 'videos' && '视频'}
            {type === 'maps' && '地图'}
          </button>
        ))}
      </div>

      {/* Search input container */}
      <div
        className={cn(
          'mx-auto flex items-center gap-3',
          'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl',
          'border border-white/20 dark:border-gray-700/50',
          'shadow-lg shadow-black/5',
          'transition-all duration-200',
          currentSizeClass
        )}
        style={{
          borderRadius: `${searchSettings.borderRadius}px`,
          opacity: searchSettings.opacity / 100,
        }}
      >
        {/* Search engine selector */}
        <div className="relative">
          <button
            onClick={() => setShowEngineSelector(!showEngineSelector)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Select search engine"
          >
            {currentEngine.icon && !iconLoadFailed ? (
              <img
                src={currentEngine.icon}
                alt={currentEngine.name}
                className="w-5 h-5"
                onError={() => setIconLoadFailed(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <Search className="w-5 h-5" />
            )}
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Engine dropdown */}
          {showEngineSelector && (
            <div className="absolute top-full left-0 mt-2 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-[150px]">
              {searchSettings.engines.map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => handleEngineChange(engine.id)}
                  className={cn(
                    'w-full px-3 py-2 flex items-center gap-2 text-sm text-left',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    engine.id === currentEngine.id &&
                      'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  )}
                >
                  {engine.icon ? (
                    <img src={engine.icon} alt="" className="w-4 h-4" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {engine.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={searchSettings.placeholder}
          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Search button (optional) */}
        {searchSettings.showButton && (
          <button
            onClick={() => performSearch(query)}
            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className={cn(
            'absolute left-1/2 -translate-x-1/2 mt-2 w-full',
            currentSizeClass.split(' ')[0], // max-width class
            'bg-white dark:bg-gray-800 rounded-xl',
            'shadow-xl border border-gray-200 dark:border-gray-700',
            'overflow-hidden z-50'
          )}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.text}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'w-full px-4 py-2.5 flex items-center gap-3 text-left',
                'text-gray-700 dark:text-gray-200',
                'transition-colors duration-100',
                index === selectedIndex
                  ? 'bg-gray-100 dark:bg-gray-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              )}
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span className="flex-1 truncate">{suggestion.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
