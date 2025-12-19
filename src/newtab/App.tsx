import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, useIconStore, useWallpaperStore } from './stores';
import { useNavigationStore } from './stores/navigationStore';
import type { Icon, Folder } from './services/database';
import { clearExpiredIconCache } from './utils/iconCache';
import {
  WallpaperBackground,
  SearchBar,
  IconGrid,
  PageDots,
  ClockWidget,
  CompactWeather,
  IconEditor,
  FolderModal,
  WidgetContainer,
} from './components';
import { InfinityLogo } from './components/Navigation/InfinityLogo';
import { InfinityNavPanel } from './components/Navigation/InfinityNavPanel';

/**
 * OpenInfinity New Tab Application
 * Main entry component that sets up the app structure
 */
function App() {
  const { i18n } = useTranslation();
  const { theme, language, initializeSettings, viewSettings } = useSettingsStore();
  const { loadIcons, isLoading } = useIconStore();
  const { openPanel } = useNavigationStore();

  // P0-9: Sidebar width state (lifted up for proper layout coordination)
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(320);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);

  // Modal states
  const [showIconEditor, setShowIconEditor] = useState(false);
  const [editingIcon, setEditingIcon] = useState<Icon | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [openedFolder, setOpenedFolder] = useState<Folder | null>(null);

  // Handle clock click - open settings panel to clock tab
  const handleClockClick = useCallback(() => {
    openPanel('settings', 'clock');
  }, [openPanel]);

  // P1-9: Initialize settings and load icons on mount
  useEffect(() => {
    clearExpiredIconCache();
    initializeSettings();
    loadIcons();
  }, [initializeSettings, loadIcons]);

  // Sync language between store, localStorage, and i18n
  // Store is the single source of truth
  useEffect(() => {
    if (!language) return; // Wait for store initialization

    // Sync store -> localStorage
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage !== language) {
      localStorage.setItem('language', language);
    }

    // Sync store -> i18n
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]); // React to store changes

  // Initialize wallpaper - fetch fresh wallpaper every time
  useEffect(() => {
    const initializeWallpaper = async () => {
      const { activeSource } = useWallpaperStore.getState();

      // For online wallpaper sources, always fetch fresh wallpaper
      if (activeSource === 'unsplash' || activeSource === 'pexels') {
        console.log(`[Wallpaper] Fetching fresh ${activeSource} wallpaper...`);
        await useWallpaperStore.getState().fetchRandomWallpaper();
      } else {
        // For gradient/solid/local, load cached wallpaper
        await useWallpaperStore.getState().loadWallpaper();
      }
    };

    initializeWallpaper();
  }, []); // Only run once on mount

  // Initialize auto-change timer based on stored config
  useEffect(() => {
    const { autoChange, startAutoChange, stopAutoChange } = useWallpaperStore.getState();

    if (autoChange.enabled) {
      startAutoChange();
    }

    // Cleanup on unmount
    return () => {
      stopAutoChange();
    };
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Handle add icon
  const handleAddIcon = useCallback(() => {
    setEditingIcon(null);
    setShowIconEditor(true);
  }, []);

  // Handle edit icon
  const handleEditIcon = useCallback((icon: Icon) => {
    setEditingIcon(icon);
    setShowIconEditor(true);
  }, []);

  // Handle open folder
  const handleOpenFolder = useCallback((folder: Folder) => {
    setOpenedFolder(folder);
    setShowFolderModal(true);
  }, []);

  // Close icon editor
  const handleCloseIconEditor = useCallback(() => {
    setShowIconEditor(false);
    setEditingIcon(null);
  }, []);

  // Close folder modal
  const handleCloseFolderModal = useCallback(() => {
    setShowFolderModal(false);
    setOpenedFolder(null);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Wallpaper Background Layer */}
      <WallpaperBackground />

      {/* Widget Sidebar - Conditional Render */}
      {viewSettings.showWidgetSidebar && (
        <WidgetContainer
          position={viewSettings.widgetSidebarPosition}
          initialWidth={
            viewSettings.widgetSidebarPosition === 'left'
              ? leftSidebarWidth
              : rightSidebarWidth
          }
          onWidthChange={
            viewSettings.widgetSidebarPosition === 'left'
              ? setLeftSidebarWidth
              : setRightSidebarWidth
          }
        />
      )}

      {/* Main Content Layer */}
      <div
        className="relative z-10 min-h-screen flex flex-col transition-all duration-300"
        style={{
          // P0-9: Dynamic margin based on actual sidebar width
          marginLeft:
            viewSettings.showWidgetSidebar &&
            !viewSettings.widgetSidebarCollapsed &&
            viewSettings.widgetSidebarPosition === 'left'
              ? `${leftSidebarWidth}px`
              : 0,
          marginRight:
            viewSettings.showWidgetSidebar &&
            !viewSettings.widgetSidebarCollapsed &&
            viewSettings.widgetSidebarPosition === 'right'
              ? `${rightSidebarWidth}px`
              : 0,
        }}
      >
        {/* Top Bar */}
        <header className="flex items-center justify-between p-4">
          {/* Left: Clock widget (P1-8: conditional render) */}
          {viewSettings.showClock && (
            <div className="flex items-center gap-6">
              <ClockWidget showDate onClick={handleClockClick} />
              <CompactWeather />
            </div>
          )}

          {/* Right: Clock widget placeholder */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Infinity Logo replaces Settings button */}
          </div>
        </header>

        {/* Search Bar */}
        <div className="flex-shrink-0 px-4 py-8">
          <SearchBar />
        </div>

        {/* Icon Grid (P1-9: Loading state) */}
        <main className="flex-1 flex items-start justify-center px-4 pb-20 pt-8">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white/80" />
            </div>
          ) : (
            <IconGrid
              className="max-w-4xl w-full"
              onAddIcon={handleAddIcon}
              onEditIcon={handleEditIcon}
              onOpenFolder={handleOpenFolder}
            />
          )}
        </main>

        {/* Bottom Dock / Pagination (P1-8: conditional render) */}
        {viewSettings.showPagination && (
          <footer className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <PageDots />
          </footer>
        )}
      </div>

      {/* Overlay Layer for modals, context menus, etc. */}
      <div id="overlay-root" className="relative z-50" />

      {/* Icon Editor Modal */}
      <IconEditor
        isOpen={showIconEditor}
        onClose={handleCloseIconEditor}
        editingIcon={editingIcon}
      />

      {/* Folder Modal */}
      <FolderModal
        isOpen={showFolderModal}
        onClose={handleCloseFolderModal}
        folder={openedFolder}
        onEditIcon={handleEditIcon}
        onAddIcon={handleAddIcon}
      />

      {/* Infinity Logo - Fixed top-right button */}
      <InfinityLogo />

      {/* Infinity Navigation Panel */}
      <InfinityNavPanel />
    </div>
  );
}

export default App;
