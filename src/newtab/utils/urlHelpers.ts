/**
 * URL Helper Functions
 * Safely handle URL parsing and normalization
 */

/**
 * Safely parse and normalize a URL
 * Handles cases like:
 * - "example.com" -> "https://example.com"
 * - "http://example.com" -> "http://example.com"
 * - "https://example.com" -> "https://example.com"
 * - Invalid URLs -> null
 */
export function safeParseUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Try to parse as-is first
    const parsedUrl = new URL(url);
    return parsedUrl.href;
  } catch {
    // If it fails, try adding https://
    try {
      const withProtocol = url.startsWith('http') ? url : `https://${url}`;
      const parsedUrl = new URL(withProtocol);
      return parsedUrl.href;
    } catch {
      return null;
    }
  }
}

/**
 * Extract domain from URL
 * Returns hostname without www prefix
 * Example: "https://www.example.com/path" -> "example.com"
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    let hostname = parsedUrl.hostname;

    // Remove www prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    return hostname;
  } catch {
    // Fallback: simple extraction
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\?#]+)/);
    return match ? match[1] : url;
  }
}

/**
 * Normalize URL for consistency
 * - Adds https:// if missing
 * - Removes trailing slash
 * - Lowercases hostname
 */
export function normalizeUrl(url: string): string {
  const parsed = safeParseUrl(url);
  if (!parsed) return url;

  try {
    const urlObj = new URL(parsed);
    urlObj.hostname = urlObj.hostname.toLowerCase();

    let result = urlObj.href;

    // Remove trailing slash (unless it's just the protocol + domain)
    if (result.endsWith('/') && result.split('/').length > 3) {
      result = result.slice(0, -1);
    }

    return result;
  } catch {
    return url;
  }
}

/**
 * Get favicon URL for a website
 * Uses DuckDuckGo's icon service
 */
export function getFaviconUrl(url: string): string {
  const domain = extractDomain(url);
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  return safeParseUrl(url) !== null;
}
