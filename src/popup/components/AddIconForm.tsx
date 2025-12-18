import { useState, useEffect } from 'react';
import { useCurrentTab } from '../hooks/useCurrentTab';
import { useAddIcon } from '../hooks/useAddIcon';
import IconTypeSelector from './IconTypeSelector';
import IconEditPage from './IconEditPage';
import IconPreview from './IconPreview';
import type { EditRequest, IconDraft } from '../types/iconDraft';
import { GlassButton } from './UI/GlassComponents';
import PopupLayout from './PopupLayout';

export default function AddIconForm() {
  const { tabInfo, isLoading } = useCurrentTab();
  const { addIcon, isAdding } = useAddIcon();

  const [title, setTitle] = useState('');
  const [iconType, setIconType] = useState<'text' | 'favicon' | 'upload' | 'custom'>('text');
  const [iconData, setIconData] = useState<IconDraft | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [editRequest, setEditRequest] = useState<EditRequest | null>(null);

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
      <div className="w-full flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold tracking-tight">添加快捷方式</h1>
        <div className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
          OpenInfinity
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-5 flex-1 overflow-y-auto scrollbar-hide">
        {/* Preview Section */}
        <div className="flex justify-center mb-2">
          <IconPreview title={title} icon={iconData} />
        </div>

        {/* Website Info */}
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-base focus:outline-none focus:border-brand-orange-500 transition-colors placeholder-zinc-600 font-medium"
            placeholder="网站名称"
          />
        </div>

        {/* Icon Type Selection */}
        <div className="flex-1 min-h-0 pt-2">
          <label className="block text-sm font-semibold mb-3">选择图标</label>
          <IconTypeSelector
            type={iconType}
            onTypeChange={setIconType}
            url={tabInfo?.url || ''}
            websiteName={title}
            iconData={iconData}
            onIconChange={setIconData}
            onEditRequest={(imageUrl) => {
              setIconData(null);
              setEditRequest({ imageUrl, iconType: 'custom' });
            }}
          />
        </div>



        {/* Spacing for bottom actions */}
        <div className="h-4"></div>
      </form>

      {/* Footer Actions */}
      <div className="w-full mt-4 flex gap-3 pt-4 border-t border-white/5">
        <GlassButton
          variant="secondary"
          onClick={() => window.close()}
          className="flex-1"
        >
          取消
        </GlassButton>
        <GlassButton
          variant="primary"
          onClick={handleSubmit}
          disabled={isAdding || !title || !iconData}
          isLoading={isAdding}
          className="flex-[2]"
        >
          {isAdding ? '添加中...' : '添加到主页'}
        </GlassButton>
      </div>

      {/* Editor Modal Overlay */}
      {editRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-xs w-full">
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

