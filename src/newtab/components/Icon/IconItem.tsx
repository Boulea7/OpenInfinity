import React, { useEffect, useMemo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Edit3 } from 'lucide-react';
import type { Icon, WeatherCache } from '../../services/database';
import { useShallow } from 'zustand/shallow';
import { useSettingsStore } from '../../stores';
import { cn, getFaviconUrl, getGoogleFaviconUrl, getClearbitLogoUrl } from '../../utils';
import { openWebsite, isSafeUrl } from '../../utils/navigation';
import { handleSystemIconClick, isSystemIcon } from '../../utils/systemIconHandlers';
import { getSystemIconComponent, WeatherIcon } from '../../assets/icons/system';

/**
 * Get weather background color based on condition
 */
function getWeatherBackgroundColor(condition?: string): string {
  if (!condition) return '#60a5fa, #3b82f6'; // Default blue

  const lower = condition.toLowerCase();

  if (lower.includes('晴') || lower.includes('clear') || lower.includes('sunny')) {
    return '#fcd34d, #f59e0b'; // Yellow/Orange
  }
  if (lower.includes('云') || lower.includes('cloud') || lower.includes('overcast')) {
    return '#9ca3af, #6b7280'; // Gray
  }
  if (lower.includes('雨') || lower.includes('rain') || lower.includes('shower')) {
    return '#60a5fa, #3b82f6'; // Blue
  }
  if (lower.includes('雪') || lower.includes('snow')) {
    return '#e0f2fe, #7dd3fc'; // Light blue
  }
  if (lower.includes('雾') || lower.includes('fog') || lower.includes('mist') || lower.includes('霾')) {
    return '#d1d5db, #9ca3af'; // Light gray
  }
  if (lower.includes('雷') || lower.includes('storm') || lower.includes('thunder')) {
    return '#6b7280, #374151'; // Dark gray
  }

  return '#60a5fa, #3b82f6'; // Default blue
}

/**
 * Render system icon content
 */
function renderSystemIcon(icon: Icon, weather?: WeatherCache | null): React.ReactNode {
  // Prefer systemIconId for stable mapping (supports legacy DB values like "system-weather").
  const iconName = icon.systemIconId?.replace('system-', '') || icon.icon.value;
  const IconComponent = getSystemIconComponent(iconName || '');

  if (!IconComponent) {
    // Fallback to first letter
    return (
      <span className="text-2xl font-bold text-gray-600 select-none">
        {icon.title.charAt(0).toUpperCase()}
      </span>
    );
  }

  // Special rendering for weather icon: show weather icon + temperature
  if (icon.systemIconId === 'system-weather' && weather?.current) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <WeatherIcon size={24} className="mb-1" />
        <span className="text-lg font-bold text-white drop-shadow-md">
          {Math.round(weather.current.temperature)}°
        </span>
      </div>
    );
  }

  return <IconComponent size={38} />;
}

interface IconItemProps {
  icon: Icon;
  weather?: WeatherCache | null; // P0 Fix: Passed from parent to avoid N subscriptions
  isDragging?: boolean;
  isSelected?: boolean;
  isOverlay?: boolean;
  isDeleteMode?: boolean;
  isDeleting?: boolean; // Exit animation state
  isMergeTarget?: boolean; // Whether this icon is a merge target (folder creation)
  isMergeReady?: boolean; // Merge is ready (500ms hold completed)
  mergeProgress?: number; // Merge progress 0-1
  onContextMenu?: (_e: React.MouseEvent, _icon: Icon) => void;
  onClick?: (_icon: Icon) => void;
  onEdit?: (_icon: Icon) => void;
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
  weather,
  isDragging: externalDragging,
  isSelected = false,
  isOverlay = false,
  isDeleteMode = false,
  isDeleting = false,
  isMergeTarget = false,
  isMergeReady = false,
  mergeProgress = 0,
  onContextMenu,
  onClick,
  onEdit,
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
  // primary → clearbit → duckduckgo → text
  // Note: If primary is already Google, we skip directly to clearbit/duckduckgo
  const [imageFallback, setImageFallback] = useState<
    'none' | 'clearbit' | 'duckduckgo' | 'text'
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

  // P0 Fix: weather is now passed from parent (IconGrid) to avoid N subscriptions
  // Get icon source URL (adapt to new icon structure)
  const iconSrc = useMemo(() => {
    if (icon.icon.type === 'custom' || icon.icon.type === 'favicon') {
      // Use provided icon value (base64, svg, or URL); empty string is invalid
      const value = (icon.icon.value || '').trim();
      if (value) return value;
    }
    if (icon.icon.type === 'text' || icon.icon.type === 'system') {
      // Text and system icons rendered separately
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

    // Check if this is a system icon and handle it
    if (isSystemIcon(icon)) {
      handleSystemIconClick(icon);
      return;
    }

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
      if (isDragging) return;

      // Check if this is a system icon and handle it (consistent with handleClick)
      if (isSystemIcon(icon)) {
        handleSystemIconClick(icon);
        return;
      }

      if (onClick) {
        onClick(icon);
        return;
      }
      if (isSafeUrl(icon.url)) {
        openWebsite(icon.url, openBehavior);
      }
      // Removed console.error for unsafe URLs to avoid noise from system:// URLs
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
        'transition-[transform,opacity] duration-300 ease-out',
        'cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40',

        // NO background on container (transparent)

        // Hover effect: lift up (disabled in delete mode to avoid animation conflict)
        !isDeleteMode && !isDeleting && 'hover:-translate-y-1',

        // NOTE: shake animation moved to inner wrapper to avoid conflicting with dnd-kit transform

        // Selected state
        isSelected && !isDeleting && 'scale-105',

        // Dragging state: hide original completely (overlay shows the dragged item)
        isDragging && !isOverlay && 'opacity-0',

        // Overlay state (drag preview): full opacity, elevated
        isOverlay && 'opacity-100 scale-110 z-50 cursor-grabbing',

        // Exit animation: scale down and fade out
        isDeleting && 'scale-75 opacity-0 pointer-events-none'
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
          {/* Merge progress ring - shows circular progress during hover hold */}
          {isMergeTarget && mergeProgress > 0 && mergeProgress < 1 && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none z-10"
              style={{
                background: `conic-gradient(
                  rgba(249, 115, 22, 0.6) ${mergeProgress * 360}deg,
                  transparent ${mergeProgress * 360}deg
                )`,
                padding: '2px',
                mask: 'radial-gradient(transparent 55%, black 55%)',
                WebkitMask: 'radial-gradient(transparent 55%, black 55%)',
              }}
            />
          )}

          {/* Merge ready glow effect - pulsing ring when ready to merge */}
          {isMergeReady && (
            <div className="absolute inset-0 rounded-full bg-brand-orange-500/20 animate-ping-slow pointer-events-none z-10" />
          )}

          {/* Icon Circle Container - ONLY contains the icon, no text */}
          <div
            className={cn(
              'flex items-center justify-center',
              'transition-[transform,box-shadow] duration-300 ease-out',
              // In edit mode: no scale, use shadow for hover feedback
              // In normal mode: scale up on hover
              isDeleteMode
                ? 'group-hover:shadow-lg group-hover:shadow-black/30'
                : 'group-hover:scale-110',
              // Selected ring
              isSelected && 'ring-2 ring-brand-orange-500 ring-offset-2 ring-offset-transparent',
              // Merge target states - override normal hover effects
              isMergeTarget && !isMergeReady && 'scale-110 animate-merge-target',
              isMergeReady && 'scale-105 animate-pulse-subtle ring-2 ring-brand-orange-500'
            )}
            style={{
              ...iconSizeStyle,
              borderRadius: borderRadiusValue,
              // Background logic: weather uses gradient, system icons use white, text uses color, others transparent
              // Use isSystemIcon flag for reliable detection (supports legacy DB entries)
              background: icon.systemIconId === 'system-weather'
                ? `linear-gradient(135deg, ${getWeatherBackgroundColor(weather?.current?.condition)})`
                : (icon.isSystemIcon || icon.icon.type === 'system')
                  ? '#ffffff'
                  : icon.icon.type === 'text'
                    ? (icon.icon.color || '#3b82f6')
                    : 'transparent',
              // Drop shadow for visibility on any wallpaper
              filter: 'drop-shadow(1px 1px 5px rgba(0, 0, 0, 0.25))',
            }}
          >
            {/* Icon content */}
            {(icon.isSystemIcon || icon.icon.type === 'system') ? (
              // System icon: render SVG component
              renderSystemIcon(icon, weather)
            ) : icon.icon.type === 'text' ? (
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
                    // Progressive fallback chain: primary → clearbit → duckduckgo → text
                    // Simplified chain removes redundant google256 step
                    setImageFallback((prev) => {
                      switch (prev) {
                        case 'none':
                          return 'clearbit';
                        case 'clearbit':
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

          {/* Edit Overlay - Only visible in delete mode on hover, covers only the icon circle */}
          {/* System icons should NOT have edit overlay - they are not editable */}
          {isDeleteMode && !isSystemIcon(icon) && (
            <div
              className={cn(
                'absolute inset-0 z-10',
                'flex items-center justify-center',
                'bg-gray-400/50 dark:bg-gray-600/50',
                'backdrop-blur-[2px]',
                'opacity-0 group-hover:opacity-100',
                'transition-opacity duration-200',
                'cursor-pointer'
              )}
              style={{ borderRadius: borderRadiusValue }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // Prefer explicit edit handler; fallback to onClick for backward compatibility.
                onEdit?.(icon) ?? onClick?.(icon);
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center">
                <Edit3 size={18} strokeWidth={2.5} className="text-gray-700 dark:text-gray-200" />
              </div>
            </div>
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
