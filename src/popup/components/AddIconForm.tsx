import { useState, useEffect } from 'react';
import { useCurrentTab } from '../hooks/useCurrentTab';
import { useAddIcon } from '../hooks/useAddIcon';
import IconTypeSelector from './IconTypeSelector';
import IconPreview from './IconPreview';

type IconType = 'text' | 'favicon' | 'upload';

export default function AddIconForm() {
  const { tabInfo, isLoading } = useCurrentTab();
  const { addIcon, isAdding } = useAddIcon();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [iconType, setIconType] = useState<IconType>('text');
  const [iconData, setIconData] = useState<any>(null);

  // Auto-fill from current tab (only if fields are empty)
  useEffect(() => {
    if (tabInfo && !title && !url) {
      setTitle(tabInfo.title);
      setUrl(tabInfo.url);
    }
  }, [tabInfo, title, url]);

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

    // Validate URL scheme
    if (!validateUrl(url)) {
      alert('请输入有效的 HTTP 或 HTTPS 网址');
      return;
    }

    try {
      await addIcon({
        title,
        url,
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
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium mb-1">网站地址</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Icon type selector */}
      <div>
        <label className="block text-sm font-medium mb-2">选择图标</label>
        <IconTypeSelector
          type={iconType}
          onTypeChange={setIconType}
          url={url}
          onIconChange={setIconData}
        />
      </div>

      {/* Preview */}
      <IconPreview title={title} icon={iconData} />

      {/* Submit button */}
      <button
        type="submit"
        disabled={isAdding || !title || !url || !iconData}
        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isAdding ? '添加中...' : '确定'}
      </button>
    </form>
  );
}
