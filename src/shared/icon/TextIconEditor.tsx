import { useTranslation } from 'react-i18next';
import type { TextIconConfig } from './types';
import { PRESET_COLORS } from './types';

interface Props {
  config: TextIconConfig;
  onChange: (config: TextIconConfig) => void;
}

/**
 * TextIconEditor - Shared component for editing text-based icons
 *
 * Allows user to:
 * - Enter 1-2 characters for the icon
 * - Adjust font size
 * - Select background color from presets or custom
 */
export default function TextIconEditor({ config, onChange }: Props) {
  const { t } = useTranslation();
  const { text, fontSize, color } = config;

  const updateConfig = (updates: Partial<TextIconConfig>) => {
    onChange({ ...config, ...updates });
  };

  // Handle manual text input
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({
      text: e.target.value.slice(0, 2),
      isManuallyEdited: true,
    });
  };

  return (
    <div className="space-y-3">
      {/* Text Input */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          {t('iconTypeSelector.displayText')}
        </label>
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder={t('iconTypeSelector.textPlaceholder')}
          maxLength={2}
          className="w-full px-3 py-2 text-center text-lg font-bold tracking-widest
                     bg-zinc-50 dark:bg-zinc-800
                     border border-zinc-200 dark:border-zinc-700
                     rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50
                     text-zinc-900 dark:text-zinc-100
                     placeholder-zinc-400 dark:placeholder-zinc-500
                     transition-all"
        />
      </div>

      {/* Font Size Slider */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          {t('iconTypeSelector.fontSize')}: {fontSize}px
        </label>
        <input
          type="range"
          min="40"
          max="200"
          value={fontSize}
          onChange={(e) => updateConfig({ fontSize: Number(e.target.value) })}
          className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-orange-500"
        />
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          {t('iconTypeSelector.backgroundColor')}
        </label>
        <div className="flex flex-wrap gap-2 justify-between">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateConfig({ color: c })}
              className={`
                flex-shrink-0 w-6 h-6 rounded-lg transition-all duration-200
                ${
                  color === c
                    ? 'ring-2 ring-offset-1 ring-brand-orange-500 scale-105'
                    : 'hover:scale-105 ring-1 ring-black/5 dark:ring-white/10'
                }
              `}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}

          {/* Custom Color Picker */}
          <label
            className={`
              flex-shrink-0 w-6 h-6 rounded-lg cursor-pointer transition-all duration-200
              relative overflow-hidden flex items-center justify-center
              ${
                !PRESET_COLORS.includes(color as typeof PRESET_COLORS[number])
                  ? 'ring-2 ring-offset-1 ring-brand-orange-500 scale-105'
                  : 'ring-1 ring-zinc-200 dark:ring-zinc-700 hover:ring-zinc-400'
              }
            `}
            style={{
              background:
                'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
            }}
            title={t('iconTypeSelector.customColor')}
          >
            <input
              type="color"
              value={color}
              onChange={(e) => updateConfig({ color: e.target.value })}
              className="absolute inset-0 opacity-0 w-[200%] h-[200%] -top-[50%] -left-[50%] cursor-pointer p-0 border-0"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </label>
        </div>
      </div>
    </div>
  );
}
