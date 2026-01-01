import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeUiLanguage } from '../../../shared/locale';
import { tr } from '../../../shared/tr';
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
import { useWeather } from '../../hooks';
import { useFolderMerge } from '../../hooks/useFolderMerge';
import { IconItem } from '../Icon/IconItem';
import { FolderItem } from '../Icon/FolderItem';
import { FolderNameModal } from '../Icon/FolderNameModal';
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu';
import { cn } from '../../utils';
import { openUrlSafe } from '../../utils/navigation';
import { handleSystemIconClick, isSystemIcon } from '../../utils/systemIconHandlers';
import { exportAllData } from '../../utils/backup';
import { createLogger } from '../../utils/logger';

// Logger instance for IconGrid module
const logger = createLogger('IconGrid');

interface IconGridProps {
  className?: string;
  onAddIcon?: () => void;
  onEditIcon?: (_icon: Icon) => void;
  onOpenFolder?: (_folder: Folder, _rect?: DOMRect) => void;
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
  const { t, i18n } = useTranslation();
  const lang = normalizeUiLanguage(i18n.language);
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

  // P0 Fix: Lift weather subscription here to avoid N subscriptions in IconItem
  // Only the weather system icon needs this data
  const { weather } = useWeather();

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

  // Folder merge state machine (replaces old hover timer refs)
  const {
    state: mergeState,
    startDrag,
    enterTarget,
    leaveTarget,
    confirmMerge,
    cancelDrag,
    isMergeTarget,
    isMergeReady,
  } = useFolderMerge();

  // Merge modal state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeInfo, setMergeInfo] = useState<{
    sourceId: string;
    targetId: string;
    position: { x: number; y: number };
  } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    item: GridItem;
  } | null>(null);

  // Background context menu state
  const [backgroundContextMenu, setBackgroundContextMenu] = useState<{
    position: { x: number; y: number };
  } | null>(null);

  // Delete animation state: track items currently being deleted (for exit animation)
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const DELETE_ANIMATION_DURATION = 300; // ms, matches CSS transition

  // Toast notification state for system icon hiding
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    // Auto-hide after 3 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Cleanup toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

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

  // Get root-level items (icons without folderId + folders, excluding hidden icons)
  const rootItems = useMemo(() => {
    const rootIcons = icons.filter((icon) => !icon.folderId && !icon.isHidden);
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
      // Start merge tracking for icon drags
      if (item.type === 'icon') {
        startDrag(item.id);
      }
    }
  }, [pageItems, startDrag]);

  // Handle drag over - uses useFolderMerge hook for state machine management
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      leaveTarget();
      return;
    }

    const activeItemData = pageItems.find(item => item.id === active.id);
    const overItem = pageItems.find(item => item.id === over.id);

    // Only icon-to-icon merge (both at root level)
    if (
      activeItemData?.type === 'icon' &&
      overItem?.type === 'icon' &&
      !activeItemData.folderId &&
      !overItem.folderId
    ) {
      enterTarget(String(over.id), overItem.position);
    } else {
      leaveTarget();
    }
  }, [pageItems, enterTarget, leaveTarget]);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);

      // Check if merge is ready (500ms hover completed)
      if (isMergeReady) {
        const mergeResult = confirmMerge();
        if (mergeResult && over && String(over.id) === mergeResult.targetId) {
          // Show folder naming modal
          setShowMergeModal(true);
          setMergeInfo(mergeResult);
          return;
        }
      }

      // Cancel merge state if not completing a merge
      cancelDrag();

      if (!over || active.id === over.id) return;

      const overItem = pageItems.find((item) => item.id === over.id);

      // Drop onto folder: add icon to folder
      if (overItem?.type === 'folder' && activeItem?.type === 'icon') {
        await addToFolder(active.id as string, over.id as string);
      } else {
        // Reorder items
        await reorderItems(active.id as string, over.id as string);
      }
    },
    [pageItems, activeItem, addToFolder, reorderItems, isMergeReady, confirmMerge, cancelDrag]
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

  // Handle animated delete: first trigger exit animation, then remove after animation completes
  const handleAnimatedDelete = useCallback((id: string) => {
    // Check if this is a system icon to show appropriate toast
    const icon = icons.find(i => i.id === id);
    const isSystemIconBeingDeleted = icon && isSystemIcon(icon);

    // Add to deleting set to trigger exit animation
    setDeletingItems(prev => new Set(prev).add(id));

    // After animation completes, actually delete the item
    setTimeout(() => {
      void deleteIcon(id).catch(err => {
        console.error('Failed to delete icon:', err);
      });
      // Remove from deleting set
      setDeletingItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Show toast for system icons
      if (isSystemIconBeingDeleted) {
        showToast(tr('快捷方式已隐藏，可在设置 > 系统快捷方式中恢复', 'Shortcut hidden. You can restore it in Settings > System Shortcuts.', lang));
      }
    }, DELETE_ANIMATION_DURATION);
  }, [deleteIcon, DELETE_ANIMATION_DURATION, icons, showToast]);

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
              // System icons use special handler (system:// URLs not safe for openUrlSafe)
              if (isSystemIcon(icon)) {
                handleSystemIconClick(icon);
                return;
              }
              // P1-5: Safe URL check before opening
              const opened = openUrlSafe(icon.url, 'current', openBehavior);
              if (!opened) {
                console.error('Blocked unsafe URL:', icon.url);
              }
            },
          },
          // Hide edit option for system icons - they should not be editable
          ...(!isSystemIcon(icon) ? [{
            id: 'edit',
            label: t('contextMenu.edit', 'Edit'),
            onClick: () => onEditIcon?.(icon),
          }] : []),
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
              // Use animated delete for smooth exit animation
              handleAnimatedDelete(item.id);
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
    [t, onEditIcon, onOpenFolder, handleAnimatedDelete, deleteFolder, openBehavior, enterDeleteMode, closeContextMenu]
  );

  // Handle background click (P0-3: only deselect when clicking background itself)
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // In delete mode, any click that reaches here (not stopped by icon/folder) exits delete mode
    // This works because IconItem and FolderItem call stopPropagation() on their click handlers
    if (isDeleteMode) {
      exitDeleteMode();
      return;
    }

    // In normal mode, only clear selection if clicking the background itself (not bubbled events)
    // This prevents accidental deselection when clicking on grid gaps
    if (e.target === e.currentTarget) {
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
            const response = await fetch(currentUrl, {
              referrerPolicy: 'no-referrer',
              credentials: 'omit',
            });
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
    if (!mergeInfo) return;

    try {
      await createFolderWithIcons(folderName, [mergeInfo.sourceId, mergeInfo.targetId], mergeInfo.position);
      logger.info('Folder created via drag merge:', folderName);
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setMergeInfo(null);
      setShowMergeModal(false);
    }
  }, [mergeInfo, createFolderWithIcons]);

  // Get preview icons for merge modal
  const mergePreviewIcons = mergeInfo
    ? icons.filter(icon => [mergeInfo.sourceId, mergeInfo.targetId].includes(icon.id))
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
        weather={weather}
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
          {/* Grid container with smooth layout transitions */}
          <div
            className="grid gap-4 justify-center mx-auto grid-layout-transition"
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
                    onClick={(folder, rect) => {
                      // P0-3: Stop propagation to prevent background click handler
                      selectItem(folder.id);
                      // Pass rect for iOS-style expand animation origin
                      onOpenFolder?.(folder, rect);
                    }}
                  />
                );
              }

              return (
                <IconItem
                  key={item.id}
                  icon={item as Icon}
                  weather={weather}
                  isSelected={selectedItems.includes(item.id)}
                  isDragging={activeItem?.id === item.id}
                  isDeleteMode={isDeleteMode}
                  isDeleting={deletingItems.has(item.id)}
                  isMergeTarget={isMergeTarget(item.id)}
                  isMergeReady={isMergeTarget(item.id) && isMergeReady}
                  mergeProgress={isMergeTarget(item.id) ? mergeState.progress : 0}
                  onEdit={(icon) => onEditIcon?.(icon)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    // Right-click on icon directly enters edit mode (skip context menu)
                    enterDeleteMode();
                  }}
                  onClick={(icon) => {
                    // In edit mode, clicking icon opens edit sidebar (except system icons)
                    if (isDeleteMode) {
                      // System icons are not editable - do nothing in edit mode
                      if (!isSystemIcon(icon)) {
                        onEditIcon?.(icon);
                      }
                      return;
                    }
                    // Normal mode: select and open URL
                    selectItem(icon.id);
                    const opened = openUrlSafe(icon.url, 'current', openBehavior);
                    if (!opened) {
                      console.error('Blocked unsafe URL:', icon.url);
                    }
                  }}
                  onDelete={handleAnimatedDelete}
                />
              );
            })}

            {/* Add new icon button - LAST item in grid (after all icons) */}
            {/* Wrapper structure matches IconItem for consistent grid alignment */}
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
                <div
                  className={cn(
                    // Match IconItem outer container structure
                    'group relative flex flex-col items-center',
                    'py-2 px-1',
                    'transition-all duration-300 ease-out',
                    'cursor-pointer select-none'
                  )}
                >
                  {/* Inner wrapper matches IconItem structure */}
                  <div className="flex flex-col items-center">
                    {/* Button positioning wrapper */}
                    <div className="relative">
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
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40'
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
                    </div>
                  </div>
                </div>
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

      {/* Toast notification for system icon hiding */}
      {toastMessage && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
            'px-4 py-3 rounded-xl shadow-lg',
            'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
            'text-sm font-medium',
            'animate-in fade-in slide-in-from-bottom-4 duration-300'
          )}
        >
          {toastMessage}
        </div>
      )}

      {/* Folder Name Modal for drag merge */}
      <FolderNameModal
        isOpen={showMergeModal}
        onClose={() => {
          setShowMergeModal(false);
          setMergeInfo(null);
        }}
        onConfirm={handleMergeConfirm}
        previewIcons={mergePreviewIcons}
      />
    </div>
  );
}

export default IconGrid;
