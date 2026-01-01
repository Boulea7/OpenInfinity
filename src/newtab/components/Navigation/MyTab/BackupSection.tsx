import { ChevronRight, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils';

export function BackupSection() {
    const { t } = useTranslation();
    return (
        <div className={cn(
            "rounded-xl p-0 overflow-hidden",
            "bg-white dark:bg-gray-900"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">{t('myTab.backup.title')}</h3>
                <Minus className="w-4 h-4 text-gray-400" />
            </div>

            {/* List Items */}
            <div className="flex flex-col">
                <button className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('myTab.backup.export.title')}</span>
                        <span className="text-xs text-gray-400">{t('myTab.backup.export.description')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

                <button className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('myTab.backup.import.title')}</span>
                        <span className="text-xs text-gray-400">{t('myTab.backup.import.description')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

                <button className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('myTab.backup.repair.title')}</span>
                        <span className="text-xs text-gray-400">{t('myTab.backup.repair.description')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
            </div>
        </div>
    );
}
