import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { Search, StickyNote } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores';
import { cn } from '../../utils';

interface ViewSwitcherProps {
  className?: string;
}

type ViewMode = 'search' | 'notes';

interface ViewOption {
  id: ViewMode;
  label: string;
  icon: typeof Search;
}

/**
 * ViewSwitcher Component
 * Allows user to switch between search view and notes view
 * Design matches the search type tabs (网页/图片/视频/地图)
 */
export function ViewSwitcher({ className }: ViewSwitcherProps) {
  const { t } = useTranslation();
  const { viewSettings, setViewSettings } = useSettingsStore(
    useShallow((state) => ({
      viewSettings: state.viewSettings,
      setViewSettings: state.setViewSettings,
    }))
  );

  const currentView = viewSettings.currentView;
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const [activeViewIndex, setActiveViewIndex] = useState(0);
  const indicatorBaseWidth = 100; // Base width for scale calculation

  // View options
  const views: ViewOption[] = [
    { id: 'search', label: t('viewSwitcher.search', '搜索'), icon: Search },
    { id: 'notes', label: t('viewSwitcher.notes', '便签'), icon: StickyNote },
  ];

  const viewToIndex: Record<ViewMode, number> = {
    search: 0,
    notes: 1,
  };

  // Sync active index with current view
  useEffect(() => {
    setActiveViewIndex(viewToIndex[currentView] ?? 0);
  }, [currentView]);

  // Update indicator position
  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    const activeButton = buttonRefs.current[activeViewIndex];
    if (!container || !activeButton) {
      setIndicatorStyle({ width: 0, left: 0 });
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setIndicatorStyle({
      width: buttonRect.width,
      left: buttonRect.left - containerRect.left,
    });
  }, [activeViewIndex]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateIndicator);
    };

    window.addEventListener('resize', schedule);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    ro?.observe(container);

    return () => {
      window.removeEventListener('resize', schedule);
      ro?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [updateIndicator]);

  const handleViewChange = (view: ViewMode, index: number) => {
    setActiveViewIndex(index);
    setViewSettings({ currentView: view });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex justify-start gap-1 p-1 rounded-full',
        'bg-white/20 dark:bg-black/10 backdrop-blur-xl',
        'border border-white/20 dark:border-white/5',
        'transition-all duration-300',
        className
      )}
    >
      {/* Animated indicator - exact same as search types */}
      <div
        className="absolute inset-y-1 left-0 bg-black dark:bg-white rounded-full transition-transform duration-300 ease-out"
        style={{
          width: `${indicatorBaseWidth}px`,
          transformOrigin: 'left center',
          transform: `translateX(${indicatorStyle.left}px) scaleX(${indicatorStyle.width ? indicatorStyle.width / indicatorBaseWidth : 0})`,
        }}
        aria-hidden="true"
      />

      {/* View buttons - exact same style as search type buttons */}
      {views.map((view, index) => {
        const isActive = currentView === view.id;
        const Icon = view.icon;
        return (
          <button
            type="button"
            key={view.id}
            onClick={() => handleViewChange(view.id, index)}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/30',
              isActive
                ? 'text-white dark:text-black'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-white/90 dark:hover:text-black/80'
            )}
            aria-pressed={isActive}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
