import { useRef, useState, useEffect } from 'react';
import { IconTypeSelectorShared, PRESET_COLORS } from '../../shared/icon';
import type { IconType, IconDraft, TextIconConfig, FaviconCandidate } from '../../shared/icon';
import { useFaviconFetch } from '../hooks/useFaviconFetch';
import { generateTextIcon } from '../utils/iconGenerator';
import { ensureFeaturePermissions, hasOrigins, PERMISSION_GROUPS } from '../../shared/permissions';

interface Props {
  type: IconType;
  onTypeChange: (type: IconType) => void;
  url: string;
  websiteName?: string;
  iconData?: IconDraft | null;
  onIconChange: (iconData: IconDraft | null) => void;
  onEditRequest: (imageUrl: string, iconType: IconType) => void;
}

/**
 * IconTypeSelectorContainer - Popup-specific container
 *
 * Handles:
 * - Favicon fetching via useFaviconFetch hook
 * - Text icon generation
 * - File upload handling
 * - Crop editor integration
 */
export default function IconTypeSelectorContainer({
  type,
  onTypeChange,
  url,
  websiteName,
  iconData,
  onIconChange,
  onEditRequest,
}: Props) {
  const [hasFaviconOrigins, setHasFaviconOrigins] = useState(false);
  const effectiveUrl = hasFaviconOrigins ? url : '';
  const { sources } = useFaviconFetch(effectiveUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoOpenedFaviconRef = useRef<string | null>(null);

  // State for text icon configuration
  const [textConfig, setTextConfig] = useState<TextIconConfig>({
    text: '',
    color: PRESET_COLORS[0],
    fontSize: 80,
    isManuallyEdited: false,
  });

  // Generated text icon preview URL
  const [textIconPreviewUrl, setTextIconPreviewUrl] = useState<string | null>(null);
  const generationIdRef = useRef(0);

  // Sync text with websiteName changes if not manually edited
  useEffect(() => {
    if (!textConfig.isManuallyEdited && websiteName !== undefined) {
      const extracted = websiteName.slice(0, 2);
      setTextConfig((prev) => ({ ...prev, text: extracted }));
    }
  }, [websiteName, textConfig.isManuallyEdited]);

  // Generate text icon whenever config changes
  useEffect(() => {
    if (!textConfig.text) {
      if (type === 'text') {
        setTextIconPreviewUrl(null);
        onIconChange(null);
      }
      return;
    }

    const currentId = ++generationIdRef.current;
    let cancelled = false;

    generateTextIcon({
      text: textConfig.text,
      color: textConfig.color,
      fontSize: textConfig.fontSize,
    })
      .then((dataUrl) => {
        if (cancelled) return;
        if (currentId === generationIdRef.current) {
          setTextIconPreviewUrl(dataUrl);
          if (type === 'text') {
            onIconChange({
              type: 'text',
              value: textConfig.text,
              color: textConfig.color,
              dataUrl,
            });
          }
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to generate text icon:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [textConfig.text, textConfig.fontSize, textConfig.color, type, onIconChange]);

  // Re-emit data when switching TO text type if we have valid data
  useEffect(() => {
    if (type === 'text' && textIconPreviewUrl && textConfig.text) {
      onIconChange({
        type: 'text',
        value: textConfig.text,
        color: textConfig.color,
        dataUrl: textIconPreviewUrl,
      });
    }
  }, [type, textIconPreviewUrl, textConfig, onIconChange]);

  // Convert favicon sources to candidates format
  const faviconCandidates: FaviconCandidate[] = sources.map((s) => ({
    source: s.provider,
    url: s.url,
    dataUrl: s.dataUrl,
    status: s.status,
  }));

  // Auto-open crop editor once favicon becomes available after permission is granted.
  // This preserves the "click favicon -> edit" flow without requiring a second click.
  useEffect(() => {
    if (type !== 'favicon') {
      autoOpenedFaviconRef.current = null;
      return;
    }

    const valid = faviconCandidates.find((c) => c.status === 'success' && c.dataUrl);
    if (!valid?.dataUrl) return;

    if (autoOpenedFaviconRef.current === valid.dataUrl) return;
    autoOpenedFaviconRef.current = valid.dataUrl;

    onEditRequest(valid.dataUrl, 'favicon');
  }, [type, faviconCandidates, onEditRequest]);

  // Check existing host permissions once (and whenever url changes)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await hasOrigins(PERMISSION_GROUPS.favicon);
      if (cancelled) return;
      setHasFaviconOrigins(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过 2MB');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        onEditRequest(imageUrl, 'custom');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <>
      <IconTypeSelectorShared
        type={type}
        onTypeChange={onTypeChange}
        websiteName={websiteName}
        faviconCandidates={faviconCandidates}
        value={iconData || null}
        onChange={onIconChange}
        textConfig={textConfig}
        onTextConfigChange={setTextConfig}
        textIconPreviewUrl={textIconPreviewUrl}
        onEditRequest={onEditRequest}
        onBeforeSelectType={async (nextType) => {
          if (nextType !== 'favicon') return true;
          const granted = await ensureFeaturePermissions([], PERMISSION_GROUPS.favicon);
          setHasFaviconOrigins(granted);
          return granted;
        }}
        fileInputRef={fileInputRef}
      />

      {/* Hidden file input for custom upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
