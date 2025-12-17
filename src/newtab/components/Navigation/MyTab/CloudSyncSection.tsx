import { cn } from '../../../utils';

/**
 * CloudSyncSection Component
 * Placeholder for cloud synchronization settings
 */
export function CloudSyncSection() {
    return (
        <div className={cn(
            "rounded-2xl p-6",
            "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl",
            "border border-white/50 dark:border-white/5",
            "shadow-glass"
        )}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                云同步
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                云同步功能开发中。
            </p>
        </div>
    );
}
