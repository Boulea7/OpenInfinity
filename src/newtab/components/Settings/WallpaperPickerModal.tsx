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
  ImageIcon,
  Key,
  Plus,
  Upload,
  Clock,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useWallpaperStore } from '../../stores/wallpaperStore';
import {
  WALLPAPER_SOURCES,
  WallpaperSource,
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

// Get selected source from localStorage (single select mode)
// 'all' means random from all sources
const getSelectedSource = (): string => {
  try {
    const stored = localStorage.getItem('wallpaper-selected-source');
    return stored || 'all';
  } catch {
    return 'all';
  }
};

// Save selected source to localStorage
const saveSelectedSource = (sourceId: string): void => {
  try {
    localStorage.setItem('wallpaper-selected-source', sourceId);
  } catch {
    // Ignore storage write failures (e.g. quota / privacy mode)
  }
};

// Header background colors for each source
const SOURCE_HEADER_COLORS: Record<string, string> = {
  all: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600',
  bing: 'bg-gradient-to-br from-blue-400 to-blue-600',
  unsplash: 'bg-gradient-to-br from-gray-700 to-gray-900',
  pexels: 'bg-gradient-to-br from-emerald-400 to-teal-600',
  anime: 'bg-gradient-to-br from-pink-400 to-purple-500',
  lifeofpix: 'bg-gradient-to-br from-cyan-400 to-blue-500',
  mmt: 'bg-gradient-to-br from-orange-400 to-red-500',
  realisticshots: 'bg-gradient-to-br from-slate-400 to-slate-600',
  jaymantri: 'bg-gradient-to-br from-red-400 to-orange-500',
  freenaturestock: 'bg-gradient-to-br from-green-400 to-lime-600',
  skitterphoto: 'bg-gradient-to-br from-teal-400 to-cyan-600',
  startupstock: 'bg-gradient-to-br from-violet-400 to-fuchsia-600',
  barnimages: 'bg-gradient-to-br from-amber-600 to-orange-800',
  picography: 'bg-gradient-to-br from-rose-400 to-pink-600',
  wallhaven: 'bg-gradient-to-br from-slate-500 to-slate-700',
  infinity: 'bg-gradient-to-br from-orange-400 to-red-500',
  preset: 'bg-gradient-to-br from-blue-400 to-indigo-500',
};

// Inline SVG icons for wallpaper sources (white color for gradient backgrounds)
const SourceIcons: Record<string, React.FC<{ className?: string }>> = {
  all: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  bing: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  unsplash: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  pexels: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  anime: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  lifeofpix: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  mmt: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11v5m0 0l-3-3m3 3l3-3M8 7.5a2.5 2.5 0 015 0v3.5a2.5 2.5 0 01-5 0V7.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7.5a2.5 2.5 0 00-5 0v3.5a2.5 2.5 0 005 0V11z" />
    </svg>
  ),
  realisticshots: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  jaymantri: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  freenaturestock: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  skitterphoto: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  startupstock: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  barnimages: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  picography: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
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

// Render source icon (inline SVG or fallback)
const renderSourceIcon = (sourceId: string, className: string = 'w-10 h-10 text-white opacity-90') => {
  const IconComponent = SourceIcons[sourceId];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  // Fallback to generic image icon
  return <ImageIcon className={className} />;
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
  const [selectedSource, setSelectedSource] = useState(() => getSelectedSource());

  // Create library modal state
  const [showCreateLibraryModal, setShowCreateLibraryModal] = useState(false);
  const [customLibraryImages, setCustomLibraryImages] = useState<string[]>([]);
  const [customLibraryFrequency, setCustomLibraryFrequency] = useState<'daily' | 'hourly' | 'startup'>('daily');
  const customLibraryInputRef = useRef<HTMLInputElement>(null);

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
          id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
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

  // Select a single source (single-select mode)
  const selectSource = (sourceId: string) => {
    setSelectedSource(sourceId);
    saveSelectedSource(sourceId);
  };

  // Get language-specific description
  const getDescription = (source: WallpaperSource) => {
    const lang = i18n.language || 'en';
    return lang.startsWith('zh') ? source.descriptionZh : source.description;
  };

  // Toggle tag filter
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  // Handle custom library image upload
  const handleCustomLibraryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const MAX_IMAGES = 20;
    const remaining = MAX_IMAGES - customLibraryImages.length;

    if (remaining <= 0) {
      alert(t('settings.wallpaper.picker.maxImagesReached', '最多上传20张图片'));
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remaining);

    filesToProcess.forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(t('settings.wallpaper.picker.fileTooLarge', `文件 ${file.name} 超过 ${MAX_FILE_SIZE_MB}MB 限制`));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setCustomLibraryImages((prev) => [...prev, url]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (customLibraryInputRef.current) {
      customLibraryInputRef.current.value = '';
    }
  };

  // Remove image from custom library
  const removeCustomLibraryImage = (index: number) => {
    setCustomLibraryImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Apply custom library
  const applyCustomLibrary = () => {
    if (customLibraryImages.length === 0) {
      alert(t('settings.wallpaper.picker.noImages', '请先上传图片'));
      return;
    }

    // Save to localStorage (best-effort; large base64 payloads may exceed quota)
    try {
      localStorage.setItem(
        'custom-wallpaper-library',
        JSON.stringify({
          images: customLibraryImages,
          frequency: customLibraryFrequency,
        })
      );
    } catch (error) {
      console.warn('[WallpaperPickerModal] Failed to persist custom library:', error);
      alert(
        t(
          'settings.wallpaper.picker.persistFailed',
          '保存失败：本地存储空间不足。建议减少图片数量/大小。'
        )
      );
      return;
    }

    // Select custom library as source
    selectSource('custom');
    setShowCreateLibraryModal(false);

    // Set a random image from the library as current wallpaper
    const randomIndex = Math.floor(Math.random() * customLibraryImages.length);
    void setWallpaperFromUrl(customLibraryImages[randomIndex]).catch((err) => {
      console.error('[WallpaperPickerModal] Failed to set wallpaper from custom library:', err);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      className="max-w-[960px] max-h-[85vh]"
      showCloseButton={false}
    >
      <div className="flex flex-col h-full overflow-hidden">
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
                {/* 1. Create new library card (FIRST) */}
                <button
                  type="button"
                  onClick={() => setShowCreateLibraryModal(true)}
                  className={`
                    group relative flex flex-col items-center justify-center h-36
                    rounded-xl border-2 transition-all duration-200 cursor-pointer
                    ${selectedSource === 'custom'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                      : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:bg-white dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {selectedSource === 'custom' && (
                    <div className="absolute inset-0 rounded-xl ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-900 pointer-events-none" />
                  )}
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {t('settings.wallpaper.picker.newLibrary', '新建我的壁纸库')}
                  </span>
                </button>

                {/* 2. "All Sources" option */}
                <button
                  type="button"
                  onClick={() => selectSource('all')}
                  className={`
                    group relative flex flex-col rounded-xl overflow-hidden text-left transition-all duration-200
                    shadow-sm hover:shadow-md h-36 border border-gray-200 dark:border-gray-700
                    ${selectedSource === 'all' ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-900' : 'hover:scale-[1.02]'}
                  `}
                >
                  {/* Gradient background with icon */}
                  <div className={`h-24 w-full ${SOURCE_HEADER_COLORS.all} flex items-center justify-center`}>
                    <div className="transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      {renderSourceIcon('all')}
                    </div>
                  </div>
                  {/* Info section */}
                  <div className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 flex flex-col justify-center">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
                      {t('settings.wallpaper.picker.allSources', '全部壁纸源')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {t('settings.wallpaper.picker.allSourcesDesc', '浏览聚合图库')}
                    </p>
                  </div>
                </button>

                {/* 3. Source cards */}
                {WALLPAPER_SOURCES.map((source) => {
                  const headerColor = SOURCE_HEADER_COLORS[source.id] || 'bg-gray-400';
                  const isSelected = selectedSource === source.id;

                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => selectSource(source.id)}
                      className={`
                        group relative flex flex-col rounded-xl overflow-hidden text-left transition-all duration-200
                        shadow-sm hover:shadow-md h-36 border border-gray-200 dark:border-gray-700
                        ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-900' : 'hover:scale-[1.02]'}
                      `}
                    >
                      {/* Gradient background with icon */}
                      <div className={`h-24 w-full ${headerColor} flex items-center justify-center`}>
                        <div className="transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                          {renderSourceIcon(source.id)}
                        </div>
                      </div>
                      {/* Info section */}
                      <div className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
                            {source.name}
                          </h3>
                          {source.apiKeyRequired && (
                            <span className="flex items-center gap-0.5 text-xs text-green-600">
                              <Key className="w-3 h-3" />
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {getDescription(source)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create Library Modal */}
          {showCreateLibraryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('settings.wallpaper.picker.createLibrary', '新建壁纸库')}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {t('settings.wallpaper.picker.maxUploadHint', '最多上传20张，单张大小不超过10M')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateLibraryModal(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-5">
                  {/* Upload Area */}
                  <button
                    type="button"
                    onClick={() => customLibraryInputRef.current?.click()}
                    className="w-full py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                  >
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">{t('settings.wallpaper.picker.selectFromComputer', '从我的电脑选取壁纸')}</span>
                    <span className="text-xs mt-1">{customLibraryImages.length}/20</span>
                  </button>
                  <input
                    ref={customLibraryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCustomLibraryUpload}
                    className="hidden"
                  />

                  {/* Preview Grid */}
                  {customLibraryImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {customLibraryImages.map((img, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeCustomLibraryImage(index)}
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {/* Frequency selector */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {t('settings.wallpaper.picker.changeFrequency', '更换频率')}
                    </span>
                    <select
                      value={customLibraryFrequency}
                      onChange={(e) => setCustomLibraryFrequency(e.target.value as 'daily' | 'hourly' | 'startup')}
                      className="ml-2 px-2 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                    >
                      <option value="startup">{t('settings.wallpaper.picker.onStartup', '每次启动')}</option>
                      <option value="hourly">{t('settings.wallpaper.picker.hourly', '每小时')}</option>
                      <option value="daily">{t('settings.wallpaper.picker.daily', '每天')}</option>
                    </select>
                  </div>

                  {/* Apply button */}
                  <button
                    type="button"
                    onClick={applyCustomLibrary}
                    disabled={customLibraryImages.length === 0}
                    className={`
                      px-5 py-2 rounded-lg text-sm font-medium transition-colors
                      ${customLibraryImages.length > 0
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {t('settings.wallpaper.picker.apply', '应用')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default WallpaperPickerModal;
