import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../services/database';

/**
 * Theme type - light, dark, or follow system
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Search engine configuration
 */
export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  icon?: string;
  isDefault?: boolean;
}

/**
 * Open behavior settings - where to open various items
 */
export interface OpenBehavior {
  websites: 'new_tab' | 'current_tab';
  searchResults: 'new_tab' | 'current_tab';
  bookmarks: 'new_tab' | 'current_tab';
  history: 'new_tab' | 'current_tab';
}

/**
 * Icon display style settings
 */
export interface IconStyle {
  showName: boolean;
  shadow: boolean;
  animation: 'none' | 'scale' | 'bounce' | 'shake';
  borderRadius: number; // 0-50%
  opacity: number; // 0-100%
  size: 'small' | 'medium' | 'large';
}

/**
 * Search bar settings
 */
export interface SearchSettings {
  hidden: boolean;
  showSuggestions: boolean;
  placeholder: string;
  engines: SearchEngine[];
  defaultEngine: string;
  showButton: boolean;
  size: 'small' | 'medium' | 'large';
  borderRadius: number;
  opacity: number;
  searchType: 'web' | 'images' | 'videos' | 'maps';  // New: search type
}

/**
 * View and layout settings
 */
export interface ViewSettings {
  zoom: number; // 50-150%
  columns: number; // 4-10
  rows: number; // 2-6
  randomWallpaper: boolean;
  showTopSites: boolean;
  showBookmarks: boolean;
  showPagination: boolean;
  showClock: boolean;
  showWeather: boolean;
  showWidgetSidebar: boolean;
  widgetSidebarPosition: 'left' | 'right';
  widgetSidebarCollapsed: boolean;
  showTodoWidget: boolean;
  showNotesWidget: boolean;
  showBookmarksWidget: boolean;
  showHistoryWidget: boolean;
}

/**
 * Weather settings
 */
export interface WeatherSettings {
  location: {
    type: 'auto' | 'manual';
    name: string;
    latitude?: number;
    longitude?: number;
  };
  unit: 'celsius' | 'fahrenheit';
  showForecast: boolean;
  forecastDays: 3 | 5 | 7;
  updateInterval: number; // minutes
}

/**
 * Widget settings
 */
export interface WidgetSettings {
  todoWidget: {
    showCompleted: boolean;
    maxItems: number;
  };
  notesWidget: {
    maxItems: number;
    showTimestamp: boolean;
  };
  bookmarksWidget: {
    maxItems: number;
  };
  historyWidget: {
    maxItems: number;
    timeRange: 'today' | 'week' | 'month';
  };
}

/**
 * Font settings
 */
export interface FontSettings {
  family: string;
  size: number;
  color: string;
  shadow: boolean;
  shadowColor: string;
  weight: 'normal' | 'medium' | 'bold';
}

/**
 * Settings store state
 */
interface SettingsState {
  // General
  theme: Theme;
  language: string;

  // Behavior
  openBehavior: OpenBehavior;

  // Display
  iconStyle: IconStyle;
  searchSettings: SearchSettings;
  viewSettings: ViewSettings;
  fontSettings: FontSettings;
  weatherSettings: WeatherSettings;
  widgetSettings: WidgetSettings;

  // State flags
  isInitialized: boolean;
}

/**
 * Settings store actions
 */
interface SettingsActions {
  // Initialization
  initializeSettings: () => Promise<void>;

  // Theme
  setTheme: (theme: Theme) => void;

  // Language
  setLanguage: (language: string) => void;

  // Behavior
  setOpenBehavior: (behavior: Partial<OpenBehavior>) => void;

  // Display
  setIconStyle: (style: Partial<IconStyle>) => void;
  setSearchSettings: (settings: Partial<SearchSettings>) => void;
  setViewSettings: (settings: Partial<ViewSettings>) => void;
  setFontSettings: (settings: Partial<FontSettings>) => void;
  setWeatherSettings: (settings: Partial<WeatherSettings>) => void;
  setWidgetSettings: (settings: Partial<WidgetSettings>) => void;

  // Reset
  resetToDefaults: () => void;
}

/**
 * Default search engines
 */
const defaultSearchEngines: SearchEngine[] = [
  {
    id: 'baidu',
    name: '百度',
    url: 'https://www.baidu.com/s?wd=',
    icon: 'https://www.google.com/s2/favicons?domain=baidu.com&sz=64',
    isDefault: false,
  },
  {
    id: 'google',
    name: '谷歌',
    url: 'https://www.google.com/search?q=',
    icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=64',
    isDefault: true,
  },
  {
    id: 'bing',
    name: '必应',
    url: 'https://www.bing.com/search?q=',
    icon: 'https://www.google.com/s2/favicons?domain=bing.com&sz=64',
    isDefault: false,
  },
  {
    id: 'yahoo',
    name: '雅虎',
    url: 'https://search.yahoo.com/search?p=',
    icon: 'https://www.google.com/s2/favicons?domain=yahoo.com&sz=64',
    isDefault: false,
  },
  {
    id: 'yandex',
    name: 'Yandex',
    url: 'https://yandex.com/search/?text=',
    icon: 'https://www.google.com/s2/favicons?domain=yandex.com&sz=64',
    isDefault: false,
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: 'https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=64',
    isDefault: false,
  },
  {
    id: 'yandexru',
    name: 'YandexRU',
    url: 'https://yandex.ru/search/?text=',
    icon: 'https://www.google.com/s2/favicons?domain=yandex.ru&sz=64',
    isDefault: false,
  },
  {
    id: 'sogou',
    name: '搜狗',
    url: 'https://www.sogou.com/web?query=',
    icon: 'https://www.google.com/s2/favicons?domain=sogou.com&sz=64',
    isDefault: false,
  },
  {
    id: '360',
    name: '360搜索',
    url: 'https://www.so.com/s?q=',
    icon: 'https://www.google.com/s2/favicons?domain=so.com&sz=64',
    isDefault: false,
  },
];

/**
 * Default settings values
 */
const defaultSettings: SettingsState = {
  theme: 'system',
  language: 'zh',
  openBehavior: {
    websites: 'current_tab',
    searchResults: 'new_tab',
    bookmarks: 'new_tab',
    history: 'new_tab',
  },
  iconStyle: {
    showName: true,
    shadow: true,
    animation: 'scale',
    borderRadius: 50,
    opacity: 100,
    size: 'medium',
  },
  searchSettings: {
    hidden: false,
    showSuggestions: true,
    placeholder: 'Search the web or type a URL...',
    engines: defaultSearchEngines,
    defaultEngine: 'google',
    showButton: false,
    size: 'medium',
    borderRadius: 50,
    opacity: 80,
    searchType: 'web',  // New: default to web search
  },
  viewSettings: {
    zoom: 100,
    columns: 6,
    rows: 4,
    randomWallpaper: false,
    showTopSites: true,
    showBookmarks: true,
    showPagination: true,
    showClock: true,
    showWeather: false,
    showWidgetSidebar: false,
    widgetSidebarPosition: 'right',
    widgetSidebarCollapsed: false,
    showTodoWidget: true,
    showNotesWidget: true,
    showBookmarksWidget: true,
    showHistoryWidget: true,
  },
  fontSettings: {
    family: 'Inter',
    size: 12,
    color: '#ffffff',
    shadow: true,
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    weight: 'medium',
  },
  weatherSettings: {
    location: {
      type: 'auto',
      name: 'Auto',
    },
    unit: 'celsius',
    showForecast: true,
    forecastDays: 5,
    updateInterval: 60,
  },
  widgetSettings: {
    todoWidget: {
      showCompleted: false,
      maxItems: 10,
    },
    notesWidget: {
      maxItems: 5,
      showTimestamp: true,
    },
    bookmarksWidget: {
      maxItems: 10,
    },
    historyWidget: {
      maxItems: 10,
      timeRange: 'today',
    },
  },
  isInitialized: false,
};

/**
 * Settings store with persistence
 */
export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      initializeSettings: async () => {
        // Load settings from IndexedDB if available
        try {
          const storedTheme = await db.settings.get('theme');
          const storedLanguage = await db.settings.get('language');

          if (storedTheme || storedLanguage) {
            set({
              theme: (storedTheme?.value as Theme) || get().theme,
              language: (storedLanguage?.value as string) || get().language,
            });
          }
        } catch (error) {
          console.error('Failed to load settings from IndexedDB:', error);
        }

        set({ isInitialized: true });
      },

      setTheme: (theme) => {
        set({ theme });
        // Persist to IndexedDB
        db.settings.put({ key: 'theme', value: theme }).catch(console.error);
      },

      setLanguage: (language) => {
        set({ language });
        db.settings.put({ key: 'language', value: language }).catch(console.error);
      },

      setOpenBehavior: (behavior) => {
        set((state) => ({
          openBehavior: { ...state.openBehavior, ...behavior },
        }));
      },

      setIconStyle: (style) => {
        set((state) => ({
          iconStyle: { ...state.iconStyle, ...style },
        }));
      },

      setSearchSettings: (settings) => {
        set((state) => ({
          searchSettings: { ...state.searchSettings, ...settings },
        }));
      },

      setViewSettings: (settings) => {
        set((state) => ({
          viewSettings: { ...state.viewSettings, ...settings },
        }));
      },

      setFontSettings: (settings) => {
        set((state) => ({
          fontSettings: { ...state.fontSettings, ...settings },
        }));
      },

      setWeatherSettings: (settings) => {
        set((state) => ({
          weatherSettings: { ...state.weatherSettings, ...settings },
        }));
      },

      setWidgetSettings: (settings) => {
        set((state) => ({
          widgetSettings: { ...state.widgetSettings, ...settings },
        }));
      },

      resetToDefaults: () => {
        set({ ...defaultSettings, isInitialized: true });
        // Clear persisted settings
        db.settings.clear().catch(console.error);
      },
    }),
    {
      name: 'openinfinity-settings',
      version: 2,  // Increment version to force migration
      migrate: (persistedState: any, version: number) => {
        // V2: Force update search engine icons from DuckDuckGo to Google Favicon API
        if (version < 2) {
          if (persistedState?.searchSettings?.engines) {
            persistedState.searchSettings.engines = defaultSearchEngines;
          }
        }
        return persistedState;
      },
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        openBehavior: state.openBehavior,
        iconStyle: state.iconStyle,
        searchSettings: state.searchSettings,
        viewSettings: state.viewSettings,
        fontSettings: state.fontSettings,
        weatherSettings: state.weatherSettings,
        widgetSettings: state.widgetSettings,
      }),
    }
  )
);
