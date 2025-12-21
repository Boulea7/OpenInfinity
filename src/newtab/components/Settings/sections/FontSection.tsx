/**
 * FontSection - Font settings with color picker
 */

import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { Toggle } from '../components/Toggle';
import { Slider } from '../components/Slider';

// Preset colors for font (8 colors to fit in one row with custom picker)
const FONT_COLORS = [
  { color: '#ffffff', name: 'white' },
  { color: '#ef4444', name: 'red' },
  { color: '#f97316', name: 'orange' },
  { color: '#eab308', name: 'yellow' },
  { color: '#22c55e', name: 'green' },
  { color: '#3b82f6', name: 'blue' },
  { color: '#8b5cf6', name: 'purple' },
  { color: '#000000', name: 'black' },
];

export const FontSection: React.FC = () => {
  const { t } = useTranslation();
  const fontSettings = useSettingsStore((state) => state.fontSettings);
  const setFontSettings = useSettingsStore((state) => state.setFontSettings);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Handle custom color selection
  const handleCustomColorClick = () => {
    colorInputRef.current?.click();
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSettings({ color: e.target.value });
  };

  // Check if current color is a custom color (not in presets)
  const isCustomColor = !FONT_COLORS.some(({ color }) => color === fontSettings.color);

  return (
    <CollapsibleSection
      id="font"
      title={t('settings.font.title', '字体')}
    >
      {/* Font Shadow Toggle */}
      <Toggle
        label={t('settings.font.shadow', '字体阴影')}
        checked={fontSettings.shadow}
        onChange={(checked) => setFontSettings({ shadow: checked })}
      />

      {/* Font Size Slider */}
      <Slider
        label={t('settings.font.size', '字体大小')}
        value={fontSettings.size}
        min={10}
        max={32}
        unit=""
        onChange={(value) => setFontSettings({ size: value })}
      />

      {/* Font Color Picker */}
      <div>
        <span className="text-sm text-gray-700 dark:text-gray-300 block mb-3">
          {t('settings.font.color', '字体颜色')}
        </span>
        <div className="flex flex-wrap gap-2">
          {/* Default/None color option (transparent/default) if needed, design shows checkmark on first item which looks gray/default */}
          {/* The image shows a checkmark on a gray looking circle first, then red, yellow etc. */}
          {/* Assuming the first one is white or default text color. FONT_COLORS start with white. */}

          {FONT_COLORS.map(({ color, name }) => (
            <button
              key={name}
              type="button"
              onClick={() => setFontSettings({ color })}
              className={`
                w-8 h-8 rounded-full
                flex items-center justify-center
                transition-all
                ${fontSettings.color === color
                  ? 'scale-110 ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-700'
                  : 'hover:scale-105'
                }
              `}
              style={{ backgroundColor: color }}
              title={name}
            >
              {fontSettings.color === color && (
                <Check
                  className="w-4 h-4"
                  style={{
                    color: ['#ffffff', '#eab308', '#22c55e'].includes(color) ? '#000' : '#fff'
                  }}
                />
              )}
            </button>
          ))}

          {/* Custom color picker button */}
          <button
            type="button"
            onClick={handleCustomColorClick}
            className={`
              w-8 h-8 rounded-full relative
              hover:scale-105 transition-all
              ${isCustomColor
                ? 'scale-110 ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-700'
                : ''
              }
            `}
            style={{
              background: isCustomColor
                ? fontSettings.color
                : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
            }}
            title={t('settings.font.custom', '自定义颜色')}
          >
            {isCustomColor && (
              <Check
                className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ color: '#fff' }}
              />
            )}
          </button>
          {/* Hidden color input */}
          <input
            ref={colorInputRef}
            type="color"
            value={fontSettings.color}
            onChange={handleCustomColorChange}
            className="sr-only"
            aria-label={t('settings.font.custom', '自定义颜色')}
          />
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default FontSection;
