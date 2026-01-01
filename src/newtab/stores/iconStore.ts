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
} from '../services/systemIcons';
import { tr } from '../../shared/tr';
import { getCurrentUiLanguage } from '../../shared/locale';

// Default grid columns for folders (fixed layout inside folder modal)
const FOLDER_GRID_COLUMNS = 6;

// Default grid columns fallback when settings are unavailable
const DEFAULT_GRID_COLUMNS = 6;

/**
 * Icon store state
 */
interface IconState {
  // Data
  icons: Icon[];
  folders: Folder[];

  // UI State
  currentPage: number;
  selectedItems: string[];
  draggedItem: GridItem | null;
  editingItem: GridItem | null;
  isDeleteMode: boolean; // iOS-style delete mode

  // Loading states
  isLoading: boolean;
  error: string | null;
}

/**
 * Icon store actions
 */
interface IconActions {
  // Data loading
  loadIcons: () => Promise<void>;

  // Icon CRUD
  addIcon: (icon: Omit<Icon, 'id' | 'type' | 'position' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateIcon: (id: string, updates: Partial<Icon>) => Promise<void>;
  deleteIcon: (id: string) => Promise<void>;

  // Folder CRUD
  addFolder: (name: string, position?: { x: number; y: number }) => Promise<string>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  addToFolder: (iconId: string, folderId: string) => Promise<void>;
  removeFromFolder: (iconId: string) => Promise<void>;

  // Batch operations
  deleteSelected: () => Promise<void>;
  moveToFolder: (itemIds: string[], folderId: string) => Promise<void>;

  // Drag and drop
  setDraggedItem: (item: GridItem | null) => void;
  reorderItems: (activeId: string, overId: string) => Promise<void>;
  reorderFolderIcons: (folderId: string, activeId: string, overId: string) => Promise<void>;
  createFolderWithIcons: (name: string, iconIds: string[], position?: { x: number; y: number }) => Promise<string>;

  // Selection
  selectItem: (id: string, multi?: boolean) => void;
  clearSelection: () => void;

  // Pagination
  setCurrentPage: (page: number) => void;
  getTotalPages: () => number;

  // Edit mode
  setEditingItem: (item: GridItem | null) => void;

  // Delete mode (iOS-style)
  enterDeleteMode: () => void;
  exitDeleteMode: () => void;

  // System icons
  hideSystemIcon: (iconId: SystemIconId) => Promise<void>;
  restoreSystemIcon: (iconId: SystemIconId) => Promise<void>;
  initializeSystemIcons: () => Promise<void>;

  // Folder utilities
  generateUniqueFolderName: (baseName?: string) => string;
  checkAndDissolveFolder: (folderId: string) => Promise<void>;
  createFolderWithAutoName: (iconIds: string[], position: { x: number; y: number }) => Promise<string>;
}

/**
 * Helper: Get next available position in grid
 * P1-1: Reads columns from settingsStore
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
 * Helper: Sort items by position (row-major order)
 */
function sortByPosition(items: GridItem[]): GridItem[] {
  return [...items].sort((a, b) => {
    if (a.position.y !== b.position.y) {
      return a.position.y - b.position.y;
    }
    return a.position.x - b.position.x;
  });
}

/**
 * Icon and folder management store
 */
export const useIconStore = create<IconState & IconActions>((set, get) => ({
  // Initial state
  icons: [],
  folders: [],
  currentPage: 0,
  selectedItems: [],
  draggedItem: null,
  editingItem: null,
  isDeleteMode: false,
  isLoading: false,
  error: null,

  loadIcons: async () => {
    set({ isLoading: true, error: null });
    try {
      const [rawIcons, rawFolders] = await Promise.all([
        db.icons.toArray(),
        db.folders.toArray(),
      ]);

      // P0-1: Defensive normalization (protect against corrupted/migrated data)
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

  addIcon: async (iconData) => {
    const { icons, folders } = get(); // P1-1: Removed viewSettings
    const now = Date.now();
    const position = getNextPosition(icons, folders); // P1-1: No longer needs columns param

    const newIcon: Icon = {
      ...iconData,
      id: generateId(),
      type: 'icon',
      position,
      createdAt: now,
      updatedAt: now,
    };

    await db.icons.add(newIcon);

    set(state => ({ icons: [...state.icons, newIcon] }));

    // P2-1: Broadcast to other tabs
    syncIcon.added(newIcon);

    return newIcon.id;
  },

  updateIcon: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: Date.now() };
    await db.icons.update(id, updatedData);

    set(state => ({
      icons: state.icons.map(icon =>
        icon.id === id ? { ...icon, ...updatedData } : icon
      ),
    }));

    // P2-1: Broadcast to other tabs
    syncIcon.updated({ id, ...updatedData });
  },

  deleteIcon: async (id) => {
    const { icons, checkAndDissolveFolder } = get();
    const icon = icons.find(i => i.id === id);

    // System icons are hidden instead of deleted
    if (icon?.isSystemIcon && icon.systemIconId) {
      await get().hideSystemIcon(icon.systemIconId);
      return;
    }

    // Remember the folder ID before deletion for auto-dissolve check
    const originalFolderId = icon?.folderId;

    await db.icons.delete(id);

    set(state => ({
      icons: state.icons.filter(icon => icon.id !== id),
      selectedItems: state.selectedItems.filter(itemId => itemId !== id),
    }));

    // P2-1: Broadcast to other tabs
    syncIcon.deleted(id);

    // Auto-dissolve folder if the deleted icon was in a folder
    // and only 1 icon remains
    if (originalFolderId) {
      await checkAndDissolveFolder(originalFolderId);
    }
  },

  addFolder: async (name, position) => {
    const { icons, folders } = get(); // P1-1: Removed viewSettings
    const now = Date.now();
    const finalPosition = position || getNextPosition(icons, folders); // P1-1: No longer needs columns param

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

    // P2-1: Broadcast to other tabs
    syncFolder.added(newFolder);

    return newFolder.id;
  },

  updateFolder: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: Date.now() };
    await db.folders.update(id, updatedData);

    set(state => ({
      folders: state.folders.map(folder =>
        folder.id === id ? { ...folder, ...updatedData } : folder
      ),
    }));

    // P2-1: Broadcast to other tabs
    syncFolder.updated({ id, ...updatedData });
  },

  deleteFolder: async (id) => {
    const { folders, icons } = get();
    const folder = folders.find(f => f.id === id);

    if (folder) {
      // P2 Fix: Use transaction for cross-table updates
      await db.transaction('rw', [db.icons, db.folders], async () => {
        // Move all children icons back to root with recalculated positions
        const childIcons = icons.filter(icon => icon.folderId === id);

        if (childIcons.length > 0) {
          // P2 Fix: Calculate new positions for displaced icons
          // Get current root items (excluding the folder being deleted and hidden icons)
          const rootIcons = icons.filter(i => !i.folderId && !i.isHidden);
          const otherFolders = folders.filter(f => f.id !== id);
          const existingRootItems = [...rootIcons, ...otherFolders];

          // Read columns from settings
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

      // P2-1: Broadcast to other tabs
      syncFolder.deleted(id);
    }
  },

  addToFolder: async (iconId, folderId) => {
    // NOTE: Not updating folder.children anymore (P0-4 fix)
    // Using icon.folderId as single source of truth
    await db.icons.update(iconId, { folderId, updatedAt: Date.now() });

    set(state => ({
      icons: state.icons.map(icon =>
        icon.id === iconId ? { ...icon, folderId } : icon
      ),
    }));

    // P1-3: Broadcast to other tabs
    syncIcon.updated({ id: iconId, folderId });
  },

  removeFromFolder: async (iconId) => {
    const { icons, checkAndDissolveFolder } = get();

    // Get the original folder ID before removing
    const icon = icons.find(i => i.id === iconId);
    const originalFolderId = icon?.folderId;

    await db.icons.update(iconId, { folderId: undefined, updatedAt: Date.now() });

    set(state => ({
      icons: state.icons.map(icon =>
        icon.id === iconId ? { ...icon, folderId: undefined } : icon
      ),
    }));

    // P1-3: Broadcast to other tabs
    syncIcon.updated({ id: iconId, folderId: undefined });

    // Auto-dissolve folder if only 1 icon remains
    if (originalFolderId) {
      await checkAndDissolveFolder(originalFolderId);
    }
  },

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

    // P1-3: Broadcast to other tabs
    iconsToMove.forEach(icon => syncIcon.updated({ id: icon.id, folderId }));
  },

  setDraggedItem: item => {
    set({ draggedItem: item });
  },

  reorderItems: async (activeId, overId) => {
    const { icons, folders } = get();

    // Find root items only (exclude hidden icons to prevent position jumping)
    const allItems: GridItem[] = sortByPosition([
      ...icons.filter(i => !i.folderId && !i.isHidden),
      ...folders,
    ]);

    const activeIndex = allItems.findIndex(item => item.id === activeId);
    const overIndex = allItems.findIndex(item => item.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    // Reorder array
    const reordered = [...allItems];
    const [moved] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, moved);

    // P1-1: Read columns from settingsStore (clamp to min 1 for safety)
    const columns = Math.max(1, useSettingsStore.getState().viewSettings.columns || DEFAULT_GRID_COLUMNS);

    // Recalculate positions based on new order
    const updates = reordered.map((item, index) => ({
      ...item,
      position: {
        x: index % columns,
        y: Math.floor(index / columns),
      },
    }));

    // Persist to database
    const iconUpdates = updates.filter(item => item.type === 'icon') as Icon[];
    const folderUpdates = updates.filter(item => item.type === 'folder') as Folder[];

    // P2 Fix: Use transaction for cross-table updates
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

    // P1-3: Broadcast reorder to other tabs
    iconUpdates.forEach(icon => syncIcon.updated({ id: icon.id, position: icon.position }));
    folderUpdates.forEach(folder => syncFolder.updated({ id: folder.id, position: folder.position }));
  },

  // P0-5: New method for reordering icons inside a folder
  reorderFolderIcons: async (folderId, activeId, overId) => {
    const { icons } = get();

    // Get icons in this folder only
    const folderIcons = sortByPosition(icons.filter(i => i.folderId === folderId));

    const activeIndex = folderIcons.findIndex(i => i.id === activeId);
    const overIndex = folderIcons.findIndex(i => i.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    // Reorder
    const reordered = [...folderIcons];
    const [moved] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, moved);

    // Recalculate positions within folder (simple linear order)
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

    // P1-3: Broadcast to other tabs
    updates.forEach(icon => syncIcon.updated({ id: icon.id, position: icon.position }));
  },

  // P1-1: Create folder with icons (for 500ms hover merge)
  createFolderWithIcons: async (name, iconIds, position) => {
    // Create folder
    const folderId = await get().addFolder(name, position);

    // Move icons to folder
    await Promise.all(
      iconIds.map(iconId =>
        db.icons.update(iconId, { folderId, updatedAt: Date.now() })
      )
    );

    set(state => ({
      icons: state.icons.map(icon =>
        iconIds.includes(icon.id) ? { ...icon, folderId } : icon
      ),
    }));

    return folderId;
  },

  selectItem: (id, multi = false) => {
    set(state => {
      if (multi) {
        // Toggle selection
        const isSelected = state.selectedItems.includes(id);
        return {
          selectedItems: isSelected
            ? state.selectedItems.filter(itemId => itemId !== id)
            : [...state.selectedItems, id],
        };
      }
      // Single selection
      return { selectedItems: [id] };
    });
  },

  clearSelection: () => {
    set({ selectedItems: [] });
  },

  setCurrentPage: page => {
    const totalPages = get().getTotalPages();
    set({ currentPage: Math.max(0, Math.min(page, totalPages - 1)) });
  },

  // P0-6: Dynamic total pages calculation
  // P1-1: Read viewSettings from settingsStore
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

    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  },

  setEditingItem: item => {
    set({ editingItem: item });
  },

  // iOS-style delete mode actions
  enterDeleteMode: () => {
    set({ isDeleteMode: true, selectedItems: [] });
  },

  exitDeleteMode: () => {
    set({ isDeleteMode: false });
  },

  // System icon actions
  hideSystemIcon: async (iconId: SystemIconId) => {
    await hideSystemIconService(iconId);

    // Update local state: mark as hidden
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
      // Icon was deleted from DB - reinject it
      await reinjectSystemIcon(iconId);
      // Reload icons to get the new one
      await get().loadIcons();
    } else {
      // Icon exists, just restore it
      await restoreSystemIconService(iconId);

      // Update local state: restore from hidden
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

      // P0 Fix: Even if initialized=true, verify DB actually has system icons
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

  /**
   * Generate a unique folder name by checking existing folders
   * If baseName exists, appends incrementing number: Folder, Folder1, Folder2, etc.
   */
  generateUniqueFolderName: (baseName?: string) => {
    const { folders } = get();
    const lang = getCurrentUiLanguage();

    // Default base name based on language
    const defaultName = tr('文件夹', 'Folder', lang);
    const base = baseName?.trim() || defaultName;

    // Get all existing folder names for duplicate checking
    const existingNames = new Set(folders.map(f => f.name));

    // If base name doesn't exist, use it directly
    if (!existingNames.has(base)) {
      return base;
    }

    // Find the next available number suffix
    let counter = 1;
    while (existingNames.has(`${base}${counter}`)) {
      counter++;
    }

    return `${base}${counter}`;
  },

  /**
   * Check if a folder has only one icon and automatically dissolve it
   * Moves the single icon back to the folder's original position
   */
  checkAndDissolveFolder: async (folderId: string) => {
    const { icons, folders } = get();

    // Find the folder
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      return;
    }

    // Get icons in this folder
    const folderIcons = icons.filter(icon => icon.folderId === folderId);

    // Only dissolve if exactly 1 icon remains
    if (folderIcons.length !== 1) {
      return;
    }

    const singleIcon = folderIcons[0];
    const folderPosition = folder.position;

    // Use transaction for atomic update
    await db.transaction('rw', [db.icons, db.folders], async () => {
      // Move the icon to the folder's position
      await db.icons.update(singleIcon.id, {
        folderId: undefined,
        position: folderPosition,
        updatedAt: Date.now(),
      });

      // Delete the empty folder
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

  /**
   * Create a folder with auto-generated unique name
   * Used for drag-and-drop merge operations
   */
  createFolderWithAutoName: async (iconIds: string[], position: { x: number; y: number }) => {
    const { generateUniqueFolderName, createFolderWithIcons } = get();

    // Generate a unique folder name
    const folderName = generateUniqueFolderName();

    // Create folder with icons using existing method
    const folderId = await createFolderWithIcons(folderName, iconIds, position);

    console.info(`[iconStore] Created folder "${folderName}" with ${iconIds.length} icons at position (${position.x}, ${position.y})`);

    return folderId;
  },
}));

// P2-1: Setup BroadcastChannel sync listener (singleton guard to prevent duplicate registration)
let syncListenerCleanup: (() => void) | null = null;
if (!syncListenerCleanup) {
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
