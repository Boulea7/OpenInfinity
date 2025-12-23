/**
 * CustomLayoutPanel - Compact sidebar-embedded panel for custom layout settings
 *
 * Key differences from CustomLayoutModal:
 * - No Modal wrapper - renders inline within LayoutSection
 * - Real-time rendering - updates store directly (no local state)
 * - Compact design - only 5 sliders, no preview area
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Slider } from './Slider';
import { useSettingsStore } from '../../../stores/settingsStore';

interface CustomLayoutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomLayoutPanel: React.FC<CustomLayoutPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const viewSettings = useSettingsStore((state) => state.viewSettings);
  const setViewSettings = useSettingsStore((state) => state.setViewSettings);

  // Direct store update for real-time rendering
  const updateSetting = (key: keyof typeof viewSettings, value: number) => {
    setViewSettings({ [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="mt-4 p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {t('settings.layout.customTitle', '自定义布局')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('common.close', '关闭')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid Dimensions */}
      <div className="space-y-1">
        <Slider
          label={t('settings.layout.rows', '行数')}
          value={viewSettings.rows}
          min={1}
          max={8}
          unit=""
          onChange={(v) => updateSetting('rows', v)}
        />

        <Slider
          label={t('settings.layout.columns', '列数')}
          value={viewSettings.columns}
          min={1}
          max={8}
          unit=""
          onChange={(v) => updateSetting('columns', v)}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-3" />

      {/* Spacing & Size */}
      <div className="space-y-1">
        <Slider
          label={t('settings.layout.columnGap', '列间距')}
          value={viewSettings.columnGap}
          min={0}
          max={100}
          onChange={(v) => updateSetting('columnGap', v)}
        />

        <Slider
          label={t('settings.layout.rowGap', '行间距')}
          value={viewSettings.rowGap}
          min={0}
          max={100}
          onChange={(v) => updateSetting('rowGap', v)}
        />

        <Slider
          label={t('settings.layout.iconSize', '图标大小')}
          value={viewSettings.iconScale}
          min={10}
          max={100}
          onChange={(v) => updateSetting('iconScale', v)}
        />
      </div>

      {/* Current dimensions display */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {viewSettings.rows} × {viewSettings.columns} • {viewSettings.iconScale}% {t('settings.layout.size', '大小')}
        </span>
      </div>
    </div>
  );
};

export default CustomLayoutPanel;
