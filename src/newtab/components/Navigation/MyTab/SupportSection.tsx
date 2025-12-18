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
            "bg-white dark:bg-zinc-900",
            "border border-zinc-100 dark:border-zinc-800",
            "shadow-sm"
        )}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">支持</h3>
                <Minus className="w-4 h-4 text-zinc-400" />
            </div>

            <button
                type="button"
                onClick={handleCopyQQ}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium transition-opacity hover:opacity-90",
                    "bg-blue-400"
                )}
            >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                </div>
                <span>QQ群</span>
            </button>
        </div>
    );
}
