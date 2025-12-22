/**
 * LayoutSection - Grid layout settings with preset cards and custom options
 * Features:
 * - Preset layout cards (2x4, 2x5, 2x6, 2x7, 3x3, custom)
 * - Custom layout modal for detailed configuration
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2 } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { CustomLayoutModal } from '../components/CustomLayoutModal';
import { Toggle } from '../components/Toggle';

// Preset layout options
const LAYOUT_PRESETS = [
  { rows: 2, columns: 4, label: '2x4' },
  { rows: 2, columns: 5, label: '2x5' },
  { rows: 2, columns: 6, label: '2x6' },
  { rows: 2, columns: 7, label: '2x7' },
  { rows: 3, columns: 3, label: '3x3' },
];

// Layout preview grid component
const LayoutPreviewGrid: React.FC<{
  rows: number;
  columns: number;
  selected: boolean;
  onClick: () => void;
  label: string;
}> = ({ rows, columns, selected, onClick, label }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2"
    >
      <div
        className={`
          w-[88px] h-[60px] p-1.5
          flex items-center justify-center
          rounded-lg
          border-2
          transition-all duration-200
          ${selected
            ? 'bg-white dark:bg-gray-800 border-gray-900 dark:border-white'
            : 'bg-gray-100 dark:bg-gray-800 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
      >
        <div
          className="w-full h-full grid gap-[2px]"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {Array.from({ length: rows * columns }).map((_, i) => {
            // Checkerboard pattern for selected state
            const row = Math.floor(i / columns);
            const col = i % columns;
            const isEven = (row + col) % 2 === 0;

            let bgClass: string;
            if (selected) {
              // Checkerboard effect for all selected layouts
              bgClass = isEven
                ? 'bg-gray-700 dark:bg-gray-200'
                : 'bg-gray-200 dark:bg-gray-600';
            } else {
              // Uniform gray for unselected
              bgClass = 'bg-gray-300 dark:bg-gray-600';
            }

            return (
              <div
                key={i}
                className={`rounded-[2px] ${bgClass}`}
              />
            );
          })}
        </div>
      </div>
      <span className={`text-xs ${selected ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
        {label}
      </span>
    </button>
  );
};

// Custom layout icon
const CustomLayoutIcon: React.FC<{ selected: boolean }> = ({ selected }) => (
  <div className={`
    w-[88px] h-[60px] p-2 flex items-center justify-center rounded-lg
    border-2 transition-all duration-200
    ${selected
      ? 'bg-white dark:bg-gray-800 border-gray-900 dark:border-white'
      : 'bg-gray-100 dark:bg-gray-800 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
    }
  `}>
    <Settings2 className={`w-6 h-6 ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />
  </div>
);

export const LayoutSection: React.FC = () => {
  const { t } = useTranslation();
  const viewSettings = useSettingsStore((state) => state.viewSettings);
  const setViewSettings = useSettingsStore((state) => state.setViewSettings);

  // Check if current layout matches a preset
  const currentPreset = LAYOUT_PRESETS.find(
    (p) => p.rows === viewSettings.rows && p.columns === viewSettings.columns
  );

  // Custom mode is active if no preset matches
  const [isCustomMode, setIsCustomMode] = useState(!currentPreset);

  // Control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync isCustomMode when viewSettings changes externally
  useEffect(() => {
    const matchesPreset = LAYOUT_PRESETS.some(
      (p) => p.rows === viewSettings.rows && p.columns === viewSettings.columns
    );
    if (matchesPreset && isCustomMode) {
      setIsCustomMode(false);
    } else if (!matchesPreset && !isCustomMode) {
      setIsCustomMode(true);
    }
  }, [viewSettings.rows, viewSettings.columns, isCustomMode]);

  // Handle preset selection
  const handlePresetSelect = (preset: typeof LAYOUT_PRESETS[0]) => {
    setViewSettings({
      rows: preset.rows,
      columns: preset.columns,
    });
    setIsCustomMode(false);
  };

  // Handle custom mode
  const handleCustomClick = () => {
    setIsCustomMode(true);
    setIsModalOpen(true);
  };

  return (
    <>
      <CollapsibleSection
        id="layout"
        title={t('settings.layout.title', '布局')}
      >
        {/* Layout Presets */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {LAYOUT_PRESETS.map((preset) => (
            <LayoutPreviewGrid
              key={preset.label}
              rows={preset.rows}
              columns={preset.columns}
              label={preset.label}
              selected={!isCustomMode && currentPreset?.label === preset.label}
              onClick={() => handlePresetSelect(preset)}
            />
          ))}

          {/* Custom option */}
          <button
            type="button"
            onClick={handleCustomClick}
            className="flex flex-col items-center gap-2"
          >
            <CustomLayoutIcon selected={isCustomMode} />
            <span className={`text-xs ${isCustomMode ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {t('settings.layout.custom', '自定义')}
            </span>
          </button>
        </div>

        {/* Info text when custom mode is active */}
        {isCustomMode && (
          <div className="flex items-center justify-between py-2 px-1 mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {viewSettings.rows} × {viewSettings.columns}
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('settings.layout.editConfig', '编辑配置')}
            </button>
          </div>
        )}

        {/* Auto Fill Grid Toggle */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Toggle
            label={t('settings.layout.autoFillGrid', '自动补位')}
            description={t('settings.layout.autoFillGridDesc', '开启后图标将自动填充空位，关闭则保留空白位置')}
            checked={viewSettings.autoFillGrid}
            onChange={(checked) => setViewSettings({ autoFillGrid: checked })}
          />
        </div>
      </CollapsibleSection>

      {/* Custom Layout Modal */}
      <CustomLayoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default LayoutSection;
