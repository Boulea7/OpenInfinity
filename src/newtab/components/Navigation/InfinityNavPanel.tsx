import { useCallback, lazy, Suspense } from 'react';
import { useShallow } from 'zustand/shallow';
import { Plus, User, Settings } from 'lucide-react';
import { SidePanel } from '../ui/SidePanel';
import { useNavigationStore, type NavigationTab } from '../../stores/navigationStore';
import { cn } from '../../utils';

// Lazy load heavy panel components to reduce initial bundle
const SettingsPanelV2 = lazy(() =>
  import('../Settings/SettingsPanelV2').then((m) => ({ default: m.SettingsPanelV2 }))
);
const AddTab = lazy(() =>
  import('./AddTab/AddTab').then((m) => ({ default: m.AddTab }))
);
const MyTab = lazy(() =>
  import('./MyTab/MyTab').then((m) => ({ default: m.MyTab }))
);

// Simple loading skeleton for panel content
function PanelSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-2/3" />
      <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>
  );
}

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

    const TABS: ReadonlyArray<{ id: NavigationTab; label: string; icon: typeof Plus }> = [
        { id: 'add', label: '添加', icon: Plus },
        { id: 'my', label: '我的', icon: User },
        { id: 'settings', label: '设置', icon: Settings },
    ];

    // Render dummy content for now, to be replaced in subsequent steps
    const renderTabContent = () => {
        switch (activeTab) {
            case 'add':
                return <AddTab />;
            case 'my':
                return <MyTab />;
            case 'settings':
                // Render SettingsPanelV2 - new vertical scrolling layout
                return <SettingsPanelV2 className="h-full" />;
            default:
                return null;
        }
    };

    return (
        <SidePanel
            isOpen={isPanelOpen}
            onClose={closePanel}
            showCloseButton={false}
            className="w-[420px] max-w-[90vw] overflow-hidden border-l border-gray-200 dark:border-gray-800 shadow-xl"
            contentClassName="p-0 h-full flex flex-col bg-gray-100 dark:bg-gray-950"
        >
            {/* Minimalist Top Tab Bar */}
            <div
                className={cn(
                    'sticky top-0 z-20',
                    'bg-white dark:bg-gray-950',
                    'border-b border-gray-100 dark:border-gray-900',
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
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                    )}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div
                className="flex-1 overflow-y-auto no-scrollbar bg-gray-100 dark:bg-gray-950"
                role="tabpanel"
            >
                <Suspense fallback={<PanelSkeleton />}>
                    {renderTabContent()}
                </Suspense>
            </div>
        </SidePanel>
    );
}
