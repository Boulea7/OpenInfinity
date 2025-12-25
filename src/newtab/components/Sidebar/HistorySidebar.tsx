/**
 * HistorySidebar Component
 *
 * Browsing history with time range filter, search, and lazy loading.
 * Requires history permission.
 */

import { useState, useMemo } from 'react';
import { Clock, Search, ExternalLink, Trash2 } from 'lucide-react';
import { useHistory } from '../../hooks';
import { PermissionGate } from '../ui/PermissionGate';
import { cn } from '../../utils';
import { openUrlSafe } from '../../utils/navigation';
import type { HistoryTimeRange } from '../../types';

const TIME_RANGES: { value: HistoryTimeRange; label: string }[] = [
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'all', label: '全部' },
];

export function HistorySidebar() {
  const {
    historyItems,
    hasPermission,
    isLoading,
    error,
    timeRange,
    setTimeRange,
    requestPermission,
    deleteItem,
    refresh,
  } = useHistory();

  const [searchQuery, setSearchQuery] = useState('');

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return historyItems;
    const query = searchQuery.toLowerCase();
    return historyItems.filter(
      item =>
        item.title?.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query)
    );
  }, [historyItems, searchQuery]);

  // If loading permission check
  if (isLoading && !hasPermission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  return (
    <PermissionGate
      hasPermission={hasPermission}
      permissionName="历史记录"
      description="允许访问您的浏览历史，以便在这里浏览和搜索。"
      onRequestPermission={requestPermission}
      icon={<Clock className="w-8 h-8 text-blue-500" />}
    >
      <HistorySidebarContent
        items={filteredItems}
        isLoading={isLoading}
        error={error}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        deleteItem={deleteItem}
        refresh={refresh}
      />
    </PermissionGate>
  );
}

interface HistorySidebarContentProps {
  items: Array<{ url: string; title?: string; lastVisitTime: number; visitCount?: number }>;
  isLoading: boolean;
  error: string | null;
  timeRange: HistoryTimeRange;
  setTimeRange: (range: HistoryTimeRange) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  deleteItem: (url: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function HistorySidebarContent({
  items,
  isLoading,
  error,
  timeRange,
  setTimeRange,
  searchQuery,
  setSearchQuery,
  deleteItem,
  refresh,
}: HistorySidebarContentProps) {

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // Get date group label
  const getDateGroup = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (date >= today) return '今天';
    if (date >= yesterday) return '昨天';
    if (date >= weekAgo) return '本周';
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: Map<string, typeof items> = new Map();
    for (const item of items) {
      const group = getDateGroup(item.lastVisitTime);
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(item);
    }
    return Array.from(groups.entries());
  }, [items]);

  // Handle delete item
  const handleDelete = async (url: string) => {
    try {
      await deleteItem(url);
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索历史记录..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Time Range Filter */}
      <div className="flex flex-wrap gap-2">
        {TIME_RANGES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTimeRange(value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              timeRange === value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>加载历史记录失败</p>
          <button
            onClick={refresh}
            className="mt-2 px-4 py-2 text-sm bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            重试
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{searchQuery ? '未找到匹配的历史记录' : '暂无历史记录'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedItems.map(([dateGroup, groupItems]) => (
            <div key={dateGroup}>
              {/* Date Group Header */}
              <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-2 py-1.5 mb-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {dateGroup}
                </span>
              </div>
              {/* Group Items */}
              <div className="space-y-1">
                {groupItems.map((item, index) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg group transition-colors"
                  >
                    <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>

                    <button
                      onClick={() => openUrlSafe(item.url, 'new-tab')}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {item.title || item.url}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {formatTime(item.lastVisitTime)}
                        {item.visitCount && item.visitCount > 1 && ` · ${item.visitCount}次访问`}
                      </p>
                    </button>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openUrlSafe(item.url, 'new-tab')}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.url)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistorySidebar;
