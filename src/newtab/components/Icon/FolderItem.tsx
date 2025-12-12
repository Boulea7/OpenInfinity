import { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Folder } from '../../services/database';
import { useIconStore, useSettingsStore } from '../../stores';
import { cn } from '../../utils';

interface FolderItemProps {
  folder: Folder;
  isSelected?: boolean;
  isOverlay?: boolean;
  onContextMenu?: (e: React.MouseEvent, folder: Folder) => void;
  onClick?: (folder: Folder) => void;
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

  // dnd-kit droppable hook
  const { isOver, setNodeRef } = useDroppable({
    id: folder.id,
    data: {
      type: 'folder',
      folder,
      accepts: ['icon'],
    },
  });

  // Get icons inside this folder (max 4 for preview)
  const folderIcons = useMemo(() => {
    return icons
      .filter((icon) => icon.folderId === folder.id)
      .slice(0, 4);
  }, [icons, folder.id]);

  // Handle click
  const handleClick = () => {
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
      className={cn(
        'flex flex-col items-center justify-center group',
        containerSize,
        'rounded-xl cursor-pointer select-none',
        'transition-all duration-200',
        // Hover effect
        iconStyle.animation === 'scale' && 'hover:scale-105',
        // Drop target highlight
        isOver && 'ring-2 ring-primary-500 scale-105',
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
          {folderIcons.map((icon) => (
            <div
              key={icon.id}
              className="w-full h-full flex items-center justify-center bg-white/30 dark:bg-gray-600/30 rounded"
            >
              <img
                src={icon.icon || `https://www.google.com/s2/favicons?domain=${new URL(icon.url).hostname}&sz=32`}
                alt=""
                className="w-4 h-4 object-contain"
              />
            </div>
          ))}
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
          folder.children.length === 0 && 'hidden'
        )}
      >
        {folder.children.length}
      </span>
    </div>
  );
}

export default FolderItem;
