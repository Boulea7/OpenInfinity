/**
 * WallpaperCard - Interactive wallpaper preview card with hover actions
 *
 * Features:
 * - Image thumbnail with hover zoom effect
 * - Favorite button (bottom-left, heart icon)
 * - Like button with count (bottom-right)
 * - Smooth hover transitions for action buttons
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, ThumbsUp } from 'lucide-react';
import type { PresetWallpaper } from '../../../data/presetWallpapers';

interface WallpaperCardProps {
  wallpaper: PresetWallpaper;
  onSelect: (wallpaper: PresetWallpaper) => void;
  onFavorite: (wallpaper: PresetWallpaper) => void;
  onLike: (wallpaper: PresetWallpaper) => void;
  isFavorited: boolean;
  isLiked: boolean;
  likeCount: number;
}

export const WallpaperCard: React.FC<WallpaperCardProps> = ({
  wallpaper,
  onSelect,
  onFavorite,
  onLike,
  isFavorited,
  isLiked,
  likeCount,
}) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Handle favorite click (prevent bubbling to select)
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite(wallpaper);
  };

  // Handle like click (prevent bubbling to select)
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(wallpaper);
  };

  // Format like count (e.g., 1234 -> 1.2k)
  const formatLikeCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Keyboard handler for accessibility (div with role="button")
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(wallpaper);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(wallpaper)}
      onKeyDown={handleKeyDown}
      className="
        group relative aspect-[16/10] rounded-xl overflow-hidden
        bg-gray-100 dark:bg-gray-800
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        transition-shadow hover:shadow-lg cursor-pointer
      "
    >
      {/* Skeleton loader */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          <span className="text-sm text-gray-400">{t('common.loadFailed', 'Load failed')}</span>
        </div>
      )}

      {/* Wallpaper image */}
      <img
        src={wallpaper.thumbnailUrl}
        alt={`Wallpaper by ${wallpaper.author}`}
        className={`
          w-full h-full object-cover
          transition-all duration-300 ease-out
          group-hover:scale-105
          ${imageLoaded ? 'opacity-100' : 'opacity-0'}
        `}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        loading="lazy"
      />

      {/* Hover overlay gradient */}
      <div className="
        absolute inset-0
        bg-gradient-to-t from-black/50 via-transparent to-transparent
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
      " />

      {/* Bottom action bar - visible on hover */}
      <div className="
        absolute bottom-0 left-0 right-0 p-2.5
        flex items-center justify-between
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
      ">
        {/* Favorite button (left) */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`
            p-1.5 rounded-full backdrop-blur-sm
            transition-all duration-200
            hover:scale-110
            ${isFavorited
              ? 'bg-red-500/90 text-white'
              : 'bg-black/40 text-white/90 hover:bg-black/60'
            }
          `}
          title={isFavorited ? t('common.unfavorite', 'Unfavorite') : t('common.favorite', 'Favorite')}
        >
          <Heart
            className="w-4 h-4"
            fill={isFavorited ? 'currentColor' : 'none'}
          />
        </button>

        {/* Like button with count (right) */}
        <button
          type="button"
          onClick={handleLikeClick}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm
            text-xs font-medium
            transition-all duration-200
            hover:scale-105
            ${isLiked
              ? 'bg-blue-500/90 text-white'
              : 'bg-black/40 text-white/90 hover:bg-black/60'
            }
          `}
          title={isLiked ? t('common.liked', 'Liked') : t('common.like', 'Like')}
        >
          <ThumbsUp
            className="w-3.5 h-3.5"
            fill={isLiked ? 'currentColor' : 'none'}
          />
          <span>{formatLikeCount(likeCount)}</span>
        </button>
      </div>

      {/* Author attribution (top-right, always visible on hover) */}
      <div className="
        absolute top-2 right-2
        px-2 py-0.5 rounded-full
        bg-black/30 backdrop-blur-sm
        text-[10px] text-white/80
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
      ">
        {wallpaper.author}
      </div>
    </div>
  );
};

export default WallpaperCard;
