import { User } from 'lucide-react';
import { cn } from '../../../utils';

/**
 * AccountSection Component
 * Displays user profile placeholder and login CTA
 * Glassmorphism design
 */
export function AccountSection() {
    const handleLogin = () => {
        alert('登录功能将在阶段3实现');
    };

    return (
        <div className={cn(
            "rounded-2xl p-6",
            "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl",
            "border border-white/50 dark:border-white/5",
            "shadow-glass"
        )}>
            <div className="flex flex-col items-center">
                {/* Avatar Placeholder */}
                <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 shadow-inner border border-white/20">
                    <User className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
                </div>

                {/* Status Text */}
                <h3 className="mt-4 mb-5 font-medium text-lg text-zinc-900 dark:text-zinc-100">
                    未登录
                </h3>

                {/* Login Button */}
                <button
                    type="button"
                    onClick={handleLogin}
                    className={cn(
                        "w-full py-2.5 rounded-xl font-medium text-white transition-all duration-300",
                        "bg-gradient-to-br from-brand-orange to-brand-orange-600 hover:to-brand-orange-500",
                        "shadow-glow-orange hover:shadow-glow-orange-lg hover:-translate-y-0.5 active:scale-95 active:shadow-inner",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
                    )}
                    aria-label="Login to account"
                >
                    立即登录
                </button>
            </div>
        </div>
    );
}
