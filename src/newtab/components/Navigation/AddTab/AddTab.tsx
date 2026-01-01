import { useMemo, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { Search, Plus, TrendingUp, Share2, AppWindow, Newspaper, Clapperboard, Image, ShoppingBag, MessageCircle, Plane, Coffee, Gamepad2, GraduationCap, Cpu, TrendingDown, BookOpen, MoreHorizontal, Flame, DollarSign, Video, ShoppingCart, Users, Sparkles } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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

    // Sliding indicator state
    const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate indicator position
    const updateIndicator = useCallback(() => {
        const activeIndex = selectedCategory
            ? PRESET_CATEGORIES.findIndex(c => c.id === selectedCategory) + 1
            : 0;
        const activeButton = buttonRefs.current[activeIndex];
        if (activeButton && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const buttonRect = activeButton.getBoundingClientRect();
            setIndicatorStyle({
                top: buttonRect.top - containerRect.top,
                height: buttonRect.height,
            });
        }
    }, [selectedCategory]);

    useLayoutEffect(() => {
        updateIndicator();
    }, [updateIndicator]);

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
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            {/* Header: Search & Custom Add */}
            <div className="flex items-center gap-3 p-4 px-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('addTab.searchPlaceholder')}
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-all"
                    />
                </div>
                <button
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200"
                    title={t('addTab.addCustomWebsite')}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Main Content: 2-Column Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Categories with Sliding Indicator */}
                <div className="w-[160px] flex-shrink-0 overflow-y-auto no-scrollbar py-2 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div ref={containerRef} className="relative flex flex-col gap-0.5 px-2">
                        {/* Sliding Indicator */}
                        <div
                            className="absolute left-2 right-2 bg-gray-100 dark:bg-gray-800 rounded-xl transition-all duration-300 ease-out pointer-events-none"
                            style={{
                                top: indicatorStyle.top,
                                height: indicatorStyle.height,
                                opacity: indicatorStyle.height > 0 ? 1 : 0,
                            }}
                        />

                        {/* All Button */}
                        <button
                            ref={(el) => { buttonRefs.current[0] = el; }}
                            onClick={() => setCategory(null)}
                            className={cn(
                                "relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-colors duration-200",
                                !selectedCategory
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                        >
                            <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{t('addTab.all')}</span>
                        </button>

                        {/* Category Buttons */}
                        {PRESET_CATEGORIES.map((category, index) => {
                            const Icon = getCategoryIcon(category.icon);
                            const isActive = selectedCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    ref={(el) => { buttonRefs.current[index + 1] = el; }}
                                    onClick={() => setCategory(category.id)}
                                    className={cn(
                                        "relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-colors duration-200",
                                        isActive
                                            ? "text-gray-900 dark:text-white"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium truncate">{category.name}</span>
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
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Search className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-sm">{t('addTab.noWebsitesFound')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
