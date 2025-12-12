import { useCallback } from 'react';
import { Bookmark, RefreshCw, ChevronDown, ChevronRight, AlertCircle, ExternalLink, Lock } from 'lucide-react';
import { useSettingsStore } from '../../stores';
import { useBookmarks } from '../../hooks';
import { cn } from '../../utils';
import { openBookmark, getFaviconUrl } from '../../services/bookmarks';
import type { BaseWidgetProps } from '../../types';

/**
 * Bookmarks Widget component
 * Displays recent bookmarks with permission management
 */
export function BookmarksWidget({ isExpanded, onToggleExpand, className }: BaseWidgetProps) {
  const { viewSettings, openBehavior } = useSettingsStore();
  const { bookmarks, hasPermission, isLoading, error, requestPermission, refresh } = useBookmarks();

  // Don't render if widget is disabled
  if (!viewSettings.showBookmarksWidget) return null;

  // Handle bookmark click
  const handleBookmarkClick = useCallback((url: string) => {
    openBookmark(url, openBehavior.bookmarks);
  }, [openBehavior.bookmarks]);

  // Handle request permission
  const handleRequestPermission = useCallback(async () => {
    try {
      await requestPermission();
    } catch (err) {
      console.error('Permission request failed:', err);
    }
  }, [requestPermission]);

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
          <Bookmark className="w-5 h-5 text-white/80" />
          <span className="font-medium text-white">书签</span>
          {hasPermission && bookmarks.length > 0 && (
            <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
              {bookmarks.length}
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
              title="刷新书签"
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
        <div className="p-3 border-t border-white/10">
          {/* Permission Request State */}
          {!hasPermission && (
            <div className="flex flex-col items-center justify-center py-6">
              <Lock className="w-8 h-8 text-white/40 mb-2" />
              <p className="text-sm text-white/60 text-center mb-3">
                需要书签权限才能显示
              </p>
              {error && (
                <p className="text-xs text-red-400 text-center mb-2">{error}</p>
              )}
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                授权访问书签
              </button>
            </div>
          )}

          {/* Loading State */}
          {hasPermission && isLoading && bookmarks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6">
              <RefreshCw className="w-8 h-8 text-white/40 animate-spin mb-2" />
              <p className="text-sm text-white/60">正在加载书签...</p>
            </div>
          )}

          {/* Error State */}
          {hasPermission && error && bookmarks.length === 0 && (
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

          {/* Bookmarks List */}
          {hasPermission && bookmarks.length > 0 && (
            <div className="space-y-1">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  onClick={() => handleBookmarkClick(bookmark.url)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  {/* Favicon */}
                  <div className="w-4 h-4 flex-shrink-0">
                    {bookmark.url && (
                      <img
                        src={getFaviconUrl(bookmark.url)}
                        alt=""
                        className="w-4 h-4"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  {/* Title and URL */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {bookmark.title}
                    </div>
                    <div className="text-xs text-white/40 truncate" title={bookmark.url}>
                      {bookmark.url}
                    </div>
                  </div>

                  {/* External link icon */}
                  <ExternalLink className="w-3 h-3 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {hasPermission && !isLoading && bookmarks.length === 0 && !error && (
            <div className="text-center py-6 text-white/40">
              <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无书签</p>
              <p className="text-xs mt-1">添加一些书签后会在这里显示</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
