import { create } from 'zustand';
import type { PresetWebsite } from '../services/database';

/**
 * Navigation panel state management
 */

export type NavigationTab = 'add' | 'my' | 'settings';
export type SettingsTab = 'general' | 'clock' | 'wallpaper' | 'icons' | 'search' | 'layout' | 'fonts' | 'marketplace' | 'backup' | 'about';

interface NavigationState {
  // Panel state
  isPanelOpen: boolean;
  activeTab: NavigationTab;
  settingsInitialTab: SettingsTab | null; // Initial tab for settings panel

  // Add tab state
  selectedCategory: string | null;
  searchQuery: string;
  filteredWebsites: PresetWebsite[];

  // My tab state
  isLoggedIn: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: number | null;
}

interface NavigationActions {
  // Panel actions
  openPanel: (tab?: NavigationTab, settingsTab?: SettingsTab) => void;
  closePanel: () => void;
  setActiveTab: (tab: NavigationTab) => void;
  setSettingsInitialTab: (tab: SettingsTab | null) => void;

  // Add tab actions
  setCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilteredWebsites: (websites: PresetWebsite[]) => void;

  // My tab actions
  setLoginStatus: (isLoggedIn: boolean) => void;
  setSyncStatus: (status: NavigationState['syncStatus']) => void;
  setLastSyncTime: (time: number) => void;
}

const initialState: NavigationState = {
  // Panel state
  isPanelOpen: false,
  activeTab: 'add',
  settingsInitialTab: null,

  // Add tab state
  selectedCategory: null,
  searchQuery: '',
  filteredWebsites: [],

  // My tab state
  isLoggedIn: false,
  syncStatus: 'idle',
  lastSyncTime: null,
};

export const useNavigationStore = create<NavigationState & NavigationActions>((set) => ({
  ...initialState,

  // Panel actions
  openPanel: (tab = 'add', settingsTab) =>
    set({
      isPanelOpen: true,
      activeTab: tab,
      settingsInitialTab: settingsTab || null,
    }),

  closePanel: () =>
    set({
      isPanelOpen: false,
      settingsInitialTab: null, // Reset settings tab on close
    }),

  setActiveTab: (tab) =>
    set({
      activeTab: tab,
    }),

  setSettingsInitialTab: (tab) =>
    set({
      settingsInitialTab: tab,
    }),

  // Add tab actions
  setCategory: (categoryId) =>
    set({
      selectedCategory: categoryId,
      searchQuery: '', // Clear search when category changes
    }),

  setSearchQuery: (query) =>
    set({
      searchQuery: query,
      selectedCategory: null, // Clear category when searching
    }),

  setFilteredWebsites: (websites) =>
    set({
      filteredWebsites: websites,
    }),

  // My tab actions
  setLoginStatus: (isLoggedIn) =>
    set({
      isLoggedIn,
    }),

  setSyncStatus: (status) =>
    set({
      syncStatus: status,
    }),

  setLastSyncTime: (time) =>
    set({
      lastSyncTime: time,
    }),
}));
