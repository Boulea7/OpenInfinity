import { useRef, useState, useEffect } from 'react';
import TextIconEditor, { TextIconConfig, PRESET_COLORS } from './TextIconEditor';
import { useFaviconFetch } from '../hooks/useFaviconFetch';
import { generateTextIcon } from '../utils/iconGenerator';
import { Plus, Check } from 'lucide-react';

type IconType = 'text' | 'favicon' | 'upload' | 'custom';

interface Props {
  type: IconType;
  onTypeChange: (type: IconType) => void;
  url: string;
  websiteName?: string;
  iconData?: any;
  onIconChange: (iconData: any) => void;
  onEditRequest: (imageUrl: string, iconType: IconType) => void;
}

export default function IconTypeSelector({
  type,
  onTypeChange,
  url,
  websiteName,
  iconData,
  onIconChange,
  onEditRequest,
}: Props) {
  const { sources } = useFaviconFetch(url);
  const validFavicon = sources.find((s) => s.status === 'success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for text icon configuration (lifted from TextIconEditor)
  const [textConfig, setTextConfig] = useState<TextIconConfig>({
    text: '',
    color: PRESET_COLORS[0],
    fontSize: 80,
    isManuallyEdited: false
  });

  // Persistent preview URL for text icon
  const [textIconPreviewUrl, setTextIconPreviewUrl] = useState<string | null>(null);
  const generationIdRef = useRef(0);

  // Sync text with websiteName changes if not manually edited
  useEffect(() => {
    if (!textConfig.isManuallyEdited && websiteName !== undefined) {
      const extracted = websiteName.slice(0, 2);
      setTextConfig(prev => ({ ...prev, text: extracted }));
    }
  }, [websiteName, textConfig.isManuallyEdited]);

  // Generate text icon whenever config changes
  useEffect(() => {
    if (!textConfig.text) {
      if (type === 'text') {
        // Only clear if active type is text, but we should probably keep previous preview if just text is empty?
        // Or maybe clear preview.
        setTextIconPreviewUrl(null);
        onIconChange(null);
      }
      return;
    }

    const currentId = ++generationIdRef.current;
    let cancelled = false;

    generateTextIcon({
      text: textConfig.text,
      color: textConfig.color,
      fontSize: textConfig.fontSize
    })
      .then((dataUrl) => {
        if (cancelled) return;
        if (currentId === generationIdRef.current) {
          setTextIconPreviewUrl(dataUrl);
          // Only propagate to parent if currently selected type is text
          if (type === 'text') {
            onIconChange({
              type: 'text',
              value: textConfig.text,
              color: textConfig.color,
              dataUrl,
            });
          }
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to generate text icon:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [textConfig.text, textConfig.fontSize, textConfig.color, type, onIconChange]);
  // Added type dependency to re-emit save data when switching back to text? 
  // Actually onIconChange might be stable, but if we switch TO text, we want to ensure the data is set.

  // Re-emit data when switching TO text type if we have valid data
  useEffect(() => {
    if (type === 'text' && textIconPreviewUrl && textConfig.text) {
      onIconChange({
        type: 'text',
        value: textConfig.text,
        color: textConfig.color,
        dataUrl: textIconPreviewUrl
      });
    }
  }, [type, textIconPreviewUrl, textConfig]);


  const handleTextSelect = () => {
    onTypeChange('text');
  };

  const handleFaviconSelect = () => {
    if (!validFavicon?.dataUrl) return;
    onTypeChange('favicon');
    onIconChange({ type: 'favicon', value: validFavicon.dataUrl });
    onEditRequest(validFavicon.dataUrl, 'favicon');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-start gap-6 px-2">
        {/* Card 1: Text Icon */}
        <button
          type="button"
          onClick={handleTextSelect}
          className="group relative flex flex-col items-center gap-2 transition-all"
        >
          <div
            className="w-14 h-14 rounded-[14px] flex items-center justify-center text-xl font-bold text-white shadow-sm overflow-hidden bg-cover bg-center transition-transform active:scale-95"
            style={{
              background: textConfig.color || '#ef4444',
              backgroundImage: textIconPreviewUrl ? `url(${textIconPreviewUrl})` : undefined
            }}
          >
            {/* Show fallback text only if no preview URL */}
            {!textIconPreviewUrl && (textConfig.text || (websiteName || '').slice(0, 2) || 'Go')}
          </div>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">纯色图标</span>
          {type === 'text' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-orange-500 rounded-full flex items-center justify-center shadow-sm border border-white dark:border-zinc-900">
              <Check size={10} className="text-white" />
            </div>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-16 bg-zinc-100 dark:bg-zinc-800" />

        {/* Card 2: Website Icon (Favicon) - Only shown if valid */}
        {validFavicon && (
          <>
            <button
              type="button"
              onClick={handleFaviconSelect}
              className="group relative flex flex-col items-center gap-2 transition-all"
            >
              <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-gray-50 dark:bg-zinc-800 shadow-sm p-2 transition-transform active:scale-95">
                <img src={validFavicon.dataUrl} alt="Favicon" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">网站图标</span>
              {type === 'favicon' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-orange-500 rounded-full flex items-center justify-center shadow-sm border border-white dark:border-zinc-900">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </button>
            <div className="w-px h-16 bg-zinc-100 dark:bg-zinc-800" />
          </>
        )}

        {/* Card 3: Custom/Upload */}
        <button
          type="button"
          onClick={() => {
            onTypeChange('custom');
            fileInputRef.current?.click();
          }}
          className="group relative flex flex-col items-center gap-2 transition-all"
        >
          <div className={`
            w-14 h-14 rounded-[14px] flex items-center justify-center transition-all overflow-hidden border-2 border-dashed active:scale-95
            ${type === 'custom'
              ? 'border-brand-orange-500 bg-brand-orange-50 dark:bg-brand-orange-900/20 text-brand-orange-500'
              : 'border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-300 group-hover:border-zinc-300 group-hover:text-zinc-400'}
          `}>
            {type === 'custom' && iconData?.value ? (
              <img src={iconData.value} className="w-full h-full object-cover" />
            ) : (
              <Plus size={20} />
            )}
          </div>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">本地图标</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 2 * 1024 * 1024) {
                  alert('图片大小不能超过 2MB');
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const imageUrl = reader.result as string;
                  onEditRequest(imageUrl, 'custom');
                };
                reader.readAsDataURL(file);
              }
              e.target.value = '';
            }}
          />
        </button>
      </div>

      {/* Editor Section */}
      <div className="pt-1 animate-fade-in">
        {type === 'text' && (
          <div className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100/50">
            <TextIconEditor config={textConfig} onChange={setTextConfig} />
          </div>
        )}

        {type === 'custom' && (
          <div className="text-center text-xs text-zinc-500 py-2">
            点击上方虚线框可重新上传
          </div>
        )}
      </div>
    </div>
  );
}

