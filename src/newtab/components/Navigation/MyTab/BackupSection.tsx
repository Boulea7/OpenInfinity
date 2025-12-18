import { ChevronRight, Minus } from 'lucide-react';
import { cn } from '../../../utils';

export function BackupSection() {
    return (
        <div className={cn(
            "rounded-xl p-0 overflow-hidden",
            "bg-white dark:bg-zinc-900",
            "border border-zinc-100 dark:border-zinc-800",
            "shadow-sm"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">备份与恢复</h3>
                <Minus className="w-4 h-4 text-zinc-400" />
            </div>

            {/* List Items */}
            <div className="flex flex-col">
                <button className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">导出备份数据</span>
                        <span className="text-xs text-zinc-400">从当前本地数据导出</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-4" />

                <button className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">导入备份数据</span>
                        <span className="text-xs text-zinc-400">从备份文件恢复数据</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-4" />

                <button className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">修复数据</span>
                        <span className="text-xs text-zinc-400">找回丢失或损坏的数据</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
            </div>
        </div>
    );
}
