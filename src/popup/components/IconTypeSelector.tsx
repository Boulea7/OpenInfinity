import TextIconEditor from './TextIconEditor';
import FaviconSelector from './FaviconSelector';
import { SegmentedControl, GlassCard } from './UI/GlassComponents';
import { Type, Image, Upload } from 'lucide-react';

type IconType = 'text' | 'favicon' | 'upload';

interface Props {
  type: IconType;
  onTypeChange: (type: IconType) => void;
  url: string;
  websiteName?: string;
  onIconChange: (iconData: any) => void;
  onEditRequest?: (imageUrl: string) => void;
}

export default function IconTypeSelector({
  type,
  onTypeChange,
  url,
  websiteName,
  onIconChange,
  onEditRequest,
}: Props) {
  return (
    <div className="space-y-4">
      <SegmentedControl
        value={type}
        onChange={onTypeChange}
        options={[
          { value: 'text', label: '纯色', icon: <Type size={14} /> },
          { value: 'favicon', label: '图标', icon: <Image size={14} /> },
          { value: 'upload', label: '上传', icon: <Upload size={14} /> },
        ]}
      />

      <div className="animate-fade-in min-h-[120px]">
        {type === 'text' && (
          <GlassCard className="p-4 bg-white/5 border-0">
            <TextIconEditor websiteName={websiteName} onIconChange={onIconChange} />
          </GlassCard>
        )}

        {type === 'favicon' && (
          <GlassCard className="p-4 bg-white/5 border-0">
            <FaviconSelector
              url={url}
              onSelect={(iconData) => {
                if (onEditRequest && iconData.value) {
                  onEditRequest(iconData.value);
                } else {
                  onIconChange(iconData);
                }
              }}
            />
          </GlassCard>
        )}

        {type === 'upload' && (
          <GlassCard className="p-4 bg-white/5 border-0 flex flex-col items-center justify-center text-center gap-3 py-8 border-dashed border-2 border-white/20 hover:border-brand-orange-500/50 transition-colors group cursor-pointer relative">
            <input
              type="file"
              accept="image/*"
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
                    if (onEditRequest) {
                      onEditRequest(imageUrl);
                    } else {
                      onIconChange({
                        type: 'custom',
                        value: imageUrl,
                      });
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="text-zinc-400 group-hover:text-brand-orange-500 transition-colors" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">点击或拖拽上传图片</p>
              <p className="text-xs text-zinc-500 mt-1">支持 PNG, JPG, SVG (Max 2MB)</p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

