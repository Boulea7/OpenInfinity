import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, X, Edit2 } from 'lucide-react';
import type { Folder, Icon } from '../../services/database';
import { useIconStore } from '../../stores';
import { Modal } from '../ui/Modal';
import { IconItem } from './IconItem';
import { cn } from '../../utils';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
  onEditIcon?: (icon: Icon) => void;
  onAddIcon?: () => void;
}

/**
 * FolderModal Component
 * Modal displaying folder contents with drag-and-drop support
 */
export function FolderModal({
  isOpen,
  onClose,
  folder,
  onEditIcon,
  onAddIcon,
}: FolderModalProps) {
  const { icons, updateFolder, removeFromFolder, reorderItems, deleteIcon } = useIconStore();

  // Edit mode for folder name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Drag state
  const [activeIcon, setActiveIcon] = useState<Icon | null>(null);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get icons inside this folder
  const folderIcons = useMemo(() => {
    if (!folder) return [];
    return icons
      .filter((icon) => icon.folderId === folder.id)
      .sort((a, b) => a.position - b.position);
  }, [icons, folder]);

  // Sortable IDs
  const sortableIds = useMemo(
    () => folderIcons.map((icon) => icon.id),
    [folderIcons]
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const icon = folderIcons.find((i) => i.id === active.id);
    if (icon) {
      setActiveIcon(icon);
    }
  }, [folderIcons]);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveIcon(null);

      if (!over || active.id === over.id) return;

      // Reorder icons within folder
      await reorderItems(active.id as string, over.id as string);
    },
    [reorderItems]
  );

  // Handle folder name edit
  const startEditingName = () => {
    if (folder) {
      setEditedName(folder.name);
      setIsEditingName(true);
    }
  };

  const saveNameEdit = async () => {
    if (folder && editedName.trim()) {
      await updateFolder(folder.id, { name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const cancelNameEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  // Handle remove icon from folder
  const handleRemoveFromFolder = async (iconId: string) => {
    await removeFromFolder(iconId);
  };

  // Handle delete icon
  const handleDeleteIcon = async (iconId: string) => {
    await deleteIcon(iconId);
  };

  if (!folder) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-4">
        {/* Folder header */}
        <div className="flex items-center justify-between">
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveNameEdit();
                  if (e.key === 'Escape') cancelNameEdit();
                }}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-lg',
                  'bg-gray-100 dark:bg-gray-700',
                  'border border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                autoFocus
              />
              <button
                onClick={saveNameEdit}
                className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm"
              >
                Save
              </button>
              <button
                onClick={cancelNameEdit}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                {folder.name}
                <button
                  onClick={startEditingName}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Rename folder"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </h2>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Icon count */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {folderIcons.length} {folderIcons.length === 1 ? 'item' : 'items'}
        </p>

        {/* Icons grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 gap-4 min-h-[200px] p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              {folderIcons.map((icon) => (
                <div key={icon.id} className="relative group">
                  <IconItem
                    icon={icon}
                    isDragging={activeIcon?.id === icon.id}
                    onClick={() => onEditIcon?.(icon)}
                  />
                  {/* Action buttons on hover */}
                  <div
                    className={cn(
                      'absolute -top-2 -right-2 flex gap-1',
                      'opacity-0 group-hover:opacity-100',
                      'transition-opacity duration-200'
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromFolder(icon.id);
                      }}
                      className="w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs"
                      title="Remove from folder"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIcon(icon.id);
                      }}
                      className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      title="Delete"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty state or add button */}
              {folderIcons.length === 0 ? (
                <div className="col-span-4 flex flex-col items-center justify-center py-8 text-gray-400">
                  <svg
                    className="w-12 h-12 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <p className="text-sm">Folder is empty</p>
                  <p className="text-xs mt-1">Drag icons here to add them</p>
                </div>
              ) : (
                <button
                  onClick={onAddIcon}
                  className={cn(
                    'w-20 h-24 flex flex-col items-center justify-center',
                    'rounded-xl border-2 border-dashed',
                    'border-gray-300 dark:border-gray-600',
                    'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    'hover:border-gray-400 dark:hover:border-gray-500',
                    'transition-all duration-200'
                  )}
                >
                  <Plus className="w-6 h-6 mb-1" />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>
          </SortableContext>

          {/* Drag overlay */}
          <DragOverlay adjustScale dropAnimation={null}>
            {activeIcon && <IconItem icon={activeIcon} isOverlay />}
          </DragOverlay>
        </DndContext>

        {/* Footer actions */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg',
              'bg-gray-100 dark:bg-gray-700',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'transition-colors duration-200'
            )}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default FolderModal;
