import { Plus, Check, Globe, Lock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { IconType, IconDraft, TextIconConfig, FaviconCandidate } from './types';
import { PRESET_COLORS } from './types';
import TextIconEditor from './TextIconEditor';

interface Props {
  // Current selected type
  type: IconType;
  onTypeChange: (type: IconType) => void;

  // Website info for text icon defaults
  websiteName?: string;

  // Favicon candidates (fetched by container)
  faviconCandidates?: FaviconCandidate[];

  // Current icon data
  value: IconDraft | null;
  onChange: (draft: IconDraft | null) => void;

  // Text icon configuration (lifted state from TextIconEditor)
  textConfig: TextIconConfig;
  onTextConfigChange: (config: TextIconConfig) => void;

  // Generated text icon preview URL
  textIconPreviewUrl: string | null;

  // Request to open image editor (for custom upload or favicon crop)
  onEditRequest?: (imageUrl: string, type: IconType) => void;

  // Optional async gate (e.g., request permissions) before selecting a type.
  // Return false to cancel the selection.
  onBeforeSelectType?: (type: IconType) => boolean | Promise<boolean>;

  // File input ref for custom upload
  fileInputRef?: React.RefObject<HTMLInputElement>;

  // Optional: hide favicon option if no valid favicon
  hideFaviconOption?: boolean;
}

/**
 * IconTypeSelectorShared - Pure UI component for icon type selection
 *
 * This is a "headless" component that receives all state via props.
 * Container components (popup/newtab) handle the business logic.
 */
export default function IconTypeSelectorShared({
  type,
  onTypeChange,
  websiteName,
  faviconCandidates = [],
  value,
  onChange,
  textConfig,
  onTextConfigChange,
  textIconPreviewUrl,
  onEditRequest,
  onBeforeSelectType,
  fileInputRef,
  hideFaviconOption = false,
}: Props) {
  const { t } = useTranslation();
  const validFavicon = faviconCandidates.find((s) => s.status === 'success');

  const getFaviconUiState = (): 'locked' | 'loading' | 'error' | 'ready' => {
    if (validFavicon?.dataUrl) return 'ready';
    if (!faviconCandidates.length) return 'locked';
    if (faviconCandidates.some((c) => c.status === 'loading' || c.status === 'pending')) return 'loading';
    if (faviconCandidates.some((c) => c.status === 'error')) return 'error';
    return 'locked';
  };

  const faviconUiState = getFaviconUiState();

  const handleTextSelect = async () => {
    const ok = await (onBeforeSelectType?.('text') ?? true);
    if (!ok) return;
    onTypeChange('text');
    if (textIconPreviewUrl && textConfig.text) {
      onChange({
        type: 'text',
        value: textConfig.text,
        color: textConfig.color,
        dataUrl: textIconPreviewUrl,
      });
    }
  };

  const handleFaviconSelect = async () => {
    const ok = await (onBeforeSelectType?.('favicon') ?? true);
    if (!ok) return;
    onTypeChange('favicon');
    if (!validFavicon?.dataUrl) return;
    onChange({ type: 'favicon', value: validFavicon.dataUrl });
    onEditRequest?.(validFavicon.dataUrl, 'favicon');
  };

  const handleCustomClick = async () => {
    const ok = await (onBeforeSelectType?.('custom') ?? true);
    if (!ok) return;
    onTypeChange('custom');
    fileInputRef?.current?.click();
  };

  // Show favicon option if not hidden (even if locked/loading) so user can grant permissions.
  const showFaviconOption = !hideFaviconOption;

  return (
    <div className="space-y-4">
      {/* Icon Type Selection Cards */}
      <div className="flex items-start justify-start gap-6 px-2">
        {/* Card 1: Text Icon */}
        <button
          type="button"
          onClick={handleTextSelect}
          className="group relative flex flex-col items-center gap-2 transition-all"
        >
          <div
            className="w-14 h-14 rounded-[14px] flex items-center justify-center text-xl font-bold text-white shadow-sm overflow-hidden bg-cover bg-center transition-transform active:scale-95"
            style={{
              background: textConfig.color || PRESET_COLORS[0],
              backgroundImage: textIconPreviewUrl ? `url(${textIconPreviewUrl})` : undefined,
            }}
          >
            {/* Show fallback text only if no preview URL */}
            {!textIconPreviewUrl && (textConfig.text || (websiteName || '').slice(0, 2) || 'Go')}
          </div>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('iconTypeSelector.textIcon')}</span>
          {type === 'text' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-orange-500 rounded-full flex items-center justify-center shadow-sm border border-white dark:border-zinc-900">
              <Check size={10} className="text-white" />
            </div>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-16 bg-zinc-100 dark:bg-zinc-800" />

        {/* Card 2: Website Icon (Favicon) - Only shown if valid */}
        {showFaviconOption && (
          <>
            <button
              type="button"
              onClick={handleFaviconSelect}
              className="group relative flex flex-col items-center gap-2 transition-all"
            >
              <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-gray-50 dark:bg-zinc-800 shadow-sm p-2 transition-transform active:scale-95">
                {validFavicon?.dataUrl ? (
                  <img
                    src={validFavicon.dataUrl}
                    alt="Favicon"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    {faviconUiState === 'loading' ? (
                      <Globe className="w-5 h-5 text-zinc-400 animate-spin" />
                    ) : faviconUiState === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('iconTypeSelector.faviconIcon')}</span>
              {type === 'favicon' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-orange-500 rounded-full flex items-center justify-center shadow-sm border border-white dark:border-zinc-900">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </button>
            <div className="w-px h-16 bg-zinc-100 dark:bg-zinc-800" />
          </>
        )}

        {/* Card 3: Custom/Upload */}
        <button
          type="button"
          onClick={handleCustomClick}
          className="group relative flex flex-col items-center gap-2 transition-all"
        >
          <div
            className={`
            w-14 h-14 rounded-[14px] flex items-center justify-center transition-all overflow-hidden border-2 border-dashed active:scale-95
            ${
              type === 'custom'
                ? 'border-brand-orange-500 bg-brand-orange-50 dark:bg-brand-orange-900/20 text-brand-orange-500'
                : 'border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-300 group-hover:border-zinc-300 group-hover:text-zinc-400'
            }
          `}
          >
            {type === 'custom' && value?.type === 'custom' && value.value ? (
              <img src={value.value} className="w-full h-full object-cover" alt="Custom icon" />
            ) : (
              <Plus size={20} />
            )}
          </div>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('iconTypeSelector.customIcon')}</span>
        </button>
      </div>

      {/* Editor Section */}
      <div className="pt-1 animate-fade-in">
        {type === 'text' && (
          <div className="bg-zinc-50/50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100/50 dark:border-zinc-700/50">
            <TextIconEditor config={textConfig} onChange={onTextConfigChange} />
          </div>
        )}

        {type === 'custom' && (
          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 py-2">
            {t('iconTypeSelector.reuploadHint')}
          </div>
        )}
      </div>
    </div>
  );
}
