/**
 * SearchSection - Search bar settings
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { Toggle } from '../components/Toggle';
import { Slider } from '../components/Slider';

export const SearchSection: React.FC = () => {
  const { t } = useTranslation();
  const searchSettings = useSettingsStore((state) => state.searchSettings);
  const setSearchSettings = useSettingsStore((state) => state.setSearchSettings);

  return (
    <CollapsibleSection
      id="search"
      title={t('settings.search.title', '搜索框')}
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <Toggle
          label={t('settings.search.hidden', '隐藏搜索框')}
          checked={searchSettings.hidden}
          onChange={(checked) => setSearchSettings({ hidden: checked })}
        />

        <Toggle
          label={t('settings.search.showSuggestions', '显示搜索建议')}
          checked={searchSettings.showSuggestions}
          onChange={(checked) => setSearchSettings({ showSuggestions: checked })}
        />

        <Toggle
          label={t('settings.search.clearAfterSearch', '保留搜索框内容')}
          checked={!searchSettings.clearAfterSearch}
          onChange={(checked) => setSearchSettings({ clearAfterSearch: !checked })}
        />

        <Toggle
          label={t('settings.search.showButton', '隐藏搜索类别')}
          checked={!searchSettings.showButton}
          onChange={(checked) => setSearchSettings({ showButton: !checked })}
        />

        <Slider
          label={t('settings.search.borderRadius', '搜索框圆角')}
          value={searchSettings.borderRadius}
          min={0}
          max={50}
          onChange={(value) => setSearchSettings({ borderRadius: value })}
        />
      </div>
    </CollapsibleSection>
  );
};

export default SearchSection;
