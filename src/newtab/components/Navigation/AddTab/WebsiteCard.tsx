import { useRef, useState, useEffect } from 'react';
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
 * minimalist list item style
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
                "group relative flex items-center gap-3 p-3 w-full rounded-xl",
                "bg-white dark:bg-zinc-900",
                "border border-zinc-100 dark:border-zinc-800",
                "shadow-sm hover:shadow-md transition-all duration-200",
                "hover:-translate-y-0.5"
            )}
        >
            {/* Icon */}
            <div className="relative w-8 h-8 shrink-0 rounded-md overflow-hidden bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700">
                {imageFailed ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-bold bg-zinc-50 dark:bg-zinc-800">
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

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                    {website.name}
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    {website.description || new URL(website.url).hostname.replace(/^www\./, '')}
                </p>
            </div>

            {/* Action Button - Only visible on hover or added/loading state */}
            <button
                type="button"
                onClick={handleAdd}
                disabled={isAdded || isLoading}
                className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200",
                    isAdded
                        ? "text-green-500 bg-green-50 dark:bg-green-900/20"
                        : "opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-700",
                    isLoading && "opacity-100"
                )}
                aria-label={`Add ${website.name}`}
            >
                {isAdded ? (
                    <Check className="w-4 h-4" />
                ) : isLoading ? (
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Plus className="w-4 h-4" />
                )}
            </button>
        </div>
    );
}
