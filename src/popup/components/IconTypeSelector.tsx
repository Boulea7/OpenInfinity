import TextIconEditor from './TextIconEditor';
import FaviconSelector from './FaviconSelector';

type IconType = 'text' | 'favicon' | 'upload';

interface Props {
  type: IconType;
  onTypeChange: (type: IconType) => void;
  url: string;
  onIconChange: (iconData: any) => void;
}

export default function IconTypeSelector({
  type,
  onTypeChange,
  url,
  onIconChange,
}: Props) {
  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          type="button"
          onClick={() => onTypeChange('text')}
          className={`px-4 py-2 transition-colors ${
            type === 'text'
              ? 'border-b-2 border-blue-500 font-medium text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          纯色图标
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('favicon')}
          className={`px-4 py-2 transition-colors ${
            type === 'favicon'
              ? 'border-b-2 border-blue-500 font-medium text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          网站图标
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('upload')}
          className={`px-4 py-2 transition-colors ${
            type === 'upload'
              ? 'border-b-2 border-blue-500 font-medium text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          本地上传
        </button>
      </div>

      {/* Conditional rendering */}
      {type === 'text' && <TextIconEditor onIconChange={onIconChange} />}
      {type === 'favicon' && <FaviconSelector url={url} onSelect={onIconChange} />}
      {type === 'upload' && (
        <div>
          <label className="block text-sm font-medium mb-2">选择图片</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Check file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                  alert('图片大小不能超过 2MB');
                  return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                  onIconChange({
                    type: 'custom',
                    value: reader.result,
                  });
                };
                reader.readAsDataURL(file);
              }
            }}
            className="w-full px-3 py-2 border rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            支持 PNG、JPG、SVG 格式，最大 2MB
          </p>
        </div>
      )}
    </div>
  );
}
