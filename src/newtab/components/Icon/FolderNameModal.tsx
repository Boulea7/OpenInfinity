import { useState } from 'react';
import { Modal } from '../ui/Modal';
import type { Icon } from '../../services/database';
import { cn, getGoogleFaviconUrl } from '../../utils';
import { FolderPlus } from 'lucide-react';

interface FolderNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (_name: string) => void;
  previewIcons?: Icon[];
}

/**
 * FolderNameModal Component
 * Modal for naming a folder when creating via hover merge
 * Refactored to match SettingsPanelV2 design language
 */
export function FolderNameModal({
  isOpen,
  onClose,
  onConfirm,
  previewIcons,
}: FolderNameModalProps) {
  const [folderName, setFolderName] = useState('New Folder');
  const [previewErrors, setPreviewErrors] = useState<Record<string, boolean>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onConfirm(folderName.trim());
      setFolderName('New Folder');
      onClose();
    }
  };

  const handleCancel = () => {
    setFolderName('New Folder');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="sm">
      <form onSubmit={handleSubmit} className="p-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary-600 dark:text-primary-400">
            <FolderPlus size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
              创建文件夹
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              为合并的图标命名
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Preview Section */}
          {previewIcons && previewIcons.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                包含图标
              </label>
              <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800/50 overflow-x-auto custom-scrollbar">
                {previewIcons.map(icon => (
                  <div
                    key={icon.id}
                    className="flex flex-col items-center gap-2 group min-w-[64px]"
                  >
                    <div className="relative p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 group-hover:shadow-md transition-all duration-200">
                      {icon.icon.type === 'text' ? (
                        <div
                          className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white rounded"
                          style={{ backgroundColor: icon.icon.color || '#3b82f6' }}
                        >
                          {icon.icon.value}
                        </div>
                      ) : (
                        previewErrors[icon.id] ? (
                          <div className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-gray-400 text-white rounded">
                            {(icon.title?.[0] || '?').toUpperCase()}
                          </div>
                        ) : (
                          <img
                            src={
                              icon.icon.type === 'custom' || icon.icon.type === 'favicon'
                                ? icon.icon.value
                                : getGoogleFaviconUrl(icon.url, 64)
                            }
                            alt={icon.title}
                            className="w-8 h-8 object-contain"
                            loading="lazy"
                            onError={() => setPreviewErrors(prev => ({ ...prev, [icon.id]: true }))}
                          />
                        )
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 w-full text-center truncate px-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {icon.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-1">
              文件夹名称
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="输入文件夹名称"
              autoFocus
              className={cn(
                'w-full px-4 py-2.5 rounded-lg',
                'bg-gray-50 dark:bg-gray-800',
                'border border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-8">
          <button
            type="button"
            onClick={handleCancel}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'text-gray-600 dark:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'active:scale-95 transition-all duration-200'
            )}
          >
            取消
          </button>
          <button
            type="submit"
            className={cn(
              'px-6 py-2 rounded-lg text-sm font-medium',
              'bg-primary-600 text-white',
              'hover:bg-primary-700',
              'shadow-sm hover:shadow',
              'active:scale-95 transition-all duration-200'
            )}
          >
            创建
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default FolderNameModal;
