import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallpaperStore, useSettingsStore } from '../../stores';
import { cn } from '../../utils';
import { useShallow } from 'zustand/react/shallow';

interface WallpaperBackgroundProps {
  className?: string;
}

interface ImageLayerState {
  url: string | null;
  loaded: boolean;
  error: boolean;
}

/**
 * WallpaperBackground Component
 * Renders the wallpaper background with effects (blur, mask, brightness)
 * Supports: local images, URLs, solid colors, gradients, Bing daily
 */
export function WallpaperBackground({ className }: WallpaperBackgroundProps) {
  const { currentUrl, activeSource, solidColor, gradient, effects } = useWallpaperStore(
    useShallow((state) => ({
      currentUrl: state.currentUrl,
      activeSource: state.activeSource,
      solidColor: state.solidColor,
      gradient: state.gradient,
      effects: state.effects,
    }))
  );

  const minimalMode = useSettingsStore((state) => state.minimalMode);
  const animationIntensity = useSettingsStore((state) => state.viewSettings.animationIntensity);

  const [layer1, setLayer1] = useState<ImageLayerState>({ url: null, loaded: false, error: false });
  const [layer2, setLayer2] = useState<ImageLayerState>({ url: null, loaded: false, error: false });
  const [activeLayer, setActiveLayer] = useState<1 | 2>(1);

  // Wallpaper initialization is handled by App.tsx to prevent race conditions
  // WallpaperBackground only renders the current wallpaper state

  // Double-buffer strategy:
  // - Keep currently visible layer as-is (avoid flicker)
  // - Load new URL into the inactive layer
  // - Swap active layer only after the new image has loaded
  useEffect(() => {
    if (!currentUrl) return;
    if (activeSource === 'solid' || activeSource === 'gradient') return;

    const layer1Url = layer1.url;
    const layer2Url = layer2.url;

    const activeUrl = activeLayer === 1 ? layer1Url : layer2Url;
    if (activeUrl === currentUrl) return;

    const nextLayer: 1 | 2 = activeLayer === 1 ? 2 : 1;
    const nextUrl = nextLayer === 1 ? layer1Url : layer2Url;
    if (nextUrl === currentUrl) return;

    if (nextLayer === 1) {
      setLayer1({ url: currentUrl, loaded: false, error: false });
    } else {
      setLayer2({ url: currentUrl, loaded: false, error: false });
    }
  }, [activeLayer, activeSource, currentUrl, layer1.url, layer2.url]);

  const handleLayerLoad = useCallback((layer: 1 | 2) => {
    if (layer === 1) {
      setLayer1((prev) => ({ ...prev, loaded: true, error: false }));
    } else {
      setLayer2((prev) => ({ ...prev, loaded: true, error: false }));
    }
    setActiveLayer(layer);
  }, []);

  const handleLayerError = useCallback((layer: 1 | 2) => {
    if (layer === 1) {
      setLayer1((prev) => ({ ...prev, loaded: false, error: true }));
    } else {
      setLayer2((prev) => ({ ...prev, loaded: false, error: true }));
    }
  }, []);

  // Calculate CSS filter based on effects with performance-aware blur capping
  const filterStyle = useMemo(() => {
    // Calculate blur cap based on performance mode
    const getBlurCap = () => {
      if (minimalMode) return 0;
      switch (animationIntensity) {
        case 'none': return 0;
        case 'light': return 5;
        case 'normal': return 10;
        case 'heavy': return 15;
        default: return 10;
      }
    };

    const blurCap = getBlurCap();
    const cappedBlur = Math.min(effects.blur / 5, blurCap);

    return {
      filter: [
        cappedBlur > 0 ? `blur(${cappedBlur}px)` : '',
        effects.brightness !== 100 ? `brightness(${effects.brightness / 100})` : '',
        effects.grayscale ? 'grayscale(1)' : '',
      ]
        .filter(Boolean)
        .join(' ') || 'none',
    };
  }, [effects.blur, effects.brightness, effects.grayscale, minimalMode, animationIntensity]);

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
          className="absolute inset-0 transition-[background-color,filter] duration-500"
          style={{ backgroundColor: solidColor, ...filterStyle }}
        />
      );
    }

    // Gradient
    if (activeSource === 'gradient') {
      return (
        <div
          className="absolute inset-0 transition-[background-image,filter] duration-500"
          style={{ ...renderGradient(), ...filterStyle }}
        />
      );
    }

    // Image-based sources (local, url, unsplash, bing, etc.)
    if (currentUrl || layer1.url || layer2.url) {
      const imageStyle = {
        ...filterStyle,
        // Slight scale to hide edges when blurred
        transform: effects.blur > 0 ? 'scale(1.1)' : 'none',
      };

      return (
        <>
          {/* Fallback background (always behind images) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: '#1a1a1a',
              ...filterStyle,
            }}
          />

          {/* Layer 1 */}
          {layer1.url && !layer1.error && (
            <img
              src={layer1.url}
              alt=""
              aria-hidden="true"
              decoding="async"
              className={cn(
                'absolute inset-0 h-full w-full select-none object-cover object-center',
                'pointer-events-none transition-opacity duration-700',
                activeLayer === 1 ? 'opacity-100' : 'opacity-0'
              )}
              style={imageStyle}
              onLoad={() => handleLayerLoad(1)}
              onError={() => handleLayerError(1)}
            />
          )}

          {/* Layer 2 */}
          {layer2.url && !layer2.error && (
            <img
              src={layer2.url}
              alt=""
              aria-hidden="true"
              decoding="async"
              className={cn(
                'absolute inset-0 h-full w-full select-none object-cover object-center',
                'pointer-events-none transition-opacity duration-700',
                activeLayer === 2 ? 'opacity-100' : 'opacity-0'
              )}
              style={imageStyle}
              onLoad={() => handleLayerLoad(2)}
              onError={() => handleLayerError(2)}
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
          backgroundColor: '#1a1a1a',
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
