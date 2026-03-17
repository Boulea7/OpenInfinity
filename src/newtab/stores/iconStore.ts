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
 * ║  Author: OpenInfinity Contributors                                        ║
 * ║  GitHub: https://github.com/OpenInfinity/OpenInfinity                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Icon Store Module
 *
 * Central state management for desktop icons and folders in the new tab page.
 * This store provides comprehensive CRUD operations, drag-and-drop functionality,
 * pagination, multi-selection, and cross-tab synchronization via BroadcastChannel.
 *
 * Key Features:
 * - Icon and folder CRUD operations with IndexedDB persistence
 * - Drag-and-drop reordering with position recalculation
 * - iOS-style delete mode with wobble animation support
 * - Folder auto-dissolution when only one icon remains
 * - System icon management (hide/restore/sync)
 * - Multi-tab synchronization via BroadcastChannel API
 * - Position-based pagination with dynamic column/row support
 *
 * @module stores/iconStore
 * @see {@link useSettingsStore} for grid configuration (columns, rows)
 * @see {@link database} for IndexedDB schema and operations
 */

import { create } from 'zustand';
import { db, generateId, type Icon, type Folder, type GridItem, type SystemIconId, isValidPosition, ensurePosition, isValidIcon, ensureIcon } from '../services/database';
import { syncIcon, syncFolder, listenForSync, type SyncMessage } from '../utils/sync';
import { useSettingsStore } from './settingsStore';
import {
  hideSystemIcon as hideSystemIconService,
  restoreSystemIcon as restoreSystemIconService,
  reinjectSystemIcon,
  injectSystemIcons,
  hasSystemIcons,
  syncSystemIconTitlesForLanguage,
} from '../services/systemIcons';
import { tr } from '../../shared/tr';
import { getCurrentUiLanguage, type UiLanguage } from '../../shared/locale';

/**
 * Fixed grid columns for folder modal layout.
 * Folders use a consistent 6-column grid regardless of main grid settings.
 * @constant {number}
 */
const FOLDER_GRID_COLUMNS = 6;

/**
 * Fallback grid columns when settings store is unavailable or returns invalid value.
 * This ensures grid calculations never fail due to division by zero.
 * @constant {number}
 */
const DEFAULT_GRID_COLUMNS = 6;

/**
 * Icon Store State Interface
 *
 * Defines the complete state shape for icon and folder management.
 * State is divided into three categories: data, UI state, and loading states.
 *
 * @interface IconState
 */
interface IconState {
  /**
   * Array of all icons stored in the database.
   * Includes both user-created icons and system icons.
   * Icons may be at root level (folderId undefined) or inside folders.
   */
  icons: Icon[];

  /**
   * Array of all folders stored in the database.
   * Folders contain icons referenced by the icon's folderId property.
   */
  folders: Folder[];

  /**
   * Current active page index for pagination (0-based).
   * Used when grid items exceed the visible area.
   */
  currentPage: number;

  /**
   * Array of selected item IDs for multi-selection operations.
   * Can contain both icon and folder IDs.
   */
  selectedItems: string[];

  /**
   * Currently dragged item during drag-and-drop operations.
   * Null when no drag operation is in progress.
   */
  draggedItem: GridItem | null;

  /**
   * Item currently being edited (rename, properties, etc.).
   * Null when no edit dialog is open.
   */
  editingItem: GridItem | null;

  /**
   * iOS-style delete mode flag.
   * When true, icons display wobble animation and delete badges.
   */
  isDeleteMode: boolean;

  /**
   * Loading state flag for async operations.
   * True during initial data fetch or bulk operations.
   */
  isLoading: boolean;

  /**
   * Error message from the last failed operation.
   * Null when no error has occurred.
   */
  error: string | null;
}

/**
 * Icon Store Actions Interface
 *
 * Defines all available operations for icon and folder management.
 * Actions are grouped by functionality: data loading, CRUD, batch ops,
 * drag-and-drop, selection, pagination, and system icon management.
 *
 * @interface IconActions
 */
interface IconActions {
  // ═══════════════════════════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Loads all icons and folders from IndexedDB into the store.
   * Performs defensive normalization to fix corrupted or migrated data.
   * @returns Promise that resolves when loading is complete
   */
  loadIcons: () => Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Icon CRUD Operations
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Creates a new icon with auto-generated ID and position.
   * @param icon - Icon data without auto-generated fields
   * @returns Promise resolving to the new icon's ID
   */
  addIcon: (icon: Omit<Icon, 'id' | 'type' | 'position' | 'createdAt' | 'updatedAt'>) => Promise<string>;

  /**
   * Updates an existing icon with partial data.
   * @param id - Icon ID to update
   * @param updates - Partial icon data to merge
   */
  updateIcon: (id: string, updates: Partial<Icon>) => Promise<void>;

  /**
   * Deletes an icon by ID. System icons are hidden instead of deleted.
   * @param id - Icon ID to delete
   */
  deleteIcon: (id: string) => Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Folder CRUD Operations
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Creates a new folder with the given name.
   * @param name - Folder display name
   * @param position - Optional grid position; auto-calculated if not provided
   * @returns Promise resolving to the new folder's ID
   */
  addFolder: (name: string, position?: { x: number; y: number }) => Promise<string>;

  /**
   * Updates an existing folder with partial data.
   * @param id - Folder ID to update
   * @param updates - Partial folder data to merge
   */
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;

  /**
   * Deletes a folder and moves its contents to root level.
   * Child icons are repositioned to maintain grid layout.
   * @param id - Folder ID to delete
   */
  deleteFolder: (id: string) => Promise<void>;

  /**
   * Moves an icon into a folder.
   * @param iconId - Icon ID to move
   * @param folderId - Target folder ID
   */
  addToFolder: (iconId: string, folderId: string) => Promise<void>;

  /**
   * Removes an icon from its folder back to root level.
   * Triggers auto-dissolve check if folder has only one icon remaining.
   * @param iconId - Icon ID to remove from folder
   */
  removeFromFolder: (iconId: string) => Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Batch Operations
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Deletes all currently selected items (icons and folders).
   * System icons are hidden instead of deleted.
   */
  deleteSelected: () => Promise<void>;

  /**
   * Moves multiple items into a target folder.
   * Only icons are moved; folders cannot be nested.
   * @param itemIds - Array of icon IDs to move
   * @param folderId - Target folder ID
   */
  moveToFolder: (itemIds: string[], folderId: string) => Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Drag and Drop
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sets the currently dragged item for visual feedback.
   * @param item - The dragged grid item, or null when drag ends
   */
  setDraggedItem: (item: GridItem | null) => void;

  /**
   * Reorders root-level items by swapping positions.
   * Recalculates all positions based on visual order.
   * @param activeId - ID of the dragged item
   * @param overId - ID of the drop target item
   */
  reorderItems: (activeId: string, overId: string) => Promise<void>;

  /**
   * Reorders icons within a folder.
   * Uses folder-specific grid layout (FOLDER_GRID_COLUMNS).
   * @param folderId - Parent folder ID
   * @param activeId - ID of the dragged icon
   * @param overId - ID of the drop target icon
   */
  reorderFolderIcons: (folderId: string, activeId: string, overId: string) => Promise<void>;

  /**
   * Creates a new folder containing the specified icons.
   * Used for drag-and-drop merge operations.
   * @param name - Folder name
   * @param iconIds - Array of icon IDs to include
   * @param position - Optional grid position for the folder
   * @returns Promise resolving to the new folder's ID
   */
  createFolderWithIcons: (name: string, iconIds: string[], position?: { x: number; y: number }) => Promise<string>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Selects or toggles selection of an item.
   * @param id - Item ID to select
   * @param multi - If true, toggles selection; if false, replaces selection
   */
  selectItem: (id: string, multi?: boolean) => void;

  /**
   * Clears all selected items.
   */
  clearSelection: () => void;

  // ═══════════════════════════════════════════════════════════════════════════
  // Pagination
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sets the current page index with bounds checking.
   * @param page - Target page index (0-based)
   */
  setCurrentPage: (page: number) => void;

  /**
   * Calculates total number of pages based on visible items and grid size.
   * @returns Total page count (minimum 1)
   */
  getTotalPages: () => number;

  // ═══════════════════════════════════════════════════════════════════════════
  // Edit Mode
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sets the item currently being edited.
   * @param item - Item to edit, or null to close edit dialog
   */
  setEditingItem: (item: GridItem | null) => void;

  // ═══════════════════════════════════════════════════════════════════════════
  // Delete Mode (iOS-style)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enters iOS-style delete mode with wobble animation.
   * Clears current selection when entering.
   */
  enterDeleteMode: () => void;

  /**
   * Exits delete mode, stopping wobble animation.
   */
  exitDeleteMode: () => void;

  // ═══════════════════════════════════════════════════════════════════════════
  // System Icons
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Hides a system icon without deleting it.
   * Icon can be restored later via settings.
   * @param iconId - System icon identifier
   */
  hideSystemIcon: (iconId: SystemIconId) => Promise<void>;

  /**
   * Restores a previously hidden system icon.
   * Reinjects the icon if it was deleted from database.
   * @param iconId - System icon identifier
   */
  restoreSystemIcon: (iconId: SystemIconId) => Promise<void>;

  /**
   * Initializes system icons on first load.
   * Injects default icons if not already present in database.
   */
  initializeSystemIcons: () => Promise<void>;

  /**
   * Syncs system icon titles with the current UI language.
   * Updates both database and local state for real-time reactivity.
   * @param lang - Target UI language code
   */
  syncSystemIcons: (lang: UiLanguage) => Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Folder Utilities
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generates a unique folder name by checking existing names.
   * Appends incrementing numbers if base name exists: Folder, Folder1, Folder2, etc.
   * @param baseName - Optional base name (defaults to localized "Folder")
   * @returns Unique folder name string
   */
  generateUniqueFolderName: (baseName?: string) => string;

  /**
   * Checks if a folder has only one icon and auto-dissolves it.
   * The single icon inherits the folder's position.
   * @param folderId - Folder ID to check
   */
  checkAndDissolveFolder: (folderId: string) => Promise<void>;

  /**
   * Creates a folder with auto-generated unique name.
   * Convenience method for drag-and-drop merge operations.
   * @param iconIds - Array of icon IDs to include
   * @param position - Grid position for the new folder
   * @returns Promise resolving to the new folder's ID
   */
  createFolderWithAutoName: (iconIds: string[], position: { x: number; y: number }) => Promise<string>;
}

/**
 * Calculates the next available grid position for a new item.
 *
 * Scans all visible root-level items to find the last occupied position,
 * then returns the next position in row-major order. If the last row is full,
 * starts a new row.
 *
 * @param icons - Array of all icons in the store
 * @param folders - Array of all folders in the store
 * @returns Grid position object with x (column) and y (row) coordinates
 *
 * @example
 * ```ts
 * // With 6 columns and items at positions (0,0), (1,0), (2,0)
 * const nextPos = getNextPosition(icons, folders);
 * // Returns { x: 3, y: 0 }
 *
 * // When last row is full (items at 0-5 in row 0)
 * const nextPos = getNextPosition(icons, folders);
 * // Returns { x: 0, y: 1 }
 * ```
 *
 * @remarks
 * - Reads column count from settingsStore for dynamic grid support
 * - Excludes hidden icons from position calculation
 * - Clamps column count to minimum 1 to prevent division errors
 */
function getNextPosition(
  icons: Icon[],
  folders: Folder[]
): { x: number; y: number } {
  // Clamp to minimum 1 to prevent division issues
  const columns = Math.max(1, useSettingsStore.getState().viewSettings.columns || DEFAULT_GRID_COLUMNS);

  // Exclude hidden icons from position calculation
  const rootIcons = icons.filter(i => !i.folderId && !i.isHidden);
  const allItems = [...rootIcons, ...folders];

  // Empty grid starts at origin
  if (allItems.length === 0) {
    return { x: 0, y: 0 };
  }

  // Find max y, then find max x in that row
  const maxY = Math.max(...allItems.map(item => item.position.y));
  const itemsInLastRow = allItems.filter(item => item.position.y === maxY);
  const maxX = Math.max(...itemsInLastRow.map(item => item.position.x));

  // If last row is full, start new row
  if (maxX >= columns - 1) {
    return { x: 0, y: maxY + 1 };
  }

  return { x: maxX + 1, y: maxY };
}

/**
 * Sorts grid items by position in row-major order.
 *
 * Items are sorted first by row (y coordinate), then by column (x coordinate)
 * within the same row. This matches the visual layout order on screen.
 *
 * @param items - Array of grid items to sort
 * @returns New sorted array (original array is not mutated)
 *
 * @example
 * ```ts
 * const items = [
 *   { id: 'a', position: { x: 2, y: 0 } },
 *   { id: 'b', position: { x: 0, y: 1 } },
 *   { id: 'c', position: { x: 0, y: 0 } },
 * ];
 * const sorted = sortByPosition(items);
 * // Returns: [{ id: 'c', ... }, { id: 'a', ... }, { id: 'b', ... }]
 * ```
 */
function sortByPosition(items: GridItem[]): GridItem[] {
  return [...items].sort((a, b) => {
    // Primary sort by row (y)
    if (a.position.y !== b.position.y) {
      return a.position.y - b.position.y;
    }
    // Secondary sort by column (x) within same row
    return a.position.x - b.position.x;
  });
}

/**
 * Icon and Folder Management Store
 *
 * Zustand store for managing desktop icons and folders in OpenInfinity.
 * Provides reactive state updates and comprehensive CRUD operations with
 * IndexedDB persistence and cross-tab synchronization.
 *
 * @example
 * ```tsx
 * // In a React component
 * import { useIconStore } from '@/stores/iconStore';
 *
 * function IconGrid() {
 *   const { icons, folders, loadIcons, addIcon } = useIconStore();
 *
 *   useEffect(() => {
 *     loadIcons();
 *   }, []);
 *
 *   const handleAddIcon = async () => {
 *     await addIcon({
 *       title: 'GitHub',
 *       url: 'https://github.com',
 *       icon: { type: 'favicon', value: 'https://github.com/favicon.ico' }
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {icons.map(icon => <IconItem key={icon.id} icon={icon} />)}
 *       {folders.map(folder => <FolderItem key={folder.id} folder={folder} />)}
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link IconState} for state shape
 * @see {@link IconActions} for available actions
 */
export const useIconStore = create<IconState & IconActions>((set, get) => ({
  // ═══════════════════════════════════════════════════════════════════════════
  // Initial State
  // ═══════════════════════════════════════════════════════════════════════════
  icons: [],
  folders: [],
  currentPage: 0,
  selectedItems: [],
  draggedItem: null,
  editingItem: null,
  isDeleteMode: false,
  isLoading: false,
  error: null,

  // ═══════════════════════════════════════════════════════════════════════════
  // Data Loading
  // ═══════════════════════════════════════════════════════════════════════════

  loadIcons: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch icons and folders in parallel for better performance
      const [rawIcons, rawFolders] = await Promise.all([
        db.icons.toArray(),
        db.folders.toArray(),
      ]);

      // Defensive normalization: fix corrupted or migrated data
      // This handles cases where position or icon structure is invalid
      const icons = rawIcons.map((icon, index) => {
        // Validate and fix position if needed
        if (!isValidPosition(icon.position)) {
          console.warn(`Fixing invalid position for icon ${icon.id}:`, icon.position);
          return {
            ...icon,
            position: ensurePosition(icon.position, 6, index),
          };
        }

        // Validate and fix icon structure if needed
        if (!isValidIcon(icon.icon)) {
          console.warn(`Fixing invalid icon structure for ${icon.id}:`, icon.icon);
          return {
            ...icon,
            icon: ensureIcon(icon.icon, icon.title),
          };
        }

        return icon;
      });

      const folders = rawFolders.map((folder, index) => {
        if (!isValidPosition(folder.position)) {
          console.warn(`Fixing invalid position for folder ${folder.id}:`, folder.position);
          return {
            ...folder,
            position: ensurePosition(folder.position, 6, icons.length + index),
          };
        }
        return folder;
      });

      // Sort by position (keeping separate types)
      const sortedIcons = [...icons].sort((a, b) => {
        if (a.position.y !== b.position.y) {
          return a.position.y - b.position.y;
        }
        return a.position.x - b.position.x;
      });

      const sortedFolders = [...folders].sort((a, b) => {
        if (a.position.y !== b.position.y) {
          return a.position.y - b.position.y;
        }
        return a.position.x - b.position.x;
      });

      set({
        icons: sortedIcons,
        folders: sortedFolders,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load icons',
        isLoading: false,
      });
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Icon CRUD Operations
  // ═══════════════════════════════════════════════════════════════════════════

  addIcon: async (iconData) => {
    const { icons, folders } = get();
    const now = Date.now();

    // Auto-calculate position at the next available grid slot
    const position = getNextPosition(icons, folders);

    const newIcon: Icon = {
      ...iconData,
      id: generateId(),
      type: 'icon',
      position,
      createdAt: now,
      updatedAt: now,
    };

    // Persist to IndexedDB
    await db.icons.add(newIcon);

    // Update local state
    set(state => ({ icons: [...state.icons, newIcon] }));

    // Broadcast to other tabs for cross-tab synchronization
    syncIcon.added(newIcon);

    return newIcon.id;
  },

  updateIcon: async (id, updates) => {
    // Always update the timestamp when modifying
    const updatedData = { ...updates, updatedAt: Date.now() };

    // Persist to IndexedDB
    await db.icons.update(id, updatedData);

    // Update local state
    set(state => ({
      icons: state.icons.map(icon =>
        icon.id === id ? { ...icon, ...updatedData } : icon
      ),
    }));

    // Broadcast to other tabs
    syncIcon.updated({ id, ...updatedData });
  },

  deleteIcon: async (id) => {
    const { icons, checkAndDissolveFolder } = get();
    const icon = icons.find(i => i.id === id);

    // System icons are hidden instead of deleted to allow restoration
    if (icon?.isSystemIcon && icon.systemIconId) {
      await get().hideSystemIcon(icon.systemIconId);
      return;
    }

    // Remember the folder ID before deletion for auto-dissolve check
    const originalFolderId = icon?.folderId;

    // Persist to IndexedDB
    await db.icons.delete(id);

    // Update local state and clear from selection
    set(state => ({
      icons: state.icons.filter(icon => icon.id !== id),
      selectedItems: state.selectedItems.filter(itemId => itemId !== id),
    }));

    // Broadcast to other tabs
    syncIcon.deleted(id);

    // Auto-dissolve folder if only 1 icon remains after deletion
    if (originalFolderId) {
      await checkAndDissolveFolder(originalFolderId);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Folder CRUD Operations
  // ═══════════════════════════════════════════════════════════════════════════

  addFolder: async (name, position) => {
    const { icons, folders } = get();
    const now = Date.now();

    // Use provided position or auto-calculate next available slot
    const finalPosition = position || getNextPosition(icons, folders);

    const newFolder: Folder = {
      id: generateId(),
      type: 'folder',
      name,
      position: finalPosition,
      createdAt: now,
      updatedAt: now,
    };

    await db.folders.add(newFolder);

    set(state => ({ folders: [...state.folders, newFolder] }));

    // Broadcast to other tabs
    syncFolder.added(newFolder);

    return newFolder.id;
  },

  updateFolder: async (id, updates) => {
    // Always update the timestamp when modifying
    const updatedData = { ...updates, updatedAt: Date.now() };

    // Persist to IndexedDB
    await db.folders.update(id, updatedData);

    // Update local state
    set(state => ({
      folders: state.folders.map(folder =>
        folder.id === id ? { ...folder, ...updatedData } : folder
      ),
    }));

    // Broadcast to other tabs
    syncFolder.updated({ id, ...updatedData });
  },

  deleteFolder: async (id) => {
    const { folders, icons } = get();
    const folder = folders.find(f => f.id === id);

    if (folder) {
      // Use database transaction for atomic cross-table updates
      // This ensures data consistency if the operation is interrupted
      await db.transaction('rw', [db.icons, db.folders], async () => {
        // Move all children icons back to root with recalculated positions
        const childIcons = icons.filter(icon => icon.folderId === id);

        if (childIcons.length > 0) {
          // Calculate new positions for displaced icons
          // Get current root items (excluding the folder being deleted and hidden icons)
          const rootIcons = icons.filter(i => !i.folderId && !i.isHidden);
          const otherFolders = folders.filter(f => f.id !== id);
          const existingRootItems = [...rootIcons, ...otherFolders];

          // Read columns from settings for proper grid layout
          const columns = Math.max(1, useSettingsStore.getState().viewSettings.columns || DEFAULT_GRID_COLUMNS);

          // Find the next available position after all existing root items
          let nextPosition = { x: 0, y: 0 };
          if (existingRootItems.length > 0) {
            const maxY = Math.max(...existingRootItems.map(item => item.position.y));
            const itemsInLastRow = existingRootItems.filter(item => item.position.y === maxY);
            const maxX = Math.max(...itemsInLastRow.map(item => item.position.x));

            if (maxX >= columns - 1) {
              nextPosition = { x: 0, y: maxY + 1 };
            } else {
              nextPosition = { x: maxX + 1, y: maxY };
            }
          }

          // Assign new positions to each displaced icon
          const now = Date.now();
          for (let i = 0; i < childIcons.length; i++) {
            const x = (nextPosition.x + i) % columns;
            const y = nextPosition.y + Math.floor((nextPosition.x + i) / columns);
            await db.icons.update(childIcons[i].id, {
              folderId: undefined,
              position: { x, y },
              updatedAt: now,
            });
          }
        }

        // Delete the folder
        await db.folders.delete(id);
      });

      // Update local state with recalculated positions
      const columns = Math.max(1, useSettingsStore.getState().viewSettings.columns || DEFAULT_GRID_COLUMNS);
      const childIcons = icons.filter(icon => icon.folderId === id);
      // Exclude hidden icons from position calculation
      const rootIcons = icons.filter(i => !i.folderId && !i.isHidden);
      const otherFolders = folders.filter(f => f.id !== id);
      const existingRootItems = [...rootIcons, ...otherFolders];

      let nextPosition = { x: 0, y: 0 };
      if (existingRootItems.length > 0) {
        const maxY = Math.max(...existingRootItems.map(item => item.position.y));
        const itemsInLastRow = existingRootItems.filter(item => item.position.y === maxY);
        const maxX = Math.max(...itemsInLastRow.map(item => item.position.x));
        nextPosition = maxX >= columns - 1 ? { x: 0, y: maxY + 1 } : { x: maxX + 1, y: maxY };
      }

      set(state => ({
        folders: state.folders.filter(f => f.id !== id),
        icons: state.icons.map((icon) => {
          if (icon.folderId !== id) return icon;
          // Find this icon's index among child icons
          const childIndex = childIcons.findIndex(c => c.id === icon.id);
          const x = (nextPosition.x + childIndex) % columns;
          const y = nextPosition.y + Math.floor((nextPosition.x + childIndex) / columns);
          return { ...icon, folderId: undefined, position: { x, y } };
        }),
        selectedItems: state.selectedItems.filter(itemId => itemId !== id),
      }));

      // Broadcast to other tabs
      syncFolder.deleted(id);
    }
  },

  addToFolder: async (iconId, folderId) => {
    // Using icon.folderId as single source of truth for folder membership
    // This simplifies data model and avoids synchronization issues
    await db.icons.update(iconId, { folderId, updatedAt: Date.now() });

    // Update local state
    set(state => ({
      icons: state.icons.map(icon =>
        icon.id === iconId ? { ...icon, folderId } : icon
      ),
    }));

    // Broadcast to other tabs
    syncIcon.updated({ id: iconId, folderId });
  },

  removeFromFolder: async (iconId) => {
    const { icons, checkAndDissolveFolder } = get();

    // Get the original folder ID before removing for auto-dissolve check
    const icon = icons.find(i => i.id === iconId);
    const originalFolderId = icon?.folderId;

    // Clear folder reference
    await db.icons.update(iconId, { folderId: undefined, updatedAt: Date.now() });

    // Update local state
    set(state => ({
      icons: state.icons.map(icon =>
        icon.id === iconId ? { ...icon, folderId: undefined } : icon
      ),
    }));

    // Broadcast to other tabs
    syncIcon.updated({ id: iconId, folderId: undefined });

    // Auto-dissolve folder if only 1 icon remains
    if (originalFolderId) {
      await checkAndDissolveFolder(originalFolderId);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Batch Operations
  // ═══════════════════════════════════════════════════════════════════════════

  deleteSelected: async () => {
    const { selectedItems, icons, folders } = get();

    // Separate icons and folders
    const allIconIds = selectedItems.filter(id =>
      icons.some(icon => icon.id === id)
    );
    const folderIds = selectedItems.filter(id =>
      folders.some(folder => folder.id === id)
    );

    // Separate system icons from regular icons
    const systemIcons = icons.filter(
      icon => allIconIds.includes(icon.id) && icon.isSystemIcon && icon.systemIconId
    );
    const regularIconIds = allIconIds.filter(
      id => !systemIcons.some(si => si.id === id)
    );

    // Hide system icons instead of deleting
    for (const sysIcon of systemIcons) {
      if (sysIcon.systemIconId) {
        await get().hideSystemIcon(sysIcon.systemIconId);
      }
    }

    // P2 Fix: Use transaction for cross-table updates
    await db.transaction('rw', [db.icons, db.folders], async () => {
      // Delete regular icons only
      if (regularIconIds.length > 0) {
        await db.icons.bulkDelete(regularIconIds);
      }

      // Delete folders (and move their children to root with recalculated positions)
      if (folderIds.length > 0) {
        // Get all child icons from folders being deleted
        const allDisplacedIcons = icons.filter(
          icon => icon.folderId && folderIds.includes(icon.folderId)
        );

        if (allDisplacedIcons.length > 0) {
          // Calculate new positions for displaced icons
          // Exclude hidden icons from position calculation
          const rootIcons = icons.filter(i => !i.folderId && !i.isHidden && !regularIconIds.includes(i.id));
          const remainingFolders = folders.filter(f => !folderIds.includes(f.id));
          const existingRootItems = [...rootIcons, ...remainingFolders];

          const columns = Math.max(1, useSettingsStore.getState().viewSettings.columns || DEFAULT_GRID_COLUMNS);

          let nextPosition = { x: 0, y: 0 };
          if (existingRootItems.length > 0) {
            const maxY = Math.max(...existingRootItems.map(item => item.position.y));
            const itemsInLastRow = existingRootItems.filter(item => item.position.y === maxY);
            const maxX = Math.max(...itemsInLastRow.map(item => item.position.x));
            nextPosition = maxX >= columns - 1 ? { x: 0, y: maxY + 1 } : { x: maxX + 1, y: maxY };
          }

          const now = Date.now();
          for (let i = 0; i < allDisplacedIcons.length; i++) {
            const x = (nextPosition.x + i) % columns;
            const y = nextPosition.y + Math.floor((nextPosition.x + i) / columns);
            await db.icons.update(allDisplacedIcons[i].id, {
              folderId: undefined,
              position: { x, y },
              updatedAt: now,
            });
          }
        }

        await db.folders.bulkDelete(folderIds);
      }
    });

    set(state => ({
      icons: state.icons
        .filter(icon => !regularIconIds.includes(icon.id))
        .map(icon =>
          folderIds.includes(icon.folderId || '')
            ? { ...icon, folderId: undefined }
            : icon
        ),
      folders: state.folders.filter(folder => !folderIds.includes(folder.id)),
      selectedItems: [],
    }));
  },

  moveToFolder: async (itemIds, folderId) => {
    const { icons, folders } = get();
    const folder = folders.find(f => f.id === folderId);

    if (!folder) return;

    // Only move icons, not folders
    const iconsToMove = icons.filter(
      icon => itemIds.includes(icon.id) && icon.type === 'icon'
    );

    await Promise.all(
      iconsToMove.map(icon => db.icons.update(icon.id, { folderId, updatedAt: Date.now() }))
    );

    set(state => ({
      icons: state.icons.map(icon =>
        itemIds.includes(icon.id) ? { ...icon, folderId } : icon
      ),
      selectedItems: [],
    }));

    // Broadcast to other tabs
    iconsToMove.forEach(icon => syncIcon.updated({ id: icon.id, folderId }));
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Drag and Drop
  // ═══════════════════════════════════════════════════════════════════════════

  setDraggedItem: item => {
    set({ draggedItem: item });
  },

  reorderItems: async (activeId, overId) => {
    const { icons, folders } = get();

    // Find root items only (exclude hidden icons to prevent position jumping)
    // Sort by position to maintain visual order
    const allItems: GridItem[] = sortByPosition([
      ...icons.filter(i => !i.folderId && !i.isHidden),
      ...folders,
    ]);

    const activeIndex = allItems.findIndex(item => item.id === activeId);
    const overIndex = allItems.findIndex(item => item.id === overId);

    // Validate both items exist
    if (activeIndex === -1 || overIndex === -1) return;

    // Perform the reorder: remove from old position, insert at new position
    const reordered = [...allItems];
    const [moved] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, moved);

    // Read columns from settingsStore (clamp to min 1 for safety)
    const columns = Math.max(1, useSettingsStore.getState().viewSettings.columns || DEFAULT_GRID_COLUMNS);

    // Recalculate positions based on new visual order
    // Position is calculated as (index % columns, floor(index / columns))
    const updates = reordered.map((item, index) => ({
      ...item,
      position: {
        x: index % columns,
        y: Math.floor(index / columns),
      },
    }));

    // Separate icons and folders for database updates
    const iconUpdates = updates.filter(item => item.type === 'icon') as Icon[];
    const folderUpdates = updates.filter(item => item.type === 'folder') as Folder[];

    // Use transaction for atomic cross-table updates
    await db.transaction('rw', [db.icons, db.folders], async () => {
      const now = Date.now();
      for (const icon of iconUpdates) {
        await db.icons.update(icon.id, { position: icon.position, updatedAt: now });
      }
      for (const folder of folderUpdates) {
        await db.folders.update(folder.id, { position: folder.position, updatedAt: now });
      }
    });

    set(state => ({
      icons: state.icons.map(icon => {
        const updated = iconUpdates.find(u => u.id === icon.id);
        return updated ? { ...icon, position: updated.position } : icon;
      }),
      folders: state.folders.map(folder => {
        const updated = folderUpdates.find(u => u.id === folder.id);
        return updated ? { ...folder, position: updated.position } : folder;
      }),
    }));

    // Broadcast reorder to other tabs for synchronization
    iconUpdates.forEach(icon => syncIcon.updated({ id: icon.id, position: icon.position }));
    folderUpdates.forEach(folder => syncFolder.updated({ id: folder.id, position: folder.position }));
  },

  reorderFolderIcons: async (folderId, activeId, overId) => {
    const { icons } = get();

    // Get icons in this folder only, sorted by current position
    const folderIcons = sortByPosition(icons.filter(i => i.folderId === folderId));

    const activeIndex = folderIcons.findIndex(i => i.id === activeId);
    const overIndex = folderIcons.findIndex(i => i.id === overId);

    // Validate both items exist
    if (activeIndex === -1 || overIndex === -1) return;

    // Perform the reorder within folder
    const reordered = [...folderIcons];
    const [moved] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, moved);

    // Recalculate positions within folder using fixed FOLDER_GRID_COLUMNS
    // Folders always use a 6-column layout regardless of main grid settings
    const updates = reordered.map((icon, index) => ({
      ...icon,
      position: {
        x: index % FOLDER_GRID_COLUMNS,
        y: Math.floor(index / FOLDER_GRID_COLUMNS),
      },
    }));

    // Persist to database
    await db.transaction('rw', db.icons, async () => {
      for (const icon of updates) {
        await db.icons.update(icon.id, { position: icon.position, updatedAt: Date.now() });
      }
    });

    set(state => ({
      icons: state.icons.map(icon => {
        const updated = updates.find(u => u.id === icon.id);
        return updated ? { ...icon, position: updated.position } : icon;
      }),
    }));

    // Broadcast to other tabs
    updates.forEach(icon => syncIcon.updated({ id: icon.id, position: icon.position }));
  },

  createFolderWithIcons: async (name, iconIds, position) => {
    // Create folder at specified or auto-calculated position
    const folderId = await get().addFolder(name, position);

    // Move all specified icons into the new folder
    await Promise.all(
      iconIds.map(iconId =>
        db.icons.update(iconId, { folderId, updatedAt: Date.now() })
      )
    );

    // Update local state to reflect folder membership
    set(state => ({
      icons: state.icons.map(icon =>
        iconIds.includes(icon.id) ? { ...icon, folderId } : icon
      ),
    }));

    return folderId;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════════════════════════

  selectItem: (id, multi = false) => {
    set(state => {
      if (multi) {
        // Multi-select mode: toggle the item's selection state
        const isSelected = state.selectedItems.includes(id);
        return {
          selectedItems: isSelected
            ? state.selectedItems.filter(itemId => itemId !== id)
            : [...state.selectedItems, id],
        };
      }
      // Single-select mode: replace selection with just this item
      return { selectedItems: [id] };
    });
  },

  clearSelection: () => {
    set({ selectedItems: [] });
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Pagination
  // ═══════════════════════════════════════════════════════════════════════════

  setCurrentPage: page => {
    // Clamp page to valid range [0, totalPages - 1]
    const totalPages = get().getTotalPages();
    set({ currentPage: Math.max(0, Math.min(page, totalPages - 1)) });
  },

  getTotalPages: () => {
    const { icons, folders } = get();
    const settingsStore = useSettingsStore.getState();
    const { columns, rows } = settingsStore.viewSettings;

    // Clamp to minimum 1 to prevent NaN/Infinity from division by zero
    const safeColumns = Math.max(1, columns || DEFAULT_GRID_COLUMNS);
    const safeRows = Math.max(1, rows || 4); // 4 rows is a reasonable default
    const itemsPerPage = safeColumns * safeRows;

    // Only count visible root level items (exclude hidden icons)
    const visibleRootIcons = icons.filter(icon => !icon.folderId && !icon.isHidden);
    const totalItems = visibleRootIcons.length + folders.length;

    // Ensure at least 1 page even when empty
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Edit Mode
  // ═══════════════════════════════════════════════════════════════════════════

  setEditingItem: item => {
    set({ editingItem: item });
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Delete Mode (iOS-style)
  // ═══════════════════════════════════════════════════════════════════════════

  enterDeleteMode: () => {
    // Clear selection when entering delete mode to prevent accidental deletions
    set({ isDeleteMode: true, selectedItems: [] });
  },

  exitDeleteMode: () => {
    set({ isDeleteMode: false });
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // System Icons
  // ═══════════════════════════════════════════════════════════════════════════

  hideSystemIcon: async (iconId: SystemIconId) => {
    // Persist hide state to database
    await hideSystemIconService(iconId);

    // Update local state: mark as hidden and save original position for restoration
    set(state => ({
      icons: state.icons.map(icon =>
        icon.systemIconId === iconId
          ? {
              ...icon,
              isHidden: true,
              originalPosition: icon.position,
              originalFolderId: icon.folderId,
              folderId: undefined,
            }
          : icon
      ),
      selectedItems: state.selectedItems.filter(id => id !== iconId),
    }));

    // Sync visibility to settings store for UI consistency
    const { systemIconSettings, setSystemIconSettings } = useSettingsStore.getState();
    setSystemIconSettings({
      visibility: {
        ...systemIconSettings.visibility,
        [iconId]: false,
      },
    });

    // Broadcast to other tabs
    syncIcon.updated({ id: iconId, isHidden: true });
  },

  restoreSystemIcon: async (iconId: SystemIconId) => {
    // Check if icon exists in DB - if not, reinject it
    const existingIcon = await db.icons.get(iconId);
    if (!existingIcon) {
      // Icon was deleted from DB - reinject it from system icon definitions
      await reinjectSystemIcon(iconId);
      // Reload icons to get the new one
      await get().loadIcons();
    } else {
      // Icon exists, just restore it from hidden state
      await restoreSystemIconService(iconId);

      // Update local state: restore from hidden with original position
      set(state => ({
        icons: state.icons.map(i =>
          i.systemIconId === iconId
            ? {
                ...i,
                isHidden: false,
                position: i.originalPosition || { x: 0, y: 0 },
                folderId: i.originalFolderId,
                originalPosition: undefined,
                originalFolderId: undefined,
              }
            : i
        ),
      }));
    }

    // Sync visibility to settings store
    const { systemIconSettings, setSystemIconSettings } = useSettingsStore.getState();
    setSystemIconSettings({
      visibility: {
        ...systemIconSettings.visibility,
        [iconId]: true,
      },
    });

    // Broadcast to other tabs
    syncIcon.updated({ id: iconId, isHidden: false });
  },

  initializeSystemIcons: async () => {
    try {
      const settingsStore = useSettingsStore.getState();
      const { systemIconSettings } = settingsStore;

      // Verify DB actually has system icons even if settings say initialized
      // This handles cases where user cleared IndexedDB but not LocalStorage
      const hasExisting = await hasSystemIcons();

      if (systemIconSettings.initialized && hasExisting) {
        // Both settings and DB are consistent, nothing to do
        return;
      }

      if (hasExisting) {
        // DB has icons but settings not marked - just sync the flag
        settingsStore.setSystemIconSettings({ initialized: true });
        return;
      }

      // DB is empty - inject system icons regardless of initialized flag
      // Get grid columns from view settings for proper position calculation
      const viewSettings = settingsStore.viewSettings;
      const gridColumns = viewSettings?.columns ?? 7;
      await injectSystemIcons(systemIconSettings.visibility, gridColumns);

      // Mark as initialized
      settingsStore.setSystemIconSettings({ initialized: true });

      // Reload icons to include newly injected system icons
      await get().loadIcons();
    } catch (error) {
      console.error('[iconStore] Failed to initialize system icons:', error);
    }
  },

  syncSystemIcons: async (lang: UiLanguage) => {
    try {
      // Update system icon titles in database based on current language
      const updatedIcons = await syncSystemIconTitlesForLanguage(lang);

      if (updatedIcons.length === 0) return;

      // Update local store state with new titles for immediate UI update
      set((state) => ({
        icons: state.icons.map((icon) => {
          const updated = updatedIcons.find((u) => u.id === icon.id);
          return updated ? { ...icon, title: updated.title, updatedAt: updated.updatedAt } : icon;
        }),
      }));

      // Broadcast updates to other tabs for cross-tab consistency
      updatedIcons.forEach((icon) => {
        syncIcon.updated({ id: icon.id, title: icon.title });
      });
    } catch (error) {
      console.error('[iconStore] Failed to sync system icons:', error);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Folder Utilities
  // ═══════════════════════════════════════════════════════════════════════════

  generateUniqueFolderName: (baseName?: string) => {
    const { folders } = get();
    const lang = getCurrentUiLanguage();

    // Default base name based on current UI language
    const defaultName = tr('文件夹', 'Folder', lang);
    const base = baseName?.trim() || defaultName;

    // Collect all existing folder names for duplicate checking
    const existingNames = new Set(folders.map(f => f.name));

    // If base name doesn't exist, use it directly
    if (!existingNames.has(base)) {
      return base;
    }

    // Find the next available number suffix: Folder, Folder1, Folder2, etc.
    let counter = 1;
    while (existingNames.has(`${base}${counter}`)) {
      counter++;
    }

    return `${base}${counter}`;
  },

  checkAndDissolveFolder: async (folderId: string) => {
    const { icons, folders } = get();

    // Find the folder to check
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      return;
    }

    // Get icons remaining in this folder
    const folderIcons = icons.filter(icon => icon.folderId === folderId);

    // Only dissolve if exactly 1 icon remains (folder with 0 or 2+ icons stays)
    if (folderIcons.length !== 1) {
      return;
    }

    const singleIcon = folderIcons[0];
    const folderPosition = folder.position;

    // Use transaction for atomic update to ensure consistency
    await db.transaction('rw', [db.icons, db.folders], async () => {
      // Move the icon to the folder's position (inherit folder's grid slot)
      await db.icons.update(singleIcon.id, {
        folderId: undefined,
        position: folderPosition,
        updatedAt: Date.now(),
      });

      // Delete the now-empty folder
      await db.folders.delete(folderId);
    });

    // Update local state
    set(state => ({
      icons: state.icons.map(icon =>
        icon.id === singleIcon.id
          ? { ...icon, folderId: undefined, position: folderPosition }
          : icon
      ),
      folders: state.folders.filter(f => f.id !== folderId),
    }));

    // Broadcast changes to other tabs
    syncIcon.updated({ id: singleIcon.id, folderId: undefined, position: folderPosition });
    syncFolder.deleted(folderId);

    console.info(`[iconStore] Auto-dissolved folder "${folder.name}" with single icon`);
  },

  createFolderWithAutoName: async (iconIds: string[], position: { x: number; y: number }) => {
    const { generateUniqueFolderName, createFolderWithIcons } = get();

    // Generate a unique folder name based on current language
    const folderName = generateUniqueFolderName();

    // Delegate to createFolderWithIcons for actual creation
    const folderId = await createFolderWithIcons(folderName, iconIds, position);

    console.info(`[iconStore] Created folder "${folderName}" with ${iconIds.length} icons at position (${position.x}, ${position.y})`);

    return folderId;
  },
}));

// ═══════════════════════════════════════════════════════════════════════════════
// BroadcastChannel Sync Listener
// ═══════════════════════════════════════════════════════════════════════════════
//
// Sets up cross-tab synchronization using the BroadcastChannel API.
// When icons or folders are modified in one tab, changes are broadcast
// to all other tabs running the same extension.

/** Cleanup function for the sync listener (singleton guard) */
let syncListenerCleanup: (() => void) | null = null;

if (!syncListenerCleanup) {
  // Register listener for sync messages from other tabs
  syncListenerCleanup = listenForSync((message: SyncMessage) => {
  const store = useIconStore.getState();

  switch (message.type) {
    case 'ICON_ADDED':
      store.loadIcons(); // Reload to get new icon
      break;

    case 'BOOKMARKS_IMPORTED':
      store.loadIcons(); // Reload once after batch import
      break;

    case 'ICON_UPDATED':
      if (message.payload.id) {
        useIconStore.setState(state => ({
          icons: state.icons.map(icon =>
            icon.id === message.payload.id
              ? { ...icon, ...message.payload }
              : icon
          ),
        }));
      }
      break;

    case 'ICON_DELETED':
      if (message.payload.id) {
        useIconStore.setState(state => ({
          icons: state.icons.filter(icon => icon.id !== message.payload.id),
        }));
      }
      break;

    case 'FOLDER_ADDED':
      store.loadIcons(); // Reload to get new folder
      break;

    case 'FOLDER_UPDATED':
      if (message.payload.id) {
        useIconStore.setState(state => ({
          folders: state.folders.map(folder =>
            folder.id === message.payload.id
              ? { ...folder, ...message.payload }
              : folder
          ),
        }));
      }
      break;

    case 'FOLDER_DELETED':
      if (message.payload.id) {
        useIconStore.setState(state => ({
          folders: state.folders.filter(folder => folder.id !== message.payload.id),
        }));
      }
      break;

    default:
      break;
  }
  });
}
