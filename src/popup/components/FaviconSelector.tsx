import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFaviconFetch } from '../hooks/useFaviconFetch';
import type { IconDraft } from '../types/iconDraft';

type FaviconSource = {
  provider: 'google' | 'duckduckgo';
  status: 'loading' | 'success' | 'error';
  dataUrl?: string;
};

interface Props {
  url: string;
  onSelect: (iconData: IconDraft) => void;
}

export default function FaviconSelector({ url, onSelect }: Props) {
  const { t } = useTranslation();
  const { sources, isLoading } = useFaviconFetch(url);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (source: FaviconSource) => {
    // Only allow selection if source is valid
    if (source.status !== 'success' || !source.dataUrl) return;
    setSelected(source.provider);
    onSelect({
      type: 'favicon',
      value: source.dataUrl,
    });
  };

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">{t('popup.fetchingIcon')}</div>;
  }

  const hasValidSource = sources.some((s) => s.status === 'success' && !!s.dataUrl);

  if (!hasValidSource) {
    return (
      <div className="text-center py-4 text-gray-500">
        {t('popup.noIconAvailable')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {sources.map((source) => (
        <button
          key={source.provider}
          type="button"
          onClick={() => handleSelect(source)}
          disabled={source.status === 'error'}
          className={`
            p-4 border-2 rounded-lg transition-all
            ${selected === source.provider ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            ${source.status === 'error' ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
          `}
        >
          {source.status === 'success' && source.dataUrl && (
            <img
              src={source.dataUrl}
              alt={source.provider}
              className="w-12 h-12 mx-auto mb-2"
            />
          )}
          {source.status === 'error' && (
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded flex items-center justify-center text-gray-400">
              ✕
            </div>
          )}
          <p className="text-xs text-center capitalize">
            {source.provider === 'google' ? 'Google' : 'DuckDuckGo'}
          </p>
        </button>
      ))}
    </div>
  );
}
