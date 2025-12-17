import { useState } from 'react';
import { useFaviconFetch } from '../hooks/useFaviconFetch';
import TextIconEditor from './TextIconEditor';

interface Props {
  url: string;
  websiteName: string;
  onIconSelect: (iconData: any) => void;
  onEditRequest?: (imageUrl: string) => void;
}

export default function IconSelectionGrid({ url, websiteName, onIconSelect, onEditRequest }: Props) {
  const { sources, isLoading } = useFaviconFetch(url);
  const [selectedType, setSelectedType] = useState<'text' | 'google' | 'duckduckgo' | 'upload' | null>('text');

  const handleTextIconSelect = () => {
    setSelectedType('text');
  };

  const handleFaviconSelect = (source: any) => {
    if (onEditRequest && source.dataUrl) {
      onEditRequest(source.dataUrl);
    }
  };

  const handleUploadSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert('图片大小不能超过 2MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          if (onEditRequest) {
            onEditRequest(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      {/* Icon selection grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Text icon (always show) */}
        <button
          type="button"
          onClick={handleTextIconSelect}
          className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${
            selectedType === 'text' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
            {websiteName.slice(0, 2) || 'Ab'}
          </div>
          <span className="text-xs text-gray-600">纯色图标</span>
        </button>

        {/* DuckDuckGo favicon (if available) - only show DuckDuckGo */}
        {!isLoading && sources.find((s) => s.provider === 'duckduckgo' && s.status === 'success') && (
          <button
            type="button"
            onClick={() => handleFaviconSelect(sources.find((s) => s.provider === 'duckduckgo'))}
            className="flex flex-col items-center gap-2 p-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg transition-all"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src={sources.find((s) => s.provider === 'duckduckgo')?.dataUrl}
                alt="Favicon"
                className="w-12 h-12 rounded"
              />
            </div>
            <span className="text-xs text-gray-600">图标02</span>
          </button>
        )}

        {/* Upload local icon (always show) */}
        <button
          type="button"
          onClick={handleUploadSelect}
          className="flex flex-col items-center gap-2 p-3 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-all"
        >
          <div className="w-12 h-12 flex items-center justify-center text-gray-400 text-3xl">
            +
          </div>
          <span className="text-xs text-gray-600">本地图标</span>
        </button>
      </div>

      {/* Text icon config panel (show below when text icon selected) */}
      {selectedType === 'text' && (
        <TextIconEditor
          websiteName={websiteName}
          onIconChange={onIconSelect}
        />
      )}
    </div>
  );
}
