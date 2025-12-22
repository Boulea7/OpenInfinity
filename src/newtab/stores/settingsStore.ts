import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../services/database';
import { isUserLocaleChina } from '../utils/regionUtils';

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
  clearAfterSearch: boolean;  // Clear search box after search (default: false)
  openInNewTab: boolean;      // Open search results in new tab (default: true)
}

/**
 * View and layout settings
 */
export interface ViewSettings {
  zoom: number; // 50-150%
  columns: number; // 1-8
  rows: number; // 1-8
  columnGap: number; // 0-100%
  rowGap: number; // 0-100%
  iconScale: number; // 10-100%
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
  animationIntensity: 'none' | 'light' | 'normal' | 'heavy';  // Animation intensity (default: 'normal')
  currentView: 'search' | 'notes';  // Current view mode (default: 'search')
  showPinnedNotes: boolean;         // Show pinned notes in search view (default: false)
  autoFillGrid: boolean;            // Auto-fill grid gaps (default: true)
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
 * Clock and timezone settings
 */
export interface ClockSettings {
  timezone: string; // IANA timezone or 'auto'
  autoDetect: boolean; // Auto-detect timezone
  format: '12h' | '24h'; // Time format
  showSeconds: boolean; // Show seconds
}

/**
 * Changelog settings
 */
export interface ChangelogSettings {
  lastViewedVersion: string;  // Last viewed version
  showOnUpdate: boolean;       // Show changelog on update (default: true)
}

/**
 * Notification settings (Gmail, Todo badges, etc.)
 */
export interface NotificationSettings {
  // Gmail notifications
  gmailEnabled: boolean;           // Enable Gmail notifications
  gmailSound: boolean;             // Play sound on new email
  showUnreadCount: boolean;        // Show unread count on icon badge
  // Todo notifications
  showTodoCount: boolean;          // Show todo count on icon badge
  // Authorization state (read-only, managed by gmail service)
  gmailAuthorized: boolean;        // Whether Gmail is authorized
  gmailEmail: string | null;       // Authorized Gmail email address
}

/**
 * Minimal mode settings
 */
export interface MinimalModeSettings {
  showViewSwitcher: boolean;       // Show ViewSwitcher (search/notes toggle) in minimal mode
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
  clockSettings: ClockSettings;
  weatherSettings: WeatherSettings;
  widgetSettings: WidgetSettings;
  changelogSettings: ChangelogSettings;
  notificationSettings: NotificationSettings;

  // Minimal mode (shows only search bar on homepage)
  minimalMode: boolean;
  minimalModeSettings: MinimalModeSettings;

  // Settings panel section collapse state
  collapsedSections: Record<string, boolean>;

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
  setClockSettings: (settings: Partial<ClockSettings>) => void;
  setWeatherSettings: (settings: Partial<WeatherSettings>) => void;
  setWidgetSettings: (settings: Partial<WidgetSettings>) => void;
  setChangelogSettings: (settings: Partial<ChangelogSettings>) => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // Minimal mode
  setMinimalMode: (enabled: boolean) => void;
  setMinimalModeSettings: (settings: Partial<MinimalModeSettings>) => void;

  // Settings panel section collapse
  toggleSectionCollapse: (sectionId: string) => void;
  setSectionCollapsed: (sectionId: string, collapsed: boolean) => void;
  setAllSectionsCollapsed: (collapsed: boolean) => void;

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
    icon: 'https://www.baidu.com/favicon.ico',
    isDefault: false,
  },
  {
    id: 'google',
    name: '谷歌',
    url: 'https://www.google.com/search?q=',
    icon: 'https://www.google.com/favicon.ico',
    isDefault: true,
  },
  {
    id: 'bing',
    name: '必应',
    url: 'https://www.bing.com/search?q=',
    icon: 'https://www.bing.com/favicon.ico',
    isDefault: false,
  },
  {
    id: 'yahoo',
    name: '雅虎',
    url: 'https://search.yahoo.com/search?p=',
    icon: 'https://search.yahoo.com/favicon.ico',
    isDefault: false,
  },
  {
    id: 'yandex',
    name: 'Yandex',
    url: 'https://yandex.com/search/?text=',
    icon: 'https://yandex.com/favicon.ico',
    isDefault: false,
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: 'https://duckduckgo.com/favicon.ico',
    isDefault: false,
  },
  {
    id: 'yandexru',
    name: 'YandexRU',
    url: 'https://yandex.ru/search/?text=',
    icon: 'https://yandex.ru/favicon.ico',
    isDefault: false,
  },
  {
    id: 'sogou',
    name: '搜狗',
    url: 'https://www.sogou.com/web?query=',
    icon: 'https://www.sogou.com/favicon.ico',
    isDefault: false,
  },
  {
    id: '360',
    name: '360搜索',
    url: 'https://www.so.com/s?q=',
    icon: 'https://www.so.com/favicon.ico',
    isDefault: false,
  },
];

/**
 * Get smart default search engine based on region
 */
function getSmartDefaultEngine(): string {
  return isUserLocaleChina() ? 'bing' : 'google';
}

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
    defaultEngine: getSmartDefaultEngine(), // Smart default based on region
    showButton: false,
    size: 'medium',
    borderRadius: 50,
    opacity: 80,
    searchType: 'web',  // New: default to web search
    clearAfterSearch: false,  // Default: keep search query after search
    openInNewTab: true,       // Default: open search results in new tab
  },
  viewSettings: {
    zoom: 100,
    columns: 7,
    rows: 3,
    columnGap: 50,  // Default 50%
    rowGap: 50,     // Default 50%
    iconScale: 80,  // Default 80%
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
    animationIntensity: 'normal',  // Default: normal animation
    currentView: 'search',          // Default: search view
    showPinnedNotes: false,         // Default: hide pinned notes
    autoFillGrid: true,             // Default: auto-fill enabled
  },
  fontSettings: {
    family: 'Inter',
    size: 12,
    color: '#ffffff',
    shadow: true,
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    weight: 'medium',
  },
  clockSettings: {
    timezone: 'auto',
    autoDetect: true,
    format: '24h',
    showSeconds: false,
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
  changelogSettings: {
    lastViewedVersion: '0.0.0',  // Default: never viewed
    showOnUpdate: true,           // Default: show changelog on update
  },
  notificationSettings: {
    gmailEnabled: false,
    gmailSound: true,
    showUnreadCount: true,
    showTodoCount: true,
    gmailAuthorized: false,
    gmailEmail: null,
  },
  minimalMode: false,  // Default: standard mode (full features)
  minimalModeSettings: {
    showViewSwitcher: false,  // Default: hide ViewSwitcher in minimal mode
  },
  collapsedSections: {},  // Default: all sections expanded
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
          const storedDefaultEngine = await db.settings.get('defaultEngine');

          // If no stored default engine, use smart default based on region
          const smartDefaultEngine = storedDefaultEngine?.value
            ? (storedDefaultEngine.value as string)
            : getSmartDefaultEngine();

          if (storedTheme || storedLanguage || !storedDefaultEngine) {
            set({
              theme: (storedTheme?.value as Theme) || get().theme,
              language: (storedLanguage?.value as string) || get().language,
              searchSettings: {
                ...get().searchSettings,
                defaultEngine: smartDefaultEngine,
              },
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

      setClockSettings: (settings) => {
        set((state) => ({
          clockSettings: { ...state.clockSettings, ...settings },
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

      setChangelogSettings: (settings) => {
        set((state) => ({
          changelogSettings: { ...state.changelogSettings, ...settings },
        }));
      },

      setNotificationSettings: (settings) => {
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings },
        }));
      },

      setMinimalMode: (enabled) => {
        set({ minimalMode: enabled });
      },

      setMinimalModeSettings: (settings) => {
        set((state) => ({
          minimalModeSettings: { ...state.minimalModeSettings, ...settings },
        }));
      },

      toggleSectionCollapse: (sectionId) => {
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [sectionId]: !state.collapsedSections[sectionId],
          },
        }));
      },

      setSectionCollapsed: (sectionId, collapsed) => {
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [sectionId]: collapsed,
          },
        }));
      },

      setAllSectionsCollapsed: (collapsed) => {
        // All possible section IDs for the settings panel
        const sectionIds = [
          'wallpaper', 'openBehavior', 'notification', 'view', 'minimalMode', 'layout',
          'icon', 'search', 'font', 'animation', 'reset',
          'general', 'clock', 'weather', 'backup', 'about',
        ];
        const newCollapsedSections: Record<string, boolean> = {};
        sectionIds.forEach((id) => {
          newCollapsedSections[id] = collapsed;
        });
        set({ collapsedSections: newCollapsedSections });
      },

      resetToDefaults: () => {
        set({ ...defaultSettings, isInitialized: true });
        // Clear persisted settings
        db.settings.clear().catch(console.error);
      },
    }),
    {
      name: 'openinfinity-settings',
      version: 7, // V7: Add autoFillGrid setting
      migrate: (persistedState: any, version: number) => {
        const state = persistedState ?? {};

        // Defense: First-time install or corrupted localStorage may have empty state
        // Ensure required nested objects exist before spreading to avoid TypeError
        if (!state.searchSettings) state.searchSettings = { ...defaultSettings.searchSettings };
        if (!state.viewSettings) state.viewSettings = { ...defaultSettings.viewSettings };
        if (!state.notificationSettings) state.notificationSettings = { ...defaultSettings.notificationSettings };
        if (!state.changelogSettings) state.changelogSettings = { ...defaultSettings.changelogSettings };
        if (!state.minimalModeSettings) state.minimalModeSettings = { ...defaultSettings.minimalModeSettings };

        // V3: Ensure default search engines are up-to-date
        if (version < 3) {
          const persistedEngines = Array.isArray(state?.searchSettings?.engines)
            ? (state.searchSettings.engines as SearchEngine[])
            : [];

          const defaultIds = new Set(defaultSearchEngines.map((e) => e.id));
          const persistedById = new Map<string, SearchEngine>();
          const customEngines: SearchEngine[] = [];

          for (const engine of persistedEngines) {
            if (!engine || typeof engine.id !== 'string') continue;
            persistedById.set(engine.id, engine);
            if (!defaultIds.has(engine.id)) {
              customEngines.push(engine);
            }
          }

          const mergedEngines = [
            ...defaultSearchEngines.map((def) => {
              const existing = persistedById.get(def.id);
              if (!existing) return def;

              // Keep user edits where possible, but always refresh the favicon URL from defaults
              return {
                ...def,
                ...existing,
                icon: def.icon ?? existing.icon,
              };
            }),
            ...customEngines,
          ];

          const persistedDefaultEngine = state?.searchSettings?.defaultEngine as string | undefined;
          const defaultEngine =
            persistedDefaultEngine && mergedEngines.some((e) => e.id === persistedDefaultEngine)
              ? persistedDefaultEngine
              : (mergedEngines.find((e) => e.isDefault)?.id || mergedEngines[0]?.id || 'google');

          state.searchSettings = {
            ...state.searchSettings,
            engines: mergedEngines,
            defaultEngine,
            searchType: state?.searchSettings?.searchType ?? 'web',
          };
        }

        // V4: Add new fields with proper defaults
        if (version < 4) {
          // Ensure searchSettings has new fields
          state.searchSettings = {
            ...state.searchSettings,
            clearAfterSearch: state?.searchSettings?.clearAfterSearch ?? false,
            openInNewTab: state?.searchSettings?.openInNewTab ?? true,
          };

          // Ensure viewSettings has new fields
          state.viewSettings = {
            ...state.viewSettings,
            animationIntensity: state?.viewSettings?.animationIntensity ?? 'normal',
            currentView: 'search',  // Always default to search view
            showPinnedNotes: state?.viewSettings?.showPinnedNotes ?? false,
          };

          // Ensure changelogSettings exists
          state.changelogSettings = state?.changelogSettings ?? {
            lastViewedVersion: '0.0.0',
            showOnUpdate: true,
          };
        }

        // V5: Add notification settings, minimal mode, collapsed sections, and layout gap/scale
        if (version < 5) {
          state.notificationSettings = state?.notificationSettings ?? {
            gmailEnabled: false,
            gmailSound: true,
            showUnreadCount: true,
            showTodoCount: true,
            gmailAuthorized: false,
            gmailEmail: null,
          };
          state.minimalMode = state?.minimalMode ?? false;
          state.collapsedSections = state?.collapsedSections ?? {};

          // Add layout gap and scale settings
          state.viewSettings = {
            ...state.viewSettings,
            columnGap: state?.viewSettings?.columnGap ?? 50,
            rowGap: state?.viewSettings?.rowGap ?? 50,
            iconScale: state?.viewSettings?.iconScale ?? 80,
          };
        }

        // V6: Add minimalModeSettings
        if (version < 6) {
          state.minimalModeSettings = state?.minimalModeSettings ?? {
            showViewSwitcher: false,
          };
        }

        // V7: Add autoFillGrid setting
        if (version < 7) {
          state.viewSettings = {
            ...state.viewSettings,
            autoFillGrid: state?.viewSettings?.autoFillGrid ?? true,
          };
        }

        return state;
      },
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        openBehavior: state.openBehavior,
        iconStyle: state.iconStyle,
        searchSettings: state.searchSettings,
        viewSettings: state.viewSettings,
        fontSettings: state.fontSettings,
        clockSettings: state.clockSettings,
        weatherSettings: state.weatherSettings,
        widgetSettings: state.widgetSettings,
        changelogSettings: state.changelogSettings,
        notificationSettings: state.notificationSettings,
        minimalMode: state.minimalMode,
        minimalModeSettings: state.minimalModeSettings,
        collapsedSections: state.collapsedSections,
      }),
    }
  )
);
