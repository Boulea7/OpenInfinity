interface Props {
  title: string;
  icon: any;
}

export default function IconPreview({ title, icon }: Props) {
  if (!icon) {
    return (
      <div className="border rounded-lg p-4 text-center bg-gray-50">
        <p className="text-sm text-gray-400">请选择图标类型</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 text-center bg-gray-50">
      <p className="text-sm text-gray-500 mb-2">预览</p>
      <div className="flex flex-col items-center gap-2">
        {icon.type === 'text' && icon.dataUrl && (
          <img
            src={icon.dataUrl}
            alt={title}
            className="w-16 h-16 rounded-xl"
          />
        )}
        {(icon.type === 'favicon' || icon.type === 'custom') && icon.value && (
          <img
            src={icon.value}
            alt={title}
            className="w-16 h-16 rounded-xl object-cover"
          />
        )}
        <p className="text-sm font-medium">{title || '未命名'}</p>
      </div>
    </div>
  );
}
