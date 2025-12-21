import { useState, useEffect, useRef } from 'react';
import { useFaviconFetch } from '../hooks/useFaviconFetch';
import TextIconEditor, { TextIconConfig, PRESET_COLORS } from './TextIconEditor';
import { generateTextIcon } from '../utils/iconGenerator';
import type { EditRequest, IconDraft } from '../types/iconDraft';

interface Props {
  url: string;
  websiteName: string;
  onIconSelect: (iconData: IconDraft | null) => void;
  onEditRequest?: (req: EditRequest) => void;
}

export default function IconSelectionGrid({ url, websiteName, onIconSelect, onEditRequest }: Props) {
  const { sources, isLoading } = useFaviconFetch(url);
  const [selectedType, setSelectedType] = useState<'text' | 'duckduckgo' | 'upload' | null>('text');

  // Lifted state for text icon config
  const [textConfig, setTextConfig] = useState<TextIconConfig>({
    text: '',
    color: PRESET_COLORS[0],
    fontSize: 130,
    isManuallyEdited: false
  });
  const generationIdRef = useRef(0);

  // Sync text with websiteName
  useEffect(() => {
    if (!textConfig.isManuallyEdited && websiteName) {
      setTextConfig(prev => ({ ...prev, text: websiteName.slice(0, 2) }));
    }
  }, [websiteName, textConfig.isManuallyEdited]);

  // Generate text icon on config change
  useEffect(() => {
    if (selectedType !== 'text') return;

    if (!textConfig.text) {
      onIconSelect(null);
      return;
    }

    const currentId = ++generationIdRef.current;
    let cancelled = false;

    generateTextIcon({
      text: textConfig.text,
      color: textConfig.color,
      fontSize: textConfig.fontSize
    }).then(dataUrl => {
      if (cancelled) return;
      if (currentId === generationIdRef.current) {
        onIconSelect({
          type: 'text',
          value: textConfig.text,
          color: textConfig.color,
          dataUrl
        });
      }
    }).catch(err => {
      console.error(err);
    });

    return () => { cancelled = true; };
  }, [textConfig, selectedType, onIconSelect]);

  const duckSource = !isLoading
    ? sources.find((s) => s.provider === 'duckduckgo' && s.status === 'success')
    : undefined;

  const handleTextIconSelect = () => {
    setSelectedType('text');
  };

  const handleFaviconSelect = () => {
    setSelectedType('duckduckgo');
    onIconSelect(null);

    if (duckSource?.dataUrl) {
      if (onEditRequest) {
        onEditRequest({ imageUrl: duckSource.dataUrl, iconType: 'favicon' });
      } else {
        onIconSelect({ type: 'favicon', value: duckSource.dataUrl });
      }
    }
  };

  const handleUploadSelect = () => {
    setSelectedType('upload');
    onIconSelect(null);

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
          const dataUrl = reader.result as string;
          if (onEditRequest) {
            onEditRequest({ imageUrl: dataUrl, iconType: 'custom' });
          } else {
            onIconSelect({ type: 'custom', value: dataUrl });
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
          className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${selectedType === 'text' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
            {textConfig.text || 'Ab'}
          </div>
          <span className="text-xs text-gray-600">纯色图标</span>
        </button>

        {/* DuckDuckGo favicon (if available) - only show DuckDuckGo */}
        {duckSource && (
          <button
            type="button"
            onClick={handleFaviconSelect}
            className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${selectedType === 'duckduckgo' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src={duckSource.dataUrl}
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
          className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${selectedType === 'upload'
              ? 'border-blue-500 bg-blue-50'
              : 'border-dashed border-gray-300 hover:border-gray-400'
            }`}
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
          config={textConfig}
          onChange={setTextConfig}
        />
      )}
    </div>
  );
}
