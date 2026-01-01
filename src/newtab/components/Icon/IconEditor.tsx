import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Icon } from '../../services/database';
import { useIconStore } from '../../stores';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils';

interface IconEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editingIcon?: Icon | null;
}

/**
 * IconEditor Component
 * Modal form for adding or editing website shortcuts
 */
export function IconEditor({ isOpen, onClose, editingIcon }: IconEditorProps) {
  const { t } = useTranslation();
  const { addIcon, updateIcon } = useIconStore();

  // Form state
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or editingIcon changes
  useEffect(() => {
    if (isOpen) {
      if (editingIcon) {
        setTitle(editingIcon.title);
        setUrl(editingIcon.url);
        // Extract icon value from structured icon object
        setIconUrl(editingIcon.icon.value || '');
      } else {
        setTitle('');
        setUrl('');
        setIconUrl('');
      }
      setError(null);
    }
  }, [isOpen, editingIcon]);

  // Validate URL format
  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Auto-fetch favicon when URL changes
  const fetchFavicon = useCallback(async (websiteUrl: string) => {
    if (!isValidUrl(websiteUrl) || iconUrl) return;

    try {
      const urlObj = new URL(websiteUrl);
      // Use Google's favicon service as fallback
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
      setIconUrl(faviconUrl);
    } catch {
      // Ignore favicon fetch errors
    }
  }, [iconUrl]);

  // Handle URL blur to auto-fetch favicon
  const handleUrlBlur = () => {
    if (url && isValidUrl(url)) {
      fetchFavicon(url);

      // Auto-fill title from domain if empty
      if (!title) {
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname.replace('www.', '');
          const siteName = hostname.split('.')[0];
          setTitle(siteName.charAt(0).toUpperCase() + siteName.slice(1));
        } catch {
          // Ignore
        }
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!title.trim()) {
      setError(t('iconEditor.titleRequired'));
      return;
    }

    if (!url.trim()) {
      setError(t('iconEditor.urlRequired'));
      return;
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    if (!isValidUrl(normalizedUrl)) {
      setError(t('iconEditor.urlInvalid'));
      return;
    }

    setIsLoading(true);

    try {
      // Generate default icon URL if not provided
      const finalIconUrl = iconUrl || `https://www.google.com/s2/favicons?domain=${new URL(normalizedUrl).hostname}&sz=128`;

      // Construct icon object (new data structure)
      const iconData = {
        type: finalIconUrl.startsWith('data:') ? 'custom' as const : 'favicon' as const,
        value: finalIconUrl,
      };

      if (editingIcon) {
        // Update existing icon
        await updateIcon(editingIcon.id, {
          title: title.trim(),
          url: normalizedUrl,
          icon: iconData,
        });
      } else {
        // Add new icon
        await addIcon({
          title: title.trim(),
          url: normalizedUrl,
          icon: iconData,
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('iconEditor.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle icon URL clear
  const handleClearIcon = () => {
    setIconUrl('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingIcon ? t('iconEditor.editIcon') : t('iconEditor.addIcon')}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Icon preview */}
        <div className="flex justify-center">
          <div className="relative group">
            <div
              className={cn(
                'w-16 h-16 rounded-xl overflow-hidden',
                'bg-gray-100 dark:bg-gray-700',
                'flex items-center justify-center',
                'border-2 border-dashed border-gray-300 dark:border-gray-600'
              )}
            >
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt="Icon preview"
                  className="w-full h-full object-cover"
                  onError={() => setIconUrl('')}
                />
              ) : (
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
            {iconUrl && (
              <button
                type="button"
                onClick={handleClearIcon}
                className={cn(
                  'absolute -top-2 -right-2',
                  'w-6 h-6 rounded-full',
                  'bg-red-500 text-white',
                  'flex items-center justify-center',
                  'opacity-0 group-hover:opacity-100',
                  'transition-opacity duration-200'
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Title input */}
        <div>
          <label
            htmlFor="icon-title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t('iconEditor.title')}
          </label>
          <input
            id="icon-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Google"
            className={cn(
              'w-full px-3 py-2 rounded-lg',
              'bg-gray-50 dark:bg-gray-700',
              'border border-gray-300 dark:border-gray-600',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-colors duration-200'
            )}
            autoFocus
          />
        </div>

        {/* URL input */}
        <div>
          <label
            htmlFor="icon-url"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t('iconEditor.url')}
          </label>
          <input
            id="icon-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleUrlBlur}
            placeholder="e.g., https://google.com"
            className={cn(
              'w-full px-3 py-2 rounded-lg',
              'bg-gray-50 dark:bg-gray-700',
              'border border-gray-300 dark:border-gray-600',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-colors duration-200'
            )}
          />
        </div>

        {/* Custom icon URL input */}
        <div>
          <label
            htmlFor="icon-image"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t('iconEditor.customIconUrl')}
          </label>
          <input
            id="icon-image"
            type="text"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="e.g., https://example.com/icon.png"
            className={cn(
              'w-full px-3 py-2 rounded-lg',
              'bg-gray-50 dark:bg-gray-700',
              'border border-gray-300 dark:border-gray-600',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-colors duration-200'
            )}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg',
              'bg-gray-100 dark:bg-gray-700',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'transition-colors duration-200'
            )}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg',
              'bg-primary-600 text-white',
              'hover:bg-primary-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200'
            )}
          >
            {isLoading ? t('iconEditor.saving') : editingIcon ? t('common.save') : t('iconEditor.add')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default IconEditor;
