import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { X, Check } from 'lucide-react';
import type { Folder, Icon } from '../../services/database';
import { useIconStore } from '../../stores';
import { IconItem } from './IconItem';
import { cn } from '../../utils';

/**
 * Number of columns in the expanded folder grid (iOS style: 8 columns)
 */
const FOLDER_GRID_COLUMNS = 8;

interface FolderExpandedViewProps {
  folder: Folder;
  isOpen: boolean;
  onClose: () => void;
  onEditIcon?: (icon: Icon) => void;
  originRect?: DOMRect | null; // For expand animation origin point
}

/**
 * FolderExpandedView Component
 * iOS-style full-screen folder expansion with glassmorphism effect.
 * Features:
 * - Full-screen blurred backdrop
 * - Editable folder name at top center
 * - 8-column icon grid in a frosted glass container
 * - Drag-and-drop support for reordering icons
 * - Smooth expand/collapse animations
 */
export function FolderExpandedView({
  folder,
  isOpen,
  onClose,
  onEditIcon,
  originRect,
}: FolderExpandedViewProps) {
  const { t } = useTranslation();
  const { icons, updateFolder, reorderFolderIcons } = useIconStore();

  // Animation state management
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [shouldRender, setShouldRender] = useState(false);

  // Edit mode for folder name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [activeIcon, setActiveIcon] = useState<Icon | null>(null);

  // Container ref for animation origin calculation
  const containerRef = useRef<HTMLDivElement>(null);

  // dnd-kit sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get icons inside this folder, sorted by position
  const folderIcons = useMemo(() => {
    return icons
      .filter((icon) => icon.folderId === folder.id)
      .sort((a, b) => {
        // Sort by position (row-major order)
        if (a.position.y !== b.position.y) {
          return a.position.y - b.position.y;
        }
        return a.position.x - b.position.x;
      });
  }, [icons, folder.id]);

  // Sortable IDs for dnd-kit
  const sortableIds = useMemo(
    () => folderIcons.map((icon) => icon.id),
    [folderIcons]
  );

  // Handle open/close state transitions with animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready before starting animation
      requestAnimationFrame(() => {
        setAnimationState('opening');
        // Transition to 'open' after animation completes
        const timer = setTimeout(() => {
          setAnimationState('open');
        }, 350); // Match folder-expand animation duration
        return () => clearTimeout(timer);
      });
    } else if (animationState !== 'closed') {
      setAnimationState('closing');
      // Remove from DOM after close animation completes
      const timer = setTimeout(() => {
        setAnimationState('closed');
        setShouldRender(false);
      }, 250); // Match folder-collapse animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const icon = folderIcons.find((i) => i.id === active.id);
    if (icon) {
      setActiveIcon(icon);
    }
  }, [folderIcons]);

  // Handle drag end - reorder icons within folder
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveIcon(null);

      if (!over || active.id === over.id) return;

      await reorderFolderIcons(folder.id, active.id as string, over.id as string);
    },
    [reorderFolderIcons, folder.id]
  );

  // Start editing folder name
  const startEditingName = useCallback(() => {
    setEditedName(folder.name);
    setIsEditingName(true);
  }, [folder.name]);

  // Save folder name edit
  const saveNameEdit = useCallback(async () => {
    if (editedName.trim() && editedName.trim() !== folder.name) {
      await updateFolder(folder.id, { name: editedName.trim() });
    }
    setIsEditingName(false);
    setEditedName('');
  }, [editedName, folder.id, folder.name, updateFolder]);

  // Cancel folder name edit
  const cancelNameEdit = useCallback(() => {
    setIsEditingName(false);
    setEditedName('');
  }, []);

  // Handle keyboard events for name editing
  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void saveNameEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelNameEdit();
    }
  }, [saveNameEdit, cancelNameEdit]);

  // Handle backdrop click to close
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not children
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle close button or Escape key
  const handleClose = useCallback(() => {
    if (isEditingName) {
      cancelNameEdit();
    } else {
      onClose();
    }
  }, [isEditingName, cancelNameEdit, onClose]);

  // Handle Escape key globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && animationState === 'open') {
        handleClose();
      }
    };

    if (shouldRender) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [shouldRender, animationState, handleClose]);

  // Calculate transform origin based on folder position
  const transformOrigin = useMemo(() => {
    if (!originRect) return 'center center';
    const centerX = originRect.left + originRect.width / 2;
    const centerY = originRect.top + originRect.height / 2;
    return `${centerX}px ${centerY}px`;
  }, [originRect]);

  // Don't render if not needed
  if (!shouldRender) return null;

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center',
        // Backdrop blur and dark overlay
        'bg-black/40 backdrop-blur-xl',
        // Animation classes
        animationState === 'opening' && 'animate-folder-backdrop-in',
        animationState === 'closing' && 'animate-folder-backdrop-out'
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-name"
    >
      {/* Main content container with expand/collapse animation */}
      <div
        ref={containerRef}
        className={cn(
          'relative flex flex-col items-center',
          'max-w-[90vw] max-h-[85vh]',
          'w-full',
          // Animation classes
          animationState === 'opening' && 'animate-folder-expand',
          animationState === 'closing' && 'animate-folder-collapse'
        )}
        style={{ transformOrigin }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Folder name section - top center */}
        <div className="mb-6 flex items-center justify-center gap-3">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameInputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={() => void saveNameEdit()}
                className={cn(
                  'px-4 py-2 min-w-[200px] max-w-[400px]',
                  'text-2xl font-semibold text-center text-white',
                  'bg-white/10 backdrop-blur-md',
                  'border border-white/20 rounded-xl',
                  'focus:outline-none focus:ring-2 focus:ring-white/40',
                  'placeholder:text-white/50'
                )}
                placeholder={t('folder.folderName')}
              />
              <button
                onClick={() => void saveNameEdit()}
                className={cn(
                  'p-2 rounded-full',
                  'bg-white/20 hover:bg-white/30',
                  'text-white transition-colors duration-200'
                )}
                title={t('common.save')}
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={cancelNameEdit}
                className={cn(
                  'p-2 rounded-full',
                  'bg-white/20 hover:bg-white/30',
                  'text-white transition-colors duration-200'
                )}
                title={t('common.cancel')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              id="folder-name"
              onClick={startEditingName}
              className={cn(
                'px-4 py-2',
                'text-2xl font-semibold text-white',
                'hover:bg-white/10 rounded-xl',
                'transition-colors duration-200',
                'cursor-text'
              )}
              title={t('folder.renameFolder')}
            >
              {folder.name}
            </button>
          )}
        </div>

        {/* Glassmorphism container for icons */}
        <div
          className={cn(
            'relative w-full max-w-4xl',
            'p-6 rounded-3xl',
            'bg-white/10 backdrop-blur-2xl',
            'border border-white/20',
            'shadow-2xl'
          )}
        >
          {/* Close button - positioned top-right of the glass container */}
          <button
            onClick={handleClose}
            className={cn(
              'absolute -top-3 -right-3 z-10',
              'w-8 h-8 rounded-full',
              'bg-white/20 hover:bg-white/30 backdrop-blur-md',
              'text-white transition-all duration-200',
              'flex items-center justify-center',
              'shadow-lg hover:scale-110'
            )}
            title={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icons grid with drag-and-drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              <div
                className={cn(
                  'grid gap-4',
                  'min-h-[200px]'
                )}
                style={{
                  gridTemplateColumns: `repeat(${FOLDER_GRID_COLUMNS}, minmax(0, 1fr))`,
                }}
              >
                {folderIcons.map((icon) => (
                  <div key={icon.id} className="flex justify-center">
                    <IconItem
                      icon={icon}
                      isDragging={activeIcon?.id === icon.id}
                      onClick={() => onEditIcon?.(icon)}
                    />
                  </div>
                ))}

                {/* Empty state message */}
                {folderIcons.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-white/60">
                    <svg
                      className="w-16 h-16 mb-4 opacity-50"
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
                    <p className="text-lg font-medium">{t('folder.folderEmpty')}</p>
                    <p className="text-sm mt-1 opacity-70">{t('folder.dragHint')}</p>
                  </div>
                )}
              </div>
            </SortableContext>

            {/* Drag overlay - shows the icon being dragged */}
            <DragOverlay adjustScale dropAnimation={null}>
              {activeIcon && <IconItem icon={activeIcon} isOverlay />}
            </DragOverlay>
          </DndContext>

          {/* Icon count footer */}
          {folderIcons.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10 text-center">
              <span className="text-sm text-white/50">
                {t('folder.itemCount', { count: folderIcons.length })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(content, document.body);
}

export default FolderExpandedView;
