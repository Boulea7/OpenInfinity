import { useMemo } from 'react';
import type { Icon } from '../../services/database';
import { cn, getGoogleFaviconUrl } from '../../utils';

interface MergePreviewOverlayProps {
  /** The icon being dragged (source) */
  sourceIcon: Icon;
  /** The icon being hovered over (target) */
  targetIcon: Icon;
  /** Whether the merge is ready to be executed (hover threshold met) */
  isMergeReady: boolean;
}

/**
 * MergePreviewOverlay Component
 *
 * Displays a preview of two icons merging into a folder during drag operations.
 * Shows a 2x2 grid with both icons and empty slots, simulating a folder preview.
 *
 * Features:
 * - Glassmorphism folder container style
 * - Supports all icon types (favicon, custom, text)
 * - Pulse animation when merge is ready
 * - "Folder" label hint on ready state
 */
export function MergePreviewOverlay({
  sourceIcon,
  targetIcon,
  isMergeReady,
}: MergePreviewOverlayProps) {
  /**
   * Resolves the image source URL for an icon based on its type.
   * Falls back to Google favicon service for icons without explicit sources.
   */
  const getIconSrc = (icon: Icon): string => {
    if (icon.icon.type === 'favicon' || icon.icon.type === 'custom') {
      const value = (icon.icon.value || '').trim();
      if (value) return value;
    }

    // Fallback to Google favicon for URL-based resolution
    try {
      const url = new URL(icon.url);
      return getGoogleFaviconUrl(url.href, 64);
    } catch {
      return '';
    }
  };

  const sourceIconSrc = useMemo(() => getIconSrc(sourceIcon), [sourceIcon]);
  const targetIconSrc = useMemo(() => getIconSrc(targetIcon), [targetIcon]);

  /**
   * Renders a single icon preview cell within the 2x2 grid.
   * Handles text icons with colored backgrounds and image icons with fallbacks.
   */
  const renderIconCell = (icon: Icon, iconSrc: string) => {
    // Text icon: render colored background with letter/emoji
    if (icon.icon.type === 'text') {
      return (
        <div
          className="w-full h-full flex items-center justify-center text-xs font-bold text-white rounded-lg"
          style={{ backgroundColor: icon.icon.color || '#3b82f6' }}
        >
          {icon.icon.value}
        </div>
      );
    }

    // Image icon: render with fallback to first letter
    if (iconSrc) {
      return (
        <img
          src={iconSrc}
          alt={icon.title}
          className="w-full h-full object-contain rounded-lg"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      );
    }

    // Fallback: first letter of title with gray background
    return (
      <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-gray-400 text-white rounded-lg">
        {(icon.title?.[0] || '?').toUpperCase()}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Folder preview container with glassmorphism effect */}
      <div
        className={cn(
          'w-20 h-20 rounded-2xl',
          'bg-white/20 backdrop-blur-lg',
          'border border-white/30',
          'flex items-center justify-center',
          'shadow-xl shadow-black/20',
          'transition-all duration-300',
          // Orange ring indicator when merge is ready
          isMergeReady &&
            'ring-2 ring-brand-orange-500 ring-offset-2 ring-offset-transparent'
        )}
      >
        {/* 2x2 preview grid showing both icons */}
        <div className="grid grid-cols-2 gap-1 p-2">
          {/* Source icon cell */}
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/20">
            {renderIconCell(sourceIcon, sourceIconSrc)}
          </div>

          {/* Target icon cell */}
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/20">
            {renderIconCell(targetIcon, targetIconSrc)}
          </div>

          {/* Empty slots for visual balance (simulating folder capacity) */}
          <div className="w-7 h-7 rounded-lg bg-white/10" />
          <div className="w-7 h-7 rounded-lg bg-white/10" />
        </div>
      </div>

      {/* Animated pulse ring when merge is ready */}
      {isMergeReady && (
        <div className="absolute inset-0 rounded-2xl animate-ping-slow bg-brand-orange-500/20 pointer-events-none" />
      )}

      {/* "Folder" label hint - only visible when merge is ready */}
      <div
        className={cn(
          'absolute -bottom-6 left-1/2 -translate-x-1/2',
          'px-2 py-0.5 rounded-md',
          'bg-black/50 text-white text-xs font-medium',
          'whitespace-nowrap',
          'transition-opacity duration-200',
          isMergeReady ? 'opacity-100' : 'opacity-0'
        )}
      >
        文件夹
      </div>
    </div>
  );
}

export default MergePreviewOverlay;
