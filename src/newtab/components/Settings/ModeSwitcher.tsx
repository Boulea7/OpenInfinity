/**
 * ModeSwitcher - Segmented control for switching between Standard and Minimal mode
 * Placed at the top of settings panel
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settingsStore';

export interface ModeSwitcherProps {
  className?: string;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const minimalMode = useSettingsStore((state) => state.minimalMode);
  const setMinimalMode = useSettingsStore((state) => state.setMinimalMode);

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="
        inline-flex
        bg-gray-100 dark:bg-gray-800
        rounded-md
        p-1
        gap-1
      ">
        {/* Standard Mode Button */}
        <button
          type="button"
          onClick={() => setMinimalMode(false)}
          className={`
            px-4 py-1.5
            text-sm font-medium
            rounded-md
            transition-all duration-200
            focus:outline-none 
            ${!minimalMode
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-transparent'
            }
          `}
          aria-pressed={!minimalMode}
        >
          {t('settings.mode.standard', '标准模式')}
        </button>

        {/* Minimal Mode Button */}
        <button
          type="button"
          onClick={() => setMinimalMode(true)}
          className={`
            px-4 py-1.5
            text-sm font-medium
            rounded-md
            transition-all duration-200
            focus:outline-none
            ${minimalMode
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-transparent'
            }
          `}
          aria-pressed={minimalMode}
        >
          {t('settings.mode.minimal', '极简模式')}
        </button>
      </div>
    </div>
  );
};

export default ModeSwitcher;
