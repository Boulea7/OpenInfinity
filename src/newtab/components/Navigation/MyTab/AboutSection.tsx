import { Github, Shield, FileText } from 'lucide-react';
import { cn } from '../../../utils';

/**
 * AboutSection Component
 * App version and legal links
 */
export function AboutSection() {
    return (
        <div className={cn(
            "rounded-2xl p-6 space-y-4",
            "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl",
            "border border-white/50 dark:border-white/5",
            "shadow-glass"
        )}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                关于 OpenInfinity
            </h3>

            <div className="space-y-3">
                {/* Version */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">版本</span>
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">v1.0.0</span>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 my-2" />

                {/* Links */}
                <div className="space-y-2">
                    <a
                        href="https://github.com/Boulea7/OpenInfinity"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40 rounded"
                    >
                        <Github className="w-4 h-4" />
                        <span>GitHub 仓库</span>
                    </a>

                    <a
                        href="#"
                        className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40 rounded"
                    >
                        <Shield className="w-4 h-4" />
                        <span>隐私政策</span>
                    </a>

                    <a
                        href="#"
                        className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-orange-500 dark:hover:text-brand-orange-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40 rounded"
                    >
                        <FileText className="w-4 h-4" />
                        <span>使用条款</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
