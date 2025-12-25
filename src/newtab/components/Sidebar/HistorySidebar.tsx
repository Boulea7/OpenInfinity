/**
 * HistorySidebar Component
 *
 * Browsing history with infinite scroll, range-based search, and granular deletion.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Clock, Search, ExternalLink, Trash2, Archive, Settings, AlertTriangle } from 'lucide-react';
import { useHistory } from '../../hooks';
import { PermissionGate } from '../ui/PermissionGate';
import { cn, getGoogleFaviconUrl } from '../../utils';
import { openUrlSafe } from '../../utils/navigation';

const SEARCH_RANGES = [
  { label: '最近1天', value: 24 * 60 * 60 * 1000 },
  { label: '最近3天', value: 3 * 24 * 60 * 60 * 1000 },
  { label: '最近1周', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '最近2周', value: 14 * 24 * 60 * 60 * 1000 },
  { label: '最近1月', value: 30 * 24 * 60 * 60 * 1000 },
];

const DELETE_RANGES = [
  ...SEARCH_RANGES,
  { label: '全部历史', value: 0 }, // 0 indicates all time
];

export function HistorySidebar() {
  const {
    historyItems,
    hasPermission,
    isLoading,
    requestPermission,
    deleteItem,
    deleteRange,
    loadMore,
    searchHistory,
  } = useHistory();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRange, setSearchRange] = useState(SEARCH_RANGES[3].value); // Default 2 weeks for search

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Clear History Modal State
  const [clearRange, setClearRange] = useState(DELETE_RANGES[0].value);
  const [isDeleting, setIsDeleting] = useState(false);

  // Infinite Scroll Ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Close settings on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  // Handle intersection for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchHistory(searchQuery, searchRange);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchRange, searchHistory]);

  // Handle Clear History
  const handleClearHistory = async () => {
    setIsDeleting(true);
    try {
      let startTime = 0;
      if (clearRange > 0) {
        startTime = Date.now() - clearRange;
      } else {
        startTime = 0; // Beginning of time
      }
      await deleteRange(startTime, Date.now());
      setShowClearModal(false);
      setShowSettings(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Group helpers
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getFriendlyDateGroup = (timestamp: number) => {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    const weekday = weekdays[date.getDay()];

    if (diffDays === 0) return `今天 ${dateStr}${weekday}`;
    if (diffDays === 1) return `昨天 ${dateStr}${weekday}`;
    return `${dateStr} ${weekday}`;
  }

  const groupedItems = useMemo(() => {
    const groups: Map<string, typeof historyItems> = new Map();
    // historyItems are already sorted DESC by hook service usually
    for (const item of historyItems) {
      const group = getFriendlyDateGroup(item.lastVisitTime);
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(item);
    }
    return Array.from(groups.entries());
  }, [historyItems]);

  // Loading Permission View
  if (isLoading && !hasPermission) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-500" />
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
      <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
        <div className="flex-none p-3 z-10 relative border-b border-transparent dark:border-zinc-800/50">

          <div className="flex items-center gap-2">
            {/* Search Input with Range Dropdown */}
            <div className="flex-1 bg-white dark:bg-zinc-800/40 border-2 border-zinc-300 dark:border-zinc-600 rounded-xl p-1 shadow-sm focus-within:border-zinc-800 dark:focus-within:border-zinc-400 focus-within:shadow-md transition-all duration-300 group flex items-center gap-2">

              <div className="flex-1 relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索..."
                  className={cn(
                    "w-full pl-9 pr-2 py-1.5 rounded-lg text-sm bg-transparent",
                    "text-gray-900 dark:text-gray-100",
                    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                    "focus:outline-none"
                  )}
                />
              </div>

              {/* Range Select (Minimal) */}
              <select
                value={searchRange}
                onChange={(e) => setSearchRange(Number(e.target.value))}
                className="text-xs bg-transparent text-zinc-500 dark:text-zinc-400 font-medium py-1 px-1 mr-1 border-none focus:ring-0 cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                {SEARCH_RANGES.map(range => (
                  <option key={range.label} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Settings Menu - Now next to search bar */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2.5 rounded-xl transition-colors border-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  showSettings ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900" : "text-zinc-400"
                )}
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-1 z-50 animate-in slide-in-from-top-2 fade-in">
                  <button
                    onClick={() => setShowClearModal(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    清除历史记录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 scroll-smooth">
          {isLoading && historyItems.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-500" />
            </div>
          ) : historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-zinc-400 dark:text-zinc-500 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                <Archive className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                暂无历史记录
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedItems.map(([dateGroup, groupItems]) => (
                <div key={dateGroup} className="space-y-2">
                  <div className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm py-2 mb-2 border-b border-transparent">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      {dateGroup}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {groupItems.map((item) => (
                      <div
                        key={`${item.url}-${item.lastVisitTime}`}
                        className="group flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all duration-200"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                          <img
                            src={getGoogleFaviconUrl(item.url, 32)}
                            alt=""
                            className="w-4 h-4 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden">
                            <Clock className="w-4 h-4 text-zinc-400" />
                          </div>
                        </div>
                        <button
                          onClick={() => openUrlSafe(item.url, 'new-tab')}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title || item.url}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                              {formatTime(item.lastVisitTime)}
                            </span>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openUrlSafe(item.url, 'new-tab')}
                            className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.url)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {/* Load More Sentinel */}
              {!searchQuery && (
                <div ref={loadMoreRef} className="h-8 flex items-center justify-center p-4">
                  {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-200 border-t-zinc-400" />}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clear History Confirmation Modal - Overlay */}
        {showClearModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-700 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  清除历史记录
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  此操作无法撤销。请确认您要删除的时间范围。
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 ml-1">
                    选择时间范围
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DELETE_RANGES.map((range) => (
                      <button
                        key={range.label}
                        onClick={() => setClearRange(range.value)}
                        className={cn(
                          "px-3 py-2 text-xs font-medium rounded-lg border transition-all",
                          clearRange === range.value
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleClearHistory}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "确认删除"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}

export default HistorySidebar;
