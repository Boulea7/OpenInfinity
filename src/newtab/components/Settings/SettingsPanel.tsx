import { useState, useCallback, useRef } from 'react';
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
  X,
  RotateCcw,
} from 'lucide-react';
import { useSettingsStore, useWallpaperStore } from '../../stores';
import type { WallpaperSource, AutoChangeInterval } from '../../stores/wallpaperStore';
import type { IconStyle, SearchSettings, ViewSettings, FontSettings } from '../../stores/settingsStore';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils';

// Settings tab definitions
const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'wallpaper', label: 'Wallpaper', icon: Image },
  { id: 'icons', label: 'Icons', icon: Grid3X3 },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'layout', label: 'Layout', icon: Layout },
  { id: 'fonts', label: 'Fonts', icon: Type },
  { id: 'marketplace', label: 'Marketplace', icon: Store },
  { id: 'backup', label: 'Backup', icon: Download },
  { id: 'about', label: 'About', icon: Info },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]['id'];

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SettingsPanel Component
 * Full settings interface with categorized tabs
 */
export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
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
    resetToDefaults,
  } = useSettingsStore();

  const { activeSource, setActiveSource, effects, setEffects, autoChange, setAutoChange, searchQuery, setSearchQuery, fetchRandomWallpaper } = useWallpaperStore();

  // Handle reset all settings
  const handleResetAll = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      resetToDefaults();
    }
  }, [resetToDefaults]);

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />;
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAll}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
                'text-gray-600 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'transition-colors duration-200'
              )}
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <nav className="w-48 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <ul className="py-2">
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
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-2 border-primary-500'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </Modal>
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
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">General Settings</h3>

      {/* Theme */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Theme
        </label>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm capitalize',
                'transition-colors duration-200',
                theme === t
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className={cn(
            'w-full px-3 py-2 rounded-lg',
            'bg-gray-50 dark:bg-gray-700',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-500'
          )}
        >
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
          <option value="zh-TW">繁體中文</option>
          <option value="ja">日本語</option>
        </select>
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
  const wallpaperSources: { id: WallpaperSource; label: string }[] = [
    { id: 'local', label: 'Local' },
    { id: 'custom', label: 'URL' },
    { id: 'solid', label: 'Solid' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'bing', label: 'Bing Daily' },
    { id: 'unsplash', label: 'Unsplash' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Wallpaper Settings</h3>

      {/* Wallpaper Source */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Wallpaper Source
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
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
          Effects
        </label>

        {/* Blur */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Blur</span>
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
            <span>Mask Opacity</span>
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
            <span>Brightness</span>
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
          Search Preferences
        </h4>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Wallpaper Search Query
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="nature, landscape, city..."
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
            Keywords used when fetching wallpapers from Unsplash, Pexels, or Bing
          </p>
        </div>
      </div>

      {/* Auto-Change Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Auto-Change Wallpaper
        </h4>

        {/* Enable Toggle */}
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Auto-Change
          </label>
          <button
            onClick={() => {
              const newEnabled = !autoChange.enabled;
              setAutoChange({ enabled: newEnabled });
            }}
            className={cn(
              'w-11 h-6 rounded-full transition-colors duration-200',
              autoChange.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
              Change Interval
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
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {interval === 'hourly' && 'Every Hour'}
                  {interval === 'daily' && 'Daily'}
                  {interval === 'weekly' && 'Weekly'}
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
            'bg-primary-600 text-white',
            'hover:bg-primary-700',
            'transition-colors duration-200'
          )}
        >
          Refresh Wallpaper Now
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
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Icon Settings</h3>

      {/* Show Name Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Show Icon Names
        </label>
        <button
          onClick={() => setIconStyle({ showName: !iconStyle.showName })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            iconStyle.showName ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
          Icon Shadow
        </label>
        <button
          onClick={() => setIconStyle({ shadow: !iconStyle.shadow })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            iconStyle.shadow ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
          Hover Animation
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
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              )}
            >
              {anim}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Border Radius</span>
          <span>{iconStyle.borderRadius}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={iconStyle.borderRadius}
          onChange={(e) => setIconStyle({ borderRadius: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Icon Size
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
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              )}
            >
              {size}
            </button>
          ))}
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
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Search Settings</h3>

      {/* Hidden Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Hide Search Bar
        </label>
        <button
          onClick={() => setSearchSettings({ hidden: !searchSettings.hidden })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            searchSettings.hidden ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
          Show Search Suggestions
        </label>
        <button
          onClick={() => setSearchSettings({ showSuggestions: !searchSettings.showSuggestions })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            searchSettings.showSuggestions ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
          Placeholder Text
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
            'focus:outline-none focus:ring-2 focus:ring-primary-500'
          )}
        />
      </div>

      {/* Size */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Bar Size
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
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Border Radius</span>
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
          <span>Opacity</span>
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
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Layout Settings</h3>

      {/* Grid Columns */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Grid Columns</span>
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
          <span>Grid Rows</span>
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
          Show Clock
        </label>
        <button
          onClick={() => setViewSettings({ showClock: !viewSettings.showClock })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            viewSettings.showClock ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
          Show Pagination
        </label>
        <button
          onClick={() => setViewSettings({ showPagination: !viewSettings.showPagination })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            viewSettings.showPagination ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
          Widget Sidebar
        </h4>

        {/* Show Widget Sidebar */}
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show Widget Sidebar
          </label>
          <button
            onClick={() => setViewSettings({ showWidgetSidebar: !viewSettings.showWidgetSidebar })}
            className={cn(
              'w-11 h-6 rounded-full transition-colors duration-200',
              viewSettings.showWidgetSidebar ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
                Todo List
              </label>
              <button
                onClick={() => setViewSettings({ showTodoWidget: !viewSettings.showTodoWidget })}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  viewSettings.showTodoWidget ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
                Notes
              </label>
              <button
                onClick={() => setViewSettings({ showNotesWidget: !viewSettings.showNotesWidget })}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  viewSettings.showNotesWidget ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
                Weather
              </label>
              <button
                onClick={() => setViewSettings({ showWeather: !viewSettings.showWeather })}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  viewSettings.showWeather ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
                Bookmarks
              </label>
              <button
                onClick={() => setViewSettings({ showBookmarksWidget: !viewSettings.showBookmarksWidget })}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  viewSettings.showBookmarksWidget ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
                History
              </label>
              <button
                onClick={() => setViewSettings({ showHistoryWidget: !viewSettings.showHistoryWidget })}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors duration-200',
                  viewSettings.showHistoryWidget ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
          <span>Zoom</span>
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
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Font Settings</h3>

      {/* Font Family */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Font Family
        </label>
        <select
          value={fontSettings.family}
          onChange={(e) => setFontSettings({ family: e.target.value })}
          className={cn(
            'w-full px-3 py-2 rounded-lg',
            'bg-gray-50 dark:bg-gray-700',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-500'
          )}
        >
          <option value="system-ui">System Default</option>
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Open Sans">Open Sans</option>
          <option value="Noto Sans SC">Noto Sans SC</option>
        </select>
      </div>

      {/* Font Size */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Font Size</span>
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
          Font Color
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
          Text Shadow
        </label>
        <button
          onClick={() => setFontSettings({ shadow: !fontSettings.shadow })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200',
            fontSettings.shadow ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
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
          Font Weight
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
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              )}
            >
              {weight}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Marketplace Settings Section (placeholder)
function MarketplaceSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Shortcut Marketplace</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Browse and add popular website shortcuts to your new tab page.
      </p>
      <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
        <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400">
          Marketplace coming soon...
        </p>
      </div>
    </div>
  );
}

// Backup Settings Section
function BackupSettings() {
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
      alert('导出失败：' + (error instanceof Error ? error.message : '未知错误'));
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
      if (!confirm('This will replace all existing data. Continue?')) {
        setIsImporting(false);
        return;
      }

      await importAllData(text);
      // Page will reload automatically
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败：' + (error instanceof Error ? error.message : '未知错误'));
      setIsImporting(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Data Backup</h3>

      <div className="space-y-4">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
            'bg-primary-600 text-white',
            'hover:bg-primary-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
        >
          <Download className="w-5 h-5" />
          {isExporting ? 'Exporting...' : 'Export All Data'}
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
            {isImporting ? 'Importing...' : 'Import All Data'}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Export all your data (settings, icons, folders, todos, notes, wallpapers) to a JSON file.
        You can import this file later to restore your complete configuration.
      </p>

      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Warning:</strong> Importing will replace all existing data. Make sure to export your current data first.
        </p>
      </div>
    </div>
  );
}

// About Settings Section
function AboutSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">About OpenInfinity</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">∞</span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              OpenInfinity
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Version 1.0.0
            </p>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          OpenInfinity is a beautiful and customizable new tab page for your browser.
          Organize your favorite websites, customize your wallpaper, and boost your productivity.
        </p>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Built with React, TypeScript, and Tailwind CSS.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            © 2024 OpenInfinity. Open source under MIT License.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
