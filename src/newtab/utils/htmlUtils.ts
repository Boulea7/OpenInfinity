import DOMPurify from 'dompurify';

/**
 * Safely strip HTML tags and return plain text
 * Uses DOMPurify to prevent XSS attacks
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  // Sanitize HTML first
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });

  // Remove extra whitespace and newlines
  return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Convert TipTap HTML content to plain text for preview
 */
export function htmlToPlainText(html: string): string {
  return stripHtml(html);
}
