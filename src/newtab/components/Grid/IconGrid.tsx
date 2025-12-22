import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus,
  Download,
  Heart,
  Image,
  RefreshCw,
  Search,
  Edit3,
  Save,
} from 'lucide-react';
import type { GridItem, Icon, Folder } from '../../services/database';
import { useIconStore, useSettingsStore, useWallpaperStore } from '../../stores';
import { IconItem } from '../Icon/IconItem';
import { FolderItem } from '../Icon/FolderItem';
import { FolderNameModal } from '../Icon/FolderNameModal';
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu';
import { cn } from '../../utils';
import { openUrlSafe } from '../../utils/navigation';
import { exportAllData } from '../../utils/backup';

interface IconGridProps {
  className?: string;
  onAddIcon?: () => void;
  onEditIcon?: (_icon: Icon) => void;
  onOpenFolder?: (_folder: Folder) => void;
}

/**
 * IconGrid Component
 * Renders a grid of icons and folders with drag-and-drop support
 */
export function IconGrid({
  className,
  onAddIcon,
  onEditIcon,
  onOpenFolder,
}: IconGridProps) {
  const { t } = useTranslation();
  const {
    icons,
    folders,
    currentPage,
    selectedItems,
    isDeleteMode,
    reorderItems,
    addToFolder,
    selectItem,
    clearSelection,
    deleteIcon,
    deleteFolder,
    createFolderWithIcons,
    enterDeleteMode,
    exitDeleteMode,
    setCurrentPage,
    getTotalPages,
  } = useIconStore(
    useShallow((state) => ({
      icons: state.icons,
      folders: state.folders,
      currentPage: state.currentPage,
      selectedItems: state.selectedItems,
      isDeleteMode: state.isDeleteMode,
      reorderItems: state.reorderItems,
      addToFolder: state.addToFolder,
      selectItem: state.selectItem,
      clearSelection: state.clearSelection,
      deleteIcon: state.deleteIcon,
      deleteFolder: state.deleteFolder,
      createFolderWithIcons: state.createFolderWithIcons,
      enterDeleteMode: state.enterDeleteMode,
      exitDeleteMode: state.exitDeleteMode,
      setCurrentPage: state.setCurrentPage,
      getTotalPages: state.getTotalPages,
    }))
  );

  const { viewSettings, openBehavior } = useSettingsStore(
    useShallow((state) => ({
      viewSettings: state.viewSettings,
      openBehavior: state.openBehavior,
    }))
  );

  // Wallpaper store for background context menu actions
  // Separate stable functions from frequently-changing state
  const { fetchRandomWallpaper, addToFavorites } = useWallpaperStore(
    useShallow((state) => ({
      fetchRandomWallpaper: state.fetchRandomWallpaper,
      addToFavorites: state.addToFavorites,
    }))
  );

  // Use refs for values only needed at click time to avoid useMemo rebuilds
  type WallpaperState = Pick<
    ReturnType<typeof useWallpaperStore.getState>,
    'currentWallpaper' | 'currentUrl' | 'activeSource'
  >;
  const wallpaperStateRef = useRef<WallpaperState>({
    currentWallpaper: null,
    currentUrl: null,
    activeSource: 'bing',
  });
  // Keep ref in sync with store (without causing re-renders)
  wallpaperStateRef.current = useWallpaperStore.getState();

  // Drag state
  const [activeItem, setActiveItem] = useState<GridItem | null>(null);

  // P1-1: Hover merge state (500ms timer)
  const [hoverTimer, setHoverTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const [pendingMerge, setPendingMerge] = useState<{
    icon1Id: string;
    icon2Id: string;
    position: { x: number; y: number };
  } | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);

  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    item: GridItem;
  } | null>(null);

  // Background context menu state
  const [backgroundContextMenu, setBackgroundContextMenu] = useState<{
    position: { x: number; y: number };
  } | null>(null);

  // ESC key to exit delete mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDeleteMode) {
        exitDeleteMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleteMode, exitDeleteMode]);

  // Swipe/wheel page navigation state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastWheelTime = useRef(0);
  const WHEEL_THROTTLE_MS = 300; // Throttle wheel events to prevent rapid page changes
  const SWIPE_THRESHOLD = 50; // Minimum swipe distance in pixels
  const SWIPE_TIME_THRESHOLD = 300; // Maximum swipe duration in ms

  // Handle horizontal wheel/trackpad scroll for page switching
  const handleWheel = useCallback((e: WheelEvent) => {
    // Avoid triggering page change when scrolling in input/textarea
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    // Normalize deltaX for different deltaMode (lines/pages/pixels)
    const normDeltaX =
      e.deltaMode === 1 ? e.deltaX * 16 : // lines
      e.deltaMode === 2 ? e.deltaX * window.innerWidth : // pages
      e.deltaX; // pixels

    // Only handle horizontal scroll (trackpad two-finger swipe or shift+wheel)
    // deltaX > 0 means scroll right (go to next page)
    // deltaX < 0 means scroll left (go to previous page)
    if (Math.abs(normDeltaX) < Math.abs(e.deltaY) * 0.5) {
      // This is primarily vertical scroll, ignore
      return;
    }

    const now = Date.now();
    if (now - lastWheelTime.current < WHEEL_THROTTLE_MS) {
      return; // Throttle
    }

    const totalPages = getTotalPages();
    if (totalPages <= 1) return;

    // Require a minimum deltaX to trigger page change
    if (Math.abs(normDeltaX) < 30) return;

    e.preventDefault();
    lastWheelTime.current = now;

    if (normDeltaX > 0) {
      // Scroll right -> next page
      setCurrentPage(Math.min(currentPage + 1, totalPages - 1));
    } else {
      // Scroll left -> previous page
      setCurrentPage(Math.max(currentPage - 1, 0));
    }
  }, [currentPage, setCurrentPage, getTotalPages]);

  // Handle touch start for swipe detection
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1) return; // Only single touch
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  }, []);

  // Handle touch end to detect swipe gesture
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    touchStartRef.current = null;

    // Check if this is a horizontal swipe
    if (
      Math.abs(deltaX) > SWIPE_THRESHOLD &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && // Primarily horizontal
      deltaTime < SWIPE_TIME_THRESHOLD
    ) {
      const totalPages = getTotalPages();
      if (totalPages <= 1) return;

      if (deltaX < 0) {
        // Swipe left -> next page
        setCurrentPage(Math.min(currentPage + 1, totalPages - 1));
      } else {
        // Swipe right -> previous page
        setCurrentPage(Math.max(currentPage - 1, 0));
      }
    }
  }, [currentPage, setCurrentPage, getTotalPages]);

  // Grid container ref for event listeners
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Attach wheel and touch event listeners
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    // Use passive: false to allow preventDefault on wheel
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchEnd]);

  // dnd-kit sensors (P1-3: Added TouchSensor for mobile support)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to activate
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Long press 200ms to activate drag
        tolerance: 5, // Movement tolerance during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate items per page (with safety clamp)
  const safeColumns = Math.max(1, viewSettings.columns || 6);
  const safeRows = Math.max(1, viewSettings.rows || 4);
  const itemsPerPage = safeColumns * safeRows;

  // Get root-level items (icons without folderId + folders)
  const rootItems = useMemo(() => {
    const rootIcons = icons.filter((icon) => !icon.folderId);
    const allItems: GridItem[] = [...rootIcons, ...folders];
    // Sort by position (row-major order: y first, then x)
    return allItems.sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });
  }, [icons, folders]);

  // Get items for current page
  const pageItems = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    return rootItems.slice(startIndex, startIndex + itemsPerPage);
  }, [rootItems, currentPage, itemsPerPage]);

  // Sortable item IDs
  const sortableIds = useMemo(
    () => pageItems.map((item) => item.id),
    [pageItems]
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const item = pageItems.find((i) => i.id === active.id);
    if (item) {
      setActiveItem(item);
    }
  }, [pageItems]);

  // Handle drag over (P1-1: 500ms hover merge)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      // Clear timer when not over any item or over itself
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        setHoverTimer(null);
        setHoverTarget(null);
      }
      if (pendingMerge) {
        setPendingMerge(null);
      }
      return;
    }

    const overItem = pageItems.find(item => item.id === over.id);
    const activeItemData = pageItems.find(item => item.id === active.id);

    // P1-1: If dragging icon over another icon (not folder), start merge timer
    if (
      activeItemData?.type === 'icon' &&
      overItem?.type === 'icon' &&
      !activeItemData.folderId && // Only for root-level icons
      !overItem.folderId
    ) {
      const nextHoverTarget = String(over.id);
      if (hoverTarget !== nextHoverTarget) {
        // Clear previous timer
        if (hoverTimer) clearTimeout(hoverTimer);
        if (pendingMerge) setPendingMerge(null);

        // Start new timer
        const timer = setTimeout(() => {
          console.info('Hover merge triggered after 500ms');
          // Set pending merge instead of creating immediately
          setPendingMerge({
            icon1Id: String(active.id),
            icon2Id: String(over.id),
            position: overItem.position,
          });
        }, 500);

        setHoverTimer(timer);
        setHoverTarget(nextHoverTarget);
      }
    } else {
      // Not icon-over-icon case, clear timer
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        setHoverTimer(null);
        setHoverTarget(null);
      }
      if (pendingMerge) {
        setPendingMerge(null);
      }
    }
  }, [pageItems, hoverTimer, hoverTarget, pendingMerge]);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveItem(null);

      // P1-1: Clear hover timer
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        setHoverTimer(null);
        setHoverTarget(null);
      }

      // P1-2: Check if pending merge (hover 500ms completed)
      if (pendingMerge) {
        const activeId = String(active.id);
        const overId = over ? String(over.id) : null;
        const shouldMerge = Boolean(
          overId &&
          pendingMerge.icon1Id === activeId &&
          pendingMerge.icon2Id === overId
        );

        if (shouldMerge) {
          // Show naming modal
          setShowMergeModal(true);
          return;
        }

        // Not dropped on the merge target; clear stale merge intent
        setPendingMerge(null);
      }

      if (!over || active.id === over.id) return;

      // Check if dropping onto a folder
      const overItem = pageItems.find((item) => item.id === over.id);
      if (overItem?.type === 'folder' && activeItem?.type === 'icon') {
        // Add icon to folder
        await addToFolder(active.id as string, over.id as string);
      } else {
        // Reorder items
        await reorderItems(active.id as string, over.id as string);
      }
    },
    [pageItems, activeItem, addToFolder, reorderItems, hoverTimer, pendingMerge]
  );

  // Handle context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, item: GridItem) => {
      e.preventDefault();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        item,
      });
    },
    []
  );

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setBackgroundContextMenu(null);
  }, []);

  // Context menu items
  const getContextMenuItems = useCallback(
    (item: GridItem): ContextMenuItem[] => {
      if (item.type === 'icon') {
        const icon = item as Icon;
        return [
          {
            id: 'open',
            label: t('contextMenu.open', 'Open'),
            onClick: () => {
              // P1-5: Safe URL check before opening
              const opened = openUrlSafe(icon.url, 'current', openBehavior);
              if (!opened) {
                console.error('Blocked unsafe URL:', icon.url);
              }
            },
          },
          {
            id: 'edit',
            label: t('contextMenu.edit', 'Edit'),
            onClick: () => onEditIcon?.(icon),
          },
          {
            id: 'edit-mode',
            label: t('contextMenu.editIcons', '编辑图标'),
            icon: <Edit3 className="w-4 h-4" />,
            onClick: () => {
              enterDeleteMode();
              closeContextMenu();
            },
          },
          { id: 'divider1', label: '', divider: true },
          {
            id: 'delete',
            label: t('contextMenu.delete', 'Delete'),
            danger: true,
            onClick: () => {
              // P1-10: Promise error handling
              void deleteIcon(item.id).catch(err => {
                console.error('Failed to delete icon:', err);
              });
            },
          },
        ];
      }

      // Folder context menu
      return [
        {
          id: 'open',
          label: t('contextMenu.openFolder', 'Open Folder'),
          onClick: () => onOpenFolder?.(item as Folder),
        },
        {
          id: 'rename',
          label: t('contextMenu.rename', 'Rename'),
          onClick: () => {
            // TODO: Implement rename modal
          },
        },
        { id: 'divider1', label: '', divider: true },
        {
          id: 'delete',
          label: t('contextMenu.deleteFolder', 'Delete Folder'),
          danger: true,
          onClick: () => {
            // P1-10: Promise error handling
            void deleteFolder(item.id).catch(err => {
              console.error('Failed to delete folder:', err);
            });
          },
        },
      ];
    },
    [t, onEditIcon, onOpenFolder, deleteIcon, deleteFolder, openBehavior, enterDeleteMode, closeContextMenu]
  );

  // Handle background click (P0-3: only deselect when clicking background itself)
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only clear selection if clicking the background itself, not bubbled events
    if (e.target === e.currentTarget) {
      // In delete mode, clicking background exits delete mode
      if (isDeleteMode) {
        exitDeleteMode();
        return;
      }
      clearSelection();
      closeContextMenu();
    }
  }, [isDeleteMode, exitDeleteMode, clearSelection, closeContextMenu]);

  // Handle background context menu
  const handleBackgroundContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if clicking on an interactive element (icon, folder, or button)
    // If so, let the element's own context menu handler take over
    const isInteractiveElement =
      target.closest('[data-icon-item]') ||
      target.closest('[data-folder-item]') ||
      target.closest('button');

    // Show background menu for any non-interactive area (including grid gaps)
    if (!isInteractiveElement) {
      e.preventDefault();
      setBackgroundContextMenu({
        position: { x: e.clientX, y: e.clientY },
      });
    }
  }, []);

  // Background context menu items
  // Optimized: use refs for wallpaper state to reduce useMemo rebuilds
  // Menu items only depend on stable functions (t, enterDeleteMode, fetchRandomWallpaper, etc.)
  const backgroundMenuItems: ContextMenuItem[] = useMemo(() => [
    {
      id: 'backup',
      label: t('contextMenu.backup', '立即备份'),
      icon: <Save className="w-4 h-4" />,
      onClick: async () => {
        try {
          const data = await exportAllData();
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `openinfinity-backup-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Backup failed:', error);
        }
        closeContextMenu();
      },
    },
    {
      id: 'edit-icons',
      label: t('contextMenu.editIcons', '编辑图标'),
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => {
        enterDeleteMode();
        closeContextMenu();
      },
    },
    { id: 'divider1', label: '', divider: true },
    {
      id: 'random-wallpaper',
      label: t('contextMenu.randomWallpaper', '随机壁纸'),
      icon: <Image className="w-4 h-4" />,
      onClick: () => {
        void fetchRandomWallpaper(); // All sources
        closeContextMenu();
      },
    },
    {
      id: 'favorite-wallpaper',
      label: t('contextMenu.favoriteWallpaper', '收藏当前壁纸'),
      icon: <Heart className="w-4 h-4" />,
      onClick: () => {
        // Read from ref at click time for fresh value
        const { currentWallpaper } = wallpaperStateRef.current;
        if (currentWallpaper) {
          addToFavorites(currentWallpaper);
        }
        closeContextMenu();
      },
      // Note: disabled state is computed at render time, but menu only shows briefly
    },
    {
      id: 'download-wallpaper',
      label: t('contextMenu.downloadWallpaper', '下载当前壁纸'),
      icon: <Download className="w-4 h-4" />,
      onClick: async () => {
        // Read from ref at click time for fresh value
        const { currentUrl } = wallpaperStateRef.current;
        if (currentUrl) {
          let blobUrl: string | null = null;
          try {
            const response = await fetch(currentUrl);
            const blob = await response.blob();
            blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `wallpaper-${Date.now()}.jpg`;
            a.click();
          } catch (error) {
            console.error('Download failed:', error);
          } finally {
            // Always release the blob URL to prevent memory leak
            if (blobUrl) {
              URL.revokeObjectURL(blobUrl);
            }
          }
        }
        closeContextMenu();
      },
    },
    {
      id: 'next-wallpaper',
      label: t('contextMenu.nextWallpaper', '切换到下一张壁纸'),
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: () => {
        // Read from ref at click time for fresh value
        const { activeSource } = wallpaperStateRef.current;
        void fetchRandomWallpaper(activeSource); // Current source only
        closeContextMenu();
      },
    },
    { id: 'divider2', label: '', divider: true },
    {
      id: 'search-icons',
      label: t('contextMenu.searchIcons', '搜索图标'),
      icon: <Search className="w-4 h-4" />,
      shortcut: 'Ctrl+F',
      onClick: () => {
        // Focus the main search input using data attribute
        const searchInput = document.querySelector('input[data-search-input="true"]') as HTMLInputElement;
        searchInput?.focus();
        closeContextMenu();
      },
    },
  ], [t, enterDeleteMode, fetchRandomWallpaper, addToFavorites, closeContextMenu]);

  // Handle folder merge confirmation
  const handleMergeConfirm = useCallback(async (folderName: string) => {
    if (!pendingMerge) return;

    const { icon1Id, icon2Id, position } = pendingMerge;

    try {
      await createFolderWithIcons(folderName, [icon1Id, icon2Id], position);
      console.info('Folder created via hover merge:', folderName);
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setPendingMerge(null);
      setShowMergeModal(false);
    }
  }, [pendingMerge, createFolderWithIcons]);

  // Get preview icons for merge modal
  const mergePreviewIcons = pendingMerge
    ? icons.filter(icon => [pendingMerge.icon1Id, pendingMerge.icon2Id].includes(icon.id))
    : [];

  // Render drag overlay
  const renderOverlay = () => {
    if (!activeItem) return null;

    if (activeItem.type === 'folder') {
      return (
        <FolderItem
          folder={activeItem as Folder}
          isOverlay
        />
      );
    }

    return (
      <IconItem
        icon={activeItem as Icon}
        isOverlay
      />
    );
  };

  return (
    <div
      ref={gridContainerRef}
      className={cn('relative', className)}
      onClick={handleBackgroundClick}
      onContextMenu={handleBackgroundContextMenu}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          {/* Grid container */}
          <div
            className="grid gap-4 justify-center mx-auto transition-all duration-300 ease-out"
            style={{
              gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`,
              // Dynamic width based on columns (Reference: Infinity Pro)
              // 4 cols: ~65%
              // 5 cols: ~75%
              // 6 cols: ~85%
              // 7+ cols: 100%
              maxWidth: safeColumns <= 4 ? '65%'
                : safeColumns === 5 ? '75%'
                  : safeColumns === 6 ? '85%'
                    : '100%',
              width: '100%',
            }}
          >
            {/* Render icons and folders first */}
            {pageItems.map((item) => {
              if (item.type === 'folder') {
                return (
                  <FolderItem
                    key={item.id}
                    folder={item as Folder}
                    isSelected={selectedItems.includes(item.id)}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                    onClick={(folder) => {
                      // P0-3: Stop propagation to prevent background click handler
                      selectItem(folder.id);
                      onOpenFolder?.(folder);
                    }}
                  />
                );
              }

              return (
                <IconItem
                  key={item.id}
                  icon={item as Icon}
                  isSelected={selectedItems.includes(item.id)}
                  isDragging={activeItem?.id === item.id}
                  isDeleteMode={isDeleteMode}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  onClick={(icon) => {
                    // P0-3: Select item (propagation already stopped in IconItem)
                    selectItem(icon.id);
                    const opened = openUrlSafe(icon.url, 'current', openBehavior);
                    if (!opened) {
                      console.error('Blocked unsafe URL:', icon.url);
                    }
                  }}
                  onDelete={(id) => {
                    void deleteIcon(id).catch(err => {
                      console.error('Failed to delete icon:', err);
                    });
                  }}
                />
              );
            })}

            {/* Add new icon button - LAST item in grid (after all icons) */}
            {pageItems.length < itemsPerPage && (() => {
              // Calculate dynamic size for add button to match icons
              // (Duplicated simplified logic from IconItem to ensure visual consistency)
              const { columns, rows, iconScale } = viewSettings;
              const baseSize = 100;
              const colAdjustment = Math.max(0, (columns - 4) * 5);
              const rowAdjustment = Math.max(0, (rows - 3) * 5);
              const densitySize = baseSize - colAdjustment - rowAdjustment;
              const scaleMultiplier = 0.4 + (iconScale / 100) * 0.8;
              const sizePx = Math.min(96, Math.max(48, densitySize * scaleMultiplier));

              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddIcon?.();
                  }}
                  className={cn(
                    'flex items-center justify-center',
                    'rounded-full border-2 border-dashed',
                    'border-white/40 hover:border-white/60',
                    'text-white/50 hover:text-white/80',
                    'transition-all duration-300 ease-out',
                    'hover:bg-white/10 hover:scale-110',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40',
                    'self-center justify-self-center'
                  )}
                  style={{
                    width: `${sizePx}px`,
                    height: `${sizePx}px`,
                    filter: 'drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.2))',
                  }}
                  aria-label={t('iconGrid.addIcon')}
                >
                  <Plus className="w-6 h-6" />
                  <span className="sr-only">{t('iconGrid.addIcon')}</span>
                </button>
              );
            })()}
          </div>
        </SortableContext>

        {/* Drag overlay - follows cursor exactly, no scale adjustment */}
        <DragOverlay adjustScale={false} dropAnimation={null}>
          {renderOverlay()}
        </DragOverlay>
      </DndContext>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          items={getContextMenuItems(contextMenu.item)}
          position={contextMenu.position}
          onClose={closeContextMenu}
        />
      )}

      {/* Background context menu */}
      {backgroundContextMenu && (
        <ContextMenu
          items={backgroundMenuItems}
          position={backgroundContextMenu.position}
          onClose={closeContextMenu}
        />
      )}

      {/* Empty state - intentionally blank, user will see the dashed circle add button */}

      {/* Folder Name Modal for hover merge */}
      <FolderNameModal
        isOpen={showMergeModal}
        onClose={() => {
          setShowMergeModal(false);
          setPendingMerge(null);
        }}
        onConfirm={handleMergeConfirm}
        previewIcons={mergePreviewIcons}
      />
    </div>
  );
}

export default IconGrid;
