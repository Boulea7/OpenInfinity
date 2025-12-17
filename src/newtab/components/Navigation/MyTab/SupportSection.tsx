import { Star, MessageCircle, QrCode } from 'lucide-react';
import { cn, copyToClipboard } from '../../../utils';

/**
 * SupportSection Component
 * Provides support and feedback channels
 */
export function SupportSection() {
    const handleCopyQQ = async () => {
        const ok = await copyToClipboard('123456789');
        alert(ok ? 'QQ群号已复制' : '复制失败，请手动复制：123456789');
    };

    return (
        <div className={cn(
            "rounded-2xl p-6 space-y-4",
            "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl",
            "border border-white/50 dark:border-white/5",
            "shadow-glass"
        )}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                支持与反馈
            </h3>

            <div className="space-y-3">
                {/* Chrome Store Rating */}
                <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700/50",
                        "bg-white/50 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-800",
                        "text-zinc-600 dark:text-zinc-400 font-medium transition-all duration-200",
                        "hover:text-brand-orange-500 dark:hover:text-brand-orange-400 hover:border-brand-orange/30 hover:-translate-y-0.5",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
                    )}
                    aria-label="Rate on Chrome Web Store"
                >
                    <Star className="w-5 h-5" />
                    <span>在 Chrome 商店评价</span>
                </a>

                {/* QQ Group */}
                <button
                    type="button"
                    onClick={handleCopyQQ}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700/50",
                        "bg-white/50 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-800",
                        "text-zinc-600 dark:text-zinc-400 font-medium transition-all duration-200",
                        "hover:text-brand-orange-500 dark:hover:text-brand-orange-400 hover:border-brand-orange/30 hover:-translate-y-0.5",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
                    )}
                    aria-label="Join QQ Group"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span>加入QQ群：123456789</span>
                </button>

                {/* WeChat Official Account */}
                <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700/50",
                    "bg-white/50 dark:bg-zinc-800/50",
                    "text-zinc-600 dark:text-zinc-400 font-medium cursor-default"
                )}>
                    <QrCode className="w-5 h-5" />
                    <span>微信公众号：OpenInfinity</span>
                </div>

                {/* Donation Placeholder */}
                <div className="pt-2">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">打赏支持</p>
                    <div className="w-full aspect-square max-w-[200px] mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700">
                        <span className="text-xs text-zinc-400">扫码支持开发 (占位)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
