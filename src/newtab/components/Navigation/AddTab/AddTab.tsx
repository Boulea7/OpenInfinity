import { useMemo } from 'react';
import {
    AppWindow,
    Cpu,
    DollarSign,
    Gamepad2,
    GraduationCap,
    HelpCircle,
    Home,
    Image,
    LayoutGrid,
    MessageCircle,
    Newspaper,
    Plane,
    Search,
    ShoppingCart,
    Sparkles,
    TrendingUp,
    Users,
    Video,
    type LucideIcon,
} from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { useNavigationStore } from '../../../stores/navigationStore';
import { PRESET_CATEGORIES, PRESET_WEBSITES } from '../../../data/presetWebsites';
import { WebsiteCard } from './WebsiteCard';
import { cn } from '../../../utils';

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    TrendingUp,
    Users,
    AppWindow,
    Newspaper,
    Sparkles,
    ShoppingCart,
    MessageCircle,
    Video,
    Image,
    Plane,
    Home,
    Gamepad2,
    GraduationCap,
    Cpu,
    DollarSign,
};

function getCategoryIcon(iconName: string): LucideIcon {
    return CATEGORY_ICON_MAP[iconName] ?? HelpCircle;
}

/**
 * AddTab Component
 * Preset website store allowing users to browse and add popular websites
 * Features category filtering and search functionality
 */
export function AddTab() {
    const {
        selectedCategory,
        searchQuery,
        setCategory,
        setSearchQuery
    } = useNavigationStore(
        useShallow((state) => ({
            selectedCategory: state.selectedCategory,
            searchQuery: state.searchQuery,
            setCategory: state.setCategory,
            setSearchQuery: state.setSearchQuery,
        }))
    );

    // Filter websites based on category and search query
    const filteredWebsites = useMemo(() => {
        let result = PRESET_WEBSITES;

        // Apply category filter
        if (selectedCategory) {
            result = result.filter(site => site.category === selectedCategory);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(site =>
                site.name.toLowerCase().includes(query) ||
                site.description.toLowerCase().includes(query) ||
                site.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return result;
    }, [selectedCategory, searchQuery]);

    return (
        <div className="flex h-full gap-6 animate-fade-in pb-4">
            {/* Sidebar: Categories (Fixed Width) */}
            <div className="w-[200px] shrink-0 flex flex-col gap-1 pr-2 overflow-y-auto no-scrollbar">
                <h3 className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Categories
                </h3>

                {/* All Categories Button */}
                <button
                    type="button"
                    onClick={() => setCategory(null)}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/30",
                        !selectedCategory
                            ? "bg-brand-orange-500 text-white shadow-glow-orange"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                    )}
                >
                    <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                    <span>全部</span>
                </button>

                {/* Category List */}
                {PRESET_CATEGORIES.map(category => {
                    const IconComponent = getCategoryIcon(category.icon);

                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => setCategory(category.id)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/30",
                                selectedCategory === category.id
                                    ? "bg-brand-orange-500 text-white shadow-glow-orange"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                            )}
                        >
                            <IconComponent className="w-4 h-4" aria-hidden="true" />
                            <span>{category.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Main Content: Search & Grid */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">

                {/* Search Bar */}
                <div className="relative group z-10">
                    <div className={cn(
                        "absolute inset-0 rounded-2xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl",
                        "border border-white/50 dark:border-white/5 shadow-sm",
                        "transition-all duration-300",
                        "group-focus-within:shadow-glow-orange group-focus-within:border-brand-orange/30 group-focus-within:bg-white/60 dark:group-focus-within:bg-zinc-900/60"
                    )} />
                    <div className="relative flex items-center px-4 h-12">
                        <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-brand-orange-500 transition-colors" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索网站..."
                            className="flex-1 bg-transparent border-none outline-none ml-3 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                            aria-label="搜索网站"
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Website Grid */}
                <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                    {filteredWebsites.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredWebsites.map(website => (
                                <WebsiteCard key={website.id} website={website} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                            <Search className="w-12 h-12 mb-4 opacity-20" />
                            <p>未找到相关网站</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
