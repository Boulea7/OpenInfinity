import { useState, useEffect } from 'react';
import { useCurrentTab } from '../hooks/useCurrentTab';
import { useAddIcon } from '../hooks/useAddIcon';
import IconSelectionGrid from './IconSelectionGrid';

interface Props {
  onEditIcon?: (imageUrl: string) => void;
}

export default function AddIconForm({ onEditIcon }: Props) {
  const { tabInfo, isLoading } = useCurrentTab();
  const { addIcon, isAdding } = useAddIcon();

  const [title, setTitle] = useState('');
  const [iconData, setIconData] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-fill title from current tab (only if empty and not dirty)
  useEffect(() => {
    if (tabInfo && !title && !isDirty) {
      setTitle(tabInfo.title);
    }
  }, [tabInfo, title, isDirty]);

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
      alert('请选择图标');
      return;
    }

    if (!tabInfo?.url) {
      alert('无法获取当前页面地址');
      return;
    }

    // Validate URL scheme
    if (!validateUrl(tabInfo.url)) {
      alert('当前页面地址无效');
      return;
    }

    try {
      await addIcon({
        title,
        url: tabInfo.url,  // Use URL from current tab
        icon: {
          type: iconData.type,
          value: iconData.dataUrl || iconData.value,
          color: iconData.color,
        },
        position: { x: 0, y: 0 },  // Background will calculate next position
      });

      // Close popup on success
      window.close();
    } catch (error) {
      console.error('Failed to add icon:', error);
      alert('添加失败，请重试');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Website name */}
      <div>
        <label className="block text-sm font-medium mb-1">网站名称</label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setIsDirty(true);  // Mark as dirty when user edits
          }}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Icon selection grid (no separate preview) */}
      <div>
        <label className="block text-sm font-medium mb-2">选择图标</label>
        <IconSelectionGrid
          url={tabInfo?.url || ''}
          websiteName={title}
          onIconSelect={setIconData}
          onEditRequest={onEditIcon}
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isAdding || !title || !iconData}
        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isAdding ? '添加中...' : '确定'}
      </button>
    </form>
  );
}
