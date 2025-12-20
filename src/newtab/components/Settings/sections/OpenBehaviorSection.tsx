/**
 * OpenBehaviorSection - Settings for how links should open (new tab vs current tab)
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore, OpenBehavior } from '../../../stores/settingsStore';
import { Toggle } from '../components/Toggle';

export const OpenBehaviorSection: React.FC = () => {
  const { t } = useTranslation();
  const openBehavior = useSettingsStore((state) => state.openBehavior);
  const setOpenBehavior = useSettingsStore((state) => state.setOpenBehavior);

  const handleChange = (key: keyof OpenBehavior, newTab: boolean) => {
    setOpenBehavior({ [key]: newTab ? 'new_tab' : 'current_tab' });
  };

  return (
    <CollapsibleSection
      id="openBehavior"
      title={t('settings.openBehavior.title', '目标打开方式')}
      subtitle={t('settings.openBehavior.subtitle', '仅作用于Infinity内部模块')}
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <Toggle
          label={t('settings.openBehavior.websites', '在新标签页中打开网站')}
          checked={openBehavior.websites === 'new_tab'}
          onChange={(checked) => handleChange('websites', checked)}
        />
        <Toggle
          label={t('settings.openBehavior.searchResults', '在新标签页中打开第三方搜索结果')}
          checked={openBehavior.searchResults === 'new_tab'}
          onChange={(checked) => handleChange('searchResults', checked)}
        />
        <Toggle
          label={t('settings.openBehavior.bookmarks', '在新标签页中打开书签链接')}
          checked={openBehavior.bookmarks === 'new_tab'}
          onChange={(checked) => handleChange('bookmarks', checked)}
        />
        <Toggle
          label={t('settings.openBehavior.history', '在新标签页中打开历史记录')}
          checked={openBehavior.history === 'new_tab'}
          onChange={(checked) => handleChange('history', checked)}
        />
      </div>
    </CollapsibleSection>
  );
};

export default OpenBehaviorSection;
