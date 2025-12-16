import { useState } from 'react';
import { sendMessage } from '../utils/messaging';

export function useAddIcon() {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addIcon = async (iconData: any) => {
    setIsAdding(true);
    setError(null);

    try {
      const response = await sendMessage({
        type: 'ADD_ICON',
        payload: iconData,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to add icon');
      }

      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsAdding(false);
    }
  };

  return { addIcon, isAdding, error };
}
