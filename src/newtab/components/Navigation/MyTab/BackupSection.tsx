import { ChevronRight, Minus } from 'lucide-react';
import { cn } from '../../../utils';

export function BackupSection() {
    return (
        <div className={cn(
            "rounded-xl p-0 overflow-hidden",
            "bg-white dark:bg-gray-900"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">备份与恢复</h3>
                <Minus className="w-4 h-4 text-gray-400" />
            </div>

            {/* List Items */}
            <div className="flex flex-col">
                <button className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">导出备份数据</span>
                        <span className="text-xs text-gray-400">从当前本地数据导出</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

                <button className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">导入备份数据</span>
                        <span className="text-xs text-gray-400">从备份文件恢复数据</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

                <button className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">修复数据</span>
                        <span className="text-xs text-gray-400">找回丢失或损坏的数据</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
            </div>
        </div>
    );
}
