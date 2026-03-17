import { Infinity as InfinityIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigationStore } from '../../stores/navigationStore';
import { cn } from '../../utils';

/**
 * InfinityLogo Component
 * Floating action button that opens the Infinity navigation panel
 * Modern glassmorphism design with brand orange accent
 */
export function InfinityLogo() {
    const { t } = useTranslation();
    const openPanel = useNavigationStore((state) => state.openPanel);

    return (
        <button
            type="button"
            onClick={() => openPanel()}
            className={cn(
                // Position and z-index
                'fixed top-4 right-4 z-40',

                // Size and shape
                'w-12 h-12 rounded-full',

                // Glassmorphism background
                'bg-white/70 dark:bg-zinc-900/40',
                'backdrop-blur-xl',
                'border border-white/40 dark:border-white/10',
                'shadow-glass',

                // Layout
                'flex items-center justify-center',

                // Transitions
                'transition-all duration-300 ease-out',

                // Hover state
                'hover:bg-white/90 dark:hover:bg-zinc-800/60',
                'hover:shadow-glow-orange',
                'hover:scale-105',

                // Active state
                'active:scale-95',

                // Focus state (accessibility)
                'focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-brand-orange-500',
                'focus-visible:ring-offset-2',
                'dark:focus-visible:ring-offset-zinc-900',

                // Group for icon hover effect
                'group'
            )}
            aria-label={t('navigation.openInfinity')}
            title={t('navigation.infinity')}
        >
            <InfinityIcon
                className={cn(
                    'w-6 h-6',
                    'text-brand-orange-500',
                    'transition-transform duration-300 ease-out',
                    'group-hover:rotate-12'
                )}
            />
        </button>
    );
}
