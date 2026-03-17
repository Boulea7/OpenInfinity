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

import { create } from 'zustand';
import type { PresetWebsite } from '../services/database';

/**
 * Navigation panel state management
 */

export type NavigationTab = 'add' | 'my' | 'settings';
export type SettingsTab = 'general' | 'clock' | 'wallpaper' | 'icons' | 'search' | 'layout' | 'fonts' | 'marketplace' | 'backup' | 'about';

/**
 * Side panel views for system icon shortcuts
 * Note: 'notes' removed - uses NotesView via switchView action instead
 */
export type SidePanelView = 'none' | 'todo' | 'bookmarks' | 'history' | 'extensions' | 'weather';

interface NavigationState {
  // Panel state
  isPanelOpen: boolean;
  activeTab: NavigationTab;
  settingsInitialTab: SettingsTab | null; // Initial tab for settings panel

  // Side panel state (for system icons)
  sidePanel: SidePanelView;

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

  // Side panel actions
  openSidePanel: (view: Exclude<SidePanelView, 'none'>) => void;
  closeSidePanel: () => void;
  toggleSidePanel: (view: Exclude<SidePanelView, 'none'>) => void;

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

  // Side panel state
  sidePanel: 'none',

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

  // Side panel actions
  openSidePanel: (view) =>
    set({
      sidePanel: view,
      // Close main panel when opening side panel for cleaner UX
      isPanelOpen: false,
    }),

  closeSidePanel: () =>
    set({
      sidePanel: 'none',
    }),

  toggleSidePanel: (view) =>
    set((state) => ({
      sidePanel: state.sidePanel === view ? 'none' : view,
      // Close main panel when opening side panel
      isPanelOpen: state.sidePanel === view ? state.isPanelOpen : false,
    })),

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
