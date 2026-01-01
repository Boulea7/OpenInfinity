import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils';

/**
 * CloudSyncSection Component
 * Placeholder for cloud synchronization settings
 */
export function CloudSyncSection() {
    const { t } = useTranslation();
    return (
        <div className={cn(
            "rounded-xl p-4 space-y-2",
            "bg-white dark:bg-gray-900"
        )}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('myTab.cloudSync.title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('myTab.cloudSync.inDevelopment')}
            </p>
        </div>
    );
}
