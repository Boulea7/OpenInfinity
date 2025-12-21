/**
 * WallpaperPickerModal - Modal for selecting wallpapers
 *
 * Two main tabs:
 * 1. Select Single Wallpaper - Browse and select individual wallpapers
 *    - Cloud: From Unsplash/Pexels with color/tag filters
 *    - Local: Upload from device
 *    - Solid: Solid color or gradient
 *    - Recent: Recently used wallpapers
 *    - Favorites: Saved favorite wallpapers
 *
 * 2. Select Wallpaper Source - Configure random wallpaper rotation
 *    - Provider selection (Unsplash, Pexels, Bing, etc.)
 *    - Custom library (max 20 images, max 10MB each)
 */

import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Check,
  ImageIcon,
  Key,
  Plus,
} from 'lucide-react';
import { useWallpaperStore } from '../../stores/wallpaperStore';
import {
  WALLPAPER_SOURCES,
  WallpaperSource,
  getStoredApiKeys,
} from '../../services/wallpaperSources';
import { WallpaperSkeleton } from './components/WallpaperSkeleton';
import { WallpaperCard } from './components/WallpaperCard';
import { PRESET_WALLPAPERS, type PresetWallpaper } from '../../data/presetWallpapers';

// Types
interface WallpaperItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  author?: string;
  source?: string;
  color?: string;
  primaryColor?: string;
  tags?: string[];
}

// Constants
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Color filter options (aligned with presetWallpapers.primaryColor values)
const COLOR_OPTIONS = [
  { id: 'any', color: 'transparent', label: '全部' },
  { id: 'red', color: '#c00018', label: '红色' },
  { id: 'orange', color: '#de8930', label: '橙色' },
  { id: 'yellow', color: '#f7d946', label: '黄色' },
  { id: 'green', color: '#22c55e', label: '绿色' },
  { id: 'blue', color: '#3b82f6', label: '蓝色' },
  { id: 'purple', color: '#a855f7', label: '紫色' },
  { id: 'black', color: '#0f172a', label: '深色' },
];

// Tag options for filtering (Infinity Pro standard 10 tags)
const TAG_OPTIONS = [
  { id: 'nature', label: '自然' },
  { id: 'ocean', label: '海洋' },
  { id: 'architecture', label: '建筑' },
  { id: 'animals', label: '动物' },
  { id: 'travel', label: '旅行' },
  { id: 'food-drink', label: '美食' },
  { id: 'anime', label: '动漫' },
  { id: 'athletics', label: '运动' },
  { id: 'technology', label: '技术' },
  { id: 'street', label: '街头' },
];

// Initialize sources with enabled state from localStorage
const getInitialSources = (): Array<WallpaperSource & { enabled: boolean }> => {
  try {
    const stored = localStorage.getItem('wallpaper-sources-enabled');
    const enabledMap = stored ? JSON.parse(stored) : { bing: true, unsplash: true };
    return WALLPAPER_SOURCES.map(source => ({
      ...source,
      enabled: enabledMap[source.id] ?? source.enabled,
    }));
  } catch {
    return WALLPAPER_SOURCES.map(source => ({ ...source }));
  }
};

// Solid color/gradient presets
const SOLID_PRESETS = [
  { id: 'black', value: '#000000' },
  { id: 'dark-gray', value: '#1f2937' },
  { id: 'navy', value: '#1e3a5f' },
  { id: 'dark-purple', value: '#4c1d95' },
  { id: 'dark-green', value: '#14532d' },
  { id: 'gradient-1', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient-2', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'gradient-3', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'gradient-4', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'gradient-5', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
];

interface WallpaperPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Source logo component with fallback
const SourceLogo: React.FC<{ src?: string; name: string }> = ({ src, name }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return <ImageIcon className="w-5 h-5 text-gray-400" />;
  }

  return (
    <img
      src={src}
      alt={name}
      className="w-6 h-6 object-contain"
      onError={() => setHasError(true)}
    />
  );
};

type MainTab = 'single' | 'source';
type SingleSubTab = 'cloud' | 'local' | 'solid' | 'recent' | 'favorites';
type SortOption = 'default' | 'popularity' | 'recent';

// Sort options for cloud wallpapers
const SORT_OPTIONS = [
  { id: 'default' as const, label: '默认排序' },
  { id: 'popularity' as const, label: '热度排序' },
  { id: 'recent' as const, label: '收录时间' },
];

export const WallpaperPickerModal: React.FC<WallpaperPickerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [mainTab, setMainTab] = useState<MainTab>('single');
  const [singleSubTab, setSingleSubTab] = useState<SingleSubTab>('cloud');
  const [selectedColor, setSelectedColor] = useState('any');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isLoading] = useState(false);

  // Local wallpapers uploaded by user
  const [localWallpapers, setLocalWallpapers] = useState<WallpaperItem[]>([]);
  const [recentWallpapers] = useState<WallpaperItem[]>([]);
  const [favoriteWallpapers] = useState<WallpaperItem[]>([]);
  const [sources, setSources] = useState(() => getInitialSources());
  const [apiKeys] = useState<Record<string, string>>(() => getStoredApiKeys());

  // Wallpaper store
  const setWallpaperFromUrl = useWallpaperStore((state) => state.setWallpaperFromUrl);
  const setSolidColor = useWallpaperStore((state) => state.setSolidColor);
  const setGradient = useWallpaperStore((state) => state.setGradient);
  const togglePresetLike = useWallpaperStore((state) => state.togglePresetLike);
  const togglePresetFavorite = useWallpaperStore((state) => state.togglePresetFavorite);
  const likedWallpapers = useWallpaperStore((state) => state.likedWallpapers);
  const favoritedPresets = useWallpaperStore((state) => state.favoritedPresets);

  // Filter and sort preset wallpapers
  const filteredPresetWallpapers = useMemo(() => {
    // First filter
    let result = PRESET_WALLPAPERS.filter((w) => {
      // Color filter
      if (selectedColor !== 'any' && w.primaryColor !== selectedColor) {
        return false;
      }
      // Tags filter
      if (selectedTags.length > 0 && !selectedTags.some((t) => w.tags.includes(t))) {
        return false;
      }
      return true;
    });

    // Then sort
    if (sortBy === 'popularity') {
      result = [...result].sort((a, b) => b.baseLikes - a.baseLikes);
    } else if (sortBy === 'recent') {
      // Sort by ID (newer IDs = more recent)
      result = [...result].sort((a, b) => {
        const aNum = parseInt(a.id.replace('preset-', ''), 10);
        const bNum = parseInt(b.id.replace('preset-', ''), 10);
        return bNum - aNum;
      });
    }
    // 'default' keeps original order

    return result;
  }, [selectedColor, selectedTags, sortBy]);

  // Handle preset wallpaper selection
  const handleSelectPresetWallpaper = async (wallpaper: PresetWallpaper) => {
    await setWallpaperFromUrl(wallpaper.url, {
      author: wallpaper.author,
    });
    onClose();
  };

  // Calculate like count (base + user like if applicable)
  const getLikeCount = (wallpaper: PresetWallpaper): number => {
    const userLiked = likedWallpapers.includes(wallpaper.id);
    return wallpaper.baseLikes + (userLiked ? 1 : 0);
  };

  // Handle wallpaper selection
  const handleSelectWallpaper = async (wallpaper: WallpaperItem) => {
    await setWallpaperFromUrl(wallpaper.url, {
      author: wallpaper.author,
    });
    onClose();
  };

  // Handle solid color/gradient selection
  const handleSelectSolid = (value: string) => {
    const isGradient = value.includes('gradient');
    if (isGradient) {
      // Parse gradient string to extract colors and direction
      // Format: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      const colorMatches = value.match(/#[0-9a-fA-F]{6}/g);
      const angleMatch = value.match(/(\d+)deg/);

      const colors = colorMatches && colorMatches.length >= 2
        ? [colorMatches[0], colorMatches[1]]
        : ['#667eea', '#764ba2']; // Fallback colors

      // Convert angle to Tailwind direction
      const angle = angleMatch ? parseInt(angleMatch[1], 10) : 135;
      let direction: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-tr' | 'to-tl' | 'to-br' | 'to-bl' = 'to-br';
      if (angle >= 0 && angle < 45) direction = 'to-t';
      else if (angle >= 45 && angle < 90) direction = 'to-tr';
      else if (angle >= 90 && angle < 135) direction = 'to-r';
      else if (angle >= 135 && angle < 180) direction = 'to-br';
      else if (angle >= 180 && angle < 225) direction = 'to-b';
      else if (angle >= 225 && angle < 270) direction = 'to-bl';
      else if (angle >= 270 && angle < 315) direction = 'to-l';
      else direction = 'to-tl';

      setGradient({ colors, direction });
    } else {
      setSolidColor(value);
    }
    onClose();
  };

  // Handle local file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(t('settings.wallpaper.fileTooLarge', `文件 ${file.name} 超过 ${MAX_FILE_SIZE_MB}MB 限制`));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const newWallpaper: WallpaperItem = {
          id: `local-${Date.now()}`,
          url,
          source: 'local',
        };
        setLocalWallpapers((prev) => [newWallpaper, ...prev]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Toggle source enabled
  const toggleSource = (sourceId: string) => {
    setSources((prev) => {
      const updated = prev.map((s) =>
        s.id === sourceId ? { ...s, enabled: !s.enabled } : s
      );
      // Persist to localStorage
      const enabledMap = Object.fromEntries(updated.map(s => [s.id, s.enabled]));
      localStorage.setItem('wallpaper-sources-enabled', JSON.stringify(enabledMap));
      return updated;
    });
  };

  // Get language-specific description
  const getDescription = (source: WallpaperSource) => {
    const lang = i18n.language;
    return lang === 'zh' ? source.descriptionZh : source.description;
  };

  // Toggle tag filter
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal - Centered large panel (Infinity Pro size: 960px x 85vh) */}
      <div className="
        relative
        w-full max-w-[960px]
        max-h-[85vh]
        bg-white dark:bg-gray-900
        rounded-xl
        shadow-2xl
        flex flex-col
        overflow-hidden
      ">
        {/* Header with tabs */}
        <div className="flex-shrink-0 px-6 pt-5 pb-0">
          {/* Tab headers and close button */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Main Tab: Single Wallpaper */}
              <button
                type="button"
                onClick={() => setMainTab('single')}
                className={`
                  text-base font-medium pb-3 relative
                  transition-colors
                  ${mainTab === 'single'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }
                `}
              >
                {t('settings.wallpaper.picker.singleTab', '选择单张壁纸')}
                {mainTab === 'single' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-900 dark:bg-white rounded-full" />
                )}
              </button>

              {/* Main Tab: Wallpaper Source */}
              <button
                type="button"
                onClick={() => setMainTab('source')}
                className={`
                  text-base font-medium pb-3 relative
                  transition-colors
                  ${mainTab === 'source'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }
                `}
              >
                {t('settings.wallpaper.picker.sourceTab', '选择壁纸源')}
                {mainTab === 'source' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-900 dark:bg-white rounded-full" />
                )}
              </button>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mt-1 -mr-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {mainTab === 'single' ? (
            <div className="flex flex-col h-full">
              {/* Sub-tab navigation (Pills) + Sort */}
              <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 dark:border-gray-800">
                {[
                  { id: 'cloud' as const, label: '云端壁纸' },
                  { id: 'local' as const, label: '本地壁纸' },
                  { id: 'solid' as const, label: '纯色壁纸' },
                  { id: 'recent' as const, label: '最近使用' },
                  { id: 'favorites' as const, label: '我的收藏' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSingleSubTab(id)}
                    className={`
                      px-3 py-1 text-sm rounded transition-colors
                      ${singleSubTab === id
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      }
                    `}
                  >
                    {t(`settings.wallpaper.picker.${id}`, label)}
                  </button>
                ))}

                <div className="flex-1" />
                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="6" x2="16" y2="6" />
                      <line x1="4" y1="12" x2="12" y2="12" />
                      <line x1="4" y1="18" x2="8" y2="18" />
                    </svg>
                    {SORT_OPTIONS.find(o => o.id === sortBy)?.label || '默认排序'}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Sort menu dropdown */}
                  {showSortMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowSortMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 min-w-[120px]">
                        {SORT_OPTIONS.map(({ id, label }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setSortBy(id);
                              setShowSortMenu(false);
                            }}
                            className={`
                              w-full px-3 py-1.5 text-left text-sm transition-colors
                              ${sortBy === id
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                              }
                            `}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Content Area - Horizontal layout */}
              <div className="flex-1 overflow-hidden flex">

                {/* Left Sidebar: Filters (Only for Cloud tab) */}
                {singleSubTab === 'cloud' && (
                  <div className="w-44 flex-shrink-0 px-5 py-4 border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
                    {/* Colors */}
                    <div className="mb-5">
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{t('settings.wallpaper.picker.colorFilter', '颜色')}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_OPTIONS.slice(1).map(({ id, color, label }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSelectedColor(selectedColor === id ? 'any' : id)}
                            className={`
                              w-5 h-5 rounded-full transition-all
                              ${selectedColor === id ? 'ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}
                            `}
                            style={{ backgroundColor: color }}
                            title={label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{t('settings.wallpaper.picker.tagFilter', '标签')}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {TAG_OPTIONS.map(({ id, label }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleTag(id)}
                            className={`
                              px-2.5 py-1 rounded text-xs transition-colors
                              border
                              ${selectedTags.includes(id)
                                ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                              }
                            `}
                          >
                            {t(`settings.wallpaper.tags.${id}`, label)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Right: Wallpaper Grid (3 columns for larger modal) */}
                <div className="flex-1 overflow-y-auto p-4">
                  {singleSubTab === 'cloud' && (
                    <div className="grid grid-cols-3 gap-3">
                      {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <WallpaperSkeleton key={i} />
                        ))
                      ) : filteredPresetWallpapers.length > 0 ? (
                        filteredPresetWallpapers.map((wallpaper) => (
                          <WallpaperCard
                            key={wallpaper.id}
                            wallpaper={wallpaper}
                            onSelect={handleSelectPresetWallpaper}
                            onFavorite={(w) => togglePresetFavorite(w.id)}
                            onLike={(w) => togglePresetLike(w.id)}
                            isFavorited={favoritedPresets.includes(wallpaper.id)}
                            isLiked={likedWallpapers.includes(wallpaper.id)}
                            likeCount={getLikeCount(wallpaper)}
                          />
                        ))
                      ) : (
                        <div className="col-span-2 py-16 text-center text-gray-400 flex flex-col items-center">
                          <ImageIcon className="w-10 h-10 mb-3 opacity-30" />
                          <p className="text-sm">{t('settings.wallpaper.picker.noResults', '暂无壁纸')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {singleSubTab === 'local' && (
                    <div className="space-y-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                      >
                        <Plus className="w-6 h-6 mb-1.5" />
                        <span className="text-sm">{t('settings.wallpaper.picker.uploadLocal', '点击上传本地图片')}</span>
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />

                      <div className="grid grid-cols-2 gap-3">
                        {localWallpapers.map(w => (
                          <button key={w.id} onClick={() => handleSelectWallpaper(w)} className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-gray-900">
                            <img src={w.url} className="w-full h-full object-cover" alt="" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {singleSubTab === 'solid' && (
                    <div className="grid grid-cols-5 gap-3">
                      {SOLID_PRESETS.map(({ id, value }) => (
                        <button
                          key={id}
                          onClick={() => handleSelectSolid(value)}
                          className="aspect-square rounded-lg hover:ring-2 hover:ring-offset-2 hover:ring-gray-400 transition-all"
                          style={{ background: value }}
                        />
                      ))}
                    </div>
                  )}

                  {(singleSubTab === 'recent' || singleSubTab === 'favorites') && (
                    <div className="grid grid-cols-2 gap-3">
                      {(singleSubTab === 'recent' ? recentWallpapers : favoriteWallpapers).length > 0 ? (
                        (singleSubTab === 'recent' ? recentWallpapers : favoriteWallpapers).map(w => (
                          <button key={w.id} onClick={() => handleSelectWallpaper(w)} className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-gray-900">
                            <img src={w.thumbnailUrl || w.url} className="w-full h-full object-cover" alt="" />
                          </button>
                        ))
                      ) : (
                        <div className="col-span-2 py-16 text-center text-gray-400">
                          <p className="text-sm">{t(`settings.wallpaper.picker.no${singleSubTab === 'recent' ? 'Recent' : 'Favorites'}`, '暂无数据')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Source tab content */
            <div className="p-5 h-full overflow-y-auto">
              {/* Wallpaper sources grid - 3 columns */}
              <div className="grid grid-cols-3 gap-4">
                {/* Create new library card */}
                <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-8 text-gray-400 hover:border-gray-300 hover:text-gray-500 cursor-pointer transition-colors">
                  <div className="w-10 h-10 border-2 border-current rounded-lg flex items-center justify-center mb-2">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-sm">{t('settings.wallpaper.picker.newLibrary', '新建我的壁纸库')}</span>
                </div>

                {/* Source cards */}
                {sources.map((source) => {
                  const headerColors: Record<string, string> = {
                    bing: 'bg-gradient-to-br from-cyan-400 to-blue-500',
                    unsplash: 'bg-gray-800',
                    pexels: 'bg-gradient-to-br from-green-400 to-teal-500',
                    wallhaven: 'bg-gradient-to-br from-slate-500 to-slate-700',
                    infinity: 'bg-gradient-to-br from-orange-400 to-red-500',
                    preset: 'bg-gradient-to-br from-blue-400 to-indigo-500',
                  };
                  const headerColor = headerColors[source.id] || 'bg-gray-300';
                  const isSelected = source.enabled;

                  return (
                    <div
                      key={source.id}
                      onClick={() => toggleSource(source.id)}
                      className={`
                        group cursor-pointer rounded-lg overflow-hidden transition-all duration-200
                        ${isSelected
                          ? 'ring-2 ring-orange-500 shadow-lg'
                          : 'hover:shadow-md border border-gray-100 dark:border-gray-800'
                        }
                      `}
                    >
                      {/* Card Header with gradient */}
                      <div className={`h-20 ${headerColor} flex items-center justify-center relative`}>
                        <div className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center">
                          <SourceLogo src={source.logo} name={source.name} />
                        </div>
                        {isSelected && (
                          <div className="absolute bottom-2 right-2 bg-orange-500 text-white rounded-full p-0.5">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-3 bg-white dark:bg-gray-900">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {source.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                          {getDescription(source)}
                        </div>
                        {source.apiKeyRequired && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Key className="w-3 h-3 text-gray-400" />
                            <span className={`text-xs ${apiKeys[source.id] ? 'text-green-600' : 'text-amber-600'}`}>
                              {apiKeys[source.id] ? 'API Key ✓' : 'Needs Key'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WallpaperPickerModal;
