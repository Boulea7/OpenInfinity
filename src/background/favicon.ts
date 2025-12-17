/**
 * Fetch favicon through Background Service Worker
 * Avoids CORS issues by fetching in background context
 */
export async function fetchFaviconAsDataUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch favicon');
  }
}
