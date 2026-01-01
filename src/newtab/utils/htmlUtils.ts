import DOMPurify from 'dompurify';

/**
 * Check if content is HTML format (lightweight detection)
 */
function isHtmlContent(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return trimmed.startsWith('<') || trimmed.includes('</');
}

/**
 * Safely strip HTML tags and return plain text
 * Uses DOMPurify ONLY for HTML content (performance optimized)
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  // Fast path: Markdown/plain text - no sanitization needed
  if (!isHtmlContent(html)) {
    return html
      .replace(/[#*_~`[\]()]/g, '')  // Remove Markdown syntax
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Slow path: HTML content - use DOMPurify for safety
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Convert TipTap HTML content to plain text for preview
 */
export function htmlToPlainText(html: string): string {
  return stripHtml(html);
}
