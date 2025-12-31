/**
 * SidebarRouter Component
 *
 * Routes to the appropriate sidebar based on navigation state.
 * Uses SidePanel for consistent slide-out behavior.
 */

import { lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigationStore } from '../../stores/navigationStore';
import { SidePanel } from '../ui/SidePanel';

// Lazy load sidebar components to reduce initial bundle size
// Note: NotesSidebar removed - notes now uses NotesView via switchView action
const TodoSidebar = lazy(() => import('./TodoSidebar'));
const BookmarksSidebar = lazy(() => import('./BookmarksSidebar'));
const HistorySidebar = lazy(() => import('./HistorySidebar'));
const ExtensionsSidebar = lazy(() => import('./ExtensionsSidebar'));
const WeatherSidebar = lazy(() => import('./WeatherSidebar'));

/**
 * Loading fallback for lazy-loaded sidebars
 */
function SidebarLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500" />
    </div>
  );
}

export function SidebarRouter() {
  const { t } = useTranslation();
  const { sidePanel, closeSidePanel } = useNavigationStore();

  // Sidebar title mapping with i18n
  const sidebarTitles = useMemo(() => ({
    todo: t('sidebar.todo', 'Todo'),
    bookmarks: t('sidebar.bookmarks', 'Bookmarks'),
    history: t('sidebar.history', 'History'),
    extensions: t('sidebar.extensions', 'Extensions'),
    weather: t('sidebar.weather', 'Weather'),
  }), [t]);

  const isOpen = sidePanel !== 'none';
  const title = sidePanel !== 'none' ? sidebarTitles[sidePanel] || '' : '';

  const renderContent = () => {
    switch (sidePanel) {
      case 'todo':
        return <TodoSidebar />;
      case 'bookmarks':
        return <BookmarksSidebar />;
      case 'history':
        return <HistorySidebar />;
      case 'extensions':
        return <ExtensionsSidebar />;
      case 'weather':
        return <WeatherSidebar />;
      default:
        return null;
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={closeSidePanel}
      title={title}
    >
      <Suspense fallback={<SidebarLoading />}>
        {renderContent()}
      </Suspense>
    </SidePanel>
  );
}

export default SidebarRouter;
