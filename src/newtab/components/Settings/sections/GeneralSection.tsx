/**
 * GeneralSection - Theme and language settings
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore, Theme } from '../../../stores/settingsStore';

export const GeneralSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const themes: Array<{ value: Theme; icon: React.ReactNode; label: string }> = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: t('settings.general.light', '浅色') },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: t('settings.general.dark', '深色') },
    { value: 'system', icon: <Monitor className="w-4 h-4" />, label: t('settings.general.system', '跟随系统') },
  ];

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <CollapsibleSection
      id="general"
      title={t('settings.general.title', '通用')}
    >
      {/* Theme Selection */}
      <div className="mb-4">
        <span className="text-sm text-gray-700 dark:text-gray-300 block mb-3">
          {t('settings.general.theme', '主题')}
        </span>
        <div className="flex gap-2">
          {themes.map(({ value, icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded
                transition-all duration-200
                ${theme === value
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {icon}
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div>
        <span className="text-sm text-gray-700 dark:text-gray-300 block mb-3">
          {t('settings.general.language', '语言')}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleLanguageChange('zh')}
            className={`
              px-4 py-2 rounded text-sm
              transition-all duration-200
              ${language === 'zh'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`
              px-4 py-2 rounded text-sm
              transition-all duration-200
              ${language === 'en'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            English
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default GeneralSection;
