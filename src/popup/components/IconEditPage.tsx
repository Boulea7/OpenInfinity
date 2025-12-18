import { useState, useRef } from 'react';
import ReactCrop, { type PercentCrop } from 'react-image-crop';
import { X, RotateCw, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', 'transparent',
  // Gradient placeholder logic can be added or just plain colors for now
];

interface Props {
  imageUrl: string;
  iconType?: 'favicon' | 'custom';
  onConfirm: (croppedImageData: string, backgroundColor: string) => void;
  onCancel: () => void;
}

export default function IconEditPage({ imageUrl, iconType = 'custom', onConfirm, onCancel }: Props) {
  const isFavicon = iconType === 'favicon';
  const outputSize = isFavicon ? 64 : 128;

  const [crop, setCrop] = useState<PercentCrop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [backgroundColor, setBackgroundColor] = useState('#f97316'); // Default brand orange
  const imgRef = useRef<HTMLImageElement>(null);

  const handleConfirm = async () => {
    if (!imgRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = outputSize;
      canvas.height = outputSize;

      const x = typeof crop.x === 'number' ? crop.x : 0;
      const y = typeof crop.y === 'number' ? crop.y : 0;
      const width = typeof crop.width === 'number' ? crop.width : 0;
      const height = typeof crop.height === 'number' ? crop.height : 0;

      if (width <= 0 || height <= 0) return;

      const pixelCrop = {
        x: (x / 100) * imgRef.current.naturalWidth,
        y: (y / 100) * imgRef.current.naturalHeight,
        width: (width / 100) * imgRef.current.naturalWidth,
        height: (height / 100) * imgRef.current.naturalHeight,
      };

      // Draw background
      if (!isFavicon && backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, outputSize, outputSize);
      }

      // Draw cropped image centered
      ctx.drawImage(
        imgRef.current,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
      );

      const croppedImageData = canvas.toDataURL('image/png');
      onConfirm(croppedImageData, backgroundColor);
    } catch (error) {
      console.error('Failed to crop image:', error);
      alert('裁切失败，请重试');
    }
  };

  return (
    <div className="w-[600px] h-[450px] bg-zinc-900 rounded-2xl flex flex-col overflow-hidden border border-white/10 shadow-2xl animate-scale-in">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center justify-center relative bg-white/5">
        <h2 className="text-lg font-medium text-white">自定义图标</h2>
        <button onClick={onCancel} className="absolute right-4 text-zinc-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Crop Area */}
        <div className="flex-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbC1vcGFjaXR5PSIwLjA1Ij48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] flex items-center justify-center p-6 border-r border-white/10 relative">
          <div className="relative max-w-full max-h-full shadow-2xl">
            <ReactCrop
              crop={crop}
              onChange={(_c, percentCrop) => setCrop(percentCrop)}
              aspect={1}
              className="max-w-[280px] max-h-[280px]"
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop"
                className="max-w-full max-h-[280px] object-contain"
              />
            </ReactCrop>
          </div>
          {/* Simple Toolbar overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-zinc-900/80 backdrop-blur rounded-full px-3 py-1.5 border border-white/10">
            <button className="p-1 hover:text-brand-orange-500 transition-colors"><RotateCcw size={16} /></button>
            <button className="p-1 hover:text-brand-orange-500 transition-colors"><RotateCw size={16} /></button>
            <div className="w-px h-4 bg-white/20 mx-1 self-center" />
            <button className="p-1 hover:text-brand-orange-500 transition-colors"><ZoomOut size={16} /></button>
            <button className="p-1 hover:text-brand-orange-500 transition-colors"><ZoomIn size={16} /></button>
          </div>
        </div>

        {/* Right: Preview & Settings */}
        <div className="w-[200px] bg-zinc-900 p-5 flex flex-col gap-6">
          {/* Preview Circle */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-zinc-500">预览</h3>
            <div className="w-24 h-24 rounded-2xl border border-white/10 mx-auto overflow-hidden shadow-lg relative flex items-center justify-center"
              style={{ backgroundColor }}>
              <img src={imageUrl} className="w-20 h-20 object-cover rounded-xl opacity-80" style={{
                // This is a rough preview approx
                clipPath: 'inset(10% 10% 10% 10%)',
                // Ideally we render real crop here via canvas but static image ok for now
              }} />
            </div>
          </div>

          {/* Background Colors */}
          {!isFavicon && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-zinc-500">背景颜色</h3>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setBackgroundColor(c)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${backgroundColor === c ? 'border-white scale-110' : 'border-transparent hover:border-white/20'}`}
                    style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }}
                  >
                    {c === 'transparent' && <div className="w-full h-full border border-zinc-600 rounded-lg relative overflow-hidden"><div className="absolute inset-0 border-t border-red-500 origin-top-left -rotate-45 translate-y-3"></div></div>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="h-16 flex items-center justify-end px-6 gap-3 border-t border-white/10 bg-zinc-900">
        <button onClick={handleConfirm} className="bg-brand-orange-500 text-white px-8 py-2 rounded-lg font-medium hover:bg-brand-orange-600 transition-colors">
          确定
        </button>
      </div>
    </div>
  );
}

