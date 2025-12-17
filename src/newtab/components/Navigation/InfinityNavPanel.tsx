import { useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { SidePanel } from '../ui/SidePanel';
import { useNavigationStore, type NavigationTab } from '../../stores/navigationStore';
import { SettingsPanel } from '../Settings/SettingsPanel';
import { AddTab } from './AddTab/AddTab';
import { MyTab } from './MyTab/MyTab';
import { cn } from '../../utils';

/**
 * InfinityNavPanel Component
 * Main navigation panel container featuring a top glassmorphism tab bar.
 */
export function InfinityNavPanel() {
    // Force HMR update
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
                // Render SettingsPanel in embedded mode (no SidePanel wrapper)
                return <SettingsPanel isOpen={true} onClose={() => { }} embedded={true} />;
            default:
                return null;
        }
    };

    return (
        <SidePanel
            isOpen={isPanelOpen}
            onClose={closePanel}
            showCloseButton={false}
            className="w-[420px] max-w-[90vw] overflow-hidden border-l border-zinc-200 dark:border-zinc-800 shadow-xl"
            contentClassName="p-0 h-full flex flex-col bg-zinc-50 dark:bg-zinc-950"
        >
            {/* Minimalist Top Tab Bar */}
            <div
                className={cn(
                    'sticky top-0 z-20',
                    'bg-white dark:bg-zinc-950',
                    'border-b border-zinc-100 dark:border-zinc-900',
                )}
            >
                <div className="flex flex-col">
                    {/* Header with Close */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <div className="flex items-center gap-4 flex-1 justify-center">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabClick(tab.id)}
                                    className={cn(
                                        'flex flex-col items-center gap-1 min-w-[3rem]',
                                        'text-xs font-medium transition-colors duration-200',
                                        activeTab === tab.id
                                            ? 'text-zinc-900 dark:text-white'
                                            : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                                    )}
                                >
                                    {/* Icon Placeholder or just text */}
                                    <span className="text-lg leading-none">
                                        {/* You could add icons here later if needed, but text is fine for minimal */}
                                        {tab.id === 'add' && '+'}
                                        {tab.id === 'my' && '👤'}
                                        {tab.id === 'settings' && '⚙️'}
                                    </span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div
                className="flex-1 overflow-y-auto no-scrollbar bg-zinc-50/50 dark:bg-zinc-900/50"
                role="tabpanel"
            >
                {renderTabContent()}
            </div>
        </SidePanel>
    );
}
