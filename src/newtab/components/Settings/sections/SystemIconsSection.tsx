/**
 * SystemIconsSection - Manage visibility of system shortcuts
 *
 * Allows users to show/hide the 9 default system shortcuts
 * that appear on the new tab page.
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useIconStore } from '../../../stores/iconStore';
import { Toggle } from '../components/Toggle';
import { SYSTEM_ICONS } from '../../../services/systemIcons';
import type { SystemIconId } from '../../../services/database';

export const SystemIconsSection: React.FC = () => {
  const { t } = useTranslation();
  const systemIconSettings = useSettingsStore((state) => state.systemIconSettings);
  const setSystemIconVisibility = useSettingsStore((state) => state.setSystemIconVisibility);
  const { restoreSystemIcon, hideSystemIcon } = useIconStore();

  // Handle visibility toggle for a system icon
  const handleToggle = useCallback(async (iconId: SystemIconId, visible: boolean) => {
    // Update settings store
    setSystemIconVisibility(iconId, visible);

    // Update icon store (show/hide the actual icon)
    if (visible) {
      await restoreSystemIcon(iconId);
    } else {
      await hideSystemIcon(iconId);
    }
  }, [setSystemIconVisibility, restoreSystemIcon, hideSystemIcon]);

  return (
    <CollapsibleSection
      id="system-icons"
      title={t('settings.systemIcons.title', '系统快捷方式')}
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <div className="py-2 px-4 text-sm text-gray-500 dark:text-gray-400">
          {t('settings.systemIcons.description', '控制首页显示哪些系统快捷方式。删除的快捷方式可以在这里恢复。')}
        </div>

        {SYSTEM_ICONS.map((icon) => (
          <Toggle
            key={icon.id}
            label={icon.name}
            description={icon.nameEn}
            checked={systemIconSettings.visibility[icon.id] ?? true}
            onChange={(checked) => handleToggle(icon.id, checked)}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
};

export default SystemIconsSection;
