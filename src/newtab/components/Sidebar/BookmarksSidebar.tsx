/**
 * BookmarksSidebar Component
 *
 * Bookmarks browser with tree navigation, search, and folder support.
 * Requires bookmarks permission.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Folder, FolderOpen, Star, Search, ChevronRight, ChevronDown, ExternalLink, Home } from 'lucide-react';
import { PermissionGate } from '../ui/PermissionGate';
import { hasPermissions, ensureOptionalPermissions, PERMISSION_GROUPS } from '../../../shared/permissions';
import { cn } from '../../utils';
import { openUrlSafe } from '../../utils/navigation';

interface BookmarkTreeNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkTreeNode[];
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  return (
    <PermissionGate
      hasPermission={hasPermission}
      permissionName="书签"
      description="允许访问您的浏览器书签，以便在这里浏览和管理。"
      onRequestPermission={handleRequestPermission}
      icon={<Star className="w-8 h-8 text-yellow-500" />}
    >
      <BookmarksSidebarContent />
    </PermissionGate>
  );
}

// Navigation tabs for bookmark categories
type BookmarkTab = 'all' | 'bar' | 'other' | 'mobile';

const BOOKMARK_TABS: { value: BookmarkTab; label: string; folderId?: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'bar', label: '书签栏', folderId: '1' },
  { value: 'other', label: '其他书签', folderId: '2' },
  { value: 'mobile', label: '移动设备', folderId: '3' },
];

// View mode: 'tree' for traditional tree view, 'folder' for folder navigation
type ViewMode = 'tree' | 'folder';

// Breadcrumb item for folder navigation
interface BreadcrumbItem {
  id: string;
  title: string;
}

function BookmarksSidebarContent() {
  const [bookmarks, setBookmarks] = useState<BookmarkTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<BookmarkTab>('all');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['0', '1', '2']));

  // Folder navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('folder');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Fetch full bookmark tree
  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tree = await chrome.bookmarks.getTree();
      // Chrome returns array with single root node containing all bookmarks
      setBookmarks(tree[0]?.children || []);
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err);
      setError('Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    fetchBookmarks();
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

  // Filter by tab first, then by folder navigation, then by search query
  const filteredBookmarks = useMemo(() => {
    let nodes = bookmarks || [];

    // Filter by active tab (find specific folder)
    if (activeTab !== 'all') {
      const tab = BOOKMARK_TABS.find(t => t.value === activeTab);
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
  }, [bookmarks, searchQuery, activeTab, filterBookmarks, viewMode, currentFolderId, findFolderById]);

  // Render bookmark item
  const renderBookmark = (node: BookmarkTreeNode) => (
    <button
      key={node.id}
      onClick={() => node.url && openUrlSafe(node.url, 'new-tab')}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg group transition-colors text-left"
    >
      <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">
        {node.title || node.url}
      </span>
      <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );

  // Render folder in tree mode (expandable)
  const renderFolderTree = (node: BookmarkTreeNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <button
          onClick={() => toggleFolder(node.id)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors',
            level > 0 && 'ml-4'
          )}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )
          ) : (
            <span className="w-4" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-blue-500" />
          ) : (
            <Folder className="w-4 h-4 text-blue-500" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {node.title || '书签'}
          </span>
          {hasChildren && (
            <span className="text-xs text-gray-400">
              ({node.children!.length})
            </span>
          )}
        </button>

        {isExpanded && node.children && (
          <div className={cn('ml-4', level > 0 && 'ml-4')}>
            {node.children.map(child =>
              child.url ? renderBookmark(child) : renderFolderTree(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Render folder in folder mode (clickable to enter)
  const renderFolderNav = (node: BookmarkTreeNode) => {
    const itemCount = node.children?.length || 0;

    return (
      <button
        key={node.id}
        onClick={() => enterFolder(node)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg group transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <Folder className="w-4 h-4 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">
            {node.title || '书签'}
          </span>
          <span className="text-xs text-gray-400">
            {itemCount} 项
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>加载书签失败</p>
        <button
          onClick={refresh}
          className="mt-2 px-4 py-2 text-sm bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Navigation Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {BOOKMARK_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeTab === tab.value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and View Mode Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索书签..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {
            setViewMode(viewMode === 'folder' ? 'tree' : 'folder');
            setCurrentFolderId(null);
            setBreadcrumbs([]);
          }}
          className={cn(
            'px-3 py-2 rounded-lg text-sm transition-colors',
            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
          title={viewMode === 'folder' ? '切换到树形视图' : '切换到文件夹视图'}
        >
          {viewMode === 'folder' ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <Folder className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Breadcrumb Navigation (folder mode only) */}
      {viewMode === 'folder' && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-sm overflow-x-auto pb-1">
          <button
            onClick={() => navigateToBreadcrumb(-1)}
            className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors flex-shrink-0"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-1 flex-shrink-0">
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className={cn(
                  'px-2 py-1 rounded transition-colors truncate max-w-[120px]',
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 dark:text-gray-100 font-medium'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                {crumb.title}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bookmarks List */}
      <div className="space-y-1">
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{searchQuery ? '未找到匹配的书签' : '暂无书签'}</p>
          </div>
        ) : viewMode === 'folder' ? (
          // Folder mode: folders first, then bookmarks
          <>
            {filteredBookmarks.filter(n => !n.url).map(node => renderFolderNav(node))}
            {filteredBookmarks.filter(n => n.url).map(node => renderBookmark(node))}
          </>
        ) : (
          // Tree mode: mixed folders and bookmarks
          filteredBookmarks.map(node =>
            node.url ? renderBookmark(node) : renderFolderTree(node)
          )
        )}
      </div>
    </div>
  );
}

export default BookmarksSidebar;
