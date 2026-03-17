import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, { type PercentCrop } from 'react-image-crop';
import { X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Check } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';



interface Props {
  imageUrl: string;
  iconType?: 'favicon' | 'custom';
  onConfirm: (croppedImageData: string, backgroundColor?: string) => void;
  onCancel: () => void;
}

export default function IconEditPage({ imageUrl, iconType = 'custom', onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  const isFavicon = iconType === 'favicon';
  const outputSize = isFavicon ? 64 : 128;

  const [crop, setCrop] = useState<PercentCrop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [backgroundColor, setBackgroundColor] = useState('transparent'); // Default transparent as requested
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
      alert(t('popup.errors.cropFailed'));
    }
  };

  const handleReset = () => {
    setCrop({
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
    // Reset rotation/scale if we had them (currently we don't store them in state shown, 
    // but if we did/will, reset them here. For now just crop reset)
    setBackgroundColor('transparent');
  };

  return (
    <div className="w-[800px] h-[600px] bg-white rounded-xl flex flex-col overflow-hidden shadow-2xl animate-scale-in text-zinc-900 relative">
      {/* close button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors z-10"
      >
        <X size={20} />
      </button>

      {/* Header */}
      <div className="mt-8 mb-2 flex items-center justify-center">
        <h2 className="text-xl font-bold text-zinc-800">{t('popup.customIcon')}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden px-12 py-6 gap-12">
        {/* Left: Crop Area */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 bg-blue-50/30 rounded-lg overflow-hidden relative border border-blue-100 flex items-center justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_c, percentCrop) => setCrop(percentCrop)}
              aspect={1}
              className="max-w-[350px] max-h-[350px]"
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop"
                className="max-w-full max-h-[350px] object-contain"
              />
            </ReactCrop>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-2 text-zinc-400">
            <div className="flex gap-4">
              <button className="hover:text-zinc-600 transition-colors"><RotateCcw size={20} /></button>
              <button className="hover:text-zinc-600 transition-colors"><RotateCw size={20} /></button>
            </div>
            <div className="flex gap-4">
              <button className="hover:text-zinc-600 transition-colors"><ZoomOut size={20} /></button>
              <button className="hover:text-zinc-600 transition-colors"><ZoomIn size={20} /></button>
            </div>
          </div>
        </div>

        {/* Right: Preview & Settings */}
        <div className="w-[240px] flex flex-col gap-8 pt-4">
          {/* Preview */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-900">{t('popup.preview')}</h3>
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center border border-zinc-100 relative"
              style={{ backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor }}
            >
              {/* Simulating checkered background if transparent */}
              {backgroundColor === 'transparent' && (
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbC1vcGFjaXR5PSIwLjA1Ij48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')] opacity-20 -z-10" />
              )}
              <img src={imageUrl} className="w-16 h-16 object-cover rounded-lg" style={{
                // This is a rough preview approx. Ideally use canvas or separate Preview component
              }} />
            </div>
          </div>

          {/* Background Colors */}
          {!isFavicon && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-900">{t('popup.backgroundColor')}</h3>
              <div className="flex flex-wrap gap-3">
                {['#ef4444', '#f97316', '#facc15', '#4ade80', '#22d3ee', '#3b82f6', '#a855f7'].map(c => (
                  <button
                    key={c}
                    onClick={() => setBackgroundColor(c)}
                    className={`w-6 h-6 rounded-md hover:scale-110 transition-transform ${backgroundColor === c ? 'ring-2 ring-offset-2 ring-zinc-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                {/* Transparent */}
                <button
                  onClick={() => setBackgroundColor('transparent')}
                  className={`w-6 h-6 rounded-md border border-zinc-200 flex items-center justify-center hover:scale-110 transition-transform ${backgroundColor === 'transparent' ? 'ring-2 ring-offset-2 ring-zinc-400' : ''}`}
                >
                  <Check size={12} className="text-zinc-300" />
                </button>
                {/* Gradient/Custom Placeholder */}
                <button
                  className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 to-yellow-500 hover:scale-110 transition-transform"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="h-24 flex items-center justify-center gap-4 pb-4">
        <button
          onClick={onCancel}
          className="w-32 py-2.5 bg-zinc-100 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          {t('popup.cancel')}
        </button>
        <button
          onClick={handleReset}
          className="w-32 py-2.5 bg-zinc-100 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          {t('popup.reset')}
        </button>
        <button
          onClick={handleConfirm}
          className="w-32 py-2.5 bg-zinc-700 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          {t('popup.confirm')}
        </button>
      </div>
    </div>
  );
}

