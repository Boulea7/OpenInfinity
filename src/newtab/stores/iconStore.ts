import { create } from 'zustand';
import { db, generateId, type Icon, type Folder, type GridItem, isValidPosition, ensurePosition, isValidIcon, ensureIcon } from '../services/database';
import { syncIcon, syncFolder, listenForSync, type SyncMessage } from '../utils/sync';
import { useSettingsStore } from './settingsStore';

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
}

/**
 * Helper: Get next available position in grid
 * P1-1: Reads columns from settingsStore
 */
function getNextPosition(
  icons: Icon[],
  folders: Folder[]
): { x: number; y: number } {
  const columns = useSettingsStore.getState().viewSettings.columns || 6;
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
      children: [], // Will be removed in future version, kept for migration compatibility
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
      // Move all children icons back to root
      const childIcons = icons.filter(icon => icon.folderId === id);
      await Promise.all(
        childIcons.map(icon =>
          db.icons.update(icon.id, { folderId: undefined, updatedAt: Date.now() })
        )
      );

      // Delete the folder
      await db.folders.delete(id);

      set(state => ({
        folders: state.folders.filter(f => f.id !== id),
        icons: state.icons.map(icon =>
          icon.folderId === id ? { ...icon, folderId: undefined } : icon
        ),
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

    // Delete icons
    await db.icons.bulkDelete(iconIds);

    // Delete folders (and move their children to root)
    for (const folderId of folderIds) {
      const childIcons = icons.filter(icon => icon.folderId === folderId);
      await Promise.all(
        childIcons.map(icon =>
          db.icons.update(icon.id, { folderId: undefined, updatedAt: Date.now() })
        )
      );
    }
    await db.folders.bulkDelete(folderIds);

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

    // P1-1: Read columns from settingsStore
    const columns = useSettingsStore.getState().viewSettings.columns || 6;

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

    await Promise.all([
      ...iconUpdates.map(icon =>
        db.icons.update(icon.id, { position: icon.position, updatedAt: Date.now() })
      ),
      ...folderUpdates.map(folder =>
        db.folders.update(folder.id, { position: folder.position, updatedAt: Date.now() })
      ),
    ]);

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
        x: index % 6, // Default 6 columns in folder
        y: Math.floor(index / 6),
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
    const itemsPerPage = columns * rows;

    // Only count root level items
    const rootIcons = icons.filter(icon => !icon.folderId);
    const totalItems = rootIcons.length + folders.length;

    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  },

  setEditingItem: item => {
    set({ editingItem: item });
  },
}));

// P2-1: Setup BroadcastChannel sync listener
listenForSync((message: SyncMessage) => {
  const store = useIconStore.getState();

  switch (message.type) {
    case 'ICON_ADDED':
      store.loadIcons(); // Reload to get new icon
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

