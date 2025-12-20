import { Minus } from 'lucide-react';
import { cn } from '../../../utils';

export function AboutSection() {
    return (
        <div className={cn(
            "rounded-xl p-4 pb-2",
            "bg-white dark:bg-gray-900"
        )}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">关于</h3>
                <Minus className="w-4 h-4 text-gray-400" />
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-500">v11.0.19</p>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                <a href="#" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    关于我们
                </a>
                <a href="#" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    联系我们
                </a>
                <a href="#" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    隐私政策
                </a>
                <a href="#" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                    使用条款
                </a>
            </div>
            <div className="h-2" />
        </div>
    );
}
