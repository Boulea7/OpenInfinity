import { useEffect, useState } from 'react';
import { sendMessage } from '../utils/messaging';

interface TabInfo {
  url: string;
  title: string;
  favIconUrl: string;
}

export function useCurrentTab() {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    sendMessage({ type: 'GET_CURRENT_TAB' })
      .then((response) => {
        if (response.success) {
          setTabInfo(response.data);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { tabInfo, isLoading };
}
