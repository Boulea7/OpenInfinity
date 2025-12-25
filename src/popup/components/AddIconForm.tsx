import { useState, useEffect } from 'react';
import { useCurrentTab } from '../hooks/useCurrentTab';
import { useAddIcon } from '../hooks/useAddIcon';
import IconTypeSelectorContainer from './IconTypeSelectorContainer';
import IconEditPage from './IconEditPage';

import type { EditRequest } from '../types/iconDraft';
import type { IconDraft, IconType } from '../../shared/icon';
import { ensureFeaturePermissions, PERMISSION_GROUPS } from '../../shared/permissions';
import { GlassButton } from './UI/GlassComponents';
import PopupLayout from './PopupLayout';

export default function AddIconForm() {
  const { tabInfo, isLoading, needsPermission, reload } = useCurrentTab();
  const { addIcon, isAdding } = useAddIcon();

  const [title, setTitle] = useState('');
  const [iconType, setIconType] = useState<IconType>('text');
  const [iconData, setIconData] = useState<IconDraft | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [editRequest, setEditRequest] = useState<EditRequest | null>(null);
  const [isGranting, setIsGranting] = useState(false);

  // Auto-fill title
  useEffect(() => {
    if (tabInfo && !title && !isDirty) {
      setTitle(tabInfo.title);
    }
  }, [tabInfo, title, isDirty]);

  // Default to favicon if available on load? Or keep text default. 
  // Requirement says "3 types selection". Let's stick to 'text' default or logic:
  // Usually favicon is better default if available, but text is safer. Sticking to text for now as per previous code,
  // or maybe switch to 'favicon' if user prefers? Let's keep 'text' as initial state for consistency with design reqs listing "Solid/Favicon/Upload".

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const safeSchemes = ['http:', 'https:'];
      return safeSchemes.includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!iconData) {
      return; // Button should be disabled anyway
    }

    if (!tabInfo?.url) {
      alert('无法获取当前页面地址');
      return;
    }

    if (!validateUrl(tabInfo.url)) {
      alert('当前页面地址无效');
      return;
    }

    try {
      const icon =
        iconData.type === 'text'
          ? {
            type: 'text' as const,
            value: iconData.value,
            color: iconData.color,
          }
          : {
            type: iconData.type,
            value: iconData.value,
          };

      await addIcon({
        title,
        url: tabInfo.url,
        icon,
        position: { x: 0, y: 0 },
      });

      window.close();
    } catch (error) {
      console.error('Failed to add icon:', error);
      alert('添加失败，请重试');
    }
  };

  if (isLoading) {
    return (
      <PopupLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange-500"></div>
        </div>
      </PopupLayout>
    );
  }

  return (
    <PopupLayout>
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <h1 className="text-base font-semibold tracking-tight text-zinc-900">添加快捷方式</h1>
        <div className="text-[10px] text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-100">
          OpenInfinity
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-2 flex-1 overflow-y-auto scrollbar-hide">

        {/* Permission gate for reading current tab */}
        {needsPermission && !tabInfo?.url && (
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
            <div className="text-xs text-zinc-600">
              需要授权读取当前标签页信息，才能自动获取网址并添加到主页。
            </div>
            <button
              type="button"
              className="mt-2 w-full px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isGranting}
              onClick={async () => {
                setIsGranting(true);
                try {
                  const ok = await ensureFeaturePermissions(PERMISSION_GROUPS.tabs, []);
                  if (ok) {
                    await reload();
                  }
                } finally {
                  setIsGranting(false);
                }
              }}
            >
              {isGranting ? '授权中...' : '授权并读取当前页面'}
            </button>
          </div>
        )}

        {/* Website Info */}
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            className="w-full bg-transparent border-b border-zinc-100 px-0 py-1.5 text-sm focus:outline-none focus:border-brand-orange-500 transition-colors placeholder-zinc-300 font-medium text-zinc-900"
            placeholder="网站名称"
          />
        </div>

        {/* Icon Type Selection */}
        <div className="flex-1 min-h-0 pt-1">
          <label className="block text-xs font-semibold mb-2 text-zinc-400">选择图标</label>
          <IconTypeSelectorContainer
            type={iconType}
            onTypeChange={setIconType}
            url={tabInfo?.url || ''}
            websiteName={title}
            iconData={iconData}
            onIconChange={setIconData}
            onEditRequest={(imageUrl, nextType) => {
              setIconType(nextType);
              setIconData(null);
              // Only set editRequest for types that support image editing
              if (nextType === 'favicon' || nextType === 'custom') {
                setEditRequest({ imageUrl, iconType: nextType });
              }
            }}
          />
        </div>



        {/* Spacing for bottom actions */}
        <div className="h-1"></div>
      </form>

      {/* Footer Actions */}
      <div className="w-full mt-2">
        <GlassButton
          variant="primary"
          onClick={handleSubmit}
          disabled={isAdding || !title || !iconData || !tabInfo?.url}
          isLoading={isAdding}
          className="w-full"
        >
          {isAdding ? '添加中...' : '添加到主页'}
        </GlassButton>
      </div>

      {/* Editor Modal Overlay */}
      {editRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl">
            <IconEditPage
              imageUrl={editRequest.imageUrl}
              iconType={editRequest.iconType}
              onConfirm={(croppedImageData) => {
                setIconData({
                  type: editRequest.iconType,
                  value: croppedImageData,
                });
                setEditRequest(null);
              }}
              onCancel={() => {
                setEditRequest(null);
              }}
            />
          </div>
        </div>
      )}
    </PopupLayout>
  );
}
