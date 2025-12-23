import { create } from 'zustand';
import { db, generateId, type Icon, type Folder, type GridItem, isValidPosition, ensurePosition, isValidIcon, ensureIcon } from '../services/database';
import { syncIcon, syncFolder, listenForSync, type SyncMessage } from '../utils/sync';
import { useSettingsStore } from './settingsStore';

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
  const rootIcons = icons.filter(i => !i.folderId);
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
    await db.icons.delete(id);

    set(state => ({
      icons: state.icons.filter(icon => icon.id !== id),
      selectedItems: state.selectedItems.filter(itemId => itemId !== id),
    }));

    // P2-1: Broadcast to other tabs
    syncIcon.deleted(id);
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
          // Get current root items (excluding the folder being deleted)
          const rootIcons = icons.filter(i => !i.folderId);
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
      const rootIcons = icons.filter(i => !i.folderId);
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
    await db.icons.update(iconId, { folderId: undefined, updatedAt: Date.now() });

    set(state => ({
      icons: state.icons.map(icon =>
        icon.id === iconId ? { ...icon, folderId: undefined } : icon
      ),
    }));

    // P1-3: Broadcast to other tabs
    syncIcon.updated({ id: iconId, folderId: undefined });
  },

  deleteSelected: async () => {
    const { selectedItems, icons, folders } = get();

    // Separate icons and folders
    const iconIds = selectedItems.filter(id =>
      icons.some(icon => icon.id === id)
    );
    const folderIds = selectedItems.filter(id =>
      folders.some(folder => folder.id === id)
    );

    // P2 Fix: Use transaction for cross-table updates
    await db.transaction('rw', [db.icons, db.folders], async () => {
      // Delete icons
      await db.icons.bulkDelete(iconIds);

      // Delete folders (and move their children to root with recalculated positions)
      if (folderIds.length > 0) {
        // Get all child icons from folders being deleted
        const allDisplacedIcons = icons.filter(
          icon => icon.folderId && folderIds.includes(icon.folderId)
        );

        if (allDisplacedIcons.length > 0) {
          // Calculate new positions for displaced icons
          const rootIcons = icons.filter(i => !i.folderId && !iconIds.includes(i.id));
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
        .filter(icon => !iconIds.includes(icon.id))
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

    // Find root items only
    const allItems: GridItem[] = sortByPosition([
      ...icons.filter(i => !i.folderId),
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

    // Only count root level items
    const rootIcons = icons.filter(icon => !icon.folderId);
    const totalItems = rootIcons.length + folders.length;

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
