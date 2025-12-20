/**
 * WallpaperSection - Wallpaper settings with preview, hover effect, and sliders
 * Features:
 * - Current wallpaper preview
 * - Hover overlay with "Change Wallpaper" button
 * - Download button at top-right
 * - Mask opacity slider
 * - Blur slider
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Image as ImageIcon } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { useWallpaperStore } from '../../../stores/wallpaperStore';
import { Slider } from '../components/Slider';

interface WallpaperSectionProps {
  onOpenPicker?: () => void;
}

export const WallpaperSection: React.FC<WallpaperSectionProps> = ({
  onOpenPicker,
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  // Wallpaper store
  const currentUrl = useWallpaperStore((state) => state.currentUrl);
  const effects = useWallpaperStore((state) => state.effects);
  const setEffects = useWallpaperStore((state) => state.setEffects);

  // Handle download wallpaper
  const handleDownload = async () => {
    if (!currentUrl) return;

    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallpaper-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download wallpaper:', error);
    }
  };

  return (
    <CollapsibleSection
      id="wallpaper"
      title={t('settings.wallpaper.title', '壁纸')}
    >
      {/* Wallpaper Preview */}
      <div
        className="relative aspect-video overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800 rounded-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Current wallpaper */}
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="Current wallpaper"
            className="w-full h-full object-cover"
            style={{
              filter: `blur(${effects.blur}px) brightness(${effects.brightness / 100})`,
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Mask overlay (always visible based on maskOpacity) */}
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: effects.maskOpacity / 100 }}
        />

        {/* Hover overlay with change button */}
        <div
          className={`
            absolute inset-0
            bg-black/50
            flex items-center justify-center
            transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <button
            type="button"
            onClick={onOpenPicker}
            className="
              px-4 py-2
              bg-white/90 dark:bg-gray-800/90
              text-gray-900 dark:text-white
              text-sm font-medium
              hover:bg-white dark:hover:bg-gray-700
              transition-colors
            "
          >
            {t('settings.wallpaper.change', '更换壁纸')}
          </button>
        </div>

        {/* Download button (always visible at top-right) */}
        <button
          type="button"
          onClick={handleDownload}
          className="
            absolute top-2 right-2
            w-8 h-8
            bg-white/80 dark:bg-gray-800/80
            flex items-center justify-center
            hover:bg-white dark:hover:bg-gray-700
            transition-colors
          "
          title={t('settings.wallpaper.download', '下载壁纸')}
        >
          <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Mask Opacity Slider */}
      <Slider
        label={t('settings.wallpaper.maskOpacity', '遮罩浓度')}
        value={effects.maskOpacity}
        min={0}
        max={100}
        onChange={(value) => setEffects({ maskOpacity: value })}
      />

      {/* Blur Slider */}
      <Slider
        label={t('settings.wallpaper.blur', '模糊度')}
        value={effects.blur}
        min={0}
        max={100}
        onChange={(value) => setEffects({ blur: value })}
      />
    </CollapsibleSection>
  );
};

export default WallpaperSection;
