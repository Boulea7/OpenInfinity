import { Minus } from 'lucide-react';
import { cn } from '../../../utils';

export function AboutSection() {
    return (
        <div className={cn(
            "rounded-xl p-4 pb-2 bg-white dark:bg-zinc-900",
            "border border-zinc-100 dark:border-zinc-800",
            "shadow-sm"
        )}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">关于</h3>
                <Minus className="w-4 h-4 text-zinc-400" />
            </div>

            <div className="mb-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-500">v11.0.19</p>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                <a href="#" className="text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    关于我们
                </a>
                <a href="#" className="text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    联系我们
                </a>
                <a href="#" className="text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    隐私政策
                </a>
                <a href="#" className="text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    使用条款
                </a>
            </div>
            <div className="h-2" />
        </div>
    );
}
