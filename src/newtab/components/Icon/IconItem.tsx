import React, { useEffect, useMemo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import type { Icon } from '../../services/database';
import { useShallow } from 'zustand/shallow';
import { useSettingsStore } from '../../stores';
import { cn, getFaviconUrl, getGoogleFaviconUrl, getClearbitLogoUrl } from '../../utils';
import { openWebsite, isSafeUrl } from '../../utils/navigation';

interface IconItemProps {
  icon: Icon;
  isDragging?: boolean;
  isSelected?: boolean;
  isOverlay?: boolean;
  isDeleteMode?: boolean;
  onContextMenu?: (_e: React.MouseEvent, _icon: Icon) => void;
  onClick?: (_icon: Icon) => void;
  onDelete?: (_iconId: string) => void;
}

/**
 * IconItem Component
 * Renders a single website icon with Infinity Pro style:
 * - Circular icon area (transparent bg for favicon, colored bg for text icons)
 * - Title displayed BELOW the circle
 * - Smooth hover and drag animations
 *
 * Wrapped with React.memo for performance optimization during drag operations
 */
export const IconItem = React.memo(function IconItem({
  icon,
  isDragging: externalDragging,
  isSelected = false,
  isOverlay = false,
  isDeleteMode = false,
  onContextMenu,
  onClick,
  onDelete,
}: IconItemProps) {
  const { iconStyle, viewSettings, openBehavior } = useSettingsStore(
    useShallow((state) => ({
      iconStyle: state.iconStyle,
      viewSettings: state.viewSettings,
      openBehavior: state.openBehavior,
    }))
  );
  // Multi-source fallback chain for maximum icon clarity:
  // none (primary) → clearbit → google256 → duckduckgo → text
  const [imageFallback, setImageFallback] = useState<
    'none' | 'clearbit' | 'google256' | 'duckduckgo' | 'text'
  >('none');

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

  // Calculate transform style for drag
  // IMPORTANT: When isOverlay=true, we're in DragOverlay which already handles positioning
  // Applying useSortable's transform would cause double-transform (flash/jump bug)
  const style = useMemo(
    () => ({
      transform: isOverlay ? undefined : CSS.Transform.toString(transform),
      transition: isOverlay ? undefined : transition,
    }),
    [transform, transition, isOverlay]
  );

  // Get icon source URL (adapt to new icon structure)
  const iconSrc = useMemo(() => {
    if (icon.icon.type === 'custom' || icon.icon.type === 'favicon') {
      // Use provided icon value (base64, svg, or URL); empty string is invalid
      const value = (icon.icon.value || '').trim();
      if (value) return value;
    }
    if (icon.icon.type === 'text') {
      // Text icons rendered separately
      return null;
    }
    // Fallback to high-resolution favicon service (256px for Retina displays)
    return getGoogleFaviconUrl(icon.url, 256);
  }, [icon.icon, icon.url]);

  // Resolve icon source based on fallback chain
  const resolvedIconSrc = useMemo(() => {
    if (!iconSrc) return null;
    switch (imageFallback) {
      case 'clearbit':
        return getClearbitLogoUrl(icon.url);
      case 'google256':
        return getGoogleFaviconUrl(icon.url, 256);
      case 'duckduckgo':
        return getFaviconUrl(icon.url);
      default:
        return iconSrc;
    }
  }, [iconSrc, imageFallback, icon.url]);

  // Handle click (P0-3: stop propagation to prevent background click)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // In delete mode, clicking does nothing (use X button to delete)
    if (isDeleteMode || isDragging) return;

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

  // Sortable attributes
  const sortableAttrs = { ...attributes, ...listeners };

  // Dynamic icon size calculation
  // Formula: Base - (Cols adjustment) - (Rows adjustment) => scale factor
  const calculateIconSize = () => {
    const { columns, rows, iconScale } = viewSettings;

    // Base size calculation logic
    // We start from a base of 100px and subtract based on density
    // This provides the "larger when sparse, smaller when dense" behavior
    const baseSize = 100;
    const colAdjustment = Math.max(0, (columns - 4) * 5);
    const rowAdjustment = Math.max(0, (rows - 3) * 5);

    // Calculate raw size based on density
    const densitySize = baseSize - colAdjustment - rowAdjustment;

    // Apply user scale preference (10-100, mapped to 0.5-1.5 multiplier roughly, or direct percentage)
    // Using simple percentage of the densitySize:
    // If scale is 100, we get full densitySize. If 50, we get half.
    // We map 0-100 scale to 0.4 - 1.2 multiplier range for better usability
    const scaleMultiplier = 0.4 + (iconScale / 100) * 0.8;

    const finalSize = densitySize * scaleMultiplier;

    // Safety clamp (48px - 96px)
    return Math.min(96, Math.max(48, finalSize));
  };

  const iconSizePx = calculateIconSize();
  const iconSizeStyle = { width: `${iconSizePx}px`, height: `${iconSizePx}px` };

  // Container width (slightly larger than icon to hold text)
  // We make it proportional to icon size to prevent text from looking disconnected
  const containerWidthPx = iconSizePx * 1.3;

  // Border radius percentage for circle
  const borderRadiusValue = `${iconStyle.borderRadius}%`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-icon-item
      className={cn(
        // Flex column layout: icon circle on top, text below
        'group relative flex flex-col items-center',
        'py-2 px-1',
        'transition-all duration-300 ease-out',
        'cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40',

        // NO background on container (transparent)

        // Hover effect: lift up (disabled in delete mode to avoid animation conflict)
        !isDeleteMode && 'hover:-translate-y-1',

        // NOTE: shake animation moved to inner wrapper to avoid conflicting with dnd-kit transform

        // Selected state
        isSelected && 'scale-105',

        // Dragging state: hide original completely (overlay shows the dragged item)
        isDragging && !isOverlay && 'opacity-0',

        // Overlay state (drag preview): full opacity, elevated
        isOverlay && 'opacity-100 scale-110 z-50 cursor-grabbing'
      )}
      {...sortableAttrs}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      aria-label={icon.title}
    >
      {/* Inner wrapper for shake animation (keeps dnd-kit transform on outer container) */}
      <div className={cn('flex flex-col items-center', isDeleteMode && 'animate-shake')}>
        {/* Icon Circle positioning wrapper - provides context for delete button */}
        <div className="relative">
          {/* Icon Circle Container - ONLY contains the icon, no text */}
          <div
            className={cn(
              'flex items-center justify-center',
              'transition-transform duration-300 ease-out',
              'group-hover:scale-110',
              // Selected ring
              isSelected && 'ring-2 ring-brand-orange-500 ring-offset-2 ring-offset-transparent'
            )}
            style={{
              ...iconSizeStyle,
              borderRadius: borderRadiusValue,
              // Transparent bg for favicon, colored bg for text icons
              backgroundColor: icon.icon.type === 'text' ? (icon.icon.color || '#3b82f6') : 'transparent',
              // Drop shadow for visibility on any wallpaper
              filter: 'drop-shadow(1px 1px 5px rgba(0, 0, 0, 0.25))',
            }}
          >
            {/* Icon content */}
            {icon.icon.type === 'text' ? (
              // Text icon: letter/emoji centered
              <span className="text-2xl font-bold text-white select-none">
                {icon.icon.value}
              </span>
            ) : (
              // Image icon: favicon or custom
              imageFallback === 'text' ? (
                // Fallback: first letter with background (use icon color if available)
                <div
                  className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
                  style={{
                    backgroundColor: icon.icon.color || '#6b7280',
                    borderRadius: borderRadiusValue,
                  }}
                >
                  {icon.title.charAt(0).toUpperCase()}
                </div>
              ) : (
                <img
                  src={resolvedIconSrc || ''}
                  alt={icon.title}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="w-full h-full object-contain"
                  style={{
                    borderRadius: borderRadiusValue,
                    // Optimize image rendering: auto for SVG quality, crisp-edges for pixel-perfect PNG
                    imageRendering: resolvedIconSrc?.endsWith('.svg') ? 'auto' : 'crisp-edges',
                    // GPU acceleration for smooth transforms
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                  }}
                  loading="lazy"
                  decoding="async"
                  onError={() => {
                    // Progressive fallback chain for maximum icon availability
                    setImageFallback((prev) => {
                      switch (prev) {
                        case 'none':
                          return 'clearbit';
                        case 'clearbit':
                          return 'google256';
                        case 'google256':
                          return 'duckduckgo';
                        default:
                          return 'text';
                      }
                    });
                  }}
                />
              )
            )}
          </div>

          {/* Selection indicator dot - positioned to intersect with icon circle edge */}
          {isSelected && !isDeleteMode && (
            <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 w-2.5 h-2.5 rounded-full bg-brand-orange-500 shadow-glow-orange" />
          )}

          {/* iOS-style delete button - positioned to intersect with icon circle edge */}
          {isDeleteMode && (
            <button
              type="button"
              className={cn(
                'absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 z-20',
                'w-5 h-5 rounded-full',
                'bg-white/60 dark:bg-gray-800/60',
                'backdrop-blur-sm',
                'flex items-center justify-center',
                'hover:bg-white/80 dark:hover:bg-gray-800/80',
                'transition-colors duration-150',
                'shadow-sm'
              )}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete?.(icon.id);
              }}
              aria-label="Delete icon"
            >
              <X className="w-3 h-3 text-gray-700 dark:text-gray-300" />
            </button>
          )}
        </div>

        {/* Title BELOW the circle with CSS variable styling */}
        {iconStyle.showName && (
          <span
            className={cn(
              'mt-2 font-medium text-center',
              'truncate', // Ellipsis for overflow
              'transition-colors duration-200'
            )}
            style={{
              width: `${containerWidthPx}px`,
              fontSize: 'var(--icon-font-size, 12px)',
              color: 'var(--icon-font-color, #ffffff)',
              textShadow: 'var(--icon-text-shadow, 1px 1px 3px rgba(0,0,0,0.5))',
            }}
          >
            {icon.title}
          </span>
        )}
      </div> {/* End inner wrapper */}
    </div>
  );
});

// Display name for React DevTools
IconItem.displayName = 'IconItem';

export default IconItem;
