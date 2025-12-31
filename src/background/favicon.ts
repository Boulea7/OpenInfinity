/**
 * Fetch favicon through Background Service Worker
 * Avoids CORS issues by fetching in background context
 */

// Security constants
const FAVICON_TIMEOUT_MS = 10000; // 10 seconds
const FAVICON_MAX_SIZE_BYTES = 512 * 1024; // 512 KB
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

// Allowlist for favicon fetch targets (defense-in-depth)
const ALLOWED_HOSTS = new Set(['icons.duckduckgo.com', 'www.google.com']);
const ALLOWED_HOST_SUFFIXES = ['.gstatic.com'];

// SSRF protection: blocked hosts and private IP ranges
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];
const PRIVATE_IP_RANGES = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^169\.254\./, // 169.254.0.0/16 (link-local)
];

function isAllowedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(lower)) return true;
  return ALLOWED_HOST_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

// IPv6 private address patterns for SSRF protection
const IPV6_PRIVATE_PATTERNS = [
  /^::1$/i, // loopback
  /^fe80:/i, // link-local
  /^fc00:/i, // unique local
  /^fd[0-9a-f]{2}:/i, // unique local
  /^::ffff:(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/i, // IPv4-mapped private
];

/**
 * Check if hostname is a private/internal IP address
 */
function isPrivateHost(hostname: string): boolean {
  // Normalize hostname (remove brackets from IPv6)
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  // Check blocked hosts list
  if (BLOCKED_HOSTS.includes(normalized)) {
    return true;
  }

  // Check IPv4 private IP ranges
  for (const pattern of PRIVATE_IP_RANGES) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  // Check IPv6 private address patterns
  for (const pattern of IPV6_PRIVATE_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate URL to prevent SSRF and malicious requests
 */
function isValidFaviconUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Reject URLs with embedded credentials (user:pass@host)
    if (url.username || url.password) {
      console.warn('[Favicon] URL contains credentials, rejecting');
      return false;
    }

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return false;
    }

    // Check for private/internal hosts (SSRF protection)
    if (isPrivateHost(url.hostname)) {
      return false;
    }

    // Restrict to a small, known allowlist (prevents abuse even if host permissions expand)
    if (!isAllowedHost(url.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function fetchFaviconAsDataUrl(url: string): Promise<string> {
  // Validate URL format and protocol
  if (!isValidFaviconUrl(url)) {
    throw new Error('Invalid favicon URL: must be http or https');
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FAVICON_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
    if (contentType && !contentType.startsWith('image/')) {
      throw new Error(`Invalid content-type for favicon: ${contentType}`);
    }

    // Check Content-Length header if available
    const contentLength = response.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength, 10) > FAVICON_MAX_SIZE_BYTES) {
      throw new Error(`Favicon too large: ${contentLength} bytes (max ${FAVICON_MAX_SIZE_BYTES})`);
    }

    const blob = await response.blob();

    // Double-check actual blob size (Content-Length may be missing or incorrect)
    if (blob.size > FAVICON_MAX_SIZE_BYTES) {
      throw new Error(`Favicon too large: ${blob.size} bytes (max ${FAVICON_MAX_SIZE_BYTES})`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error(`Favicon fetch timeout after ${FAVICON_TIMEOUT_MS}ms`);
    }
    throw error instanceof Error ? error : new Error('Failed to fetch favicon');
  }
}
