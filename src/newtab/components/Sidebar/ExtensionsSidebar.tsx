/**
 * ExtensionsSidebar Component
 *
 * Extension management sidebar with enable/disable controls.
 * Requires management permission.
 */

import { useState, useEffect, useCallback } from 'react';
import { Puzzle, Trash2, Settings, ExternalLink, Search, ToggleLeft, ToggleRight, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { PermissionGate } from '../ui/PermissionGate';
import { hasPermissions, ensureOptionalPermissions, PERMISSION_GROUPS } from '../../../shared/permissions';
import { cn } from '../../utils';

interface ExtensionInfo {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  version: string;
  enabled: boolean;
  type: string;
  icons?: { size: number; url: string }[];
  homepageUrl?: string;
  optionsUrl?: string;
  mayDisable: boolean;
  permissions?: string[];
  hostPermissions?: string[];
}

export function ExtensionsSidebar() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // Check permission on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const granted = await hasPermissions(PERMISSION_GROUPS.management);
      if (!cancelled) {
        setHasPermission(granted);
        setIsCheckingPermission(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleRequestPermission = async () => {
    const granted = await ensureOptionalPermissions(PERMISSION_GROUPS.management);
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
      permissionName="扩展管理"
      description="允许查看和管理已安装的浏览器扩展。"
      onRequestPermission={handleRequestPermission}
      icon={<Puzzle className="w-8 h-8 text-purple-500" />}
    >
      <ExtensionsSidebarContent />
    </PermissionGate>
  );
}

function ExtensionsSidebarContent() {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set());

  // Toggle permissions expansion
  const togglePermissions = useCallback((id: string) => {
    setExpandedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Load extensions
  const loadExtensions = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await chrome.management.getAll();
      // Filter out self and themes
      const filtered = all
        .filter(ext => ext.type === 'extension' && ext.id !== chrome.runtime.id)
        .map(ext => ({
          id: ext.id,
          name: ext.name,
          shortName: ext.shortName,
          description: ext.description,
          version: ext.version,
          enabled: ext.enabled,
          type: ext.type,
          icons: ext.icons,
          homepageUrl: ext.homepageUrl,
          optionsUrl: ext.optionsUrl,
          mayDisable: ext.mayDisable,
          permissions: ext.permissions,
          hostPermissions: ext.hostPermissions,
        }));

      // Sort by name
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      setExtensions(filtered);
    } catch (error) {
      console.error('Failed to load extensions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExtensions();
  }, [loadExtensions]);

  // Toggle extension
  const toggleExtension = async (id: string, enabled: boolean) => {
    try {
      await chrome.management.setEnabled(id, enabled);
      setExtensions(prev =>
        prev.map(ext => ext.id === id ? { ...ext, enabled } : ext)
      );
    } catch (error) {
      console.error('Failed to toggle extension:', error);
    }
  };

  // Uninstall extension - Chrome's native dialog provides confirmation
  const uninstallExtension = async (id: string) => {
    try {
      await chrome.management.uninstall(id, { showConfirmDialog: true });
      setExtensions(prev => prev.filter(ext => ext.id !== id));
    } catch {
      // User cancelled or uninstall failed - no action needed
    }
  };

  // Get extension icon
  const getIcon = (ext: ExtensionInfo) => {
    if (ext.icons && ext.icons.length > 0) {
      // Get the largest icon
      const sorted = [...ext.icons].sort((a, b) => b.size - a.size);
      return sorted[0].url;
    }
    return null;
  };

  // Filter extensions
  const filteredExtensions = extensions.filter(ext => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!ext.name.toLowerCase().includes(query) &&
          !ext.description.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Filter by status
    if (filter === 'enabled' && !ext.enabled) return false;
    if (filter === 'disabled' && ext.enabled) return false;

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索扩展..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'enabled', 'disabled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              filter === f
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {f === 'all' ? '全部' : f === 'enabled' ? '已启用' : '已禁用'}
          </button>
        ))}
      </div>

      {/* Extensions List */}
      {filteredExtensions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Puzzle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{searchQuery ? '未找到匹配的扩展' : '暂无扩展'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExtensions.map((ext) => (
            <div
              key={ext.id}
              className={cn(
                'p-3 rounded-lg border transition-colors',
                ext.enabled
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-70'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {getIcon(ext) ? (
                    <img src={getIcon(ext)!} alt="" className="w-6 h-6" />
                  ) : (
                    <Puzzle className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {ext.name}
                    </h4>
                    <span className="text-xs text-gray-400">v{ext.version}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                    {ext.description}
                  </p>
                </div>

                {/* Toggle */}
                {ext.mayDisable && (
                  <button
                    onClick={() => toggleExtension(ext.id, !ext.enabled)}
                    className={cn(
                      'flex-shrink-0 transition-colors',
                      ext.enabled ? 'text-blue-500' : 'text-gray-400'
                    )}
                  >
                    {ext.enabled ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-2 pt-2 border-t dark:border-gray-700">
                {ext.optionsUrl && (
                  <button
                    onClick={() => window.open(ext.optionsUrl, '_blank')}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                    选项
                  </button>
                )}
                {ext.homepageUrl && (
                  <a
                    href={ext.homepageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    主页
                  </a>
                )}
                {/* Permissions toggle */}
                {((ext.permissions && ext.permissions.length > 0) ||
                  (ext.hostPermissions && ext.hostPermissions.length > 0)) && (
                  <button
                    onClick={() => togglePermissions(ext.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <Shield className="w-3 h-3" />
                    权限
                    {expandedPermissions.has(ext.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                )}
                {ext.mayDisable && (
                  <button
                    onClick={() => uninstallExtension(ext.id)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                    卸载
                  </button>
                )}
              </div>

              {/* Expanded Permissions */}
              {expandedPermissions.has(ext.id) && (
                <div className="mt-2 pt-2 border-t dark:border-gray-700 space-y-2">
                  {ext.permissions && ext.permissions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        权限
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {ext.permissions.map((perm, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {ext.hostPermissions && ext.hostPermissions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        网站访问
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {ext.hostPermissions.map((host, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded"
                          >
                            {host}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExtensionsSidebar;
