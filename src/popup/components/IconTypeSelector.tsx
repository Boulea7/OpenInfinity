import { useRef } from 'react';
import TextIconEditor from './TextIconEditor';
import { useFaviconFetch } from '../hooks/useFaviconFetch';
import { Plus, Check } from 'lucide-react';

type IconType = 'text' | 'favicon' | 'upload' | 'custom';

interface Props {
  type: IconType;
  onTypeChange: (type: IconType) => void;
  url: string;
  websiteName?: string;
  iconData?: any;
  onIconChange: (iconData: any) => void;
  onEditRequest: (imageUrl: string) => void;
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

  const handleTextSelect = () => {
    onTypeChange('text');
  };

  const handleFaviconSelect = () => {
    if (validFavicon) {
      onTypeChange('favicon');
      onIconChange({
        type: 'favicon',
        value: validFavicon.dataUrl
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {/* Card 1: Text Icon */}
        <button
          type="button"
          onClick={handleTextSelect}
          className={`
                group relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all
                ${type === 'text' ? 'border-brand-orange-500 bg-brand-orange-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}
            `}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-lg"
            style={{
              background: type === 'text' && iconData?.color ? iconData.color : '#ef4444'
            }}
          >
            {iconData?.type === 'text' && iconData.value ? iconData.value : (websiteName || '').slice(0, 2) || 'Go'}
          </div>
          <span className="text-xs text-zinc-400 group-hover:text-zinc-200">纯色图标</span>
          {type === 'text' && (
            <div className="absolute top-2 right-2 w-4 h-4 bg-brand-orange-500 rounded-full flex items-center justify-center">
              <Check size={10} className="text-white" />
            </div>
          )}
        </button>

        {/* Card 2: Website Icon (Favicon) */}
        <button
          type="button"
          onClick={handleFaviconSelect}
          disabled={!validFavicon}
          className={`
                group relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all
                ${type === 'favicon' ? 'border-brand-orange-500 bg-brand-orange-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}
                ${!validFavicon ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 shadow-lg p-1.5">
            {validFavicon ? (
              <img src={validFavicon.dataUrl} alt="Favicon" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-zinc-500">...</span>
            )}
          </div>
          <span className="text-xs text-zinc-400 group-hover:text-zinc-200">网站图标</span>
          {type === 'favicon' && (
            <div className="absolute top-2 right-2 w-4 h-4 bg-brand-orange-500 rounded-full flex items-center justify-center">
              <Check size={10} className="text-white" />
            </div>
          )}
        </button>

        {/* Card 3: Custom/Upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`
                group relative flex flex-col items-center gap-2 p-3 rounded-2xl border border-dashed hover:border-brand-orange-500/50 bg-transparent transition-all
                ${type === 'custom' ? 'border-brand-orange-500 bg-brand-orange-500/10' : 'border-white/20'}
            `}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all overflow-hidden">
            {type === 'custom' && iconData?.value ? (
              <img src={iconData.value} className="w-full h-full object-cover" />
            ) : (
              <Plus size={20} />
            )}
          </div>
          <span className="text-xs text-zinc-400 group-hover:text-zinc-200">本地图标</span>
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
                  onEditRequest(imageUrl);
                };
                reader.readAsDataURL(file);
              }
              e.target.value = '';
            }}
          />
        </button>
      </div>

      {/* Editor Section */}
      <div className="pt-2 animate-fade-in">
        {type === 'text' && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <TextIconEditor websiteName={websiteName} onIconChange={onIconChange} />
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

