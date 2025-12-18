/**
 * Hook for Chrome bookmarks import functionality
 * Manages import state and provides easy-to-use interface
 */

import { useState, useCallback } from 'react';
import {
  importBookmarks,
  type ImportProgress,
  type ImportResult,
} from '../services/bookmarkImport';

export interface UseBookmarkImportReturn {
  isImporting: boolean;
  progress: ImportProgress | null;
  result: ImportResult | null;
  error: string | null;
  startImport: () => Promise<void>;
  resetError: () => void;
}

/**
 * Custom hook for importing Chrome bookmarks
 * @returns Import state and control functions
 */
export function useBookmarkImport(): UseBookmarkImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startImport = useCallback(async () => {
    setIsImporting(true);
    setProgress(null);
    setResult(null);
    setError(null);

    try {
      const importResult = await importBookmarks(
        {
          maxIcons: 500,
          deduplicateByUrl: true,
        },
        (p) => setProgress(p)
      );

      setResult(importResult);

      if (!importResult.success) {
        setError(importResult.errors[0] || 'Import failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setResult({
        success: false,
        imported: 0,
        duplicates: 0,
        errors: [errorMessage],
        duration: 0,
      });
    } finally {
      setIsImporting(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isImporting,
    progress,
    result,
    error,
    startImport,
    resetError,
  };
}
