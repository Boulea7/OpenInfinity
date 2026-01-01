import { useMemo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Folder } from '../../services/database';
import { useIconStore, useSettingsStore } from '../../stores';
import { cn } from '../../utils';
import { safeParseUrl } from '../../utils/urlHelpers';
import { getGoogleFaviconUrl } from '../../utils';

interface FolderItemProps {
  folder: Folder;
  isSelected?: boolean;
  isOverlay?: boolean;
  onContextMenu?: (_e: React.MouseEvent, _folder: Folder) => void;
  onClick?: (_folder: Folder, _rect?: DOMRect) => void;
}

/**
 * FolderItem Component
 * Renders a folder with 3x3 icon preview grid (Infinity Pro style)
 * - Glassmorphism folder background
 * - Folder name displayed BELOW the folder container
 * - Supports drag-and-drop (sortable + droppable)
 * - Smooth hover and drop target animations
 */
export function FolderItem({
  folder,
  isSelected = false,
  isOverlay = false,
  onContextMenu,
  onClick,
}: FolderItemProps) {
  const { icons } = useIconStore();
  const { iconStyle } = useSettingsStore();
  const [isHovered, setIsHovered] = useState(false);
  const [previewErrors, setPreviewErrors] = useState<Record<string, boolean>>({});

  // P1-2: Use useSortable (includes droppable functionality)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: folder.id,
    data: {
      type: 'folder',
      folder,
      accepts: ['icon'],
    },
  });

  // Apply drag transform
  // IMPORTANT: When isOverlay=true, DragOverlay handles positioning
  // Avoid double-transform which causes flash/jump bug
  const style = useMemo(
    () => ({
      transform: isOverlay ? undefined : CSS.Transform.toString(transform),
      transition: isOverlay ? undefined : transition,
    }),
    [transform, transition, isOverlay]
  );

  // Get icons inside this folder (max 9 for 3x3 preview grid)
  const folderIcons = useMemo(() => {
    return icons
      .filter(icon => icon.folderId === folder.id)
      .slice(0, 9);
  }, [icons, folder.id]);

  // Calculate icon count (P0-4: use filtered icons instead of folder.children)
  const iconCount = useMemo(() => {
    return icons.filter(icon => icon.folderId === folder.id).length;
  }, [icons, folder.id]);

  // Handle click (P0-3: stop propagation)
  // Pass the folder element's bounding rect for expand animation origin
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    onClick?.(folder, rect);
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, folder);
  };

  // Folder container size based on icon size settings
  const folderSize =
    iconStyle.size === 'small'
      ? 'w-12 h-12'
      : iconStyle.size === 'large'
        ? 'w-16 h-16'
        : 'w-14 h-14';

  // Container width for text truncation
  const containerWidth =
    iconStyle.size === 'small'
      ? 'w-16'
      : iconStyle.size === 'large'
        ? 'w-20'
        : 'w-18';

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-folder-item
      {...attributes}
      {...listeners}
      className={cn(
        // Flex column layout: folder on top, text below (matches IconItem)
        'group relative flex flex-col items-center',
        'py-2 px-1',
        'cursor-pointer select-none',
        'transition-all duration-300 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40',

        // NO background on container (transparent)

        // Hover effect: lift up
        'hover:-translate-y-1',

        // Drop target highlight (when dragging icon over folder)
        isOver && !isDragging && 'scale-110',

        // Dragging state: hide original completely
        isDragging && !isOverlay && 'opacity-0',

        // Overlay style (drag preview)
        isOverlay && 'opacity-100 scale-110 z-50 cursor-grabbing',

        // Selected state
        isSelected && 'scale-105'
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Folder container with glassmorphism style */}
      <div
        className={cn(
          folderSize,
          'relative flex items-center justify-center',
          'overflow-hidden',
          'transition-all duration-300 ease-out',
          'group-hover:scale-110',
          // Drop target ring
          isOver && !isDragging && 'ring-2 ring-brand-orange-500 ring-offset-2 ring-offset-transparent',
          // Selected ring
          isSelected && 'ring-2 ring-brand-orange-500 ring-offset-2 ring-offset-transparent'
        )}
        style={{
          background: 'var(--folder-bg, rgba(255,255,255,0.2))',
          backdropFilter: 'blur(var(--folder-backdrop-blur, 10px))',
          WebkitBackdropFilter: 'blur(var(--folder-backdrop-blur, 10px))',
          borderRadius: `${iconStyle.borderRadius}%`,
          filter: 'drop-shadow(1px 1px 5px rgba(0, 0, 0, 0.25))',
        }}
      >
        {/* 3x3 Icon preview grid (Infinity Pro style) */}
        <div
          className="grid grid-cols-3 w-full h-full"
          style={{
            padding: 'var(--mini-icon-padding)',
            gap: 'var(--mini-icon-gap)',
          }}
        >
          {folderIcons.map((icon) => {
            // P0-2: Safe URL handling + adapt to new icon structure
            const validUrl = safeParseUrl(icon.url);
            const iconSrc = icon.icon.type === 'favicon'
              ? icon.icon.value
              : icon.icon.type === 'custom'
                ? icon.icon.value
                : validUrl
                  ? getGoogleFaviconUrl(validUrl, 64) // Use 64px for mini previews
                  : '';
            const showImage = Boolean(iconSrc) && !previewErrors[icon.id];

            return (
              <div
                key={icon.id}
                className="aspect-square flex items-center justify-center bg-white/30 dark:bg-gray-600/30 rounded-sm overflow-hidden"
                style={{ opacity: 'var(--mini-icon-opacity)' }}
              >
                {icon.icon.type === 'text' ? (
                  // Text icon
                  <div
                    className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ backgroundColor: icon.icon.color || '#3b82f6' }}
                  >
                    {icon.icon.value}
                  </div>
                ) : (
                  // Image icon with safe React fallback (no DOM mutations)
                  showImage ? (
                    <img
                      src={iconSrc}
                      alt=""
                      className="w-full h-full object-contain p-0.5"
                      loading="lazy"
                      onError={() => {
                        setPreviewErrors(prev => ({ ...prev, [icon.id]: true }));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold bg-gray-400 text-white">
                      {icon.title[0]?.toUpperCase() || '?'}
                    </div>
                  )
                )}
              </div>
            );
          })}
          {/* Empty slots to complete 3x3 grid */}
          {Array.from({ length: Math.max(0, 9 - folderIcons.length) }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square bg-white/10 dark:bg-gray-700/30 rounded-sm"
              />
            )
          )}
        </div>

        {/* Folder open indicator on hover */}
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
            <svg
              className="w-6 h-6 text-white"
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
          </div>
        )}
      </div>

      {/* Folder name BELOW the folder container (matches IconItem style) */}
      {iconStyle.showName && (
        <span
          className={cn(
            containerWidth,
            'mt-2 font-medium text-center',
            'truncate', // Ellipsis for overflow
            'transition-colors duration-200'
          )}
          style={{
            fontSize: 'var(--icon-font-size, 12px)',
            color: 'var(--icon-font-color, #ffffff)',
            textShadow: 'var(--icon-text-shadow, 1px 1px 3px rgba(0,0,0,0.5))',
          }}
        >
          {folder.name}
        </span>
      )}

      {/* Item count badge */}
      <span
        className={cn(
          'absolute -top-1 -right-1',
          'px-1.5 py-0.5 text-[10px] font-semibold',
          'bg-primary-500 text-white rounded-full',
          'min-w-[18px] text-center',
          iconCount === 0 && 'hidden'
        )}
      >
        {iconCount}
      </span>
    </div>
  );
}

export default FolderItem;
