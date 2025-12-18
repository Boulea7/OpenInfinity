import { ChevronRight, Cloud } from 'lucide-react';
import { cn } from '../../../utils';
import { useState } from 'react';

export function AccountSection() {
    const [syncEnabled, setSyncEnabled] = useState(true);

    return (
        <div className={cn(
            "rounded-xl p-4 space-y-4",
            "bg-white dark:bg-zinc-900",
            "border border-zinc-100 dark:border-zinc-800",
            "shadow-sm"
        )}>
            {/* User Profile Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        {/* Placeholder Avatar - replace with image if available */}
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                            alt="User Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-lg font-medium text-zinc-900 dark:text-zinc-100">京</span>
                </div>
                <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

            {/* Sync Toggle Row */}
            <div className="flex items-center justify-between py-1">
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">与其他设备保持同步</span>
                    <span className="text-xs text-zinc-400">上次同步时间：2025年12月18日 02:11</span>
                </div>
                <button
                    onClick={() => setSyncEnabled(!syncEnabled)}
                    className={cn(
                        "w-11 h-6 rounded-full transition-colors relative",
                        syncEnabled ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
                    )}
                >
                    <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 transition-transform shadow-sm",
                        syncEnabled ? "translate-x-5" : "translate-x-0"
                    )} />
                </button>
            </div>

            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-1">
                <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-200 hover:opacity-70 transition-opacity">
                    <span>管理历史备份节点</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-200 hover:opacity-70 transition-opacity">
                    <Cloud className="w-4 h-4" />
                    <span>立即备份</span>
                </button>
            </div>
        </div>
    );
}
