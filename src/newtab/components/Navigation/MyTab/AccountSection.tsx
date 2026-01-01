import { ChevronRight, Cloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils';
import { useState } from 'react';

export function AccountSection() {
    const { t } = useTranslation();
    const [syncEnabled, setSyncEnabled] = useState(true);

    return (
        <div className={cn(
            "rounded-xl p-4 space-y-4",
            "bg-white dark:bg-gray-900"
        )}>
            {/* User Profile Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center overflow-hidden">
                        {/* Infinity Logo Avatar */}
                        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                            <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.82 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.37-5.4-5.37z"/>
                        </svg>
                    </div>
                    <span className="text-lg font-medium text-gray-900 dark:text-gray-100">京</span>
                </div>
                <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            {/* Sync Toggle Row */}
            <div className="flex items-center justify-between py-1">
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{t('myTab.account.syncDevices')}</span>
                    <span className="text-xs text-gray-400">{t('myTab.account.lastSyncTime')}</span>
                </div>
                <button
                    onClick={() => setSyncEnabled(!syncEnabled)}
                    className={cn(
                        "w-11 h-6 rounded-full transition-colors duration-200 relative",
                        syncEnabled ? "bg-gray-900 dark:bg-gray-100" : "bg-gray-200 dark:bg-gray-700"
                    )}
                >
                    <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white dark:bg-gray-900 transition-transform duration-200",
                        syncEnabled ? "translate-x-5" : "translate-x-0"
                    )} />
                </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-1">
                <button className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200">
                    <span>{t('myTab.account.manageBackups')}</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200">
                    <Cloud className="w-4 h-4" />
                    <span>{t('myTab.account.backupNow')}</span>
                </button>
            </div>
        </div>
    );
}
