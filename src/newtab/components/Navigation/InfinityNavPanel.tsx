import { useCallback } from 'react';
import { X } from 'lucide-react';
import { useShallow } from 'zustand/shallow';
import { SidePanel } from '../ui/SidePanel';
import { useNavigationStore, type NavigationTab } from '../../stores/navigationStore';
import { AddTab } from './AddTab/AddTab';
import { MyTab } from './MyTab/MyTab';
import { cn } from '../../utils';

/**
 * InfinityNavPanel Component
 * Main navigation panel container featuring a top glassmorphism tab bar.
 */
export function InfinityNavPanel() {
    const { isPanelOpen, activeTab, setActiveTab, closePanel } = useNavigationStore(
        useShallow((state) => ({
            isPanelOpen: state.isPanelOpen,
            activeTab: state.activeTab,
            setActiveTab: state.setActiveTab,
            closePanel: state.closePanel,
        }))
    );

    const handleTabClick = useCallback(
        (tab: NavigationTab) => {
            setActiveTab(tab);
        },
        [setActiveTab]
    );

    const TABS: ReadonlyArray<{ id: NavigationTab; label: string }> = [
        { id: 'add', label: '添加' },
        { id: 'my', label: '我的' },
        { id: 'settings', label: '设置' },
    ];

    // Render dummy content for now, to be replaced in subsequent steps
    const renderTabContent = () => {
        switch (activeTab) {
            case 'add':
                return <AddTab />;
            case 'my':
                return <MyTab />;
            case 'settings':
                return (
                    <div className="animate-fade-in p-6">
                        <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-2xl p-8 shadow-sm">
                            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">全局设置</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                配置选项迁移中...
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <SidePanel
            isOpen={isPanelOpen}
            onClose={closePanel}
            showCloseButton={false}
            className="w-[780px] max-w-[90vw] overflow-hidden rounded-l-2xl border-l border-white/20 dark:border-white/5 shadow-2xl"
            contentClassName="p-0 h-full flex flex-col bg-white/90 dark:bg-zinc-950/90 backdrop-blur-3xl"
        >
            {/* Top Sticky Glass Tab Bar */}
            <div
                className={cn(
                    'sticky top-0 z-20',
                    'bg-white/80 dark:bg-zinc-900/80',
                    'backdrop-blur-xl',
                    'border-b border-zinc-200/50 dark:border-zinc-800/50',
                    'shadow-sm'
                )}
            >
                <div className="flex items-center justify-between px-6 py-4">
                    {/* Tab Group */}
                    <div
                        role="tablist"
                        aria-label="Infinity navigation tabs"
                        className="flex items-center gap-1.5 p-1 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl"
                    >
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                id={`infinity-tab-${tab.id}`}
                                aria-controls={`infinity-panel-${tab.id}`}
                                aria-selected={activeTab === tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={cn(
                                    'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-out',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40',
                                    activeTab === tab.id
                                        ? 'bg-brand-orange-500 text-white shadow-glow-orange scale-100'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-zinc-700/50'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={closePanel}
                        className={cn(
                            'group p-2 rounded-full',
                            'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800',
                            'text-zinc-400 hover:text-red-500 dark:hover:text-red-400',
                            'transition-all duration-200',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40'
                        )}
                        aria-label="Close navigation panel"
                        title="Close"
                    >
                        <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div
                className="flex-1 overflow-y-auto no-scrollbar"
                role="tabpanel"
                id={`infinity-panel-${activeTab}`}
                aria-labelledby={`infinity-tab-${activeTab}`}
            >
                {renderTabContent()}
            </div>
        </SidePanel>
    );
}
