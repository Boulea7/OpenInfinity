import { useEffect, useState } from 'react';
import { sendMessage } from '../utils/messaging';

interface TabInfo {
  url: string;
  title: string;
  favIconUrl: string;
}

// Pending icon data expires after 30 seconds
const PENDING_EXPIRY_MS = 30 * 1000;

export function useCurrentTab() {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTabInfo() {
      try {
        // First check for pending add icon (from context menu or keyboard shortcut)
        const pendingResponse = await sendMessage({ type: 'GET_PENDING_ADD_ICON' });

        if (pendingResponse.success && pendingResponse.data) {
          const pending = pendingResponse.data;
          const isExpired = Date.now() - pending.timestamp > PENDING_EXPIRY_MS;

          if (!isExpired && pending.url) {
            // Use pending data and clear it
            setTabInfo({
              url: pending.url,
              title: pending.title || '',
              favIconUrl: '', // Will be fetched by the form if needed
            });
            await sendMessage({ type: 'CLEAR_PENDING_ADD_ICON' });
            return;
          }

          // Clear expired pending data
          await sendMessage({ type: 'CLEAR_PENDING_ADD_ICON' });
        }

        // Fall back to current active tab
        const tabResponse = await sendMessage({ type: 'GET_CURRENT_TAB' });
        if (tabResponse.success) {
          setTabInfo(tabResponse.data);
        }
      } catch (error) {
        console.error('Failed to load tab info:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTabInfo();
  }, []);

  return { tabInfo, isLoading };
}
