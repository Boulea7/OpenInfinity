import { cn } from '../../../utils';

/**
 * CloudSyncSection Component
 * Placeholder for cloud synchronization settings
 */
export function CloudSyncSection() {
    return (
        <div className={cn(
            "rounded-xl p-4 space-y-2",
            "bg-white dark:bg-gray-900"
        )}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                云同步
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                云同步功能开发中。
            </p>
        </div>
    );
}
