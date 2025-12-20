/**
 * ViewSection - View and display settings
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { Toggle } from '../components/Toggle';
import { Slider } from '../components/Slider';

export const ViewSection: React.FC = () => {
  const { t } = useTranslation();
  const viewSettings = useSettingsStore((state) => state.viewSettings);
  const setViewSettings = useSettingsStore((state) => state.setViewSettings);

  return (
    <CollapsibleSection
      id="view"
      title={t('settings.view.title', '视图')}
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <Slider
          label={t('settings.view.zoom', '屏幕缩放')}
          value={viewSettings.zoom}
          min={50}
          max={150}
          onChange={(value) => setViewSettings({ zoom: value })}
        />

        <Toggle
          label={t('settings.view.showRandomWallpaper', '在右下角显示随机壁纸按钮')}
          checked={viewSettings.randomWallpaper}
          onChange={(checked) => setViewSettings({ randomWallpaper: checked })}
        />

        <Toggle
          label={t('settings.view.showTopSites', '在顶部显示常用网站')}
          checked={viewSettings.showTopSites}
          onChange={(checked) => setViewSettings({ showTopSites: checked })}
        />

        <Toggle
          label={t('settings.view.showBookmarks', '在顶部显示书签')}
          checked={viewSettings.showBookmarks}
          onChange={(checked) => setViewSettings({ showBookmarks: checked })}
        />

        <Toggle
          label={t('settings.view.showPagination', '翻页按钮')}
          checked={viewSettings.showPagination}
          onChange={(checked) => setViewSettings({ showPagination: checked })}
        />

        <Toggle
          label={t('settings.view.showClock', '显示时钟')}
          checked={viewSettings.showClock}
          onChange={(checked) => setViewSettings({ showClock: checked })}
        />

        <Toggle
          label={t('settings.view.showWeather', '显示天气')}
          checked={viewSettings.showWeather}
          onChange={(checked) => setViewSettings({ showWeather: checked })}
        />
      </div>
    </CollapsibleSection>
  );
};

export default ViewSection;
