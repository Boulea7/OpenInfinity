import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Home, Cloud, CheckSquare, FileText, Bookmark, Clock } from 'lucide-react';
import { useSettingsStore } from '../../stores';
import { cn } from '../../utils';
import { TodoWidget } from './TodoWidget';
import { NotesWidget } from './NotesWidget';
import { WeatherWidget } from './WeatherWidget';
import { BookmarksWidget } from './BookmarksWidget';
import { HistoryWidget } from './HistoryWidget';

/**
 * Sidebar configuration constants
 */
const SIDEBAR_CONFIG = {
  defaultWidth: 320,
  minWidth: 280,
  maxWidth: 480,
  collapsedWidth: 48,
  zIndex: 40,
} as const;

/**
 * Widget sidebar container component
 * Provides a collapsible sidebar for hosting various widgets
 */
interface WidgetContainerProps {
  position?: 'left' | 'right';
  initialWidth?: number;
  onWidthChange?: (width: number) => void;
}

export function WidgetContainer({
  position: propPosition,
  initialWidth = SIDEBAR_CONFIG.defaultWidth,
  onWidthChange,
}: WidgetContainerProps = {}) {
  const { viewSettings, setViewSettings } = useSettingsStore();
  const [width, setWidth] = useState<number>(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedWidgets, setExpandedWidgets] = useState<Set<string>>(new Set());

  const sidebarRef = useRef<HTMLDivElement>(null);

  const { widgetSidebarPosition, widgetSidebarCollapsed } = viewSettings;
  const isLeft = (propPosition || widgetSidebarPosition) === 'left';

  // Sync width changes to parent (P0-9)
  useEffect(() => {
    onWidthChange?.(width);
  }, [width, onWidthChange]);

  // Handle resize functionality
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;

      const rect = sidebarRef.current.getBoundingClientRect();
      let newWidth;

      if (isLeft) {
        newWidth = e.clientX - rect.left;
      } else {
        newWidth = rect.right - e.clientX;
      }

      newWidth = Math.max(SIDEBAR_CONFIG.minWidth, Math.min(newWidth, SIDEBAR_CONFIG.maxWidth));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isLeft]);

  // Handle resize mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Toggle sidebar collapse state
  const handleToggleCollapsed = () => {
    setViewSettings({
      widgetSidebarCollapsed: !widgetSidebarCollapsed,
    });
  };

  // Toggle widget expansion
  const handleToggleWidgetExpansion = (widgetId: string) => {
    setExpandedWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  };

  // Widget configurations
  const widgets = [
    {
      id: 'weather',
      title: 'Weather',
      icon: <Cloud className="w-5 h-5" />,
      enabled: true, // Will use viewSettings.showWeather when available
    },
    {
      id: 'todo',
      title: 'Todos',
      icon: <CheckSquare className="w-5 h-5" />,
      enabled: viewSettings.showTodoWidget,
    },
    {
      id: 'notes',
      title: 'Notes',
      icon: <FileText className="w-5 h-5" />,
      enabled: viewSettings.showNotesWidget,
    },
    {
      id: 'bookmarks',
      title: 'Bookmarks',
      icon: <Bookmark className="w-5 h-5" />,
      enabled: viewSettings.showBookmarksWidget,
    },
    {
      id: 'history',
      title: 'History',
      icon: <Clock className="w-5 h-5" />,
      enabled: viewSettings.showHistoryWidget,
    },
  ].filter(widget => widget.enabled);

  const displayWidth = widgetSidebarCollapsed ? SIDEBAR_CONFIG.collapsedWidth : width;

  return (
    <div
      ref={sidebarRef}
      className={cn(
        'fixed top-0 h-screen z-40 transition-all duration-300',
        'bg-white/10 dark:bg-black/20 backdrop-blur-xl',
        'border-white/10',
        isLeft ? 'left-0 border-r' : 'right-0 border-l',
        'overflow-hidden'
      )}
      style={{ width: `${displayWidth}px` }}
    >
      {/* Resize handle - only visible when expanded */}
      {!widgetSidebarCollapsed && (
        <div
          className={cn(
            'absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors',
            isLeft ? 'right-0' : 'left-0'
          )}
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        />
      )}

      {/* Collapsed view - icon strip */}
      {widgetSidebarCollapsed && (
        <div className="flex flex-col items-center py-4 gap-4 h-full overflow-y-auto">
          {/* Expand button */}
          <button
            onClick={handleToggleCollapsed}
            className="btn-ghost text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            aria-label="Expand sidebar"
            title="Expand Widgets"
          >
            {isLeft ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {/* Widget icons */}
          <div className="flex-1 flex flex-col gap-3">
            {widgets.map((widget) => (
              <button
                key={widget.id}
                className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors group"
                onClick={() => handleToggleWidgetExpansion(widget.id)}
                title={widget.title}
              >
                {widget.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded view */}
      {!widgetSidebarCollapsed && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-white/80" />
              <h2 className="text-lg font-semibold text-white">Widgets</h2>
            </div>
            <button
              onClick={handleToggleCollapsed}
              className="btn-ghost text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              aria-label="Collapse sidebar"
              title="Collapse Widgets"
            >
              {isLeft ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          {/* Widgets list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Placeholder widgets */}
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="bg-white/5 rounded-lg overflow-hidden border border-white/10"
              >
                {/* Widget header */}
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                  onClick={() => handleToggleWidgetExpansion(widget.id)}
                >
                  <div className="flex items-center gap-2 text-white">
                    {widget.icon}
                    <span className="font-medium">{widget.title}</span>
                  </div>
                  <div className="text-white/60">
                    {expandedWidgets.has(widget.id) ? '▼' : '▶'}
                  </div>
                </button>

                {/* Widget content */}
                {expandedWidgets.has(widget.id) && (
                  <div className="p-3 border-t border-white/10">
                    {widget.id === 'weather' && (
                      <WeatherWidget
                        isExpanded={true}
                        onToggleExpand={() => {}}
                      />
                    )}
                    {widget.id === 'todo' && (
                      <TodoWidget
                        isExpanded={true}
                        onToggleExpand={() => {}}
                      />
                    )}
                    {widget.id === 'notes' && (
                      <NotesWidget
                        isExpanded={true}
                        onToggleExpand={() => {}}
                      />
                    )}
                    {widget.id === 'bookmarks' && (
                      <BookmarksWidget
                        isExpanded={true}
                        onToggleExpand={() => {}}
                      />
                    )}
                    {widget.id === 'history' && (
                      <HistoryWidget
                        isExpanded={true}
                        onToggleExpand={() => {}}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Empty state */}
            {widgets.length === 0 && (
              <div className="text-center py-8 text-white/40">
                <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No widgets enabled</p>
                <p className="text-sm mt-1">Enable widgets in settings</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}