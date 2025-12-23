/**
 * Fetch favicon through Background Service Worker
 * Avoids CORS issues by fetching in background context
 */

// Security constants
const FAVICON_TIMEOUT_MS = 10000; // 10 seconds
const FAVICON_MAX_SIZE_BYTES = 512 * 1024; // 512 KB
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Validate URL to prevent SSRF and malicious requests
 */
function isValidFaviconUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ALLOWED_PROTOCOLS.includes(url.protocol);
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
