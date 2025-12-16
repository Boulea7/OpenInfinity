import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Icon } from '../../services/database';
import { useSettingsStore } from '../../stores';
import { cn, getFaviconUrl, getGoogleFaviconUrl } from '../../utils';
import { openWebsite, isSafeUrl } from '../../utils/navigation';

interface IconItemProps {
  icon: Icon;
  isDragging?: boolean;
  isSelected?: boolean;
  isOverlay?: boolean;
  onContextMenu?: (_e: React.MouseEvent, _icon: Icon) => void;
  onClick?: (_icon: Icon) => void;
}

/**
 * IconItem Component
 * Renders a single website icon with drag-and-drop support
 */
export function IconItem({
  icon,
  isDragging: externalDragging,
  isSelected = false,
  isOverlay = false,
  onContextMenu,
  onClick,
}: IconItemProps) {
  const { iconStyle, openBehavior } = useSettingsStore();

  // dnd-kit sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableDragging,
  } = useSortable({
    id: icon.id,
    data: {
      type: 'icon',
      icon,
    },
  });

  const isDragging = externalDragging || sortableDragging;

  // Calculate transform style
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition: isOverlay ? undefined : transition,
    }),
    [transform, transition, isOverlay]
  );

  // Get icon source URL (adapt to new icon structure)
  const iconSrc = useMemo(() => {
    if (icon.icon.type === 'custom' || icon.icon.type === 'favicon') {
      // Use provided icon value (base64, svg, or URL)
      return icon.icon.value;
    } else if (icon.icon.type === 'text') {
      // Text icons rendered separately
      return null;
    }
    // Fallback to favicon service
    return getGoogleFaviconUrl(icon.url, 64);
  }, [icon.icon, icon.url]);

  // Handle click (P0-3: stop propagation to prevent background click)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isDragging) return;

    if (onClick) {
      onClick(icon);
    } else {
      // P1-11: Use unified openUrl with safe URL check
      if (isSafeUrl(icon.url)) {
        openWebsite(icon.url, openBehavior);
      } else {
        console.error('Blocked unsafe URL:', icon.url);
      }
    }
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, icon);
  };

  // Icon size based on settings
  const iconSizeClass =
    iconStyle.size === 'small'
      ? 'w-12 h-12'
      : iconStyle.size === 'large'
        ? 'w-16 h-16'
        : 'w-14 h-14';

  // Container size
  const containerSize =
    iconStyle.size === 'small'
      ? 'w-16 h-20'
      : iconStyle.size === 'large'
        ? 'w-24 h-28'
        : 'w-20 h-24';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col items-center justify-center group',
        containerSize,
        'rounded-xl cursor-pointer select-none',
        'transition-all duration-200',
        // Hover effect based on settings
        iconStyle.animation === 'scale' && 'hover:scale-105',
        iconStyle.animation === 'bounce' && 'hover:animate-bounce',
        // Dragging state
        isDragging && 'opacity-50 scale-105',
        isOverlay && 'shadow-2xl',
        // Selected state
        isSelected && 'ring-2 ring-primary-500 ring-offset-2 ring-offset-transparent'
      )}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Icon container */}
      <div
        className={cn(
          iconSizeClass,
          'flex items-center justify-center mb-1.5',
          'bg-white/20 dark:bg-gray-700/40 backdrop-blur-sm',
          'rounded-xl overflow-hidden',
          'transition-all duration-200',
          'group-hover:bg-white/30 dark:group-hover:bg-gray-600/50',
          // Shadow based on settings
          iconStyle.shadow && 'shadow-lg shadow-black/10'
        )}
        style={{
          borderRadius: `${iconStyle.borderRadius}%`,
          opacity: iconStyle.opacity / 100,
        }}
      >
        {/* Icon image or text */}
        {icon.icon.type === 'text' ? (
          // Text icon
          <div
            className="w-8 h-8 flex items-center justify-center text-2xl font-bold text-white rounded"
            style={{ backgroundColor: icon.icon.color || '#3b82f6' }}
          >
            {icon.icon.value}
          </div>
        ) : (
          // Image icon
          <img
            src={iconSrc || ''}
            alt={icon.title}
            className="w-8 h-8 object-contain"
            loading="lazy"
            onError={(e) => {
              // Fallback to DuckDuckGo favicon service
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('duckduckgo')) {
                target.src = getFaviconUrl(icon.url);
              } else {
                // Final fallback: first letter
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('span');
                  fallback.className =
                    'text-2xl font-bold text-white/80';
                  fallback.textContent = icon.title.charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
              }
            }}
          />
        )}
      </div>

      {/* Title */}
      {iconStyle.showName && (
        <span
          className={cn(
            'text-xs font-medium text-center px-1',
            'line-clamp-1 max-w-full',
            'text-white/90 dark:text-gray-200',
            // Text shadow based on settings
            iconStyle.shadow && 'drop-shadow-md'
          )}
        >
          {icon.title}
        </span>
      )}
    </div>
  );
}

export default IconItem;
