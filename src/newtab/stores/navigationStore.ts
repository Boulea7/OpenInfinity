import { create } from 'zustand';
import type { PresetWebsite } from '../services/database';

/**
 * Navigation panel state management
 */

export type NavigationTab = 'add' | 'my' | 'settings';

interface NavigationState {
  // Panel state
  isPanelOpen: boolean;
  activeTab: NavigationTab;

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
  openPanel: (tab?: NavigationTab) => void;
  closePanel: () => void;
  setActiveTab: (tab: NavigationTab) => void;

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
  openPanel: (tab = 'add') =>
    set({
      isPanelOpen: true,
      activeTab: tab,
    }),

  closePanel: () =>
    set({
      isPanelOpen: false,
    }),

  setActiveTab: (tab) =>
    set({
      activeTab: tab,
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
