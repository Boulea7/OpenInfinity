import TurndownService from 'turndown';

/**
 * HTML to Markdown converter for data migration
 */
const turndownService = new TurndownService({
  headingStyle: 'atx', // Use # ## ### for headings
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});

/**
 * Convert HTML content to Markdown
 * Used for migrating TipTap HTML data to CodeMirror Markdown
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html.trim() === '' || html === '<p></p>') {
    return '';
  }

  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error('Failed to convert HTML to Markdown:', error);
    // Fallback: strip HTML tags by parsing as HTML and extracting text
    const tmp = document.createElement('div');
    tmp.innerHTML = html; // Parse HTML
    return tmp.textContent || ''; // Extract text content (strips tags)
  }
}

/**
 * Check if content is HTML format (for migration detection)
 */
export function isHtmlContent(content: string): boolean {
  if (!content) return false;
  return content.trim().startsWith('<') || content.includes('</');
}
