import { useState, useEffect, useCallback } from 'react';
import { X, Globe } from 'lucide-react';
import type { Icon } from '../../services/database';
import { useIconStore } from '../../stores';
import { cn } from '../../utils';
import IconTypeSelectorContainer from './IconTypeSelectorContainer';
import type { IconType, IconDraft } from '../../../shared/icon';

interface IconEditorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  editingIcon: Icon | null;
}

export function IconEditorSidebar({ isOpen, onClose, editingIcon }: IconEditorSidebarProps) {
  const { addIcon, updateIcon } = useIconStore();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  // Icon state (stores the value/color/dataUrl from IconTypeSelector)
  const [iconType, setIconType] = useState<IconType>('favicon');
  const [iconData, setIconData] = useState<IconDraft | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeWebsiteUrl = useCallback((raw: string): string => {
    const trimmed = (raw || '').trim();
    if (!trimmed) {
      throw new Error('Please enter a URL');
    }

    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withScheme);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') {
      throw new Error('Please enter a valid URL');
    }
    return parsed.toString();
  }, []);

  const buildGoogleFaviconUrl = useCallback((normalizedUrl: string): string => {
    const hostname = new URL(normalizedUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  }, []);

  const toStoredIcon = useCallback(
    (type: IconType, data: IconDraft | null, normalizedUrl: string, websiteTitle: string): Icon['icon'] => {
      if (type === 'text') {
        // Safely access text-specific properties
        const textData = data?.type === 'text' ? data : null;
        const value = textData?.value || websiteTitle.slice(0, 2);
        const color = textData?.color || '#3b82f6';
        return {
          type: 'text',
          value: (value || '?').slice(0, 2).toUpperCase(),
          color,
        };
      }

      if (type === 'custom') {
        const customData = data?.type === 'custom' ? data : null;
        const value = customData?.value || '';
        if (!value) {
          // Fallback to favicon if user didn't finish the upload flow
          return { type: 'favicon', value: buildGoogleFaviconUrl(normalizedUrl) };
        }
        return { type: 'custom', value };
      }

      // favicon
      const faviconData = data?.type === 'favicon' ? data : null;
      const value = faviconData?.value || '';
      return { type: 'favicon', value: value || buildGoogleFaviconUrl(normalizedUrl) };
    },
    [buildGoogleFaviconUrl]
  );

  // Initialize state when editingIcon changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingIcon) {
      setTitle(editingIcon.title);
      setUrl(editingIcon.url);

      const existingIcon = editingIcon.icon;
      const existingType = existingIcon?.type;

      // Map database icon type to IconDraft type
      const safeType: IconType =
        existingType === 'text' || existingType === 'favicon' || existingType === 'custom'
          ? existingType
          : 'favicon';

      setIconType(safeType);

      // Convert database icon to IconDraft format
      if (existingType === 'text') {
        setIconData({
          type: 'text',
          value: existingIcon.value,
          color: existingIcon.color || '#3b82f6',
        });
      } else if (existingType === 'custom') {
        setIconData({
          type: 'custom',
          value: existingIcon.value,
        });
      } else if (existingType === 'favicon' || existingType === 'system') {
        // Treat 'system' as favicon for editing purposes
        setIconData({
          type: 'favicon',
          value: existingIcon.value,
        });
      } else {
        setIconData(null);
      }
    } else {
      // New icon defaults
      setTitle('');
      setUrl('');
      setIconType('favicon');
      setIconData(null);
    }

    setError(null);
  }, [isOpen, editingIcon]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSave = async () => {
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a title');
      return;
    }

    setIsLoading(true);
    try {
      const normalizedUrl = normalizeWebsiteUrl(url);
      const finalIcon = toStoredIcon(iconType, iconData, normalizedUrl, trimmedTitle);

      if (editingIcon) {
        await updateIcon(editingIcon.id, {
          title: trimmedTitle,
          url: normalizedUrl,
          icon: finalIcon,
        });
      } else {
        await addIcon({
          title: trimmedTitle,
          url: normalizedUrl,
          icon: finalIcon,
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save icon');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && !isLoading) return null;

  // System icons should not be editable
  const isSystemIconEditing = editingIcon?.isSystemIcon === true;

  const show = isOpen;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] transition-opacity duration-300',
          show ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleClose}
      />

      {/* Sidebar Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-[60] w-[360px]',
          'bg-white dark:bg-zinc-900',
          'shadow-2xl',
          'transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'flex flex-col',
          show ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {editingIcon ? '编辑图标' : '添加图标'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* System icon protection message */}
          {isSystemIconEditing ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Globe size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                系统快捷方式不可编辑
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px]">
                这是一个内置的系统快捷方式，无法修改其属性。如需隐藏此快捷方式，可在设置 &gt; 系统快捷方式中进行管理。
              </p>
            </div>
          ) : (
          <>
          {/* URL Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              网站地址
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              网站名称
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Website"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 transition-all text-sm font-medium"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              选择图标
            </label>
            <div className="bg-white dark:bg-zinc-900 rounded-xl">
              <IconTypeSelectorContainer
                type={iconType}
                onTypeChange={setIconType}
                url={url}
                websiteName={title}
                iconData={iconData}
                onIconChange={setIconData}
                onEditRequest={(imageUrl, requestType) => {
                  // Minimal behavior: accept the incoming image URL directly.
                  // The popup flow may open a crop editor, but in newtab we keep it simple.
                  if (requestType === 'custom') {
                    setIconType('custom');
                    setIconData({ type: 'custom', value: imageUrl });
                    return;
                  }
                  if (requestType === 'favicon') {
                    setIconType('favicon');
                    setIconData({ type: 'favicon', value: imageUrl });
                  }
                }}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}
          </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex flex-col gap-3">
            {isSystemIconEditing ? (
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium rounded-lg transition-colors"
              >
                关闭
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-medium rounded-lg shadow-sm shadow-brand-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? '保存中...' : '确定'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 font-medium rounded-lg transition-colors"
                >
                  取消
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
