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
 * ║  Author: OpenInfinity Contributors                                        ║
 * ║  GitHub: https://github.com/OpenInfinity/OpenInfinity                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Settings Store Module
 *
 * Central state management for all user preferences and application settings.
 * This store uses Zustand with persist middleware for automatic localStorage
 * persistence and IndexedDB synchronization for cross-context access.
 *
 * Key Features:
 * - Theme management (light/dark/system)
 * - Grid layout configuration (columns, rows, gaps, scale)
 * - Search engine preferences with region-aware defaults
 * - Icon display customization
 * - Clock, weather, and widget settings
 * - Minimal mode for distraction-free experience
 * - System icon visibility control
 * - Settings panel section collapse state
 *
 * Persistence Strategy:
 * - Primary: localStorage via Zustand persist middleware
 * - Secondary: IndexedDB for settings needed by background scripts
 * - Migration: Automatic schema migration for version upgrades
 *
 * @module stores/settingsStore
 * @see {@link useIconStore} for grid item management that depends on view settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, type SystemIconId } from '../services/database';
import { isUserLocaleChina } from '../utils/regionUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Theme type for application appearance.
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 * - 'system': Follow operating system preference
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Search Engine Configuration
 *
 * Defines a search engine that can be used in the search bar.
 * Users can add custom engines or modify the default ones.
 *
 * @interface SearchEngine
 */
export interface SearchEngine {
  /** Unique identifier for the engine */
  id: string;
  /** Display name shown in the UI */
  name: string;
  /** Search URL template (query is appended to this) */
  url: string;
  /** Optional favicon URL for the engine */
  icon?: string;
  /** Whether this is the default search engine */
  isDefault?: boolean;
}

/**
 * Open Behavior Settings
 *
 * Controls where different types of content are opened.
 * Each setting can be either 'new_tab' or 'current_tab'.
 *
 * @interface OpenBehavior
 */
export interface OpenBehavior {
  /** Where to open website shortcuts */
  websites: 'new_tab' | 'current_tab';
  /** Where to open search results */
  searchResults: 'new_tab' | 'current_tab';
  /** Where to open bookmarks */
  bookmarks: 'new_tab' | 'current_tab';
  /** Where to open history items */
  history: 'new_tab' | 'current_tab';
}

/**
 * Icon Display Style Settings
 *
 * Controls the visual appearance of desktop icons.
 *
 * @interface IconStyle
 */
export interface IconStyle {
  /** Whether to show icon labels */
  showName: boolean;
  /** Whether to show drop shadow on icons */
  shadow: boolean;
  /** Hover animation style */
  animation: 'none' | 'scale' | 'bounce' | 'shake';
  /** Border radius as percentage (0-50) */
  borderRadius: number;
  /** Icon opacity as percentage (0-100) */
  opacity: number;
  /** Icon size preset */
  size: 'small' | 'medium' | 'large';
}

/**
 * Search Bar Settings
 *
 * Configuration for the search bar component.
 *
 * @interface SearchSettings
 */
export interface SearchSettings {
  /** Whether search bar is hidden */
  hidden: boolean;
  /** Whether to show search suggestions */
  showSuggestions: boolean;
  /** Placeholder text for the search input */
  placeholder: string;
  /** Array of available search engines */
  engines: SearchEngine[];
  /** ID of the default search engine */
  defaultEngine: string;
  /** Whether to show the search button */
  showButton: boolean;
  /** Search bar size preset */
  size: 'small' | 'medium' | 'large';
  /** Border radius for the search bar */
  borderRadius: number;
  /** Background opacity as percentage */
  opacity: number;
  /** Type of search to perform */
  searchType: 'web' | 'images' | 'videos' | 'maps';
  /** Whether to clear input after search */
  clearAfterSearch: boolean;
  /** Whether to open results in new tab */
  openInNewTab: boolean;
}

/**
 * View and Layout Settings
 *
 * Controls the overall layout and visibility of UI elements.
 *
 * @interface ViewSettings
 */
export interface ViewSettings {
  /** Page zoom level (50-150%) */
  zoom: number;
  /** Number of icon columns (1-8) */
  columns: number;
  /** Number of icon rows (1-8) */
  rows: number;
  /** Column gap as percentage (0-100) */
  columnGap: number;
  /** Row gap as percentage (0-100) */
  rowGap: number;
  /** Icon scale as percentage (10-100) */
  iconScale: number;
  /** Whether to randomize wallpaper on load */
  randomWallpaper: boolean;
  /** Whether to show top sites section */
  showTopSites: boolean;
  /** Whether to show bookmarks section */
  showBookmarks: boolean;
  /** Whether to show pagination controls */
  showPagination: boolean;
  /** Whether to show the clock widget */
  showClock: boolean;
  /** Whether to show the weather widget */
  showWeather: boolean;
  /** Whether to show the widget sidebar */
  showWidgetSidebar: boolean;
  /** Position of the widget sidebar */
  widgetSidebarPosition: 'left' | 'right';
  /** Whether the sidebar is collapsed */
  widgetSidebarCollapsed: boolean;
  /** Whether to show todo widget in sidebar */
  showTodoWidget: boolean;
  /** Whether to show notes widget in sidebar */
  showNotesWidget: boolean;
  /** Whether to show bookmarks widget in sidebar */
  showBookmarksWidget: boolean;
  /** Whether to show history widget in sidebar */
  showHistoryWidget: boolean;
  /** Whether to show todo list on home page */
  showHomeTodoList: boolean;
  /** Animation intensity level */
  animationIntensity: 'none' | 'light' | 'normal' | 'heavy';
  /** Current view mode */
  currentView: 'search' | 'notes';
  /** Whether to show pinned notes in search view */
  showPinnedNotes: boolean;
  /** Whether to auto-fill grid gaps */
  autoFillGrid: boolean;
}

/**
 * Weather Settings
 *
 * Configuration for the weather widget.
 *
 * @interface WeatherSettings
 */
export interface WeatherSettings {
  /** Location configuration */
  location: {
    /** Whether to auto-detect or use manual location */
    type: 'auto' | 'manual';
    /** Display name of the location */
    name: string;
    /** Latitude for manual location */
    latitude?: number;
    /** Longitude for manual location */
    longitude?: number;
  };
  /** Temperature unit */
  unit: 'celsius' | 'fahrenheit';
  /** Whether to show forecast */
  showForecast: boolean;
  /** Number of forecast days */
  forecastDays: 3 | 5 | 7;
  /** Update interval in minutes */
  updateInterval: number;
}

/**
 * Widget Settings
 *
 * Configuration for sidebar widgets.
 *
 * @interface WidgetSettings
 */
export interface WidgetSettings {
  /** Todo widget configuration */
  todoWidget: {
    /** Whether to show completed items */
    showCompleted: boolean;
    /** Maximum number of items to display */
    maxItems: number;
  };
  /** Notes widget configuration */
  notesWidget: {
    /** Maximum number of notes to display */
    maxItems: number;
    /** Whether to show timestamps */
    showTimestamp: boolean;
  };
  /** Bookmarks widget configuration */
  bookmarksWidget: {
    /** Maximum number of bookmarks to display */
    maxItems: number;
  };
  /** History widget configuration */
  historyWidget: {
    /** Maximum number of history items */
    maxItems: number;
    /** Time range filter */
    timeRange: 'today' | 'week' | 'month';
  };
}

/**
 * Font Settings
 *
 * Typography configuration for icon labels and text.
 *
 * @interface FontSettings
 */
export interface FontSettings {
  /** Font family name */
  family: string;
  /** Font size in pixels */
  size: number;
  /** Text color (hex or CSS color) */
  color: string;
  /** Whether to show text shadow */
  shadow: boolean;
  /** Shadow color (CSS color with alpha) */
  shadowColor: string;
  /** Font weight */
  weight: 'normal' | 'medium' | 'bold';
}

/**
 * Clock Settings
 *
 * Configuration for the clock widget.
 *
 * @interface ClockSettings
 */
export interface ClockSettings {
  /** IANA timezone string or 'auto' for system timezone */
  timezone: string;
  /** Whether to auto-detect timezone */
  autoDetect: boolean;
  /** Time format (12-hour or 24-hour) */
  format: '12h' | '24h';
  /** Whether to show seconds */
  showSeconds: boolean;
}

/**
 * Changelog Settings
 *
 * Tracks changelog viewing state for update notifications.
 *
 * @interface ChangelogSettings
 */
export interface ChangelogSettings {
  /** Last version the user viewed the changelog for */
  lastViewedVersion: string;
  /** Whether to show changelog on version update */
  showOnUpdate: boolean;
}

/**
 * Notification Settings
 *
 * Configuration for Gmail and todo badge notifications.
 *
 * @interface NotificationSettings
 */
export interface NotificationSettings {
  /** Whether Gmail notifications are enabled */
  gmailEnabled: boolean;
  /** Whether to play sound on new email */
  gmailSound: boolean;
  /** Whether to show unread count badge */
  showUnreadCount: boolean;
  /** Whether to show todo count badge */
  showTodoCount: boolean;
  /** Whether Gmail is authorized (read-only) */
  gmailAuthorized: boolean;
  /** Authorized Gmail email address (read-only) */
  gmailEmail: string | null;
}

/**
 * Minimal Mode Settings
 *
 * Configuration for the minimal/distraction-free mode.
 *
 * @interface MinimalModeSettings
 */
export interface MinimalModeSettings {
  /** Whether to show view switcher in minimal mode */
  showViewSwitcher: boolean;
}

/**
 * System Icon Settings
 *
 * Controls visibility and state of default system shortcuts
 * (Settings, Weather, Todo, Notes, etc.)
 *
 * @interface SystemIconSettings
 */
export interface SystemIconSettings {
  /** Visibility state for each system icon (true = visible) */
  visibility: Record<SystemIconId, boolean>;
  /** Whether system icons have been initialized on first load */
  initialized: boolean;
  /** Whether location denied prompt has been shown for weather */
  locationDeniedPromptShown: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Store State Interface
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Settings Store State Interface
 *
 * Complete state shape for all application settings.
 * Settings are organized into logical groups for better maintainability.
 *
 * @interface SettingsState
 */
interface SettingsState {
  // ─────────────────────────────────────────────────────────────────────────────
  // General Settings
  // ─────────────────────────────────────────────────────────────────────────────

  /** Current theme setting */
  theme: Theme;
  /** Current UI language code */
  language: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // Behavior Settings
  // ─────────────────────────────────────────────────────────────────────────────

  /** Controls where different content types are opened */
  openBehavior: OpenBehavior;

  // ─────────────────────────────────────────────────────────────────────────────
  // Display Settings
  // ─────────────────────────────────────────────────────────────────────────────

  /** Icon visual style configuration */
  iconStyle: IconStyle;
  /** Search bar configuration */
  searchSettings: SearchSettings;
  /** Grid layout and visibility configuration */
  viewSettings: ViewSettings;
  /** Typography configuration */
  fontSettings: FontSettings;
  /** Clock widget configuration */
  clockSettings: ClockSettings;
  /** Weather widget configuration */
  weatherSettings: WeatherSettings;
  /** Sidebar widgets configuration */
  widgetSettings: WidgetSettings;
  /** Changelog notification settings */
  changelogSettings: ChangelogSettings;
  /** Email and badge notifications */
  notificationSettings: NotificationSettings;

  // ─────────────────────────────────────────────────────────────────────────────
  // Mode Settings
  // ─────────────────────────────────────────────────────────────────────────────

  /** Whether minimal mode is enabled */
  minimalMode: boolean;
  /** Minimal mode specific settings */
  minimalModeSettings: MinimalModeSettings;

  // ─────────────────────────────────────────────────────────────────────────────
  // System Settings
  // ─────────────────────────────────────────────────────────────────────────────

  /** System icon visibility and state */
  systemIconSettings: SystemIconSettings;
  /** Settings panel section collapse states */
  collapsedSections: Record<string, boolean>;
  /** Whether initial settings load is complete */
  isInitialized: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Store Actions Interface
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Settings Store Actions Interface
 *
 * All available actions for modifying settings state.
 * Actions are organized by the settings group they modify.
 *
 * @interface SettingsActions
 */
interface SettingsActions {
  // ─────────────────────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Initializes settings from IndexedDB.
   * Should be called once on application startup.
   * @returns Promise that resolves when initialization is complete
   */
  initializeSettings: () => Promise<void>;

  // ─────────────────────────────────────────────────────────────────────────────
  // Theme
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sets the application theme.
   * Persists to both localStorage and IndexedDB.
   * @param theme - The theme to apply
   */
  setTheme: (theme: Theme) => void;

  // ─────────────────────────────────────────────────────────────────────────────
  // Language
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sets the UI language.
   * Persists to both localStorage and IndexedDB.
   * @param language - Language code (e.g., 'en', 'zh')
   */
  setLanguage: (language: string) => void;

  // ─────────────────────────────────────────────────────────────────────────────
  // Behavior
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Updates open behavior settings.
   * @param behavior - Partial settings to merge
   */
  setOpenBehavior: (behavior: Partial<OpenBehavior>) => void;

  // ─────────────────────────────────────────────────────────────────────────────
  // Display Settings
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Updates icon style settings.
   * @param style - Partial settings to merge
   */
  setIconStyle: (style: Partial<IconStyle>) => void;

  /**
   * Updates search bar settings.
   * @param settings - Partial settings to merge
   */
  setSearchSettings: (settings: Partial<SearchSettings>) => void;

  /**
   * Updates view and layout settings.
   * Also syncs to IndexedDB for background script access.
   * @param settings - Partial settings to merge
   */
  setViewSettings: (settings: Partial<ViewSettings>) => void;

  /**
   * Updates font settings.
   * @param settings - Partial settings to merge
   */
  setFontSettings: (settings: Partial<FontSettings>) => void;

  /**
   * Updates clock settings.
   * @param settings - Partial settings to merge
   */
  setClockSettings: (settings: Partial<ClockSettings>) => void;

  /**
   * Updates weather settings.
   * @param settings - Partial settings to merge
   */
  setWeatherSettings: (settings: Partial<WeatherSettings>) => void;

  /**
   * Updates widget settings.
   * @param settings - Partial settings to merge
   */
  setWidgetSettings: (settings: Partial<WidgetSettings>) => void;

  /**
   * Updates changelog settings.
   * @param settings - Partial settings to merge
   */
  setChangelogSettings: (settings: Partial<ChangelogSettings>) => void;

  /**
   * Updates notification settings.
   * @param settings - Partial settings to merge
   */
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // ─────────────────────────────────────────────────────────────────────────────
  // Minimal Mode
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Enables or disables minimal mode.
   * @param enabled - Whether minimal mode should be active
   */
  setMinimalMode: (enabled: boolean) => void;

  /**
   * Updates minimal mode specific settings.
   * @param settings - Partial settings to merge
   */
  setMinimalModeSettings: (settings: Partial<MinimalModeSettings>) => void;

  // ─────────────────────────────────────────────────────────────────────────────
  // System Icons
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Updates system icon settings.
   * @param settings - Partial settings to merge
   */
  setSystemIconSettings: (settings: Partial<SystemIconSettings>) => void;

  /**
   * Sets visibility for a specific system icon.
   * @param iconId - System icon identifier
   * @param visible - Whether the icon should be visible
   */
  setSystemIconVisibility: (iconId: SystemIconId, visible: boolean) => void;

  // ─────────────────────────────────────────────────────────────────────────────
  // Settings Panel
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Toggles collapse state of a settings section.
   * @param sectionId - Section identifier
   */
  toggleSectionCollapse: (sectionId: string) => void;

  /**
   * Sets collapse state of a settings section.
   * @param sectionId - Section identifier
   * @param collapsed - Whether section should be collapsed
   */
  setSectionCollapsed: (sectionId: string, collapsed: boolean) => void;

  /**
   * Collapses or expands all settings sections.
   * @param collapsed - Whether all sections should be collapsed
   */
  setAllSectionsCollapsed: (collapsed: boolean) => void;

  // ─────────────────────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Resets all settings to default values.
   * Clears both localStorage and IndexedDB settings.
   */
  resetToDefaults: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Default Values
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Default Search Engines
 *
 * Pre-configured search engines available out of the box.
 * Includes major global and regional search providers.
 * Users can add custom engines or modify these defaults.
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
 * Determines the default search engine based on user's region.
 *
 * Uses browser locale and timezone to detect if user is likely in China,
 * where Google may be inaccessible, and defaults to Bing instead.
 *
 * @returns Search engine ID ('bing' for China, 'google' elsewhere)
 */
function getSmartDefaultEngine(): string {
  return isUserLocaleChina() ? 'bing' : 'google';
}

/**
 * Default Settings Values
 *
 * Complete default configuration for all settings.
 * These values are used on first install and when resetting to defaults.
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
    placeholder: '搜索或输入网址',
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
    showHomeTodoList: false,        // Default: hidden, user can enable in settings
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
  systemIconSettings: {
    visibility: {
      'system-weather': true,
      'system-todo': true,
      'system-notes': true,
      'system-settings': true,
      'system-wallpaper': true,
      'system-openinfinity': true,
      'system-bookmarks': true,
      'system-history': true,
      'system-extensions': true,
    },
    initialized: false,  // Will be set to true after first injection
    locationDeniedPromptShown: false,
  },
  collapsedSections: {},  // Default: all sections expanded
  isInitialized: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Store Implementation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Settings Store with Persistence
 *
 * Zustand store with persist middleware for automatic localStorage persistence.
 * Includes schema migration for handling version upgrades gracefully.
 *
 * @example
 * ```tsx
 * import { useSettingsStore } from '@/stores/settingsStore';
 *
 * function ThemeToggle() {
 *   const { theme, setTheme } = useSettingsStore();
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       Toggle Theme
 *     </button>
 *   );
 * }
 *
 * // Access settings outside React components
 * const columns = useSettingsStore.getState().viewSettings.columns;
 * ```
 *
 * @see {@link SettingsState} for state shape
 * @see {@link SettingsActions} for available actions
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
          const msg = error instanceof Error ? error.message : JSON.stringify(error);
          console.error('Failed to load settings from IndexedDB:', msg);
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
        set((state) => {
          const newViewSettings = { ...state.viewSettings, ...settings };
          // Sync to IndexedDB for background script access
          db.settings.put({ key: 'viewSettings', value: newViewSettings }).catch(console.error);
          return { viewSettings: newViewSettings };
        });
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

      setSystemIconSettings: (settings) => {
        set((state) => ({
          systemIconSettings: { ...state.systemIconSettings, ...settings },
        }));
      },

      setSystemIconVisibility: (iconId, visible) => {
        set((state) => ({
          systemIconSettings: {
            ...state.systemIconSettings,
            visibility: {
              ...state.systemIconSettings.visibility,
              [iconId]: visible,
            },
          },
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
          'icon', 'system-icons', 'search', 'font', 'animation', 'reset',
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
      version: 9, // V9: Add viewSettings.showHomeTodoList
      migrate: (persistedState: any, version: number) => {
        const state = persistedState ?? {};

        // Defense: First-time install or corrupted localStorage may have empty state
        // Ensure required nested objects exist before spreading to avoid TypeError
        if (!state.searchSettings) state.searchSettings = { ...defaultSettings.searchSettings };
        if (!state.viewSettings) state.viewSettings = { ...defaultSettings.viewSettings };
        if (!state.notificationSettings) state.notificationSettings = { ...defaultSettings.notificationSettings };
        if (!state.changelogSettings) state.changelogSettings = { ...defaultSettings.changelogSettings };
        if (!state.minimalModeSettings) state.minimalModeSettings = { ...defaultSettings.minimalModeSettings };
        if (!state.systemIconSettings) state.systemIconSettings = { ...defaultSettings.systemIconSettings };

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

        // V8: Add system icon settings for default shortcuts
        if (version < 8) {
          state.systemIconSettings = state?.systemIconSettings ?? {
            visibility: {
              'system-weather': true,
              'system-todo': true,
              'system-notes': true,
              'system-settings': true,
              'system-wallpaper': true,
              'system-openinfinity': true,
              'system-bookmarks': true,
              'system-history': true,
              'system-extensions': true,
            },
            initialized: false,
            locationDeniedPromptShown: false,
          };
        }

        // V9: Add HomeTodoList toggle in viewSettings
        if (version < 9) {
          state.viewSettings = {
            ...state.viewSettings,
            showHomeTodoList: state?.viewSettings?.showHomeTodoList ?? false,
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
        systemIconSettings: state.systemIconSettings,
        // Note: collapsedSections intentionally excluded from persistence
        // so settings panel always opens with all sections expanded
      }),
    }
  )
);
