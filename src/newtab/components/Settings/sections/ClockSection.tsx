/**
 * ClockSection - Clock and timezone settings
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { Toggle } from '../components/Toggle';

export const ClockSection: React.FC = () => {
  const { t } = useTranslation();
  const clockSettings = useSettingsStore((state) => state.clockSettings);
  const setClockSettings = useSettingsStore((state) => state.setClockSettings);

  return (
    <CollapsibleSection
      id="clock"
      title={t('settings.clock.title', '时钟')}
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {/* Time Format */}
        <div className="py-3">
          <span className="text-sm text-gray-700 dark:text-gray-300 block mb-2">
            {t('settings.clock.format', '时间格式')}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setClockSettings({ format: '12h' })}
              className={`
                px-4 py-2 rounded text-sm
                ${clockSettings.format === '12h'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              12{t('settings.clock.hour', '小时')}
            </button>
            <button
              type="button"
              onClick={() => setClockSettings({ format: '24h' })}
              className={`
                px-4 py-2 rounded text-sm
                ${clockSettings.format === '24h'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              24{t('settings.clock.hour', '小时')}
            </button>
          </div>
        </div>

        <Toggle
          label={t('settings.clock.showSeconds', '显示秒数')}
          checked={clockSettings.showSeconds}
          onChange={(checked) => setClockSettings({ showSeconds: checked })}
        />

        <Toggle
          label={t('settings.clock.autoDetect', '自动检测时区')}
          checked={clockSettings.autoDetect}
          onChange={(checked) => setClockSettings({ autoDetect: checked })}
        />
      </div>
    </CollapsibleSection>
  );
};

export default ClockSection;
