import { useEffect, useRef, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useIconStore } from '../../../stores/iconStore';
import { useNavigationStore } from '../../../stores/navigationStore';
import type { PresetWebsite } from '../../../services/database';
import { cn } from '../../../utils';

interface WebsiteCardProps {
    website: PresetWebsite;
}

/**
 * WebsiteCard Component
 * Displays a single preset website with adding functionality
 * Modern glassmorphism design with brand orange accents
 */
export function WebsiteCard({ website }: WebsiteCardProps) {
    const addIcon = useIconStore((state) => state.addIcon);
    const closePanel = useNavigationStore((state) => state.closePanel);
    const [isAdded, setIsAdded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
        };
    }, []);

    const handleAdd = async () => {
        if (isAdded || isLoading) return;

        setIsLoading(true);
        try {
            await addIcon({
                title: website.name,
                url: website.url,
                icon: {
                    type: 'favicon',
                    value: website.icon,
                },
            });
            setIsAdded(true);

            // Close panel after short delay to show success state
            closeTimerRef.current = setTimeout(() => {
                closePanel();
            }, 500);
        } catch (error) {
            console.error('Failed to add icon:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className={cn(
                "group relative flex flex-col p-4 w-full h-[120px]",
                "rounded-2xl border",
                // Glassmorphism
                "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl",
                "border-white/50 dark:border-white/5",
                "shadow-glass",
                // Hover effects
                "transition-all duration-300 ease-out",
                "hover:shadow-glass-hover hover:-translate-y-1 hover:shadow-glow-orange",
                "hover:border-white/70 dark:hover:border-white/10"
            )}
        >
            {/* Top Section: Icon & Name */}
            <div className="flex items-start gap-3 mb-2">
                <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden bg-white/50 dark:bg-zinc-800/50 shadow-sm transition-transform group-hover:scale-105">
                    {imageFailed ? (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                            {website.name.charAt(0).toUpperCase()}
                        </div>
                    ) : (
                        <img
                            src={website.icon}
                            alt={website.name}
                            className="w-full h-full object-contain p-1"
                            loading="lazy"
                            onError={() => setImageFailed(true)}
                        />
                    )}
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                    <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 truncate">
                        {website.name}
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        {new URL(website.url).hostname.replace(/^www\./, '')}
                    </p>
                </div>
            </div>

            {/* Bottom Section: Description */}
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed pr-8">
                {website.description}
            </p>

            {/* Add Button */}
            <button
                type="button"
                onClick={handleAdd}
                disabled={isAdded || isLoading}
                className={cn(
                    "absolute bottom-3 right-3 w-8 h-8 rounded-full",
                    "flex items-center justify-center",
                    "transition-all duration-300",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40",
                    isLoading ? "cursor-wait opacity-75" : "cursor-pointer",
                    isAdded
                        ? "bg-green-500 text-white shadow-md cursor-default text-white"
                        : "bg-brand-orange-500 text-white shadow-glow-orange hover:bg-brand-orange-600 hover:scale-110 active:scale-95"
                )}
                aria-label={`Add ${website.name} to home`}
            >
                {isAdded ? (
                    <Check className="w-4 h-4 animate-scale-in" />
                ) : (
                    <Plus className={cn("w-4 h-4", isLoading && "animate-spin")} />
                )}
            </button>
        </div>
    );
}
