import { useState } from 'react';
import { Modal } from '../ui/Modal';
import type { Icon } from '../../services/database';
import { cn } from '../../utils';

interface FolderNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (_name: string) => void;
  previewIcons?: Icon[];
}

/**
 * FolderNameModal Component
 * Modal for naming a folder when creating via hover merge
 */
export function FolderNameModal({
  isOpen,
  onClose,
  onConfirm,
  previewIcons,
}: FolderNameModalProps) {
  const [folderName, setFolderName] = useState('New Folder');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onConfirm(folderName.trim());
      setFolderName('New Folder'); // Reset for next use
      onClose();
    }
  };

  const handleCancel = () => {
    setFolderName('New Folder');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          创建文件夹
        </h3>

        {/* Preview icons that will be in folder */}
        {previewIcons && previewIcons.length > 0 && (
          <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {previewIcons.map(icon => (
              <div
                key={icon.id}
                className="flex flex-col items-center gap-1"
              >
                {icon.icon.type === 'text' ? (
                  <div
                    className="w-10 h-10 flex items-center justify-center text-lg font-bold text-white rounded"
                    style={{ backgroundColor: icon.icon.color || '#3b82f6' }}
                  >
                    {icon.icon.value}
                  </div>
                ) : (
                  <img
                    src={icon.icon.value}
                    alt={icon.title}
                    className="w-10 h-10 object-contain"
                  />
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[60px]">
                  {icon.title}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              'w-full px-3 py-2 rounded-lg',
              'bg-gray-50 dark:bg-gray-700',
              'border border-gray-300 dark:border-gray-600',
              'text-gray-900 dark:text-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className={cn(
              'px-4 py-2 rounded-lg',
              'bg-gray-100 dark:bg-gray-700',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'transition-colors'
            )}
          >
            取消
          </button>
          <button
            type="submit"
            className={cn(
              'px-4 py-2 rounded-lg',
              'bg-primary-600 text-white',
              'hover:bg-primary-700',
              'transition-colors'
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
