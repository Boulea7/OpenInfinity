import { Minus, Users } from 'lucide-react';
import { cn, copyToClipboard } from '../../../utils';

export function SupportSection() {
    const handleCopyQQ = async () => {
        const ok = await copyToClipboard('123456789');
        alert(ok ? 'QQ群号已复制' : '复制失败，请手动复制：123456789');
    };

    return (
        <div className={cn(
            "rounded-xl p-4 space-y-4",
            "bg-white dark:bg-gray-900"
        )}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">支持</h3>
                <Minus className="w-4 h-4 text-gray-400" />
            </div>

            <button
                type="button"
                onClick={handleCopyQQ}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors duration-200",
                    "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                )}
            >
                <Users className="w-4 h-4" aria-hidden="true" />
                <span>QQ群</span>
            </button>
        </div>
    );
}
