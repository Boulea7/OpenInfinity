/**
 * Shared icon types for popup and newtab
 */

export type IconType = 'text' | 'favicon' | 'custom';

/**
 * Icon draft represents the in-progress state of an icon being edited
 */
export type IconDraft =
  | { type: 'text'; value: string; color: string; dataUrl?: string }
  | { type: 'favicon'; value: string }
  | { type: 'custom'; value: string };

/**
 * Text icon configuration
 */
export interface TextIconConfig {
  text: string;
  color: string;
  fontSize: number;
  isManuallyEdited: boolean;
}

/**
 * Favicon candidate from various sources
 */
export interface FaviconCandidate {
  source: string;
  url: string;
  dataUrl?: string;
  status: 'pending' | 'loading' | 'success' | 'error';
}

/**
 * Preset colors for text icons
 */
export const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
] as const;
