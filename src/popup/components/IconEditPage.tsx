import { useState, useRef } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

interface Props {
  imageUrl: string;
  onConfirm: (croppedImageData: string, backgroundColor: string) => void;
  onCancel: () => void;
}

export default function IconEditPage({ imageUrl, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [backgroundColor, setBackgroundColor] = useState(PRESET_COLORS[0]);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleConfirm = async () => {
    if (!imgRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 128;
      canvas.height = 128;

      // Calculate crop dimensions
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      const pixelCrop = {
        x: crop.x * scaleX,
        y: crop.y * scaleY,
        width: crop.width * scaleX,
        height: crop.height * scaleY,
      };

      // Draw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, 128, 128);

      // Draw cropped image centered
      ctx.drawImage(
        imgRef.current,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        128,
        128
      );

      const croppedImageData = canvas.toDataURL('image/png');
      onConfirm(croppedImageData, backgroundColor);
    } catch (error) {
      console.error('Failed to crop image:', error);
      alert('裁切失败，请重试');
    }
  };

  const handleReset = () => {
    setCrop({
      unit: '%',
      width: 80,
      height: 80,
      x: 10,
      y: 10,
    });
    setBackgroundColor(PRESET_COLORS[0]);
  };

  return (
    <div className="w-[600px] min-h-[500px] p-4 bg-white">
      <h2 className="text-xl font-semibold mb-4">自定义图标</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Left: Crop area */}
        <div>
          <h3 className="text-sm font-medium mb-2">裁切区域</h3>
          <div className="border rounded-lg overflow-hidden">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={1}  // Square crop
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Edit"
                style={{ maxWidth: '100%' }}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <h3 className="text-sm font-medium mb-2">预览</h3>
          <div className="border rounded-lg p-4 flex items-center justify-center" style={{ backgroundColor }}>
            <div className="w-24 h-24 flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-w-full max-h-full rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Background color selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">背景颜色</label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setBackgroundColor(c)}
              className="w-10 h-10 rounded-lg border-2 transition-all"
              style={{
                backgroundColor: c,
                borderColor: backgroundColor === c ? '#000' : '#ccc',
              }}
            />
          ))}
          <label
            className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            title="自定义颜色"
          >
            🎨
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          重置
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          确定
        </button>
      </div>
    </div>
  );
}
