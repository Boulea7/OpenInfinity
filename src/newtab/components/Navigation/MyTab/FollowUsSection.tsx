import { Minus, QrCode } from 'lucide-react';
import { cn } from '../../../utils';

export function FollowUsSection() {
    return (
        <div className="flex flex-col gap-6">
            {/* WeChat Official Account */}
            <div className={cn(
                "rounded-xl p-4 space-y-4",
                "bg-white dark:bg-zinc-900",
                "border border-zinc-100 dark:border-zinc-800",
                "shadow-sm"
            )}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">关注Infinity微信公众号</h3>
                    <Minus className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    关注我们的微信公众号（微信号：infinitydaily），获取Infinity最新产品动态，还能带你发现更多好玩有趣的扩展和网站。
                </p>
                <div className="flex justify-center py-2">
                    <div className="w-32 h-32 bg-white p-2 rounded-lg border border-zinc-100 shadow-sm flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-zinc-800" />
                    </div>
                </div>
            </div>

            {/* Share */}
            <div className={cn(
                "rounded-xl p-4 space-y-4",
                "bg-white dark:bg-zinc-900",
                "border border-zinc-100 dark:border-zinc-800",
                "shadow-sm"
            )}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">分享</h3>
                    <Minus className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex gap-4">
                    <button className="w-12 h-12 rounded-lg bg-yellow-400 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                        {/* Star icon typically */}
                        <span className="font-bold text-xl">★</span>
                    </button>
                    <button className="w-12 h-12 rounded-lg bg-green-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                        {/* Douban or similar */}
                        <span className="font-bold">豆</span>
                    </button>
                    <button className="w-12 h-12 rounded-lg bg-red-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                        {/* Weibo */}
                        <span className="font-bold text-xl">We</span>
                    </button>
                </div>
            </div>

            {/* Follow Us (Weibo) */}
            <div className={cn(
                "rounded-xl p-4 space-y-4",
                "bg-white dark:bg-zinc-900",
                "border border-zinc-100 dark:border-zinc-800",
                "shadow-sm"
            )}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">关注我们</h3>
                    <Minus className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                    <button className="w-12 h-12 rounded-lg bg-red-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                        <span className="font-bold text-xl">We</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
