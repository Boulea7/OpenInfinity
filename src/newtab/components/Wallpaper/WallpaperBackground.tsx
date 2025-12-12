import { useState, useEffect, useCallback } from 'react';
import { useWallpaperStore } from '../../stores';
import { cn } from '../../utils';

interface WallpaperBackgroundProps {
  className?: string;
}

/**
 * WallpaperBackground Component
 * Renders the wallpaper background with effects (blur, mask, brightness)
 * Supports: local images, URLs, solid colors, gradients, Bing daily
 */
export function WallpaperBackground({ className }: WallpaperBackgroundProps) {
  const {
    currentUrl,
    activeSource,
    solidColor,
    gradient,
    effects,
    loadWallpaper,
  } = useWallpaperStore();

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Load wallpaper on mount
  useEffect(() => {
    loadWallpaper();
  }, [loadWallpaper]);

  // Reset states when URL changes
  useEffect(() => {
    if (currentUrl) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [currentUrl]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  // Calculate CSS filter based on effects
  const filterStyle = {
    filter: [
      effects.blur > 0 ? `blur(${effects.blur / 5}px)` : '',
      effects.brightness !== 100 ? `brightness(${effects.brightness / 100})` : '',
      effects.grayscale ? 'grayscale(1)' : '',
    ]
      .filter(Boolean)
      .join(' ') || 'none',
  };

  // Render gradient background
  const renderGradient = () => {
    const directionMap: Record<string, string> = {
      'to-r': 'to right',
      'to-l': 'to left',
      'to-t': 'to top',
      'to-b': 'to bottom',
      'to-br': 'to bottom right',
      'to-bl': 'to bottom left',
      'to-tr': 'to top right',
      'to-tl': 'to top left',
    };

    const direction = directionMap[gradient.direction] || 'to bottom right';
    const colorStops = gradient.colors.join(', ');

    return {
      background: `linear-gradient(${direction}, ${colorStops})`,
    };
  };

  // Render background based on source type
  const renderBackground = () => {
    // Solid color
    if (activeSource === 'solid') {
      return (
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{ backgroundColor: solidColor, ...filterStyle }}
        />
      );
    }

    // Gradient
    if (activeSource === 'gradient') {
      return (
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{ ...renderGradient(), ...filterStyle }}
        />
      );
    }

    // Image-based sources (local, url, unsplash, bing, etc.)
    if (currentUrl && !imageError) {
      return (
        <>
          {/* Preload image */}
          <img
            src={currentUrl}
            alt=""
            className="hidden"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Actual background */}
          <div
            className={cn(
              'absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              backgroundImage: `url(${currentUrl})`,
              ...filterStyle,
              // Slight scale to hide edges when blurred
              transform: effects.blur > 0 ? 'scale(1.1)' : 'none',
            }}
          />

          {/* Loading placeholder gradient while image loads */}
          {!imageLoaded && (
            <div
              className="absolute inset-0 transition-opacity duration-500"
              style={renderGradient()}
            />
          )}
        </>
      );
    }

    // Fallback: default gradient
    return (
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, #8b5cf6, #6366f1, #3b82f6)',
          ...filterStyle,
        }}
      />
    );
  };

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Background layer */}
      {renderBackground()}

      {/* Mask overlay */}
      {effects.maskOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black transition-opacity duration-300"
          style={{ opacity: effects.maskOpacity / 100 }}
        />
      )}
    </div>
  );
}

export default WallpaperBackground;
