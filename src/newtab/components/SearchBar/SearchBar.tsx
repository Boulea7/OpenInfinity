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
  const { searchSettings, openBehavior } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showEngineSelector, setShowEngineSelector] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

  // Fetch suggestions via JSONP
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !searchSettings.showSuggestions) {
      setSuggestions([]);
      return;
    }

    try {
      // Google suggestions via JSONP
      const callbackName = `googleSuggest_${Date.now()}`;
      const script = document.createElement('script');

      const promise = new Promise<string[]>((resolve) => {
        (window as unknown as Record<string, unknown>)[callbackName] = (data: [string, string[]]) => {
          resolve(data[1] || []);
          delete (window as unknown as Record<string, unknown>)[callbackName];
          script.remove();
        };

        // Timeout fallback
        setTimeout(() => {
          if ((window as unknown as Record<string, unknown>)[callbackName]) {
            resolve([]);
            delete (window as unknown as Record<string, unknown>)[callbackName];
            script.remove();
          }
        }, 3000);
      });

      script.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(searchQuery)}&callback=${callbackName}`;
      document.head.appendChild(script);

      const results = await promise;
      setSuggestions(
        results.slice(0, 8).map((text) => ({ text, type: 'suggestion' as const }))
      );
    } catch {
      setSuggestions([]);
    }
  }, [searchSettings.showSuggestions]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery, fetchSuggestions]);

  // Perform search
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      const url = currentEngine.url + encodeURIComponent(searchQuery);
      const target = openBehavior.searchResults === 'new_tab' ? '_blank' : '_self';
      window.open(url, target);

      setQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
    },
    [currentEngine, openBehavior.searchResults]
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

  // Get size class safely
  const currentSizeClass = sizeClasses[searchSettings.size as keyof typeof sizeClasses] || sizeClasses.medium;

  return (
    <div className={cn('relative w-full', className)} ref={suggestionsRef}>
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
            {currentEngine.icon ? (
              <img
                src={currentEngine.icon}
                alt={currentEngine.name}
                className="w-5 h-5"
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
