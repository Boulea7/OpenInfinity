interface TextIconParams {
  text: string;
  color: string;
  fontSize: number;
  size?: number;
}

/**
 * Generate text-based icon using Canvas API
 * Creates a rounded square with text overlay
 */
export async function generateTextIcon(params: TextIconParams): Promise<string> {
  const { text, color, fontSize, size = 128 } = params;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw rounded background
  ctx.fillStyle = color;
  const radius = size * 0.2;  // 20% border radius
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Draw text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);

  return canvas.toDataURL('image/png');
}
