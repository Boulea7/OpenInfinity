import { useTranslation } from 'react-i18next';
import type { IconDraft } from '../types/iconDraft';

interface Props {
  title: string;
  icon: IconDraft | null;
}

export default function IconPreview({ title, icon }: Props) {
  const { t } = useTranslation();

  if (!icon) {
    return (
      <div className="border rounded-lg p-4 text-center bg-gray-50">
        <p className="text-sm text-gray-400">{t('popup.selectType')}</p>
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
      <p className="text-sm text-gray-500 mb-2">{t('popup.preview')}</p>
      <div className="flex flex-col items-center gap-2">
        {imageSrc && (
          <img
            src={imageSrc}
            alt={title}
            className="w-16 h-16 rounded-xl object-cover"
          />
        )}
        <p className="text-sm font-medium">{title || t('popup.unnamed')}</p>
      </div>
    </div>
  );
}
