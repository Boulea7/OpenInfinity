import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Image,
  Grid3X3,
  Search,
  Layout,
  Type,
  Store,
  Download,
  Info,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { COMMON_TIMEZONES } from '../../data/timezones';
import { useSettingsStore, useWallpaperStore } from '../../stores';
import type { WallpaperSource, AutoChangeInterval } from '../../stores/wallpaperStore';
import type { IconStyle, SearchSettings, ViewSettings, FontSettings } from '../../stores/settingsStore';
import { APP_VERSION } from '../../constants/version';
import { SidePanel } from '../ui/SidePanel';
import { cn } from '../../utils';
import { ImportBookmarksButton } from './ImportBookmarksButton';

// Settings tab definitions
const SETTINGS_TABS = [
  { id: 'general', labelKey: 'settings.tabs.general', icon: Settings },
  { id: 'clock', labelKey: 'settings.tabs.clock', icon: Clock },
  { id: 'wallpaper', labelKey: 'settings.tabs.wallpaper', icon: Image },
  { id: 'icons', labelKey: 'settings.tabs.icons', icon: Grid3X3 },
  { id: 'search', labelKey: 'settings.tabs.search', icon: Search },
  { id: 'layout', labelKey: 'settings.tabs.layout', icon: Layout },
  { id: 'fonts', labelKey: 'settings.tabs.fonts', icon: Type },
  { id: 'marketplace', labelKey: 'settings.tabs.marketplace', icon: Store },
  { id: 'backup', labelKey: 'settings.tabs.backup', icon: Download },
  { id: 'about', labelKey: 'settings.tabs.about', icon: Info },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]['id'];

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean; // If true, render content only without SidePanel wrapper
  initialTab?: SettingsTab; // Initial active tab when panel opens
}

/**
 * SettingsPanel Component
 * Full settings interface with categorized tabs
 */
export function SettingsPanel({ isOpen, onClose, embedded = false, initialTab }: SettingsPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'general');

  // Update activeTab when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    iconStyle,
    setIconStyle,
    searchSettings,
    setSearchSettings,
    viewSettings,
    setViewSettings,
    fontSettings,
    setFontSettings,
    clockSettings,
    setClockSettings,
    resetToDefaults,
  } = useSettingsStore();

  const { activeSource, setActiveSource, effects, setEffects, autoChange, setAutoChange, searchQuery, setSearchQuery, fetchRandomWallpaper } = useWallpaperStore();

  // Handle reset all settings
  const handleResetAll = useCallback(() => {
    if (window.confirm(t('settings.resetAllConfirm'))) {
      resetToDefaults();
    }
  }, [resetToDefaults, t]);

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />;
      case 'clock':
        return <ClockSettings clockSettings={clockSettings} setClockSettings={setClockSettings} />;
      case 'wallpaper':
        return <WallpaperSettings activeSource={activeSource} setActiveSource={setActiveSource} effects={effects} setEffects={setEffects} autoChange={autoChange} setAutoChange={setAutoChange} searchQuery={searchQuery} setSearchQuery={setSearchQuery} fetchRandomWallpaper={fetchRandomWallpaper} />;
      case 'icons':
        return <IconSettings iconStyle={iconStyle} setIconStyle={setIconStyle} />;
      case 'search':
        return <SearchSettingsTab searchSettings={searchSettings} setSearchSettings={setSearchSettings} />;
      case 'layout':
        return <LayoutSettings viewSettings={viewSettings} setViewSettings={setViewSettings} />;
      case 'fonts':
        return <FontSettingsTab fontSettings={fontSettings} setFontSettings={setFontSettings} />;
      case 'marketplace':
        return <MarketplaceSettings />;
      case 'backup':
        return <BackupSettings />;
      case 'about':
        return <AboutSettings />;
      default:
        return null;
    }
  };

  // Settings content (sidebar + content area)
  const settingsContent = (
    <div className="flex h-full">
      {/* Sidebar */}
      <nav className="w-48 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
        <div className="py-4">
          {/* Reset All Button - moved to sidebar top */}
          <div className="px-4 mb-2">
            <button
              onClick={handleResetAll}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm',
                'text-gray-600 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'transition-colors duration-200'
              )}
            >
              <RotateCcw className="w-4 h-4" />
              {t('settings.resetAll')}
            </button>
          </div>

          {/* Tab List */}
          <ul>
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                      'transition-colors duration-200',
                      activeTab === tab.id
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t(tab.labelKey)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderTabContent()}
      </div>
    </div>
  );

  // If embedded mode, return content only
  if (embedded) {
    return settingsContent;
  }

  // Otherwise, wrap in SidePanel for modal usage
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.title')}
    >
      {settingsContent}
    </SidePanel>
  );
}

// General Settings Section
interface GeneralSettingsProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  language: string;
  setLanguage: (language: string) => void;
}

function GeneralSettings({ theme, setTheme, language, setLanguage }: GeneralSettingsProps) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lng: string) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
    // Persist to localStorage for consistency with i18n initialization
    localStorage.setItem('language', lng);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.general.title')}</h3>

      {/* Theme */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.general.theme')}
        </label>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => setTheme(themeOption)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm capitalize',
                'transition-colors duration-200',
                theme === themeOption
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              )}
            >
              {themeOption === 'light' && t('settings.general.light')}
              {themeOption === 'dark' && t('settings.general.dark')}
              {themeOption === 'system' && t('settings.general.system')}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.general.language')}
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleLanguageChange('zh')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm',
              'transition-colors duration-200',
              i18n.language === 'zh' || language === 'zh'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            )}
          >
            {t('settings.general.chinese')}
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm',
              'transition-colors duration-200',
              i18n.language === 'en' || language === 'en'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            )}
          >
            {t('settings.general.english')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Wallpaper Settings Section
interface WallpaperSettingsProps {
  activeSource: WallpaperSource;
  setActiveSource: (source: WallpaperSource) => void;
  effects: { blur: number; maskOpacity: number; brightness: number };
  setEffects: (effects: Partial<{ blur: number; maskOpacity: number; brightness: number }>) => void;
  autoChange: { enabled: boolean; interval: AutoChangeInterval; sources: WallpaperSource[] };
  setAutoChange: (config: Partial<{ enabled: boolean; interval: AutoChangeInterval; sources: WallpaperSource[] }>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchRandomWallpaper: (source?: WallpaperSource) => Promise<void>;
}

function WallpaperSettings({ activeSource, setActiveSource, effects, setEffects, autoChange, setAutoChange, searchQuery, setSearchQuery, fetchRandomWallpaper }: WallpaperSettingsProps) {
  const { t } = useTranslation();
  const wallpaperSources: { id: WallpaperSource; label: string }[] = [
    { id: 'local', label: t('settings.wallpaper.sources.local') },
    { id: 'custom', label: t('settings.wallpaper.sources.custom') },
    { id: 'solid', label: t('settings.wallpaper.sources.solid') },
    { id: 'gradient', label: t('settings.wallpaper.sources.gradient') },
    { id: 'bing', label: t('settings.wallpaper.sources.bing') },
    { id: 'unsplash', label: t('settings.wallpaper.sources.unsplash') },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.wallpaper.title')}</h3>

      {/* Wallpaper Source */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.wallpaper.source')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {wallpaperSources.map((source) => (
            <button
              key={source.id}
              onClick={() => setActiveSource(source.id)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm',
                'transition-colors duration-200',
                activeSource === source.id
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              )}
            >
              {source.label}
            </button>
          ))}
        </div>
      </div>

      {/* Effects */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.wallpaper.effects')}
        </label>

        {/* Blur */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{t('settings.wallpaper.blur')}</span>
            <span>{effects.blur}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={effects.blur}
            onChange={(e) => setEffects({ blur: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Mask Opacity */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{t('settings.wallpaper.maskOpacity')}</span>
            <span>{effects.maskOpacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={effects.maskOpacity}
            onChange={(e) => setEffects({ maskOpacity: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Brightness */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{t('settings.wallpaper.brightness')}</span>
            <span>{effects.brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={effects.brightness}
            onChange={(e) => setEffects({ brightness: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* Search Query Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t('settings.wallpaper.searchPreferences')}
        </h4>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('settings.wallpaper.searchQuery')}
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('settings.wallpaper.searchQueryPlaceholder')}
            className={cn(
              'w-full px-3 py-2 rounded-lg',
              'bg-gray-50 dark:bg-gray-700',
              'border border-gray-300 dark:border-gray-600',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('settings.wallpaper.searchQueryHint')}
          </p>
        </div>
      </div>

      {/* Auto-Change Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('settings.wallpaper.autoChange.title')}
        </h4>

        {/* Enable Toggle */}
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('settings.wallpaper.autoChange.enable')}
          </label>
          <button
            onClick={() => {
              const newEnabled = !autoChange.enabled;
              setAutoChange({ enabled: newEnabled });
            }}
            className={cn(
              'w-11 h-6 rounded-full transition-colors duration-200',
              autoChange.enabled ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-700'
            )}
          >
            <span
              className={cn(
                'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                autoChange.enabled ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Interval Selection */}
        {autoChange.enabled && (
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('settings.wallpaper.autoChange.interval')}
            </label>
            <div className="flex gap-2">
              {(['hourly', 'daily', 'weekly'] as const).map((interval) => (
                <button
                  key={interval}
                  onClick={() => setAutoChange({ interval })}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm capitalize',
                    'transition-colors duration-200',
                    autoChange.interval === interval
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                )}
              >
                  {interval === 'hourly' && t('settings.wallpaper.autoChange.intervals.hourly')}
                  {interval === 'daily' && t('settings.wallpaper.autoChange.intervals.daily')}
                  {interval === 'weekly' && t('settings.wallpaper.autoChange.intervals.weekly')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual Refresh Button */}
        <button
          onClick={() => void fetchRandomWallpaper()}
          className={cn(
            'w-full px-4 py-2 rounded-lg text-sm',
            'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
            'hover:bg-zinc-800 dark:hover:bg-zinc-200',
            'transition-colors duration-200'
          )}
        >
          {t('settings.wallpaper.refreshNow')}
        </button>
      </div>
    </div>
  );
}

// Icon Settings Section
interface IconSettingsProps {
  iconStyle: IconStyle;
  setIconStyle: (style: Partial<IconStyle>) => void;
}

function IconSettings({ iconStyle, setIconStyle }: IconSettingsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.icons.title')}</h3>

      {/* Show Name Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.icons.showName')}
        </label>
        <button
          onClick={() => setIconStyle({ showName: !iconStyle.showName })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            iconStyle.showName ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-700'
          )}
        >
          <span
            className={cn(
              'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              iconStyle.showName ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Shadow Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.icons.shadow')}
        </label>
        <button
          onClick={() => setIconStyle({ shadow: !iconStyle.shadow })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            iconStyle.shadow ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-700'
          )}
        >
          <span
            className={cn(
              'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              iconStyle.shadow ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Animation */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.icons.animation')}
        </label>
        <div className="flex gap-2">
          {(['none', 'scale', 'bounce', 'shake'] as const).map((anim) => (
            <button
              key={anim}
              onClick={() => setIconStyle({ animation: anim })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm capitalize',
                'transition-colors duration-200',
                iconStyle.animation === anim
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              )}
            >
              {anim === 'none' && t('settings.icons.animationNone')}
              {anim === 'scale' && t('settings.icons.animationScale')}
              {anim === 'bounce' && t('settings.icons.animationBounce')}
              {anim === 'shake' && t('settings.icons.animationShake')}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="border-radius-slider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('settings.icons.borderRadius')}
          </label>
          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400" aria-live="polite">
            {iconStyle.borderRadius}%
          </span>
        </div>
        <input
          id="border-radius-slider"
          type="range"
          min="0"
          max="50"
          step="1"
          value={iconStyle.borderRadius}
          onChange={(e) => setIconStyle({ borderRadius: Number(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white dark:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          aria-label={t('settings.icons.borderRadius')}
          aria-valuemin={0}
          aria-valuemax={50}
          aria-valuenow={iconStyle.borderRadius}
          aria-valuetext={t('settings.icons.borderRadiusValue', { value: iconStyle.borderRadius })}
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400" id="border-radius-description">
          <span>{t('settings.icons.square')}</span>
          <span className="text-center">{t('settings.icons.rounded')}</span>
          <span>{t('settings.icons.circle')}</span>
        </div>

        {/* Preview */}
        <div className="mt-3 flex items-center justify-center" aria-hidden="true">
          <div
            className="w-16 h-16 bg-gradient-to-br from-zinc-500 to-zinc-700 transition-all duration-200"
            style={{ borderRadius: `${iconStyle.borderRadius}%` }}
          />
        </div>
      </div>

      {/* Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.icons.size')}
        </label>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setIconStyle({ size })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm capitalize',
                'transition-colors duration-200',
                iconStyle.size === size
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              )}
            >
              {size === 'small' && t('settings.icons.sizeSmall')}
              {size === 'medium' && t('settings.icons.sizeMedium')}
              {size === 'large' && t('settings.icons.sizeLarge')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Clock Settings Section
interface ClockSettingsProps {
  clockSettings: import('../../stores/settingsStore').ClockSettings;
  setClockSettings: (settings: Partial<import('../../stores/settingsStore').ClockSettings>) => void;
}

function ClockSettings({ clockSettings, setClockSettings }: ClockSettingsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.clock.title')}</h3>

      {/* Time Format Card */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 space-y-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.clock.format')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['12h', '24h'] as const).map((format) => (
            <button
              key={format}
              onClick={() => setClockSettings({ format })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                clockSettings.format === format
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-zinc-600'
              )}
            >
              {format === '12h' ? t('settings.clock.format12h') : t('settings.clock.format24h')}
            </button>
          ))}
        </div>
      </div>

      {/* Display Options Card */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 space-y-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.clock.displayOptions')}</h4>

        {/* Show Seconds Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.clock.showSeconds')}
          </label>
          <button
            onClick={() => setClockSettings({ showSeconds: !clockSettings.showSeconds })}
            className={cn(
              'w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500/50',
              clockSettings.showSeconds ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
            )}
          >
            <span
              className={cn(
                'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                clockSettings.showSeconds ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
      </div>

      {/* Timezone Settings Card */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 space-y-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.clock.timezone')}</h4>

        {/* Auto Detect Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.clock.autoDetect')}
          </label>
          <button
            onClick={() => setClockSettings({ autoDetect: !clockSettings.autoDetect })}
            className={cn(
              'w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500/50',
              clockSettings.autoDetect ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
            )}
          >
            <span
              className={cn(
                'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                clockSettings.autoDetect ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Timezone Selector */}
        <div className={cn(
          "transition-opacity duration-200",
          clockSettings.autoDetect ? "opacity-50 pointer-events-none" : "opacity-100"
        )}>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            {t('settings.clock.manualSelect')}
          </label>
          <select
            value={clockSettings.timezone}
            onChange={(e) => setClockSettings({ timezone: e.target.value })}
            disabled={clockSettings.autoDetect}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-sm appearance-none',
              'bg-white/50 dark:bg-gray-700/50',
              'border border-gray-200 dark:border-gray-600',
              'text-gray-900 dark:text-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-zinc-500',
              'transition-all duration-200'
            )}
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          {clockSettings.autoDetect && (
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {t('settings.clock.systemTimezone')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Search Settings Section
interface SearchSettingsTabProps {
  searchSettings: SearchSettings;
  setSearchSettings: (settings: Partial<SearchSettings>) => void;
}

function SearchSettingsTab({ searchSettings, setSearchSettings }: SearchSettingsTabProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.search.title')}</h3>

      {/* Hidden Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.search.hideSearchBar')}
        </label>
        <button
          onClick={() => setSearchSettings({ hidden: !searchSettings.hidden })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            searchSettings.hidden ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
          )}
        >
          <span
            className={cn(
              'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              searchSettings.hidden ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Show Suggestions Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.search.showSuggestions')}
        </label>
        <button
          onClick={() => setSearchSettings({ showSuggestions: !searchSettings.showSuggestions })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            searchSettings.showSuggestions ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
          )}
        >
          <span
            className={cn(
              'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              searchSettings.showSuggestions ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Placeholder */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.search.placeholderText')}
        </label>
        <input
          type="text"
          value={searchSettings.placeholder}
          onChange={(e) => setSearchSettings({ placeholder: e.target.value })}
          className={cn(
            'w-full px-3 py-2 rounded-lg',
            'bg-gray-50 dark:bg-gray-700',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-zinc-500'
          )}
        />
      </div>

      {/* Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.search.size')}
        </label>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setSearchSettings({ size })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm capitalize',
                'transition-colors duration-200',
                searchSettings.size === size
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              )}
            >
              {size === 'small' && t('settings.search.sizeSmall')}
              {size === 'medium' && t('settings.search.sizeMedium')}
              {size === 'large' && t('settings.search.sizeLarge')}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{t('settings.search.borderRadius')}</span>
          <span>{searchSettings.borderRadius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={searchSettings.borderRadius}
          onChange={(e) => setSearchSettings({ borderRadius: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Opacity */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{t('settings.search.opacity')}</span>
          <span>{searchSettings.opacity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={searchSettings.opacity}
          onChange={(e) => setSearchSettings({ opacity: Number(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
}

// Layout Settings Section
interface LayoutSettingsProps {
  viewSettings: ViewSettings;
  setViewSettings: (settings: Partial<ViewSettings>) => void;
}

function LayoutSettings({ viewSettings, setViewSettings }: LayoutSettingsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.layout.title')}</h3>

      {/* Grid Columns */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{t('settings.layout.gridColumns')}</span>
          <span>{viewSettings.columns}</span>
        </div>
        <input
          type="range"
          min="3"
          max="10"
          value={viewSettings.columns}
          onChange={(e) => setViewSettings({ columns: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Grid Rows */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{t('settings.layout.gridRows')}</span>
          <span>{viewSettings.rows}</span>
        </div>
        <input
          type="range"
          min="2"
          max="6"
          value={viewSettings.rows}
          onChange={(e) => setViewSettings({ rows: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Show Clock */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.layout.showClock')}
        </label>
        <button
          onClick={() => setViewSettings({ showClock: !viewSettings.showClock })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            viewSettings.showClock ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
          )}
        >
          <span
            className={cn(
              'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              viewSettings.showClock ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Show Pagination */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.layout.showPagination')}
        </label>
        <button
          onClick={() => setViewSettings({ showPagination: !viewSettings.showPagination })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            viewSettings.showPagination ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
          )}
        >
          <span
            className={cn(
              'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              viewSettings.showPagination ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Widget Sidebar Section */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t('settings.layout.widgetSidebar.title')}
        </h4>

        {/* Show Widget Sidebar */}
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('settings.layout.widgetSidebar.show')}
          </label>
          <button
            onClick={() => setViewSettings({ showWidgetSidebar: !viewSettings.showWidgetSidebar })}
            className={cn(
              'w-11 h-6 rounded-full transition-colors duration-200',
              viewSettings.showWidgetSidebar ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
            )}
          >
            <span
              className={cn(
                'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                viewSettings.showWidgetSidebar ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Individual Widget Toggles (only shown when sidebar is enabled) */}
        {viewSettings.showWidgetSidebar && (
          <div className="ml-4 space-y-2">
            {/* Todo Widget */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {t('settings.layout.widgetSidebar.widgets.todo')}
              </label>
              <button
                onClick={() => setViewSettings({ showTodoWidget: !viewSettings.showTodoWidget })}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  viewSettings.showTodoWidget ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
                )}
              >
                <span
                  className={cn(
                    'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    viewSettings.showTodoWidget ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            {/* Notes Widget */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {t('settings.layout.widgetSidebar.widgets.notes')}
              </label>
              <button
                onClick={() => setViewSettings({ showNotesWidget: !viewSettings.showNotesWidget })}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  viewSettings.showNotesWidget ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
                )}
              >
                <span
                  className={cn(
                    'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    viewSettings.showNotesWidget ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            {/* Weather Widget */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {t('settings.layout.widgetSidebar.widgets.weather')}
              </label>
              <button
                onClick={() => setViewSettings({ showWeather: !viewSettings.showWeather })}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  viewSettings.showWeather ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
                )}
              >
                <span
                  className={cn(
                    'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    viewSettings.showWeather ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            {/* Bookmarks Widget */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {t('settings.layout.widgetSidebar.widgets.bookmarks')}
              </label>
              <button
                onClick={() => setViewSettings({ showBookmarksWidget: !viewSettings.showBookmarksWidget })}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  viewSettings.showBookmarksWidget ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
                )}
              >
                <span
                  className={cn(
                    'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    viewSettings.showBookmarksWidget ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            {/* History Widget */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {t('settings.layout.widgetSidebar.widgets.history')}
              </label>
              <button
                onClick={() => setViewSettings({ showHistoryWidget: !viewSettings.showHistoryWidget })}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  viewSettings.showHistoryWidget ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
                )}
              >
                <span
                  className={cn(
                    'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    viewSettings.showHistoryWidget ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Zoom */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{t('settings.layout.zoom')}</span>
          <span>{viewSettings.zoom}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="150"
          value={viewSettings.zoom}
          onChange={(e) => setViewSettings({ zoom: Number(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
}

// Font Settings Section
interface FontSettingsTabProps {
  fontSettings: FontSettings;
  setFontSettings: (settings: Partial<FontSettings>) => void;
}

function FontSettingsTab({ fontSettings, setFontSettings }: FontSettingsTabProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.fonts.title')}</h3>

      {/* Font Family */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.fonts.family')}
        </label>
        <select
          value={fontSettings.family}
          onChange={(e) => setFontSettings({ family: e.target.value })}
          className={cn(
            'w-full px-3 py-2 rounded-lg',
            'bg-gray-50 dark:bg-gray-700',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-zinc-500'
          )}
        >
          <option value="system-ui">{t('settings.fonts.systemDefault')}</option>
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Open Sans">Open Sans</option>
          <option value="Noto Sans SC">Noto Sans SC</option>
        </select>
      </div>

      {/* Font Size */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{t('settings.fonts.size')}</span>
          <span>{fontSettings.size}px</span>
        </div>
        <input
          type="range"
          min="12"
          max="24"
          value={fontSettings.size}
          onChange={(e) => setFontSettings({ size: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Font Color */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.fonts.color')}
        </label>
        <input
          type="color"
          value={fontSettings.color}
          onChange={(e) => setFontSettings({ color: e.target.value })}
          className="w-full h-10 rounded-lg cursor-pointer"
        />
      </div>

      {/* Text Shadow */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.fonts.shadow')}
        </label>
        <button
          onClick={() => setFontSettings({ shadow: !fontSettings.shadow })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            fontSettings.shadow ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-gray-300 dark:bg-zinc-600'
          )}
        >
          <span
            className={cn(
              'block w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              fontSettings.shadow ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Font Weight */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('settings.fonts.weight')}
        </label>
        <div className="flex gap-2">
          {(['normal', 'medium', 'bold'] as const).map((weight) => (
            <button
              key={weight}
              onClick={() => setFontSettings({ weight })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm capitalize',
                'transition-colors duration-200',
                fontSettings.weight === weight
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              )}
            >
              {weight === 'normal' && t('settings.fonts.weightNormal')}
              {weight === 'medium' && t('settings.fonts.weightMedium')}
              {weight === 'bold' && t('settings.fonts.weightBold')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Marketplace Settings Section (placeholder)
function MarketplaceSettings() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.marketplace.title')}</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {t('settings.marketplace.description')}
      </p>
      <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
        <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400">
          {t('settings.marketplace.comingSoon')}
        </p>
      </div>
    </div>
  );
}

// Backup Settings Section
function BackupSettings() {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { exportAllData } = await import('../../utils/backup');
      const json = await exportAllData();

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `openinfinity-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      console.info('Backup exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert(t('settings.backup.exportFailed') + (error instanceof Error ? error.message : t('settings.backup.unknownError')));
    } finally {
      setIsExporting(false);
    }
  };

  // Handle import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();

      // Validate before importing
      const { validateBackupFile, importAllData } = await import('../../utils/backup');
      validateBackupFile(text);

      // Confirm with user
      if (!confirm(t('settings.backup.importConfirm'))) {
        setIsImporting(false);
        return;
      }

      await importAllData(text);
      // Page will reload automatically
    } catch (error) {
      console.error('Import failed:', error);
      alert(t('settings.backup.importFailed') + (error instanceof Error ? error.message : t('settings.backup.unknownError')));
      setIsImporting(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.backup.title')}</h3>

      <div className="space-y-4">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
            'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
            'hover:bg-zinc-800 dark:hover:bg-zinc-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
        >
          <Download className="w-5 h-5" />
          {isExporting ? t('settings.backup.exporting') : t('settings.backup.exportAllData')}
        </button>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="backup-file-input"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
              'bg-gray-100 dark:bg-gray-700',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200'
            )}
          >
            <Download className="w-5 h-5 rotate-180" />
            {isImporting ? t('settings.backup.importing') : t('settings.backup.importAllData')}
          </button>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>{t('settings.backup.warningTitle')}:</strong> {t('settings.backup.warningText')}
        </p>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('settings.backup.description')}
      </p>

      {/* Import from Chrome Bookmarks Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
          {t('settings.backup.importFromChrome.title')}
        </h4>
        <ImportBookmarksButton />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          {t('settings.backup.importFromChrome.description')}
        </p>
      </div>
    </div>
  );
}

// About Settings Section
function AboutSettings() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('settings.about.title')}</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-black dark:from-white dark:to-zinc-200 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white dark:text-black">∞</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              OpenInfinity
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.about.version')} {APP_VERSION}
            </p>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          {t('settings.about.description')}
        </p>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('settings.about.builtWith')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('settings.about.copyright')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
