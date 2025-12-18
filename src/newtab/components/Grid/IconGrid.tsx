import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Plus } from 'lucide-react';
import type { GridItem, Icon, Folder } from '../../services/database';
import { useIconStore, useSettingsStore } from '../../stores';
import { IconItem } from '../Icon/IconItem';
import { FolderItem } from '../Icon/FolderItem';
import { FolderNameModal } from '../Icon/FolderNameModal';
import { ContextMenu, type ContextMenuItem } from '../ui/ContextMenu';
import { cn } from '../../utils';
import { openUrlSafe } from '../../utils/navigation';

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
    reorderItems,
    addToFolder,
    selectItem,
    clearSelection,
    deleteIcon,
    deleteFolder,
    createFolderWithIcons,
  } = useIconStore(
    useShallow((state) => ({
      icons: state.icons,
      folders: state.folders,
      currentPage: state.currentPage,
      selectedItems: state.selectedItems,
      reorderItems: state.reorderItems,
      addToFolder: state.addToFolder,
      selectItem: state.selectItem,
      clearSelection: state.clearSelection,
      deleteIcon: state.deleteIcon,
      deleteFolder: state.deleteFolder,
      createFolderWithIcons: state.createFolderWithIcons,
    }))
  );

  const { viewSettings, openBehavior } = useSettingsStore(
    useShallow((state) => ({
      viewSettings: state.viewSettings,
      openBehavior: state.openBehavior,
    }))
  );

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

  // Calculate items per page
  const itemsPerPage = viewSettings.columns * viewSettings.rows;

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
  }, []);

  // Context menu items
  const getContextMenuItems = useCallback(
    (item: GridItem): ContextMenuItem[] => {
      if (item.type === 'icon') {
        const icon = item as Icon;
        return [
          {
            id: 'open',
            label: 'Open',
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
            label: 'Edit',
            onClick: () => onEditIcon?.(icon),
          },
          { id: 'divider1', label: '', divider: true },
          {
            id: 'delete',
            label: 'Delete',
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
          label: 'Open Folder',
          onClick: () => onOpenFolder?.(item as Folder),
        },
        {
          id: 'rename',
          label: 'Rename',
          onClick: () => {
            // TODO: Implement rename modal
          },
        },
        { id: 'divider1', label: '', divider: true },
        {
          id: 'delete',
          label: 'Delete Folder',
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
    [onEditIcon, onOpenFolder, deleteIcon, deleteFolder, openBehavior]
  );

  // Handle background click (P0-3: only deselect when clicking background itself)
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only clear selection if clicking the background itself, not bubbled events
    if (e.target === e.currentTarget) {
      clearSelection();
      closeContextMenu();
    }
  }, [clearSelection, closeContextMenu]);

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
      className={cn('relative', className)}
      onClick={handleBackgroundClick}
    >
      {/* Add new icon button - positioned at top-left corner */}
      {pageItems.length < itemsPerPage && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddIcon?.();
          }}
          className={cn(
            'absolute top-0 left-0 z-10',
            'w-20 h-20 flex items-center justify-center',
            'rounded-full border-2 border-dashed',
            'border-white/30 hover:border-white/50',
            'text-white/50 hover:text-white/70',
            'transition-all duration-200',
            'hover:bg-white/10 hover:scale-105',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40'
          )}
          aria-label={t('iconGrid.addIcon')}
        >
          <Plus className="w-8 h-8" />
          <span className="sr-only">{t('iconGrid.addIcon')}</span>
        </button>
      )}

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
            className="grid gap-4 justify-center"
            style={{
              gridTemplateColumns: `repeat(${viewSettings.columns}, minmax(0, 1fr))`,
            }}
          >
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
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  onClick={(icon) => {
                    // P0-3: Select item (propagation already stopped in IconItem)
                    selectItem(icon.id);
                    const opened = openUrlSafe(icon.url, 'current', openBehavior);
                    if (!opened) {
                      console.error('Blocked unsafe URL:', icon.url);
                    }
                  }}
                />
              );
            })}
          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay adjustScale dropAnimation={null}>
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
