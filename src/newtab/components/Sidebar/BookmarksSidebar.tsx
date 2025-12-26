/**
 * BookmarksSidebar Component
 *
 * Bookmarks browser with tree navigation, search, and folder support.
 * Redesigned for modern aesthetics, compact layout, and real favicons.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  Search,
  ChevronRight,
  ExternalLink,
  Home,
  LayoutGrid,
  List as ListIcon,
  Compass,
  Star,
  Settings,
  Clock,
  Check
} from 'lucide-react';
import { PermissionGate } from '../ui/PermissionGate';
import { hasPermissions, ensureOptionalPermissions, PERMISSION_GROUPS } from '../../../shared/permissions';
import { cn, getGoogleFaviconUrl } from '../../utils';
import { openUrlSafe } from '../../utils/navigation';

interface BookmarkTreeNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkTreeNode[];
  dateAdded?: number;
}

// Navigation tabs for bookmark categories
type BookmarkTab = 'recent' | 'all' | 'bar' | 'other' | 'mobile';

interface TabDefinition {
  value: BookmarkTab;
  label: string;
  folderId?: string;
  icon?: React.ReactNode;
}

// View mode: 'tree' for traditional tree view, 'folder' for folder navigation
type ViewMode = 'tree' | 'folder';

// Breadcrumb item for folder navigation
interface BreadcrumbItem {
  id: string;
  title: string;
}

export function BookmarksSidebar() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // Check permission on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const granted = await hasPermissions(PERMISSION_GROUPS.bookmarks);
      if (!cancelled) {
        setHasPermission(granted);
        setIsCheckingPermission(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleRequestPermission = async () => {
    const granted = await ensureOptionalPermissions(PERMISSION_GROUPS.bookmarks);
    setHasPermission(granted);
    return granted;
  };

  if (isCheckingPermission) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-500" />
      </div>
    );
  }

  return (
    <PermissionGate
      hasPermission={hasPermission}
      permissionName="书签"
      description="允许访问您的浏览器书签，以便在这里浏览和管理。"
      onRequestPermission={handleRequestPermission}
      icon={<Star className="w-8 h-8 text-amber-500" />}
    >
      <BookmarksSidebarContent />
    </PermissionGate>
  );
}

function BookmarksSidebarContent() {
  const [bookmarks, setBookmarks] = useState<BookmarkTreeNode[]>([]);
  const [recentBookmarks, setRecentBookmarks] = useState<BookmarkTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<BookmarkTab>('bar');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['0', '1', '2']));

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [showRecentlyAdded, setShowRecentlyAdded] = useState(() => {
    return localStorage.getItem('bookmarks_show_recent') !== 'false';  // Default to true on first install
  });

  // Persist showRecentlyAdded
  useEffect(() => {
    localStorage.setItem('bookmarks_show_recent', String(showRecentlyAdded));
    // If turning off and currently on 'recent' tab, switch to 'all'
    if (!showRecentlyAdded && activeTab === 'recent') {
      setActiveTab('all');
    }
  }, [showRecentlyAdded, activeTab]);

  // Folder navigation state
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('bookmarks_view_mode') as ViewMode) || 'tree';
  });
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Persist viewMode
  useEffect(() => {
    localStorage.setItem('bookmarks_view_mode', viewMode);
  }, [viewMode]);

  // Animation ref for list items
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // Fetch bookmarks
  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch full tree
      const tree = await chrome.bookmarks.getTree();
      setBookmarks(tree[0]?.children || []);

      // Fetch recent if enabled
      if (showRecentlyAdded) {
        const recent = await chrome.bookmarks.getRecent(20);
        // Map recent to ensure they look like tree nodes (though getRecent returns array of BookmarksTreeNode)
        setRecentBookmarks(recent as BookmarkTreeNode[]);
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err);
      setError('无法加载书签');
    } finally {
      setIsLoading(false);
    }
  }, [showRecentlyAdded]);

  // Load on mount and when settings change
  useEffect(() => {
    fetchBookmarks();

    // Subscribe to bookmark changes
    const handleBookmarkChanged = () => fetchBookmarks();
    chrome.bookmarks.onCreated.addListener(handleBookmarkChanged);
    chrome.bookmarks.onRemoved.addListener(handleBookmarkChanged);
    chrome.bookmarks.onChanged.addListener(handleBookmarkChanged);
    chrome.bookmarks.onMoved.addListener(handleBookmarkChanged);

    return () => {
      chrome.bookmarks.onCreated.removeListener(handleBookmarkChanged);
      chrome.bookmarks.onRemoved.removeListener(handleBookmarkChanged);
      chrome.bookmarks.onChanged.removeListener(handleBookmarkChanged);
      chrome.bookmarks.onMoved.removeListener(handleBookmarkChanged);
    };
  }, [fetchBookmarks]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Toggle folder expansion (tree mode)
  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Find folder by ID in the tree
  const findFolderById = useCallback((nodes: BookmarkTreeNode[], id: string): BookmarkTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFolderById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Enter a folder (folder mode)
  const enterFolder = useCallback((folder: BookmarkTreeNode) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs(prev => [...prev, { id: folder.id, title: folder.title || '书签' }]);
    // Scroll to top when entering folder
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // Navigate to a breadcrumb
  const navigateToBreadcrumb = useCallback((index: number) => {
    if (index < 0) {
      // Go to root
      setCurrentFolderId(null);
      setBreadcrumbs([]);
    } else {
      // Go to specific breadcrumb
      const crumb = breadcrumbs[index];
      setCurrentFolderId(crumb.id);
      setBreadcrumbs(prev => prev.slice(0, index + 1));
    }
  }, [breadcrumbs]);

  // Reset folder navigation when tab changes
  useEffect(() => {
    setCurrentFolderId(null);
    setBreadcrumbs([]);
  }, [activeTab]);

  // Filter bookmarks by search
  const filterBookmarks = useCallback((nodes: BookmarkTreeNode[], query: string): BookmarkTreeNode[] => {
    if (!query) return nodes;

    const lowerQuery = query.toLowerCase();
    const result: BookmarkTreeNode[] = [];

    for (const node of nodes) {
      if (node.url) {
        // It's a bookmark
        if (node.title.toLowerCase().includes(lowerQuery) ||
          node.url.toLowerCase().includes(lowerQuery)) {
          result.push(node);
        }
      } else if (node.children) {
        // It's a folder
        const filteredChildren = filterBookmarks(node.children, query);
        if (filteredChildren.length > 0) {
          result.push({ ...node, children: filteredChildren });
        }
      }
    }

    return result;
  }, []);

  // Define tabs dynamically
  const tabs: TabDefinition[] = useMemo(() => {
    const baseTabs: TabDefinition[] = [
      { value: 'all', label: '全部' },
      { value: 'bar', label: '收藏夹栏', folderId: '1' }, // Rename Bookmarks Bar
      { value: 'other', label: '其他', folderId: '2' },
      { value: 'mobile', label: '移动端', folderId: '3' },
    ];
    if (showRecentlyAdded) {
      return [{ value: 'recent', label: '最近添加', icon: <Clock className="w-3 h-3" /> }, ...baseTabs];
    }
    return baseTabs;
  }, [showRecentlyAdded]);

  // Filter by tab first, then by folder navigation, then by search query
  const filteredBookmarks = useMemo(() => {
    if (activeTab === 'recent') {
      return filterBookmarks(recentBookmarks, searchQuery);
    }

    let nodes = bookmarks || [];

    // Filter by active tab (find specific folder)
    if (activeTab !== 'all') {
      const tab = tabs.find(t => t.value === activeTab);
      if (tab?.folderId) {
        const folder = findFolderById(nodes, tab.folderId);
        nodes = folder?.children || [];
      }
    }

    // In folder mode, navigate to current folder
    if (viewMode === 'folder' && currentFolderId) {
      const folder = findFolderById(bookmarks, currentFolderId);
      nodes = folder?.children || [];
    }

    return filterBookmarks(nodes, searchQuery);
  }, [bookmarks, recentBookmarks, searchQuery, activeTab, filterBookmarks, viewMode, currentFolderId, findFolderById, tabs]);

  // --- Render Components ---

  // Render bookmark item
  const renderBookmark = (node: BookmarkTreeNode) => {
    const faviconUrl = node.url ? getGoogleFaviconUrl(node.url, 64) : null;

    return (
      <button
        key={node.id}
        onClick={() => node.url && openUrlSafe(node.url, 'new-tab')}
        className="group w-full flex items-center gap-3 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-200 text-left animate-in slide-in-from-bottom-[2px] fade-in"
      >
        <div className="flex-shrink-0 w-6 h-6 rounded bg-transparent flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="w-4 h-4 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={cn("flex items-center justify-center w-full h-full", faviconUrl ? "hidden" : "")}>
            <Star className="w-4 h-4 text-zinc-400 group-hover:text-yellow-500 fill-current transition-colors" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] leading-tight font-medium text-zinc-900 dark:text-zinc-100 truncate block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {node.title || node.url}
          </span>
          {/* URL hint on hover only */}
          {node.url && (
            <span className="hidden group-hover:block text-[10px] text-zinc-400 dark:text-zinc-500 truncate transition-opacity">
              {new URL(node.url).hostname.replace(/^www\./, '')}
            </span>
          )}
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  };

  // Render folder in tree mode
  const renderFolderTree = (node: BookmarkTreeNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const paddingLeft = level * 14 + 10;

    return (
      <div key={node.id} className="animate-in slide-in-from-bottom-[2px] fade-in">
        <button
          onClick={() => toggleFolder(node.id)}
          style={{ paddingLeft: `${paddingLeft}px` }}
          className={cn(
            'w-full flex items-center gap-2 pr-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group',
            isExpanded ? 'bg-zinc-50 dark:bg-zinc-800/40' : ''
          )}
        >
          {hasChildren ? (
            <div className={cn("transition-transform duration-200 flex-shrink-0", isExpanded ? "rotate-90" : "rotate-0")}>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
            </div>
          ) : (
            <span className="w-3.5 flex-shrink-0" />
          )}

          <div className="relative flex-shrink-0">
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
            )}
          </div>

          <span className="text-[13px] text-zinc-700 dark:text-zinc-200 truncate font-medium flex-1 text-left">
            {node.title || '书签'}
          </span>

          {hasChildren && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1.5 font-normal">
              {node.children!.length}
            </span>
          )}
        </button>

        {isExpanded && node.children && (
          <div className="relative">
            <div
              className="absolute top-0 bottom-0 border-l border-zinc-200 dark:border-zinc-800"
              style={{ left: `${paddingLeft + 6}px` }}
            />
            {node.children.map(child =>
              child.url ? (
                <div key={child.id} style={{ paddingLeft: `${paddingLeft + 14}px` }} className="pr-1">
                  {/* Inline implementation of bookmark item for tree */}
                  <button
                    onClick={() => child.url && openUrlSafe(child.url, 'new-tab')}
                    className="w-full flex items-center gap-2 py-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/item text-left"
                  >
                    <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                      <img
                        src={getGoogleFaviconUrl(child.url!, 32)}
                        alt=""
                        className="w-3.5 h-3.5 object-contain opacity-75 group-hover/item:opacity-100 transition-opacity"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden">
                        <Star className="w-3.5 h-3.5 text-zinc-300 group-hover/item:text-yellow-500 transition-colors" />
                      </div>
                    </div>
                    <span className="text-[13px] text-zinc-600 dark:text-zinc-400 group-hover/item:text-zinc-900 dark:group-hover/item:text-zinc-100 truncate">
                      {child.title || child.url}
                    </span>
                  </button>
                </div>
              ) : renderFolderTree(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Render folder in folder mode
  const renderFolderNav = (node: BookmarkTreeNode) => {
    const itemCount = node.children?.length || 0;

    return (
      <button
        key={node.id}
        onClick={() => enterFolder(node)}
        className="group w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-200 text-left animate-in slide-in-from-bottom-[2px] fade-in"
      >
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          <Folder className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate block">
            {node.title || '书签'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {itemCount}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 opacity-50 group-hover:opacity-100 transition-all" />
        </div>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <p className="text-zinc-500 font-medium text-sm mb-2">{error}</p>
        <button
          onClick={refresh}
          className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      <div className="flex-none p-3 space-y-3 z-10 relative border-b border-transparent dark:border-zinc-800/50">

        {/* Search & Header Actions */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="flex-1 bg-white dark:bg-zinc-800/40 border-2 border-zinc-300 dark:border-zinc-600 rounded-xl p-1 shadow-sm focus-within:border-zinc-800 dark:focus-within:border-zinc-400 focus-within:shadow-md transition-all duration-300 group">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索书签..."
                className={cn(
                  "w-full pl-9 pr-3 py-1.5 rounded-lg text-sm bg-transparent",
                  "text-gray-900 dark:text-gray-100",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                  "focus:outline-none"
                )}
              />
              {/* View Mode Toggle */}
              <button
                onClick={() => {
                  setViewMode(viewMode === 'folder' ? 'tree' : 'folder');
                  if (viewMode === 'folder') {
                    setCurrentFolderId(null);
                    setBreadcrumbs([]);
                  }
                }}
                className="mr-1 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                title={viewMode === 'folder' ? '切换到树形视图' : '切换到文件夹视图'}
              >
                {viewMode === 'folder' ? (
                  <ListIcon className="w-4 h-4" />
                ) : (
                  <LayoutGrid className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Settings Button */}
          <div className="relative flex-shrink-0" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2.5 rounded-xl border-2 transition-all duration-200",
                showSettings
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600"
                  : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                <button
                  onClick={() => setShowRecentlyAdded(!showRecentlyAdded)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                    showRecentlyAdded
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-zinc-300 dark:border-zinc-600"
                  )}>
                    {showRecentlyAdded && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">最近添加</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg relative overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'flex-1 min-w-[60px] relative px-2 py-1.5 text-[11px] font-medium rounded-md transition-all duration-200 z-10 flex items-center justify-center gap-1.5 whitespace-nowrap',
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100 shadow-sm bg-white dark:bg-zinc-700'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Improved Breadcrumb Navigation */}
        {viewMode === 'folder' && activeTab !== 'recent' && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
            {/* Back Button */}
            <button
              onClick={() => {
                if (breadcrumbs.length > 1) {
                  navigateToBreadcrumb(breadcrumbs.length - 2);
                } else {
                  // Go to root
                  navigateToBreadcrumb(-1);
                }
              }}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors flex-shrink-0"
              title="返回上一级"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>

            {/* Current Folder Title / Breadcrumb Trail */}
            <div className="flex items-center gap-1 overflow-hidden">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {breadcrumbs[breadcrumbs.length - 1].title}
              </span>
            </div>

            {/* Divider if needed, or visual separation */}
            <div className="flex-1" />

            {/* Small Home shortcut (optional, keeping it minimal) */}
            <button
              onClick={() => navigateToBreadcrumb(-1)}
              className="p-1 text-zinc-400 hover:text-blue-500 transition-colors"
              title="回到主页"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bookmarks List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5 scroll-smooth"
      >
        {filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center text-zinc-400 dark:text-zinc-500 animate-in fade-in duration-500">
            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-3">
              {searchQuery ? (
                <Search className="w-6 h-6 opacity-50" />
              ) : (
                <Compass className="w-6 h-6 opacity-50" />
              )}
            </div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {searchQuery ? '未找到相关书签' : '暂无书签'}
            </p>
          </div>
        ) : activeTab === 'recent' ? (
          // Recent mode (always list)
          filteredBookmarks.map(node => renderBookmark(node))
        ) : viewMode === 'folder' ? (
          // Folder mode
          <>
            {filteredBookmarks.filter(n => !n.url).map(node => renderFolderNav(node))}
            {filteredBookmarks.filter(n => n.url).map(node => renderBookmark(node))}
          </>
        ) : (
          // Tree mode
          <div className="pt-1">
            {filteredBookmarks.map(node =>
              node.url ? renderBookmark(node) : renderFolderTree(node)
            )}
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}

export default BookmarksSidebar;
