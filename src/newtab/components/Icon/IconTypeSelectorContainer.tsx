import { useRef, useState, useEffect, useCallback } from 'react';
import { IconTypeSelectorShared, PRESET_COLORS } from '../../../shared/icon';
import type { IconType, IconDraft, TextIconConfig, FaviconCandidate } from '../../../shared/icon';

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
 * Simple canvas-based text icon generator for newtab
 * (Avoids importing the popup's version which may have additional dependencies)
 */
async function generateTextIcon(config: {
  text: string;
  color: string;
  fontSize: number;
}): Promise<string> {
  const { text, color, fontSize } = config;
  const size = 256;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);

  return canvas.toDataURL('image/png');
}

function buildGoogleFaviconUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return null;
  }
}

/**
 * IconTypeSelectorContainer - Newtab-specific container
 *
 * Simplified version that:
 * - Uses a simple favicon fetcher (no multi-source)
 * - Generates text icons locally
 * - Accepts custom uploads directly (no crop editor)
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Favicon state (simple single-source)
  const [faviconCandidates, setFaviconCandidates] = useState<FaviconCandidate[]>([]);

  // Fetch favicon when URL changes
  useEffect(() => {
    if (!url) {
      setFaviconCandidates([]);
      return;
    }
    const faviconUrl = buildGoogleFaviconUrl(url);
    if (!faviconUrl) {
      setFaviconCandidates([]);
      return;
    }
    // Use URL directly (no fetch) to avoid requiring host permissions just for preview.
    setFaviconCandidates([{ source: 'google', url: faviconUrl, dataUrl: faviconUrl, status: 'success' }]);
  }, [url]);

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

  // Handle file upload (simplified - direct accept)
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
          // In newtab, we directly accept the image without cropping
          onTypeChange('custom');
          onIconChange({ type: 'custom', value: imageUrl });
          // Still call onEditRequest for any additional handling
          onEditRequest(imageUrl, 'custom');
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    },
    [onTypeChange, onIconChange, onEditRequest]
  );

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
