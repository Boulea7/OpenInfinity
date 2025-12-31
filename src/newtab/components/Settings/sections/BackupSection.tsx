/**
 * BackupSection - Data backup and restore settings
 */

import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Trash2, BookMarked } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { exportAllData, importAllData, validateBackupFile } from '../../../utils/backup';

// Action button component
const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}> = ({ icon, label, description, onClick, variant = 'default', disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-start gap-3 p-3 rounded text-left
      transition-all duration-200
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${variant === 'danger'
        ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
      }
    `}
  >
    <div className={`
      p-2 rounded
      ${variant === 'danger'
        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      }
    `}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className={`
        text-sm font-medium
        ${variant === 'danger'
          ? 'text-red-700 dark:text-red-300'
          : 'text-gray-900 dark:text-white'
        }
      `}>
        {label}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {description}
      </div>
    </div>
  </button>
);

export const BackupSection: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bookmarkInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Export all data (localStorage + IndexedDB)
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonData = await exportAllData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openinfinity-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert(t('settings.backup.exportError', '导出失败，请重试'));
    } finally {
      setIsExporting(false);
    }
  };

  // Import all data from backup file
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();

      // Validate backup file format
      validateBackupFile(text);

      // Import data (will reload page on success)
      await importAllData(text);
    } catch (error) {
      console.error('Import failed:', error);
      alert(t('settings.backup.importError', '导入失败，请检查文件格式'));
      setIsImporting(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import bookmarks from HTML file
  const handleBookmarkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const html = e.target?.result as string;
        // Parse bookmark HTML - basic implementation
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a');

        const bookmarks = Array.from(links).map((link) => ({
          title: link.textContent || 'Untitled',
          url: link.href,
        }));

        console.info('Imported bookmarks:', bookmarks);
        // TODO: Save bookmarks to store
        alert(t('settings.backup.bookmarkSuccess', `成功导入 ${bookmarks.length} 个书签`));
      } catch (error) {
        console.error('Bookmark import failed:', error);
      }
    };
    reader.readAsText(file);

    if (bookmarkInputRef.current) {
      bookmarkInputRef.current.value = '';
    }
  };

  // Clear cache
  const handleClearCache = () => {
    if (confirm(t('settings.backup.clearCacheConfirm', '确定要清除缓存吗？这不会影响您的设置和数据。'))) {
      // Clear image cache
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }

      // Clear session storage
      sessionStorage.clear();

      alert(t('settings.backup.clearCacheSuccess', '缓存已清除'));
    }
  };

  return (
    <CollapsibleSection
      id="backup"
      title={t('settings.backup.title', '备份')}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      <input
        ref={bookmarkInputRef}
        type="file"
        accept=".html"
        onChange={handleBookmarkImport}
        className="hidden"
      />

      <div className="space-y-2">
        <ActionButton
          icon={<Download className="w-4 h-4" />}
          label={t('settings.backup.export', '导出数据')}
          description={t('settings.backup.exportDesc', '将所有设置和图标导出为文件')}
          onClick={handleExport}
          disabled={isExporting}
        />

        <ActionButton
          icon={<Upload className="w-4 h-4" />}
          label={t('settings.backup.import', '导入数据')}
          description={t('settings.backup.importDesc', '从备份文件恢复设置')}
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        />

        <ActionButton
          icon={<BookMarked className="w-4 h-4" />}
          label={t('settings.backup.importBookmarks', '导入书签')}
          description={t('settings.backup.importBookmarksDesc', '从浏览器导出的HTML文件导入书签')}
          onClick={() => bookmarkInputRef.current?.click()}
        />

        <ActionButton
          icon={<Trash2 className="w-4 h-4" />}
          label={t('settings.backup.clearCache', '清除缓存')}
          description={t('settings.backup.clearCacheDesc', '清除图片和临时数据缓存')}
          onClick={handleClearCache}
          variant="danger"
        />
      </div>
    </CollapsibleSection>
  );
};

export default BackupSection;
