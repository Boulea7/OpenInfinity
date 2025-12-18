/**
 * Import Bookmarks Button Component
 * Provides UI for importing Chrome bookmarks with progress tracking
 */

import { BookmarkPlus, CheckCircle, Loader2 } from 'lucide-react';
import { useBookmarkImport } from '../../hooks/useBookmarkImport';
import { cn } from '../../utils';

/**
 * Button component for importing Chrome bookmarks
 * Shows different states: idle, importing, success, error
 */
export function ImportBookmarksButton() {
  const { isImporting, progress, result, error, startImport, resetError } = useBookmarkImport();

  // Show progress during import
  if (isImporting && progress) {
    const percentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400 truncate">{progress.current}</span>
          <span className="text-zinc-500 font-mono">
            {progress.processed}/{progress.total}
          </span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand-orange-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
      </div>
    );
  }

  // Show result after import
  if (result) {
    return (
      <div
        className={cn(
          'p-4 rounded-lg border',
          result.success
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        )}
      >
        <div className="flex items-start gap-3">
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
          ) : (
            <div className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5">✕</div>
          )}
          <div className="flex-1">
            <p className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">
              {result.success ? 'Import Completed' : 'Import Failed'}
            </p>
            <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
              <li>Imported: {result.imported} bookmarks</li>
              <li>Duplicates skipped: {result.duplicates}</li>
              <li>Duration: {(result.duration / 1000).toFixed(1)}s</li>
            </ul>
            {result.errors.length > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Error: {result.errors[0]}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error if any
  if (error) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={() => {
            resetError();
            startImport();
          }}
          className={cn(
            'w-full px-4 py-2 rounded-lg',
            'bg-brand-orange-500 text-white font-medium',
            'hover:bg-brand-orange-600',
            'transition-all duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          <BookmarkPlus className="w-5 h-5" />
          Retry Import
        </button>
      </div>
    );
  }

  // Default: idle state button
  return (
    <button
      onClick={startImport}
      disabled={isImporting}
      className={cn(
        'w-full px-4 py-2 rounded-lg',
        'bg-brand-orange-500 text-white font-medium',
        'hover:bg-brand-orange-600 active:bg-brand-orange-700',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        'flex items-center justify-center gap-2',
        'shadow-lg shadow-brand-orange-500/20'
      )}
    >
      {isImporting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Importing...
        </>
      ) : (
        <>
          <BookmarkPlus className="w-5 h-5" />
          Import from Chrome Bookmarks
        </>
      )}
    </button>
  );
}
