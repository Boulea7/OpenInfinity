/**
 * Note-related utility functions
 * Shared helpers for note processing and display
 */

/**
 * Extract title from note content (first line, cleaned of markdown headers)
 */
export function extractNoteTitle(content: string, fallback = 'Untitled'): string {
  if (!content?.trim()) return fallback;
  const firstLine = content.split('\n')[0];
  return firstLine.replace(/^#+\s*/, '').trim() || fallback;
}

/**
 * Generate a preview snippet from note content
 * Removes markdown headers and limits length
 */
export function extractNotePreview(content: string, maxLength = 100): string {
  if (!content?.trim()) return '';

  // Remove first line (title) and markdown syntax
  const lines = content.split('\n').slice(1);
  const cleanContent = lines
    .map(line => line.replace(/^#+\s*/, '').replace(/[*_~`]/g, ''))
    .join(' ')
    .trim();

  if (cleanContent.length <= maxLength) return cleanContent;
  return cleanContent.substring(0, maxLength).trim() + '...';
}

/**
 * Format note date for display
 */
export function formatNoteDate(timestamp: number, locale = 'zh-CN'): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}
