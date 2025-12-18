import { Minus } from 'lucide-react';
import { cn } from '../../../utils';

export function FeedbackSection() {
    return (
        <div className={cn(
            "rounded-xl p-4 space-y-4",
            "bg-white dark:bg-zinc-900",
            "border border-zinc-100 dark:border-zinc-800",
            "shadow-sm"
        )}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">用户评价</h3>
                <Minus className="w-4 h-4 text-zinc-400" />
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                如果您喜欢Infinity新标签页，请给我们打分或者反馈帮助我们进行优化。
            </p>

            <div className="flex gap-3">
                <button className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors">
                    五星好评
                </button>
                <button className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors">
                    反馈
                </button>
            </div>
        </div>
    );
}
