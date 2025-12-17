import { useEffect, useState } from 'react';
import { sendMessage } from '../utils/messaging';

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

    // Only use DuckDuckGo (Google has CORS issues)
    const duckUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

    sendMessage({ type: 'FETCH_FAVICON', payload: { url: duckUrl } }).then((response) => {
      if (response.success) {
        setSources([
          {
            provider: 'duckduckgo',
            url: duckUrl,
            status: 'success',
            dataUrl: response.data,
          },
        ]);
      } else {
        setSources([
          {
            provider: 'duckduckgo',
            url: duckUrl,
            status: 'error',
          },
        ]);
      }
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
