import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';
import { useSettingsStore, useIconStore, useWallpaperStore } from './stores';
import { useNavigationStore } from './stores/navigationStore';
import { useWeatherUiStore } from './stores/weatherUiStore';
import type { Icon, Folder } from './services/database';
import { clearExpiredIconCache } from './utils/iconCache';
import { hasOrigins, PERMISSION_GROUPS } from '../shared/permissions';
import { applyDocumentLanguage, normalizeUiLanguage } from '../shared/locale';
import { syncSystemIconTitlesForLanguage } from './services/systemIcons';
import {
  WallpaperBackground,
  SearchBar,
  IconGrid,
  PageDots,
  ClockWidget,
  CompactWeather,
  FolderModal,
  WidgetContainer,
  // ViewSwitcher removed here as it is integrated into SearchBar
} from './components';

// Lazy load heavy components to reduce initial bundle size (~600KB savings)
const NotesView = lazy(() =>
  import('./components/Notes/NotesView').then((m) => ({ default: m.NotesView }))
);
const PinnedNotesPanel = lazy(() =>
  import('./components/Notes/PinnedNotesPanel').then((m) => ({ default: m.PinnedNotesPanel }))
);
import { IconEditorSidebar } from './components/Icon/IconEditorSidebar';
import { InfinityLogo } from './components/Navigation/InfinityLogo';
import { InfinityNavPanel } from './components/Navigation/InfinityNavPanel';
import { SidebarRouter } from './components/Sidebar/SidebarRouter';
import { HomeTodoList } from './components/Widgets/HomeTodoList';

/**
 * OpenInfinity New Tab Application
 * Main entry component that sets up the app structure
 */
function App() {
  const { i18n } = useTranslation();
  // Precise subscriptions to prevent unnecessary re-renders
  const {
    theme,
    language,
    initializeSettings,
    viewSettings,
    setViewSettings,
    minimalMode,
    minimalModeSettings,
  } = useSettingsStore(
    useShallow((s) => ({
      theme: s.theme,
      language: s.language,
      initializeSettings: s.initializeSettings,
      viewSettings: s.viewSettings,
      setViewSettings: s.setViewSettings,
      minimalMode: s.minimalMode,
      minimalModeSettings: s.minimalModeSettings,
    }))
  );
  const { loadIcons, isLoading, initializeSystemIcons } = useIconStore(
    useShallow((s) => ({
      loadIcons: s.loadIcons,
      isLoading: s.isLoading,
      initializeSystemIcons: s.initializeSystemIcons,
    }))
  );
  const openPanel = useNavigationStore((s) => s.openPanel);
  const isWeatherExpanded = useWeatherUiStore((s) => s.isExpanded);

  // layout state
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(320);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);

  // modal states
  const [showIconEditor, setShowIconEditor] = useState(false);
  const [editingIcon, setEditingIcon] = useState<Icon | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [openedFolder, setOpenedFolder] = useState<Folder | null>(null);
  const [folderOriginRect, setFolderOriginRect] = useState<DOMRect | null>(null);

  // Search state moved to searchStore to prevent App re-renders
  // when user types in SearchBar

  const handleClockClick = useCallback(() => {
    openPanel('settings', 'clock');
  }, [openPanel]);

  useEffect(() => {
    clearExpiredIconCache();
    initializeSettings();
    loadIcons();
  }, [initializeSettings, loadIcons]);

  // Initialize system icons after icons are loaded (first-time setup)
  useEffect(() => {
    initializeSystemIcons();
  }, [initializeSystemIcons]);

  useEffect(() => {
    setViewSettings({ currentView: 'search' });
  }, []);

  useEffect(() => {
    if (!language) return;
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage !== language) {
      localStorage.setItem('language', language);
    }
    applyDocumentLanguage(normalizeUiLanguage(language));
    syncSystemIconTitlesForLanguage(normalizeUiLanguage(language)).catch((err) => {
      console.error('[App] Failed to sync system icon titles:', err);
    });
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
    const initializeWallpaper = async () => {
      const { activeSource } = useWallpaperStore.getState();
      if (activeSource === 'unsplash' || activeSource === 'pexels') {
        const requiredOrigins =
          activeSource === 'unsplash'
            ? PERMISSION_GROUPS.wallpaperUnsplash
            : PERMISSION_GROUPS.wallpaperPexels;

        // Minimal-permissions mode: only fetch if the user has already granted origins.
        // Do not request here (no user gesture).
        const permitted = await hasOrigins(requiredOrigins);
        if (permitted) {
          await useWallpaperStore.getState().fetchRandomWallpaper();
          return;
        }
      }

      await useWallpaperStore.getState().loadWallpaper();
    };
    initializeWallpaper();
  }, []);

  useEffect(() => {
    const { autoChange, startAutoChange, stopAutoChange } = useWallpaperStore.getState();
    if (autoChange.enabled) {
      startAutoChange();
    }
    return () => {
      stopAutoChange();
    };
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    const intensity = viewSettings.animationIntensity;
    document.documentElement.setAttribute('data-animation-intensity', intensity);
  }, [viewSettings.animationIntensity]);

  // Ctrl+F / Cmd+F to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        const target = e.target as HTMLElement | null;
        // Do not override native find when user is typing in input/textarea
        if (target && (target.closest('input, textarea') || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        // Use data attribute to find the main search input
        const searchInput = document.querySelector('input[data-search-input="true"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddIcon = useCallback(() => {
    setEditingIcon(null);
    setShowIconEditor(true);
  }, []);

  const handleEditIcon = useCallback((icon: Icon) => {
    setEditingIcon(icon);
    setShowIconEditor(true);
  }, []);

  const handleOpenFolder = useCallback((folder: Folder, rect?: DOMRect) => {
    setOpenedFolder(folder);
    setFolderOriginRect(rect || null);
    setShowFolderModal(true);
  }, []);

  const handleCloseIconEditor = useCallback(() => {
    setShowIconEditor(false);
    setEditingIcon(null);
  }, []);

  const handleCloseFolderModal = useCallback(() => {
    setShowFolderModal(false);
    setOpenedFolder(null);
    setFolderOriginRect(null);
  }, []);

  // Dynamic layout animation based on grid rows
  // When user adjusts rows, search bar and content smoothly transition
  const layoutStyle = useMemo(() => {
    // Base padding for header (5rem = 80px)
    const basePadding = 80;
    // Row factor: fewer rows = more top padding to center content better
    // Reference row count is 4 (default), adjust by 20px per row difference
    const rowDiff = Math.max(0, 4 - viewSettings.rows);
    const dynamicPadding = basePadding + rowDiff * 20;

    return {
      headerPaddingTop: minimalMode ? 'calc(38vh - 60px)' : `${dynamicPadding}px`,
      contentPaddingBottom: minimalMode ? '2rem' : `${dynamicPadding}px`,
    };
  }, [viewSettings.rows, minimalMode]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Wallpaper Background Layer */}
      <WallpaperBackground />

      {/* Widget Sidebar - hidden in minimal mode */}
      {!minimalMode && viewSettings.showWidgetSidebar && (
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

      <div
        className="relative z-10 h-screen flex flex-col transition-all duration-300 overflow-hidden"
        style={{
          marginLeft:
            !minimalMode &&
              viewSettings.showWidgetSidebar &&
              !viewSettings.widgetSidebarCollapsed &&
              viewSettings.widgetSidebarPosition === 'left'
              ? `${leftSidebarWidth}px`
              : 0,
          marginRight:
            !minimalMode &&
              viewSettings.showWidgetSidebar &&
              !viewSettings.widgetSidebarCollapsed &&
              viewSettings.widgetSidebarPosition === 'right'
              ? `${rightSidebarWidth}px`
              : 0,
        }}
      >
        {/* Fixed Clock & Weather - Top Left Corner (symmetric with InfinityLogo) */}
        {(viewSettings.showClock || viewSettings.showWeather || isWeatherExpanded) && (
          <div className="fixed top-4 left-4 z-40 flex items-center gap-4">
            {viewSettings.showClock && <ClockWidget showDate onClick={handleClockClick} />}
            {(viewSettings.showWeather || isWeatherExpanded) && <CompactWeather />}
          </div>
        )}

        {/* Layout Header & Search: Persistent across views */}
        {/* Dynamic padding based on grid rows for visual balance */}
        <header
          className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 pb-2 layout-adaptive-transition"
          style={{
            paddingTop: layoutStyle.headerPaddingTop,
          }}
        >
          {/* Persistent Search Bar */}
          <div className="w-full flex justify-center">
            <SearchBar
              className="mb-6"
              showViewSwitcher={!minimalMode || minimalModeSettings.showViewSwitcher}
            />
          </div>
        </header>

        {/* Content Area - hidden in minimal mode with animation */}
        <main
          className={`
            flex-1 min-h-0 flex flex-col w-full max-w-7xl mx-auto px-4 relative overflow-hidden
            minimal-mode-content-transition
            ${minimalMode ? 'minimal-mode-content-hidden' : 'minimal-mode-content-visible'}
          `}
        >
          {viewSettings.currentView === 'search' ? (
            <>
              {/* Icon grid container with dynamic padding that responds to layout changes */}
              <div
                className="flex-1 min-h-0 flex items-center justify-center layout-adaptive-transition"
                style={{ paddingBottom: layoutStyle.contentPaddingBottom }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white/80" />
                  </div>
                ) : (
                  <IconGrid
                    className="w-full"
                    onAddIcon={handleAddIcon}
                    onEditIcon={handleEditIcon}
                    onOpenFolder={handleOpenFolder}
                  />
                )}
              </div>

              {viewSettings.showPagination && (
                <footer className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <PageDots />
                </footer>
              )}

              {/* Pinned Notes Panel - hidden in minimal mode */}
              {!minimalMode && viewSettings.showPinnedNotes && (
                <Suspense fallback={null}>
                  <PinnedNotesPanel />
                </Suspense>
              )}
            </>
          ) : (
            // Notes View taking remaining space
            <div className="flex-1 h-full min-h-0 overflow-hidden">
              <Suspense fallback={<div className="animate-pulse h-full w-full bg-white/5 rounded-lg" />}>
                <NotesView />
              </Suspense>
            </div>
          )}
        </main>

      </div>

      <div id="overlay-root" className="relative z-50" />

      <IconEditorSidebar
        isOpen={showIconEditor}
        onClose={handleCloseIconEditor}
        editingIcon={editingIcon}
      />

      <FolderModal
        isOpen={showFolderModal}
        onClose={handleCloseFolderModal}
        folder={openedFolder}
        onEditIcon={handleEditIcon}
        onAddIcon={handleAddIcon}
        originRect={folderOriginRect}
      />

      <InfinityLogo />
      <InfinityNavPanel />
      <SidebarRouter />

      {/* Home Todo List - Fixed on right side, hidden in minimal mode */}
      {!minimalMode && viewSettings.showHomeTodoList && (
        <HomeTodoList />
      )}
    </div>
  );
}

export default App;
