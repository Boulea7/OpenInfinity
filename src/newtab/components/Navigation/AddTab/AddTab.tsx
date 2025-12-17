import { useMemo } from 'react';
import { Search, Plus, TrendingUp, Share2, AppWindow, Newspaper, Clapperboard, Image, ShoppingBag, MessageCircle, Plane, Coffee, Gamepad2, GraduationCap, Cpu, TrendingDown, BookOpen, MoreHorizontal, Flame, DollarSign, Video, ShoppingCart, Users, Sparkles } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { useNavigationStore } from '../../../stores/navigationStore';
import { PRESET_WEBSITES, PRESET_CATEGORIES } from '../../../data/presetWebsites';
import { WebsiteCard } from './WebsiteCard';
import { cn } from '../../../utils';

// Icon mapping helper
const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
        case 'Flame': return Flame;
        case 'TrendingUp': return TrendingUp;
        case 'Share2': return Share2;
        case 'Users': return Users;
        case 'AppWindow': return AppWindow;
        case 'Newspaper': return Newspaper;
        case 'Clapperboard': return Clapperboard;
        case 'Video': return Video;
        case 'Image': return Image;
        case 'ShoppingBag': return ShoppingBag;
        case 'ShoppingCart': return ShoppingCart;
        case 'MessageCircle': return MessageCircle;
        case 'Plane': return Plane;
        case 'Coffee': return Coffee;
        case 'Gamepad2': return Gamepad2;
        case 'GraduationCap': return GraduationCap;
        case 'Cpu': return Cpu;
        case 'DollarSign': return DollarSign;
        case 'TrendingDown': return TrendingDown;
        case 'BookOpen': return BookOpen;
        case 'MoreHorizontal': return MoreHorizontal;
        case 'Sparkles': return Sparkles;
        default: return MoreHorizontal;
    }
};

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

        // Apply category filter (only if no search query is active, or we can keep it strict)
        // User usually wants to search globally, but let's stick to category if selected? 
        // Actually, usually search overrides category, but let's keep category filter + search within category or global?
        // Let's do: if search is empty, filter by category. If search has text, search globally (or user preference).
        // For now: Category + Search (AND logic)
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
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            {/* Header: Search & Custom Add */}
            <div className="flex items-center gap-3 p-4 px-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索网站"
                        className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 transition-all"
                    />
                </div>
                <button
                    className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="添加自定义网站"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Main Content: 2-Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Categories */}
                <div className="w-[120px] flex-shrink-0 overflow-y-auto no-scrollbar py-2 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <div className="flex flex-col gap-1 px-2">
                        <button
                            onClick={() => setCategory('all' as any)} // Assuming 'all' clears it or we handle it
                            // Actually user might want "All" button. Let's assume if category is empty/null it is "All".
                            // But presetWebsites types might be strict. Let's check store type later.
                            // For now let's iterate categories.
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-xl gap-1 transition-all",
                                !selectedCategory
                                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm"
                                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            <MoreHorizontal className="w-5 h-5" />
                            <span className="text-xs font-medium">全部</span>
                        </button>

                        {PRESET_CATEGORIES.map(category => {
                            const Icon = getCategoryIcon(category.icon);
                            const isActive = selectedCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setCategory(category.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl gap-1.5 transition-all text-center",
                                        isActive
                                            ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm"
                                            : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium leading-tight">{category.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content: Website List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
                    {filteredWebsites.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {filteredWebsites.map(website => (
                                <WebsiteCard key={website.id} website={website} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                            <Search className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-sm">未找到相关网站</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
