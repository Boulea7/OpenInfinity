/**
 * ResetSection - Reset settings to defaults
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { db } from '../../../services/database';

export const ResetSection: React.FC = () => {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsResetting(true);

    try {
      // Clear localStorage with correct keys
      localStorage.removeItem('openinfinity-settings');
      localStorage.removeItem('openinfinity-wallpaper');

      // Clear all IndexedDB tables
      await db.transaction(
        'rw',
        [db.icons, db.folders, db.todos, db.notes, db.wallpapers, db.weatherCache],
        async () => {
          await Promise.all([
            db.icons.clear(),
            db.folders.clear(),
            db.todos.clear(),
            db.notes.clear(),
            db.wallpapers.clear(),
            db.weatherCache.clear(),
          ]);
        }
      );

      // Reload to apply defaults
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Reset failed:', error);
      setIsResetting(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <CollapsibleSection
      id="reset"
      title={t('settings.reset.title', '重置设置')}
    >
      {!showConfirm ? (
        <button
          type="button"
          onClick={handleReset}
          className="
            w-full flex items-center justify-center gap-2
            px-4 py-3 rounded
            bg-gray-100 dark:bg-gray-800
            text-gray-700 dark:text-gray-300
            hover:bg-gray-200 dark:hover:bg-gray-700
            transition-all duration-200
          "
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-medium">
            {t('settings.reset.button', '还原默认设置')}
          </span>
        </button>
      ) : (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-700 dark:text-red-300">
                {t('settings.reset.confirmTitle', '确认重置')}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                {t('settings.reset.confirmDesc', '此操作将清除所有设置和数据，无法恢复。建议先导出备份。')}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="
                flex-1 px-3 py-2 rounded text-sm
                bg-white dark:bg-gray-800
                text-gray-700 dark:text-gray-300
                border border-gray-200 dark:border-gray-700
                hover:bg-gray-50 dark:hover:bg-gray-700
                transition-colors
              "
            >
              {t('common.cancel', '取消')}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className="
                flex-1 px-3 py-2 rounded text-sm
                bg-red-600 text-white
                hover:bg-red-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {isResetting
                ? t('settings.reset.resetting', '重置中...')
                : t('settings.reset.confirm', '确认重置')
              }
            </button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
};

export default ResetSection;
