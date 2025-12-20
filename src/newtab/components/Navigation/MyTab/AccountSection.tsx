import { ChevronRight, Cloud } from 'lucide-react';
import { cn } from '../../../utils';
import { useState } from 'react';

export function AccountSection() {
    const [syncEnabled, setSyncEnabled] = useState(true);

    return (
        <div className={cn(
            "rounded-xl p-4 space-y-4",
            "bg-white dark:bg-gray-900"
        )}>
            {/* User Profile Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                        {/* Placeholder Avatar - replace with image if available */}
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                            alt="User Avatar"
                            className="w-full h-full object-cover"
                        />
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
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">与其他设备保持同步</span>
                    <span className="text-xs text-gray-400">上次同步时间：2025年12月18日 02:11</span>
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
                    <span>管理历史备份节点</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200">
                    <Cloud className="w-4 h-4" />
                    <span>立即备份</span>
                </button>
            </div>
        </div>
    );
}
