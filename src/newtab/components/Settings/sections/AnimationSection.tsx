/**
 * AnimationSection - Animation style selection with preview cards
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';

// Animation preview card component
const AnimationCard: React.FC<{
  type: 'none' | 'light' | 'normal' | 'heavy';
  label: string;
  selected: boolean;
  onClick: () => void;
}> = ({ type, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex flex-col items-center gap-2"
  >
    <div className={`
      w-full aspect-[4/3] rounded-lg
      flex items-center justify-center
      border-2 transition-all duration-200
      ${selected
        ? 'bg-gray-100 dark:bg-gray-800 border-gray-900 dark:border-white'
        : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
      }
    `}>
      <div
        className={`
          w-12 h-8 rounded
          ${selected ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'}
          ${type === 'light' ? 'animate-bounce' : ''}
          ${type === 'normal' ? 'animate-pulse' : ''}
          ${type === 'heavy' ? 'animate-ping' : ''}
        `}
      />
    </div>
    <span className={`
      text-xs font-medium
      ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
    `}>
      {label}
    </span>
  </button>
);

export const AnimationSection: React.FC = () => {
  const { t } = useTranslation();
  const viewSettings = useSettingsStore((state) => state.viewSettings);
  const setViewSettings = useSettingsStore((state) => state.setViewSettings);

  const animations: Array<{
    type: 'none' | 'light' | 'normal' | 'heavy';
    label: string;
  }> = [
      { type: 'none', label: t('settings.animation.default', '默认') },
      { type: 'light', label: t('settings.animation.bounce', '回弹') },
      { type: 'normal', label: t('settings.animation.fade', '淡入') },
      { type: 'heavy', label: t('settings.animation.heavy', '强烈') },
    ];

  return (
    <CollapsibleSection
      id="animation"
      title={t('settings.animation.title', '动画')}
      subtitle={t('settings.animation.subtitle', '仅作用于Infinity内部模块')}
    >
      <div className="grid grid-cols-4 gap-3">
        {animations.map(({ type, label }) => (
          <AnimationCard
            key={type}
            type={type}
            label={label}
            selected={viewSettings.animationIntensity === type}
            onClick={() => setViewSettings({ animationIntensity: type })}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
};

export default AnimationSection;
