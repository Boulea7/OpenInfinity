import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils';

/**
 * Context menu item definition
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  className?: string;
}

/**
 * ContextMenu Component
 * Renders a floating context menu at the specified position
 * Features: Portal rendering, auto-positioning, keyboard navigation
 */
export function ContextMenu({
  items,
  position,
  onClose,
  className,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position to keep menu within viewport
  const getAdjustedPosition = useCallback(() => {
    if (!menuRef.current) return position;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let { x, y } = position;

    // Adjust horizontal position
    if (x + rect.width > viewport.width - 10) {
      x = viewport.width - rect.width - 10;
    }
    if (x < 10) x = 10;

    // Adjust vertical position
    if (y + rect.height > viewport.height - 10) {
      y = viewport.height - rect.height - 10;
    }
    if (y < 10) y = 10;

    return { x, y };
  }, [position]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Handle escape key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Add listeners with a small delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Handle item click
  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled || item.divider) return;
      item.onClick?.();
      onClose();
    },
    [onClose]
  );

  // Adjust position after render
  useEffect(() => {
    if (menuRef.current) {
      const adjusted = getAdjustedPosition();
      menuRef.current.style.left = `${adjusted.x}px`;
      menuRef.current.style.top = `${adjusted.y}px`;
    }
  }, [getAdjustedPosition]);

  // Pre-compute first and last non-divider items for rounded corners
  const nonDividerItems = items.filter(i => !i.divider);
  const firstItemId = nonDividerItems[0]?.id;
  const lastItemId = nonDividerItems[nonDividerItems.length - 1]?.id;

  const menuContent = (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-[9999] min-w-[160px] py-1.5',
        'bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl',
        'border border-gray-200/50 dark:border-gray-700/50',
        'rounded-xl shadow-xl shadow-black/10',
        'animate-scale-in origin-top-left',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      role="menu"
      aria-orientation="vertical"
    >
      {items.map((item) => {
        // Divider
        if (item.divider) {
          return (
            <div
              key={item.id}
              className="h-px my-1.5 mx-2 bg-gray-200 dark:bg-gray-700"
              role="separator"
            />
          );
        }

        // Check if this is first or last non-divider item
        const isFirst = item.id === firstItemId;
        const isLast = item.id === lastItemId;

        // Menu item
        return (
          <button
            key={item.id}
            className={cn(
              'w-full px-3 py-2 flex items-center gap-3',
              'text-sm text-left transition-colors duration-100',
              // Rounded corners for first and last items to match container
              isFirst && 'rounded-t-lg',
              isLast && 'rounded-b-lg',
              item.disabled
                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : item.danger
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            )}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            role="menuitem"
            tabIndex={item.disabled ? -1 : 0}
          >
            {/* Icon */}
            {item.icon && (
              <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </span>
            )}

            {/* Label */}
            <span className="flex-1">{item.label}</span>

            {/* Shortcut */}
            {item.shortcut && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-4">
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // Render via portal to overlay-root or body
  const portalTarget =
    document.getElementById('overlay-root') || document.body;

  return createPortal(menuContent, portalTarget);
}

export default ContextMenu;
