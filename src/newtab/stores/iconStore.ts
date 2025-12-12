import { create } from 'zustand';
import { db, generateId, type Icon, type Folder, type GridItem } from '../services/database';

/**
 * Icon store state
 */
interface IconState {
  // Data
  icons: Icon[];
  folders: Folder[];

  // UI State
  currentPage: number;
  totalPages: number;
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
  addFolder: (name: string) => Promise<string>;
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

  // Selection
  selectItem: (id: string, multi?: boolean) => void;
  clearSelection: () => void;

  // Pagination
  setCurrentPage: (page: number) => void;

  // Edit mode
  setEditingItem: (item: GridItem | null) => void;
}

/**
 * Calculate total pages based on items and view settings
 */
function calculateTotalPages(
  icons: Icon[],
  folders: Folder[],
  itemsPerPage: number
): number {
  // Only count root level items (icons without folderId + folders)
  const rootIcons = icons.filter((icon) => !icon.folderId);
  const totalItems = rootIcons.length + folders.length;
  return Math.max(1, Math.ceil(totalItems / itemsPerPage));
}

/**
 * Icon and folder management store
 */
export const useIconStore = create<IconState & IconActions>((set, get) => ({
  // Initial state
  icons: [],
  folders: [],
  currentPage: 0,
  totalPages: 1,
  selectedItems: [],
  draggedItem: null,
  editingItem: null,
  isLoading: false,
  error: null,

  loadIcons: async () => {
    set({ isLoading: true, error: null });
    try {
      const [icons, folders] = await Promise.all([
        db.icons.orderBy('position').toArray(),
        db.folders.orderBy('position').toArray(),
      ]);

      // Default items per page (6 columns x 4 rows)
      const itemsPerPage = 24;
      const totalPages = calculateTotalPages(icons, folders, itemsPerPage);

      set({
        icons,
        folders,
        totalPages,
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
    const { icons, folders } = get();
    const now = Date.now();
    const maxPosition = Math.max(
      0,
      ...icons.map((i) => i.position),
      ...folders.map((f) => f.position)
    );

    const newIcon: Icon = {
      ...iconData,
      id: generateId(),
      type: 'icon',
      position: maxPosition + 1,
      createdAt: now,
      updatedAt: now,
    };

    await db.icons.add(newIcon);
    set({ icons: [...icons, newIcon] });

    return newIcon.id;
  },

  updateIcon: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: Date.now() };
    await db.icons.update(id, updatedData);

    set((state) => ({
      icons: state.icons.map((icon) =>
        icon.id === id ? { ...icon, ...updatedData } : icon
      ),
    }));
  },

  deleteIcon: async (id) => {
    await db.icons.delete(id);
    set((state) => ({
      icons: state.icons.filter((icon) => icon.id !== id),
      selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
    }));
  },

  addFolder: async (name) => {
    const { icons, folders } = get();
    const now = Date.now();
    const maxPosition = Math.max(
      0,
      ...icons.map((i) => i.position),
      ...folders.map((f) => f.position)
    );

    const newFolder: Folder = {
      id: generateId(),
      type: 'folder',
      name,
      children: [],
      position: maxPosition + 1,
      createdAt: now,
      updatedAt: now,
    };

    await db.folders.add(newFolder);
    set({ folders: [...folders, newFolder] });

    return newFolder.id;
  },

  updateFolder: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: Date.now() };
    await db.folders.update(id, updatedData);

    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === id ? { ...folder, ...updatedData } : folder
      ),
    }));
  },

  deleteFolder: async (id) => {
    const { folders, icons } = get();
    const folder = folders.find((f) => f.id === id);

    if (folder) {
      // Move all children icons back to root
      const childIcons = icons.filter((icon) => icon.folderId === id);
      await Promise.all(
        childIcons.map((icon) =>
          db.icons.update(icon.id, { folderId: undefined })
        )
      );

      // Delete the folder
      await db.folders.delete(id);

      set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
        icons: state.icons.map((icon) =>
          icon.folderId === id ? { ...icon, folderId: undefined } : icon
        ),
        selectedItems: state.selectedItems.filter((itemId) => itemId !== id),
      }));
    }
  },

  addToFolder: async (iconId, folderId) => {
    const { icons, folders } = get();
    const folder = folders.find((f) => f.id === folderId);

    if (folder) {
      // Update icon's folderId
      await db.icons.update(iconId, { folderId });

      // Update folder's children
      const newChildren = [...folder.children, iconId];
      await db.folders.update(folderId, { children: newChildren });

      set({
        icons: icons.map((icon) =>
          icon.id === iconId ? { ...icon, folderId } : icon
        ),
        folders: folders.map((f) =>
          f.id === folderId ? { ...f, children: newChildren } : f
        ),
      });
    }
  },

  removeFromFolder: async (iconId) => {
    const { icons, folders } = get();
    const icon = icons.find((i) => i.id === iconId);

    if (icon?.folderId) {
      const folder = folders.find((f) => f.id === icon.folderId);

      // Update icon
      await db.icons.update(iconId, { folderId: undefined });

      // Update folder's children if folder exists
      if (folder) {
        const newChildren = folder.children.filter((id) => id !== iconId);
        await db.folders.update(folder.id, { children: newChildren });

        set({
          icons: icons.map((i) =>
            i.id === iconId ? { ...i, folderId: undefined } : i
          ),
          folders: folders.map((f) =>
            f.id === folder.id ? { ...f, children: newChildren } : f
          ),
        });
      } else {
        set({
          icons: icons.map((i) =>
            i.id === iconId ? { ...i, folderId: undefined } : i
          ),
        });
      }
    }
  },

  deleteSelected: async () => {
    const { selectedItems, icons, folders } = get();

    // Separate icons and folders
    const iconIds = selectedItems.filter((id) =>
      icons.some((icon) => icon.id === id)
    );
    const folderIds = selectedItems.filter((id) =>
      folders.some((folder) => folder.id === id)
    );

    // Delete icons
    await db.icons.bulkDelete(iconIds);

    // Delete folders (and move their children to root)
    for (const folderId of folderIds) {
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        await Promise.all(
          folder.children.map((childId) =>
            db.icons.update(childId, { folderId: undefined })
          )
        );
      }
    }
    await db.folders.bulkDelete(folderIds);

    set((state) => ({
      icons: state.icons
        .filter((icon) => !iconIds.includes(icon.id))
        .map((icon) =>
          folderIds.includes(icon.folderId || '')
            ? { ...icon, folderId: undefined }
            : icon
        ),
      folders: state.folders.filter((folder) => !folderIds.includes(folder.id)),
      selectedItems: [],
    }));
  },

  moveToFolder: async (itemIds, folderId) => {
    const { icons, folders } = get();
    const folder = folders.find((f) => f.id === folderId);

    if (!folder) return;

    // Only move icons, not folders
    const iconsToMove = icons.filter(
      (icon) => itemIds.includes(icon.id) && icon.type === 'icon'
    );

    await Promise.all(
      iconsToMove.map((icon) => db.icons.update(icon.id, { folderId }))
    );

    const newChildren = [...folder.children, ...iconsToMove.map((i) => i.id)];
    await db.folders.update(folderId, { children: newChildren });

    set({
      icons: icons.map((icon) =>
        itemIds.includes(icon.id) ? { ...icon, folderId } : icon
      ),
      folders: folders.map((f) =>
        f.id === folderId ? { ...f, children: newChildren } : f
      ),
      selectedItems: [],
    });
  },

  setDraggedItem: (item) => {
    set({ draggedItem: item });
  },

  reorderItems: async (activeId, overId) => {
    const { icons, folders } = get();

    // Find items
    const allItems: GridItem[] = [
      ...icons.filter((i) => !i.folderId),
      ...folders,
    ].sort((a, b) => a.position - b.position);

    const activeIndex = allItems.findIndex((item) => item.id === activeId);
    const overIndex = allItems.findIndex((item) => item.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    // Reorder
    const reordered = [...allItems];
    const [moved] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, moved);

    // Update positions
    const updates = reordered.map((item, index) => ({
      ...item,
      position: index,
    }));

    // Persist to database
    const iconUpdates = updates.filter((item) => item.type === 'icon') as Icon[];
    const folderUpdates = updates.filter((item) => item.type === 'folder') as Folder[];

    await Promise.all([
      ...iconUpdates.map((icon) =>
        db.icons.update(icon.id, { position: icon.position })
      ),
      ...folderUpdates.map((folder) =>
        db.folders.update(folder.id, { position: folder.position })
      ),
    ]);

    set({
      icons: icons.map((icon) => {
        const updated = iconUpdates.find((u) => u.id === icon.id);
        return updated ? { ...icon, position: updated.position } : icon;
      }),
      folders: folders.map((folder) => {
        const updated = folderUpdates.find((u) => u.id === folder.id);
        return updated ? { ...folder, position: updated.position } : folder;
      }),
    });
  },

  selectItem: (id, multi = false) => {
    set((state) => {
      if (multi) {
        // Toggle selection
        const isSelected = state.selectedItems.includes(id);
        return {
          selectedItems: isSelected
            ? state.selectedItems.filter((itemId) => itemId !== id)
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

  setCurrentPage: (page) => {
    const { totalPages } = get();
    set({ currentPage: Math.max(0, Math.min(page, totalPages - 1)) });
  },

  setEditingItem: (item) => {
    set({ editingItem: item });
  },
}));
