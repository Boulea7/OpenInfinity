/**
 * SettingsPanelV2 - New vertical scrolling settings panel
 *
 * Features:
 * - Single page vertical scroll layout (no sidebar tabs)
 * - Mode switcher at top (Standard/Minimal)
 * - All sections are collapsible
 * - Square corners design
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';

// All section IDs for checking collapse state
const ALL_SECTION_IDS = [
  'wallpaper', 'openBehavior', 'notification', 'view', 'minimalMode', 'layout',
  'icon', 'system-icons', 'search', 'font', 'animation', 'reset',
  'general', 'clock', 'weather', 'backup', 'about',
];

// Section components
import { ModeSwitcher } from './ModeSwitcher';
import { WallpaperSection } from './sections/WallpaperSection';
import { WallpaperPickerModal } from './WallpaperPickerModal';
import { OpenBehaviorSection } from './sections/OpenBehaviorSection';
import { NotificationSection } from './sections/NotificationSection';
import { ViewSection } from './sections/ViewSection';
import { MinimalModeSection } from './sections/MinimalModeSection';
import { LayoutSection } from './sections/LayoutSection';
import { IconSection } from './sections/IconSection';
import { SystemIconsSection } from './sections/SystemIconsSection';
import { SearchSection } from './sections/SearchSection';
import { FontSection } from './sections/FontSection';
import { AnimationSection } from './sections/AnimationSection';
import { ResetSection } from './sections/ResetSection';
import { GeneralSection } from './sections/GeneralSection';
import { ClockSection } from './sections/ClockSection';
import { WeatherSection } from './sections/WeatherSection';
import { BackupSection } from './sections/BackupSection';
import { AboutSection } from './sections/AboutSection';

interface SettingsPanelV2Props {
  className?: string;
}

export const SettingsPanelV2: React.FC<SettingsPanelV2Props> = ({ className = '' }) => {
  const { t } = useTranslation();
  const collapsedSections = useSettingsStore((state) => state.collapsedSections);
  const setAllSectionsCollapsed = useSettingsStore((state) => state.setAllSectionsCollapsed);

  // Wallpaper picker modal state
  const [isWallpaperPickerOpen, setIsWallpaperPickerOpen] = useState(false);

  // Check if all sections are currently collapsed
  const allCollapsed = useMemo(() => {
    return ALL_SECTION_IDS.every((id) => collapsedSections[id] === true);
  }, [collapsedSections]);

  // Toggle all sections expand/collapse
  const handleToggleAll = () => {
    setAllSectionsCollapsed(!allCollapsed);
  };

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-gray-900 ${className}`}>
      {/* Wallpaper Picker Modal - conditionally rendered for performance */}
      {isWallpaperPickerOpen && (
        <WallpaperPickerModal
          isOpen={isWallpaperPickerOpen}
          onClose={() => setIsWallpaperPickerOpen(false)}
        />
      )}
      {/* Header with mode switcher - single line layout */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-shrink-0">
            {t('settings.title', '设置')}
          </h2>

          {/* Mode Switcher - centered */}
          <ModeSwitcher className="flex-1" />

          {/* Toggle expand/collapse all button */}
          <button
            type="button"
            onClick={handleToggleAll}
            className="
              p-1.5 rounded flex-shrink-0
              text-gray-500 dark:text-gray-400
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
            "
            title={allCollapsed
              ? t('settings.expandAll', '展开全部')
              : t('settings.collapseAll', '收起全部')
            }
          >
            <ChevronDown
              className={`
                w-4 h-4
                transition-transform duration-300 ease-out
                ${allCollapsed ? 'rotate-0' : 'rotate-180'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Scrollable content - gray background with white cards */}
      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950">
        <div className="p-3 space-y-3">
          {/* Primary sections (per design order) */}
          <WallpaperSection onOpenPicker={() => setIsWallpaperPickerOpen(true)} />
          <OpenBehaviorSection />
          <NotificationSection />
          <ViewSection />
          <MinimalModeSection />
          <LayoutSection />
          <IconSection />
          <SystemIconsSection />
          <SearchSection />
          <FontSection />
          <AnimationSection />
          <ResetSection />

          {/* Secondary sections (migrated from old layout) */}
          <GeneralSection />
          <ClockSection />
          <WeatherSection />
          <BackupSection />
          <AboutSection />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanelV2;
