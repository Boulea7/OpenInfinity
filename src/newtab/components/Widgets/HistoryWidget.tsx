import { useCallback, useState } from 'react';
import { Clock, RefreshCw, ChevronDown, ChevronRight, AlertCircle, ExternalLink, Trash2, Lock } from 'lucide-react';
import { useSettingsStore } from '../../stores';
import { useHistory } from '../../hooks';
import { cn } from '../../utils';
import { openHistoryItem, getFaviconUrl, formatRelativeTime } from '../../services/history';
import type { BaseWidgetProps, HistoryTimeRange } from '../../types';

/**
 * History Widget component
 * Displays browsing history with permission management
 */
export function HistoryWidget({ isExpanded, onToggleExpand, className }: BaseWidgetProps) {
  const { viewSettings, openBehavior, widgetSettings, setWidgetSettings } = useSettingsStore();
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
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  // Don't render if widget is disabled
  if (!viewSettings.showHistoryWidget) return null;

  // Handle history item click
  const handleHistoryClick = useCallback((url: string) => {
    openHistoryItem(url, openBehavior.history);
  }, [openBehavior.history]);

  // Handle delete history item
  const handleDelete = useCallback(async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();

    if (!confirm('确定要删除这条历史记录吗？')) {
      return;
    }

    setDeletingUrl(url);
    try {
      await deleteItem(url);
    } catch (err) {
      console.error('Failed to delete history item:', err);
    } finally {
      setDeletingUrl(null);
    }
  }, [deleteItem]);

  // Handle request permission
  const handleRequestPermission = useCallback(async () => {
    try {
      await requestPermission();
    } catch (err) {
      console.error('Permission request failed:', err);
    }
  }, [requestPermission]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((e: React.MouseEvent, range: HistoryTimeRange) => {
    e.stopPropagation();
    setTimeRange(range);
    // Persist to store (only for supported ranges)
    if (range !== 'all') {
      setWidgetSettings({
        historyWidget: {
          ...widgetSettings.historyWidget,
          timeRange: range,
        },
      });
    }
  }, [setTimeRange, setWidgetSettings, widgetSettings.historyWidget]);

  return (
    <div className={cn('bg-white/5 rounded-lg overflow-hidden border border-white/10', className)}>
      {/* Header */}
      <div
        role="button"
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        tabIndex={0}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-white/80" />
          <span className="font-medium text-white">历史记录</span>
          {hasPermission && historyItems.length > 0 && (
            <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
              {historyItems.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasPermission && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                refresh();
              }}
              className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="刷新历史"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/60" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 border-t border-white/10 space-y-3">
          {/* Permission Request State */}
          {!hasPermission && (
            <div className="flex flex-col items-center justify-center py-6">
              <Lock className="w-8 h-8 text-white/40 mb-2" />
              <p className="text-sm text-white/60 text-center mb-3">
                需要历史记录权限才能显示
              </p>
              {error && (
                <p className="text-xs text-red-400 text-center mb-2">{error}</p>
              )}
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                授权访问历史记录
              </button>
            </div>
          )}

          {/* Time Range Selector */}
          {hasPermission && (
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
              {(['today', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={(e) => handleTimeRangeChange(e, range)}
                  className={cn(
                    'flex-1 px-2 py-1 text-xs rounded transition-colors',
                    timeRange === range
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                >
                  {range === 'today' && '今天'}
                  {range === 'week' && '一周'}
                  {range === 'month' && '一个月'}
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {hasPermission && isLoading && historyItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6">
              <RefreshCw className="w-8 h-8 text-white/40 animate-spin mb-2" />
              <p className="text-sm text-white/60">正在加载历史记录...</p>
            </div>
          )}

          {/* Error State */}
          {hasPermission && error && historyItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6">
              <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
              <p className="text-sm text-white/60 text-center mb-3">{error}</p>
              <button
                onClick={refresh}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                重试
              </button>
            </div>
          )}

          {/* History List */}
          {hasPermission && historyItems.length > 0 && (
            <div className="space-y-1">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleHistoryClick(item.url)}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  {/* Favicon */}
                  <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                    {item.url && (
                      <img
                        src={getFaviconUrl(item.url)}
                        alt=""
                        className="w-4 h-4"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  {/* Title and metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-white/40">
                        {formatRelativeTime(item.lastVisitTime)}
                      </span>
                      {item.visitCount > 1 && (
                        <span className="text-xs text-white/30">
                          访问 {item.visitCount} 次
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, item.url)}
                      disabled={deletingUrl === item.url}
                      className="p-1 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <ExternalLink className="w-3 h-3 text-white/40 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {hasPermission && !isLoading && historyItems.length === 0 && !error && (
            <div className="text-center py-6 text-white/40">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无历史记录</p>
              <p className="text-xs mt-1">在所选时间范围内没有浏览记录</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
