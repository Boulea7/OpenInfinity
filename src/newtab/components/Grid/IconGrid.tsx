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

/** Logger instance for IconGrid module debug and info messages */
const logger = createLogger('IconGrid');

/**
 * Props for the IconGrid component
 */
interface IconGridProps {
  /** Additional CSS classes to apply to the grid container */
  className?: string;
  /** Callback fired when user clicks the "Add Icon" button */
  onAddIcon?: () => void;
  /** Callback fired when user initiates icon editing (via context menu or edit mode click) */
  onEditIcon?: (_icon: Icon) => void;
  /** Callback fired when user opens a folder; receives the folder and optional DOMRect for animation origin */
  onOpenFolder?: (_folder: Folder, _rect?: DOMRect) => void;
}

/**
 * IconGrid Component
 *
 * A responsive grid layout for displaying desktop icons and folders on the new tab page.
 * This component serves as the main visual interface for organizing and interacting
 * with user-created shortcuts and system icons.
 *
 * Features:
 * - Responsive grid layout with configurable rows and columns
 * - Drag-and-drop reordering powered by @dnd-kit
 * - Multi-page pagination with horizontal swipe/wheel navigation
 * - Folder support with iOS-style merge gesture (drag icon onto another)
 * - Context menus for icons, folders, and background areas
 * - Delete mode with iOS-style shake animation and X buttons
 * - Wallpaper actions (random, favorite, download) via background context menu
 * - Weather icon support with live temperature display
 *
 * Architecture:
 * - Uses Zustand stores for state management (icons, settings, wallpaper)
 * - Implements useFolderMerge hook for folder creation gesture state machine
 * - Renders IconItem and FolderItem components within SortableContext
 * - Supports keyboard navigation and accessibility features
 *
 * Performance Optimizations:
 * - Weather data lifted to parent to avoid N subscriptions in IconItem
 * - Wallpaper state accessed via refs to prevent useMemo rebuilds
 * - useShallow selector to minimize re-renders from store changes
 *
 * @param props - Component props
 * @returns The rendered icon grid with drag-and-drop context
 *
 * @example
 * ```tsx
 * <IconGrid
 *   className="mt-8"
 *   onAddIcon={() => setShowAddModal(true)}
 *   onEditIcon={(icon) => setEditingIcon(icon)}
 *   onOpenFolder={(folder, rect) => openFolderModal(folder, rect)}
 * />
 * ```
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

  // Wallpaper store for background context menu actions.
  // Extract only stable action functions to prevent re-renders from wallpaper state changes.
  const { fetchRandomWallpaper, addToFavorites } = useWallpaperStore(
    useShallow((state) => ({
      fetchRandomWallpaper: state.fetchRandomWallpaper,
      addToFavorites: state.addToFavorites,
    }))
  );

  // P0 Performance Fix: Lift weather subscription to parent component.
  // This prevents N separate subscriptions when N IconItems render, as only
  // the weather system icon actually needs this data.
  const { weather } = useWeather();

  // Performance optimization: Use refs for wallpaper values only needed at click time.
  // This avoids including frequently-changing wallpaper state in useMemo dependencies,
  // which would cause unnecessary rebuilds of the background context menu items.
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

  /** Currently dragged item for DragOverlay rendering */
  const [activeItem, setActiveItem] = useState<GridItem | null>(null);

  // Folder merge state machine - manages the iOS-style folder creation gesture.
  // When dragging an icon over another icon for 500ms, they merge into a new folder.
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

  /** Whether the folder naming modal is visible after successful merge gesture */
  const [showMergeModal, setShowMergeModal] = useState(false);
  /** Information about the pending folder merge (source icon, target icon, position) */
  const [mergeInfo, setMergeInfo] = useState<{
    sourceId: string;
    targetId: string;
    position: { x: number; y: number };
  } | null>(null);

  /** State for item-specific context menu (right-click on icon/folder) */
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    item: GridItem;
  } | null>(null);

  /** State for background context menu (right-click on empty area) */
  const [backgroundContextMenu, setBackgroundContextMenu] = useState<{
    position: { x: number; y: number };
  } | null>(null);

  // Delete animation state: track items currently being deleted.
  // Items in this set show exit animation before actual deletion.
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  /** Duration of delete exit animation in milliseconds (matches CSS transition) */
  const DELETE_ANIMATION_DURATION = 300;

  /** Toast message to display (e.g., "Shortcut hidden") */
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  /** Ref for toast auto-hide timeout to enable cleanup */
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Displays a toast notification message with auto-dismiss after 3 seconds.
   * Clears any existing toast before showing the new one.
   */
  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Cleanup effect: Clear toast timeout on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard handler: ESC key exits delete mode for better UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDeleteMode) {
        exitDeleteMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleteMode, exitDeleteMode]);

  // ============================================================================
  // Page Navigation: Swipe/Wheel Gesture Handling
  // ============================================================================

  /** Touch start position for swipe gesture detection */
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  /** Last wheel event timestamp for throttling */
  const lastWheelTime = useRef(0);
  /** Throttle interval for wheel events to prevent rapid page changes */
  const WHEEL_THROTTLE_MS = 300;
  /** Minimum horizontal distance in pixels to qualify as a swipe */
  const SWIPE_THRESHOLD = 50;
  /** Maximum duration in ms for a gesture to count as a swipe */
  const SWIPE_TIME_THRESHOLD = 300;

  /**
   * Handles horizontal wheel/trackpad scroll for page navigation.
   * Normalizes deltaX across different deltaMode values and throttles events.
   */
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

  /**
   * Records touch start position for swipe gesture detection.
   * Only tracks single-finger touches to avoid interfering with pinch/zoom.
   */
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  }, []);

  /**
   * Detects horizontal swipe gestures on touch end and triggers page navigation.
   * Validates swipe distance, direction (primarily horizontal), and duration.
   */
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

  /** Ref for the main grid container to attach gesture event listeners */
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Effect: Attach wheel and touch event listeners for page navigation gestures.
  // Uses passive: false for wheel to allow preventDefault (required for navigation).
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

  // ============================================================================
  // Drag-and-Drop Configuration (dnd-kit)
  // ============================================================================

  // Configure dnd-kit sensors for multi-input support:
  // - PointerSensor: Desktop mouse/trackpad with 8px activation distance
  // - TouchSensor: Mobile with 200ms long-press to avoid conflicts with scroll
  // - KeyboardSensor: Accessibility support with arrow key navigation
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

  // ============================================================================
  // Grid Layout Calculations
  // ============================================================================

  // Calculate items per page with safety clamps to prevent division by zero
  const safeColumns = Math.max(1, viewSettings.columns || 6);
  const safeRows = Math.max(1, viewSettings.rows || 4);
  /** Total number of items that can fit on one page */
  const itemsPerPage = safeColumns * safeRows;

  /**
   * Computes root-level items (icons not in folders + all folders).
   * Filters out hidden icons and sorts by position in row-major order.
   */
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

  /** Items to display on the current page, sliced from rootItems */
  const pageItems = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    return rootItems.slice(startIndex, startIndex + itemsPerPage);
  }, [rootItems, currentPage, itemsPerPage]);

  /** Array of item IDs for SortableContext (required by dnd-kit) */
  const sortableIds = useMemo(
    () => pageItems.map((item) => item.id),
    [pageItems]
  );

  // ============================================================================
  // Drag-and-Drop Event Handlers
  // ============================================================================

  /**
   * Handles drag start event: stores the active item and initiates merge tracking.
   * Only icon drags can trigger folder merge (not folder drags).
   */
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

  /**
   * Handles drag over event: detects when an icon is hovering over another icon.
   * Updates the folder merge state machine for the iOS-style merge gesture.
   * Only icon-to-icon combinations at root level can trigger merge.
   */
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

  /**
   * Handles drag end event: completes folder merge, folder drop, or reorder.
   * Priority: merge (if 500ms hover completed) > folder drop > position swap.
   */
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

  // ============================================================================
  // Context Menu Handlers
  // ============================================================================

  /**
   * Opens the context menu for a specific icon or folder.
   * Positions the menu at the mouse cursor location.
   */
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

  /** Closes both item and background context menus */
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setBackgroundContextMenu(null);
  }, []);

  /**
   * Handles animated icon deletion with exit animation.
   * Adds item to deletingItems set (triggers CSS animation), then removes after delay.
   * Shows toast notification for system icons to inform about restoration option.
   */
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

  /**
   * Generates context menu items for a given icon or folder.
   * Icons get: Open, Edit (non-system only), Edit Mode, Delete
   * Folders get: Open, Rename, Delete
   */
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

  /**
   * Handles clicks on the grid background (empty area).
   * In delete mode: exits delete mode
   * In normal mode: clears selection if clicking directly on background (not bubbled)
   */
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

  /**
   * Opens the background context menu on right-click.
   * Only shows for non-interactive areas (not icons, folders, or buttons).
   */
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

  /**
   * Background context menu items for wallpaper and general actions.
   * Optimized: wallpaper state is accessed via refs at click time to prevent
   * useMemo rebuilds when wallpaper changes (menu only shown briefly anyway).
   */
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

  /**
   * Confirms folder creation after merge gesture completes.
   * Creates a new folder with the two merged icons and the user-specified name.
   */
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

  /** Icons to preview in the folder naming modal after merge gesture */
  const mergePreviewIcons = mergeInfo
    ? icons.filter(icon => [mergeInfo.sourceId, mergeInfo.targetId].includes(icon.id))
    : [];

  /**
   * Renders the drag overlay content (the item following the cursor during drag).
   * Uses FolderItem or IconItem based on active item type.
   */
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
