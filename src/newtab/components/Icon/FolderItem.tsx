import { useMemo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Folder } from '../../services/database';
import { useIconStore, useSettingsStore } from '../../stores';
import { cn } from '../../utils';
import { safeParseUrl, getFaviconUrl } from '../../utils/urlHelpers';

interface FolderItemProps {
  folder: Folder;
  isSelected?: boolean;
  isOverlay?: boolean;
  onContextMenu?: (_e: React.MouseEvent, _folder: Folder) => void;
  onClick?: (_folder: Folder) => void;
}

/**
 * FolderItem Component
 * Renders a folder with preview of contained icons
 * Supports receiving dragged icons
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
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition: isOverlay ? undefined : transition,
    }),
    [transform, transition, isOverlay]
  );

  // Get icons inside this folder (max 4 for preview)
  const folderIcons = useMemo(() => {
    return icons
      .filter(icon => icon.folderId === folder.id)
      .slice(0, 4);
  }, [icons, folder.id]);

  // Calculate icon count (P0-4: use filtered icons instead of folder.children)
  const iconCount = useMemo(() => {
    return icons.filter(icon => icon.folderId === folder.id).length;
  }, [icons, folder.id]);

  // Handle click (P0-3: stop propagation)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(folder);
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, folder);
  };

  // Container size based on icon size settings
  const containerSize =
    iconStyle.size === 'small'
      ? 'w-16 h-20'
      : iconStyle.size === 'large'
        ? 'w-24 h-28'
        : 'w-20 h-24';

  const folderIconSize =
    iconStyle.size === 'small'
      ? 'w-12 h-12'
      : iconStyle.size === 'large'
        ? 'w-16 h-16'
        : 'w-14 h-14';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex flex-col items-center justify-center group',
        containerSize,
        'rounded-xl cursor-pointer select-none',
        'transition-all duration-200',
        // Hover effect
        iconStyle.animation === 'scale' && !isDragging && 'hover:scale-105',
        // Drop target highlight
        isOver && !isDragging && 'ring-2 ring-primary-500 scale-105',
        // Dragging state
        isDragging && 'opacity-50 scale-95',
        // Overlay style
        isOverlay && 'shadow-2xl',
        // Selected state
        isSelected && 'ring-2 ring-primary-500 ring-offset-2'
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Folder container */}
      <div
        className={cn(
          folderIconSize,
          'relative flex items-center justify-center mb-1.5',
          'bg-gray-100/40 dark:bg-gray-700/60 backdrop-blur-sm',
          'rounded-xl overflow-hidden',
          'transition-all duration-200',
          'group-hover:bg-gray-200/50 dark:group-hover:bg-gray-600/70',
          iconStyle.shadow && 'shadow-lg shadow-black/10'
        )}
        style={{
          borderRadius: `${iconStyle.borderRadius}%`,
        }}
      >
        {/* 2x2 Icon preview grid */}
        <div className="grid grid-cols-2 gap-0.5 p-1.5 w-full h-full">
          {folderIcons.map((icon) => {
            // P0-2: Safe URL handling + adapt to new icon structure
            const validUrl = safeParseUrl(icon.url);
            const iconSrc = icon.icon.type === 'favicon'
              ? icon.icon.value
              : icon.icon.type === 'custom'
                ? icon.icon.value
                : validUrl
                  ? getFaviconUrl(validUrl)
                  : '';
            const showImage = Boolean(iconSrc) && !previewErrors[icon.id];

            return (
              <div
                key={icon.id}
                className="w-full h-full flex items-center justify-center bg-white/30 dark:bg-gray-600/30 rounded"
              >
                {icon.icon.type === 'text' ? (
                  // Text icon
                  <div
                    className="w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white rounded"
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
                      className="w-4 h-4 object-contain"
                      loading="lazy"
                      onError={() => {
                        setPreviewErrors(prev => ({ ...prev, [icon.id]: true }));
                      }}
                    />
                  ) : (
                    <div className="w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-gray-400 text-white rounded">
                      {icon.title[0]?.toUpperCase() || '?'}
                    </div>
                  )
                )}
              </div>
            );
          })}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 4 - folderIcons.length) }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                className="w-full h-full bg-white/10 dark:bg-gray-700/30 rounded"
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

      {/* Folder name */}
      {iconStyle.showName && (
        <span
          className={cn(
            'text-xs font-medium text-center px-1',
            'line-clamp-1 max-w-full',
            'text-white/90 dark:text-gray-200',
            iconStyle.shadow && 'drop-shadow-md'
          )}
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
