/**
 * IconSection - Icon display settings
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { Toggle } from '../components/Toggle';
import { Slider } from '../components/Slider';

export const IconSection: React.FC = () => {
  const { t } = useTranslation();
  const iconStyle = useSettingsStore((state) => state.iconStyle);
  const setIconStyle = useSettingsStore((state) => state.setIconStyle);

  return (
    <CollapsibleSection
      id="icon"
      title={t('settings.icon.title', '图标')}
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <Toggle
          label={t('settings.icon.hideName', '隐藏图标名称')}
          checked={!iconStyle.showName}
          onChange={(checked) => setIconStyle({ showName: !checked })}
        />

        <Toggle
          label={t('settings.icon.shadow', '图标阴影')}
          checked={iconStyle.shadow}
          onChange={(checked) => setIconStyle({ shadow: checked })}
        />

        <Toggle
          label={t('settings.icon.animation', '启动动画')}
          checked={iconStyle.animation !== 'none'}
          onChange={(checked) => setIconStyle({ animation: checked ? 'scale' : 'none' })}
        />

        <Slider
          label={t('settings.icon.borderRadius', '图标圆角')}
          value={iconStyle.borderRadius}
          min={0}
          max={50}
          onChange={(value) => setIconStyle({ borderRadius: value })}
        />

        <Slider
          label={t('settings.icon.opacity', '图标不透明度')}
          value={iconStyle.opacity}
          min={0}
          max={100}
          onChange={(value) => setIconStyle({ opacity: value })}
        />
      </div>
    </CollapsibleSection>
  );
};

export default IconSection;
