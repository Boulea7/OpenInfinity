import { cn } from '../../../utils';

/**
 * BackupSection Component
 * Placeholder for data backup management
 */
export function BackupSection() {
    return (
        <div className={cn(
            "rounded-2xl p-6",
            "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl",
            "border border-white/50 dark:border-white/5",
            "shadow-glass"
        )}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                数据备份
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                备份功能将在后续更新中提供。
            </p>
        </div>
    );
}
