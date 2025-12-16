import { useEffect, useState } from 'react';

interface FaviconSource {
  provider: 'google' | 'duckduckgo';
  url: string;
  status: 'loading' | 'success' | 'error';
  dataUrl?: string;
}

export function useFaviconFetch(url: string) {
  const [sources, setSources] = useState<FaviconSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setSources([]);
      setIsLoading(false);
      return;
    }

    // Reset state when URL changes
    setIsLoading(true);
    setSources([]);

    const domain = extractDomain(url);
    const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    const duckUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

    Promise.allSettled([
      loadImageAsDataUrl(googleUrl),
      loadImageAsDataUrl(duckUrl),
    ]).then(([googleResult, duckResult]) => {
      setSources([
        {
          provider: 'google',
          url: googleUrl,
          status: googleResult.status === 'fulfilled' ? 'success' : 'error',
          dataUrl: googleResult.status === 'fulfilled' ? googleResult.value : undefined,
        },
        {
          provider: 'duckduckgo',
          url: duckUrl,
          status: duckResult.status === 'fulfilled' ? 'success' : 'error',
          dataUrl: duckResult.status === 'fulfilled' ? duckResult.value : undefined,
        },
      ]);
      setIsLoading(false);
    });
  }, [url]);

  return { sources, isLoading };
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Load image as data URL (avoid CORS issues)
 * Added timeout and error handling to prevent promise hanging
 */
function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      img.src = '';  // Cancel loading
      reject(new Error('Favicon loading timeout'));
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Canvas conversion failed'));
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load favicon'));
    };

    img.src = url;
  });
}
