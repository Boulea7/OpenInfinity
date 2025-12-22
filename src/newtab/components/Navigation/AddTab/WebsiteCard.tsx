import { useRef, useState, useEffect, useMemo } from 'react';
import { Plus, Check } from 'lucide-react';
import { useIconStore } from '../../../stores/iconStore';
import type { PresetWebsite } from '../../../services/database';
import { cn, getGoogleFaviconUrl } from '../../../utils';

interface WebsiteCardProps {
    website: PresetWebsite;
}

/**
 * WebsiteCard Component
 * minimalist list item style
 */
export function WebsiteCard({ website }: WebsiteCardProps) {
    const addIcon = useIconStore((state) => state.addIcon);
    const [isAdded, setIsAdded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Generate high-resolution favicon URL (128px for retina displays)
    const hdIconUrl = useMemo(() => {
        return getGoogleFaviconUrl(website.url, 128);
    }, [website.url]);

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
                    value: hdIconUrl, // Use high-resolution icon
                },
            });
            setIsAdded(true);

            // Keep panel open for multiple additions
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
                "bg-white dark:bg-gray-900",
                "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                "transition-colors duration-200"
            )}
        >
            {/* Icon */}
            <div className="relative w-8 h-8 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                {imageFailed ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold bg-gray-50 dark:bg-gray-800">
                        {website.name.charAt(0).toUpperCase()}
                    </div>
                ) : (
                    <img
                        src={hdIconUrl}
                        alt={website.name}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                    />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">
                    {website.name}
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
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
                        : "opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700",
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
