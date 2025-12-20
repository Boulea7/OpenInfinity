/**
 * MinimalModeSection - Minimal mode settings
 * Controls the simplified interface mode that shows only search bar, clock, and weather
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { Toggle } from '../components/Toggle';

export const MinimalModeSection: React.FC = () => {
  const { t } = useTranslation();
  const minimalMode = useSettingsStore((state) => state.minimalMode);
  const setMinimalMode = useSettingsStore((state) => state.setMinimalMode);
  const minimalModeSettings = useSettingsStore((state) => state.minimalModeSettings);
  const setMinimalModeSettings = useSettingsStore((state) => state.setMinimalModeSettings);

  return (
    <CollapsibleSection
      id="minimalMode"
      title={t('settings.minimalMode.title', '极简模式')}
      subtitle={t('settings.minimalMode.subtitle', '简化界面，只保留核心功能')}
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {/* Enable Minimal Mode */}
        <Toggle
          label={t('settings.minimalMode.enable', '启用极简模式')}
          description={t('settings.minimalMode.enableDesc', '仅显示搜索框、时钟和天气')}
          checked={minimalMode}
          onChange={(checked) => setMinimalMode(checked)}
        />

        {/* Show ViewSwitcher - only visible when minimal mode is enabled */}
        <div
          className={`
            transition-all duration-300 ease-out overflow-hidden
            ${minimalMode ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <Toggle
            label={t('settings.minimalMode.showViewSwitcher', '显示便签入口')}
            description={t('settings.minimalMode.showViewSwitcherDesc', '在极简模式下显示搜索/便签切换按钮')}
            checked={minimalModeSettings.showViewSwitcher}
            onChange={(checked) => setMinimalModeSettings({ showViewSwitcher: checked })}
          />
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default MinimalModeSection;
