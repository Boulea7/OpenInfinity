import type { IconDraft } from '../types/iconDraft';

interface Props {
  title: string;
  icon: IconDraft | null;
}

export default function IconPreview({ title, icon }: Props) {
  if (!icon) {
    return (
      <div className="border rounded-lg p-4 text-center bg-gray-50">
        <p className="text-sm text-gray-400">请选择图标类型</p>
      </div>
    );
  }

  // Get image source based on icon type
  const getImageSrc = (): string | undefined => {
    if (icon.type === 'text') {
      return icon.dataUrl ?? icon.value;
    }
    return icon.value;
  };

  const imageSrc = getImageSrc();

  return (
    <div className="border rounded-lg p-4 text-center bg-gray-50">
      <p className="text-sm text-gray-500 mb-2">预览</p>
      <div className="flex flex-col items-center gap-2">
        {imageSrc && (
          <img
            src={imageSrc}
            alt={title}
            className="w-16 h-16 rounded-xl object-cover"
          />
        )}
        <p className="text-sm font-medium">{title || '未命名'}</p>
      </div>
    </div>
  );
}
