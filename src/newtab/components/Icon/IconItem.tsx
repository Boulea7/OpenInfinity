import { useEffect, useMemo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Icon } from '../../services/database';
import { useShallow } from 'zustand/shallow';
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
 * Renders a single website icon with glassmorphism style and drag-and-drop support
 */
export function IconItem({
  icon,
  isDragging: externalDragging,
  isSelected = false,
  isOverlay = false,
  onContextMenu,
  onClick,
}: IconItemProps) {
  const { iconStyle, openBehavior } = useSettingsStore(
    useShallow((state) => ({
      iconStyle: state.iconStyle,
      openBehavior: state.openBehavior,
    }))
  );
  const [imageFallback, setImageFallback] = useState<'none' | 'duckduckgo' | 'text'>('none');

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

  useEffect(() => {
    // Reset image fallback state when icon changes
    setImageFallback('none');
  }, [icon.id, icon.url, icon.icon.type, icon.icon.value]);

  // Calculate transform style
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition: isOverlay ? undefined : transition,
      borderRadius: `${iconStyle.borderRadius}%`,
    }),
    [transform, transition, isOverlay, iconStyle.borderRadius]
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

  const resolvedIconSrc = useMemo(() => {
    if (!iconSrc) return null;
    if (imageFallback === 'duckduckgo') return getFaviconUrl(icon.url);
    return iconSrc;
  }, [iconSrc, imageFallback, icon.url]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Preserve dnd-kit keyboard behavior first
    (listeners as any)?.onKeyDown?.(e);
    if (e.defaultPrevented) return;

    // Enter to activate (avoid Space to not conflict with dnd-kit keyboard dragging)
    if (e.key === 'Enter') {
      e.preventDefault();
      // Synthetic event: reuse click handler behavior without leaking the event
      if (isDragging) return;
      if (onClick) {
        onClick(icon);
        return;
      }
      if (isSafeUrl(icon.url)) {
        openWebsite(icon.url, openBehavior);
      } else {
        console.error('Blocked unsafe URL:', icon.url);
      }
    }
  };

  // Sortable attributes (exclude if manually handling drag handle, but sticking to standard item drag here)
  const sortableAttrs = { ...attributes, ...listeners };

  // Icon size based on settings
  const iconSizeClass =
    iconStyle.size === 'small'
      ? 'w-10 h-10'
      : iconStyle.size === 'large'
        ? 'w-14 h-14'
        : 'w-12 h-12';

  // Container size
  const containerSize =
    iconStyle.size === 'small'
      ? 'w-20 h-24'
      : iconStyle.size === 'large'
        ? 'w-28 h-32'
        : 'w-24 h-28';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col items-center justify-center p-2',
        containerSize,
        'transition-all duration-300 ease-out',
        'cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40',

        // Glassmorphism Base Styles
        'bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl',
        'border border-white/50 dark:border-white/5',
        'shadow-glass',

        // Hover Effects (Enhanced)
        'hover:shadow-glass-hover hover:-translate-y-1 hover:shadow-glow-orange',
        'hover:bg-white/80 dark:hover:bg-zinc-800/60',
        'hover:border-white/70 dark:hover:border-white/10',

        // Selected State
        isSelected && 'ring-2 ring-brand-orange-500 bg-white/80 dark:bg-zinc-800/60',

        // Dragging State
        isDragging && 'opacity-60 blur-sm scale-105 z-50',

        // Overlay State (for drag preview)
        isOverlay && 'shadow-2xl scale-105 z-50 !opacity-90 !blur-none cursor-grabbing'
      )}
      {...sortableAttrs}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      aria-label={icon.title}
    >
      {/* Icon Content Container */}
      <div
        className={cn(
          iconSizeClass,
          'flex items-center justify-center mb-2',
          'transition-transform duration-300',
          'group-hover:scale-110' // Inner icon scale on hover
        )}
      >
        {/* Icon image or text */}
        {icon.icon.type === 'text' ? (
          // Text icon
          <div
            className="w-full h-full flex items-center justify-center text-2xl font-bold text-white shadow-sm"
            style={{
              backgroundColor: icon.icon.color || '#3b82f6',
              borderRadius: `${iconStyle.borderRadius * 0.5}%` // Slightly softer radius for inner
            }}
          >
            {icon.icon.value}
          </div>
        ) : (
          // Image icon with safe React fallback (no DOM mutations)
          imageFallback === 'text' ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 text-zinc-500 font-bold rounded-lg text-xl">
              {icon.title.charAt(0).toUpperCase()}
            </div>
          ) : (
            <img
              src={resolvedIconSrc || ''}
              alt={icon.title}
              className="w-full h-full object-contain drop-shadow-sm"
              loading="lazy"
              onError={() => {
                setImageFallback((prev) => {
                  if (prev === 'none') return 'duckduckgo';
                  return 'text';
                });
              }}
            />
          )
        )}
      </div>

      {/* Title with CSS variable styling */}
      {iconStyle.showName && (
        <span
          className={cn(
            'font-medium text-center px-1 w-full',
            'truncate',
            'transition-colors duration-200'
          )}
          style={{
            fontSize: 'var(--icon-font-size)',
            color: 'var(--icon-font-color)',
            textShadow: 'var(--icon-text-shadow)',
          }}
        >
          {icon.title}
        </span>
      )}

      {/* Selection/Hover Indicator Dot (Optional embellishment) */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-orange-500 shadow-glow-orange" />
      )}
    </div>
  );
}

export default IconItem;
