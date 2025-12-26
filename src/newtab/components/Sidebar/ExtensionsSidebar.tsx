/**
 * ExtensionsSidebar Component
 *
 * Extension management sidebar with enable/disable controls.
 * Requires management permission.
 * Redesigned to match modern "Zinc" aesthetic.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Puzzle,
  Trash2,
  Settings,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { PermissionGate } from '../ui/PermissionGate';
import { hasPermissions, ensureOptionalPermissions, PERMISSION_GROUPS } from '../../../shared/permissions';
import { cn } from '../../utils';
import { openUrlSafe } from '../../utils/navigation';

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
  installType: string;
}

// Custom Toggle Component to match design system
function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900",
        checked ? "bg-zinc-800 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-900 transition-transform duration-200 shadow-sm",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-500" />
      </div>
    );
  }

  return (
    <PermissionGate
      hasPermission={hasPermission}
      permissionName="扩展管理"
      description="允许查看和管理已安装的浏览器扩展。"
      onRequestPermission={handleRequestPermission}
      icon={<Puzzle className="w-8 h-8 text-zinc-500" />}
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
  const [permissionWarnings, setPermissionWarnings] = useState<Record<string, string[]>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  // Toggle permissions expansion and fetch warnings if needed
  const togglePermissions = useCallback(async (id: string) => {
    const isExpanding = !expandedPermissions.has(id);

    setExpandedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // Fetch localized permission warnings if expanding and not yet loaded
    if (isExpanding && !permissionWarnings[id]) {
      try {
        const warnings = await chrome.management.getPermissionWarningsById(id);
        setPermissionWarnings(prev => ({
          ...prev,
          [id]: warnings
        }));
      } catch (e) {
        console.error('Failed to fetch permission warnings for', id, e);
      }
    }
  }, [expandedPermissions, permissionWarnings]);

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
          installType: ext.installType,
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

    // Listen for extension events to keep list in sync
    const handleEvent = () => loadExtensions();

    if (chrome.management) {
      chrome.management.onInstalled?.addListener(handleEvent);
      chrome.management.onUninstalled?.addListener(handleEvent);
      chrome.management.onEnabled?.addListener(handleEvent);
      chrome.management.onDisabled?.addListener(handleEvent);
    }

    return () => {
      if (chrome.management) {
        chrome.management.onInstalled?.removeListener(handleEvent);
        chrome.management.onUninstalled?.removeListener(handleEvent);
        chrome.management.onEnabled?.removeListener(handleEvent);
        chrome.management.onDisabled?.removeListener(handleEvent);
      }
    };
  }, [loadExtensions]);

  // Toggle extension
  const toggleExtension = async (id: string, enabled: boolean) => {
    try {
      await chrome.management.setEnabled(id, enabled);
      setExtensions(prev =>
        prev.map(ext => ext.id === id ? { ...ext, enabled } : ext)
      );
      setActionError(null);
    } catch (error) {
      console.error('Failed to toggle extension:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to toggle extension');
    }
  };

  // Uninstall extension - Chrome's native dialog provides confirmation
  const uninstallExtension = async (id: string) => {
    try {
      await chrome.management.uninstall(id, { showConfirmDialog: true });
      setActionError(null);
    } catch (error) {
      // User cancelled or uninstall failed
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();
      if (lower.includes('cancel') || lower.includes('canceled') || lower.includes('cancelled')) {
        return;
      }
      setActionError(message || 'Failed to uninstall extension');
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
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!ext.name.toLowerCase().includes(query) &&
        !ext.description.toLowerCase().includes(query)) {
        return false;
      }
    }

    if (filter === 'enabled' && !ext.enabled) return false;
    if (filter === 'disabled' && ext.enabled) return false;

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      <div className="flex-none p-3 space-y-3 z-10 relative border-b border-transparent dark:border-zinc-800/50">

        {/* Error Message */}
        {actionError && (
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm animate-in fade-in slide-in-from-top-1">
            {actionError}
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white dark:bg-zinc-800/40 border-2 border-zinc-300 dark:border-zinc-600 rounded-xl p-1 shadow-sm focus-within:border-zinc-800 dark:focus-within:border-zinc-400 focus-within:shadow-md transition-all duration-300 group">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索扩展..."
              className={cn(
                "w-full pl-9 pr-3 py-1.5 rounded-lg text-sm bg-transparent",
                "text-gray-900 dark:text-gray-100",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "focus:outline-none"
              )}
            />
          </div>
        </div>

        {/* Filter Segment Control */}
        <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg relative">
          {(['all', 'enabled', 'disabled'] as const).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'flex-1 relative px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 z-10',
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100 shadow-sm bg-white dark:bg-zinc-700'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
                )}
              >
                {f === 'all' ? '全部' : f === 'enabled' ? '已启用' : '已禁用'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extensions List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 scroll-smooth">
        {filteredExtensions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center text-zinc-400 dark:text-zinc-500 animate-in fade-in duration-500">
            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-3">
              {searchQuery ? (
                <Search className="w-6 h-6 opacity-50" />
              ) : (
                <Puzzle className="w-6 h-6 opacity-50" />
              )}
            </div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {searchQuery ? '未找到相关扩展' : '暂无扩展'}
            </p>
          </div>
        ) : (
          filteredExtensions.map((ext) => (
            <div
              key={ext.id}
              className={cn(
                'group p-3 rounded-xl border transition-all duration-200',
                ext.enabled
                  ? 'bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm'
                  : 'bg-zinc-50 dark:bg-zinc-800/20 border-zinc-100 dark:border-zinc-800 grayscale-[0.5] hover:grayscale-0'
              )}
            >
              {/* Header: Icon, Info, Toggle */}
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white dark:bg-zinc-700 p-1 border border-zinc-100 dark:border-zinc-600 flex items-center justify-center">
                  {getIcon(ext) ? (
                    <img src={getIcon(ext)!} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Puzzle className="w-5 h-5 text-zinc-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "font-semibold text-sm truncate",
                      ext.enabled ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"
                    )}>
                      {ext.name}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      v{ext.version}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                    {ext.description}
                  </p>
                </div>

                {/* Toggle */}
                {ext.mayDisable && (
                  <div className="flex-shrink-0 ml-1">
                    <ToggleSwitch
                      checked={ext.enabled}
                      onChange={() => toggleExtension(ext.id, !ext.enabled)}
                    />
                  </div>
                )}
              </div>

              {/* Actions Divider */}
              <div className="my-3 border-t border-zinc-100 dark:border-zinc-800" />

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {/* Settings - uses openUrlSafe for protocol validation */}
                  {ext.optionsUrl && (
                    <button
                      onClick={() => openUrlSafe(ext.optionsUrl!)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                      title="扩展选项"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}

                  {/* Homepage - uses openUrlSafe for protocol validation */}
                  <button
                    onClick={() => openUrlSafe(ext.homepageUrl || `https://chrome.google.com/webstore/detail/${ext.id}`)}
                    className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="打开主页/商店"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  {/* Permissions Toggle */}
                  <button
                    onClick={() => togglePermissions(ext.id)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      expandedPermissions.has(ext.id)
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    权限
                    {expandedPermissions.has(ext.id) ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Uninstall */}
                <button
                  onClick={() => uninstallExtension(ext.id)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-60 hover:opacity-100"
                  title="卸载扩展"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>卸载</span>
                </button>
              </div>

              {/* Expanded Layout: Details Table */}
              {expandedPermissions.has(ext.id) && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 -mx-3 -mb-3 p-3 rounded-b-xl space-y-3 animate-in fade-in slide-in-from-top-1">

                  {/* Host Permissions */}
                  {ext.hostPermissions && ext.hostPermissions.length > 0 && (
                    <div className="flex items-start text-xs">
                      <span className="w-20 flex-shrink-0 text-zinc-500 dark:text-zinc-400 py-0.5">Host权限</span>
                      <div className="flex-1 flex flex-col gap-1">
                        {ext.hostPermissions.map((host, i) => (
                          <span key={i} className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px] bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 w-fit">
                            {host}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General Permissions (Warnings) */}
                  <div className="flex items-start text-xs">
                    <span className="w-20 flex-shrink-0 text-zinc-500 dark:text-zinc-400 py-0.5">权限</span>
                    <div className="flex-1 flex flex-col gap-1">
                      {permissionWarnings[ext.id]?.length ? (
                        permissionWarnings[ext.id].map((warning, i) => (
                          <span key={i} className="text-zinc-700 dark:text-zinc-300 py-0.5">
                            {warning}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400 italic py-0.5">
                          {(ext.permissions && ext.permissions.length > 0) ? '无特殊警告权限' : '此扩展不需要特殊权限'}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))
        )}
        <div className="h-4" /> {/* Bottom spacer */}
      </div>
    </div>
  );
}

export default ExtensionsSidebar;
