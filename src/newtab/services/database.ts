/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗ ██████╗ ███████╗███╗   ██╗    ██╗███╗   ██╗███████╗██╗███╗   ██║
 * ║  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ██║████╗  ██║██╔════╝██║████╗  ██║
 * ║  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║
 * ║  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║
 * ║  ╚██████╔╝██║     ███████╗██║ ╚████║    ██║██║ ╚████║██║     ██║██║ ╚████║
 * ║   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══║
 * ║                                                                           ║
 * ║  OpenInfinity - Your Infinite New Tab Experience                          ║
 * ║                                                                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Copyright (c) 2024-2026 OpenInfinity Team. All rights reserved.          ║
 * ║  Licensed under the MIT License                                           ║
 * ║  GitHub: https://github.com/OpenInfinity/OpenInfinity                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Database Service
 *
 * IndexedDB-based persistence layer for the OpenInfinity Chrome extension.
 * Uses Dexie.js as a wrapper around IndexedDB for improved developer experience.
 *
 * Features:
 * - Automatic schema migrations with data normalization
 * - Type-safe table definitions with TypeScript generics
 * - Transaction management for data integrity
 * - Singleton pattern ensures single database connection
 *
 * Database Tables:
 * - icons: Website shortcuts with custom icons
 * - folders: Organizational folders for icons
 * - wallpapers: Background images with effects
 * - todos: Task management with priorities and tags
 * - notes: Markdown-based note storage
 * - settings: Key-value configuration store
 * - emailAccounts: Email notification integrations
 * - todoIntegrations: External todo service connections
 * - rssSubscriptions: RSS feed subscriptions
 * - rssItems: Cached RSS feed items
 * - notificationLogs: Notification history
 * - presetWebsites: Curated website recommendations
 * - userFavorites: User's favorite preset websites
 * - weatherCache: Cached weather API responses
 * - resourceCache: Cached external resources (icons, images)
 *
 * @module services/database
 * @see {@link https://dexie.org/} Dexie.js Documentation
 */
import Dexie, { type Table } from 'dexie';
import { tr } from '../../shared/tr';

// ============================================================================
// Data Normalization Helpers
// ============================================================================

/**
 * Type guard to validate position object structure.
 *
 * Ensures the position has valid finite x and y coordinates.
 * Used during schema migrations to handle corrupted or legacy data.
 *
 * @param p - Value to check for valid position structure
 * @returns True if p is a valid position with finite x and y coordinates
 *
 * @example
 * ```ts
 * isValidPosition({ x: 1, y: 2 }); // true
 * isValidPosition({ x: NaN, y: 2 }); // false
 * isValidPosition(null); // false
 * isValidPosition(5); // false (legacy number format)
 * ```
 */
function isValidPosition(p: any): p is { x: number; y: number } {
  return p && typeof p === 'object' && Number.isFinite(p.x) && Number.isFinite(p.y);
}

/**
 * Normalizes position data to a valid {x, y} object.
 *
 * Handles multiple input formats for backwards compatibility:
 * - Valid {x, y} object: returned as-is
 * - Legacy number format: converted to grid coordinates
 * - Invalid/null: generates position from fallback index
 *
 * @param pos - Position value to normalize (object, number, or invalid)
 * @param cols - Number of columns in the grid (for index conversion)
 * @param fallbackIndex - Index to use for position generation if pos is invalid
 * @returns Normalized position object with x and y coordinates
 *
 * @example
 * ```ts
 * // Valid position passes through
 * ensurePosition({ x: 2, y: 3 }, 6, 0); // { x: 2, y: 3 }
 *
 * // Legacy number format converted
 * ensurePosition(14, 6, 0); // { x: 2, y: 2 } (14 % 6 = 2, 14 / 6 = 2)
 *
 * // Invalid value uses fallback
 * ensurePosition(null, 6, 5); // { x: 5, y: 0 } (5 % 6 = 5, 5 / 6 = 0)
 * ```
 */
function ensurePosition(pos: any, cols: number, fallbackIndex: number): { x: number; y: number } {
  if (isValidPosition(pos)) return pos;
  if (typeof pos === 'number' && Number.isFinite(pos)) {
    return { x: pos % cols, y: Math.floor(pos / cols) };
  }
  // Fallback: use fallbackIndex as position
  return { x: fallbackIndex % cols, y: Math.floor(fallbackIndex / cols) };
}

/**
 * Type guard to validate icon object structure.
 *
 * Checks if the icon has the required type and value properties.
 * Used during migrations to validate icon data before processing.
 *
 * @param raw - Value to check for valid icon structure
 * @returns True if raw has valid type and value string properties
 *
 * @example
 * ```ts
 * isValidIcon({ type: 'favicon', value: 'https://example.com/icon.png' }); // true
 * isValidIcon({ type: 'text', value: 'A', color: '#3b82f6' }); // true
 * isValidIcon('https://example.com/icon.png'); // false (legacy string format)
 * isValidIcon(null); // false
 * ```
 */
function isValidIcon(raw: any): raw is { type: string; value: string; color?: string } {
  return (
    raw &&
    typeof raw === 'object' &&
    typeof raw.type === 'string' &&
    typeof raw.value === 'string'
  );
}

/**
 * Normalizes icon data to a valid Icon['icon'] structure.
 *
 * Handles multiple input formats for backwards compatibility:
 * - Valid structured icon: validated and returned
 * - Legacy string format: inferred from content (data URL, HTTP URL, or single char)
 * - Invalid/null: generates text icon from title's first character
 *
 * @param raw - Icon value to normalize (object, string, or invalid)
 * @param title - Title to use for fallback text icon generation
 * @returns Normalized icon object with type, value, and optional color
 *
 * @example
 * ```ts
 * // Valid structured icon passes through
 * ensureIcon({ type: 'favicon', value: 'https://...' }, 'Google');
 * // Returns: { type: 'favicon', value: 'https://...' }
 *
 * // Legacy data URL string converted to custom
 * ensureIcon('data:image/png;base64,...', 'My Icon');
 * // Returns: { type: 'custom', value: 'data:image/png;base64,...' }
 *
 * // Invalid value uses title fallback
 * ensureIcon(null, 'GitHub');
 * // Returns: { type: 'text', value: 'G', color: '#3b82f6' }
 * ```
 */
function ensureIcon(raw: any, title: string): Icon['icon'] {
  if (isValidIcon(raw)) {
    // Validate type is one of the allowed values
    const validTypes = ['system', 'custom', 'text', 'favicon'];
    if (validTypes.includes(raw.type)) {
      return raw as Icon['icon'];
    }
  }

  if (typeof raw === 'string') {
    // Legacy format - try to infer type
    if (raw.startsWith('data:image') || raw.startsWith('blob:')) {
      return { type: 'custom', value: raw };
    } else if (raw.startsWith('http')) {
      return { type: 'favicon', value: raw };
    } else if (raw.length === 1) {
      return { type: 'text', value: raw.toUpperCase(), color: '#3b82f6' };
    }
    // Default to favicon for other strings
    return { type: 'favicon', value: raw };
  }

  // Final fallback: text icon from title
  return {
    type: 'text',
    value: (title?.[0] || '?').toUpperCase(),
    color: '#3b82f6',
  };
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Unique identifiers for built-in system shortcuts.
 *
 * System icons are default shortcuts that come pre-installed with the extension.
 * They can be hidden but not permanently deleted, allowing users to restore them.
 *
 * @example
 * ```ts
 * const icon: Icon = {
 *   // ... other fields
 *   isSystemIcon: true,
 *   systemIconId: 'system-weather',
 * };
 * ```
 */
export type SystemIconId =
  | 'system-weather'
  | 'system-todo'
  | 'system-notes'
  | 'system-settings'
  | 'system-wallpaper'
  | 'system-openinfinity'
  | 'system-bookmarks'
  | 'system-history'
  | 'system-extensions';

/**
 * Website shortcut icon stored in the grid.
 *
 * Represents a clickable shortcut to a website or internal function.
 * Icons can be user-created or system-provided defaults.
 *
 * @property id - Unique identifier (UUID format)
 * @property type - Always 'icon' to distinguish from folders
 * @property url - Target URL or internal action (e.g., 'chrome://extensions')
 * @property title - Display name shown below the icon
 * @property icon - Icon display configuration
 * @property icon.type - Icon source type:
 *   - 'system': Built-in SVG icon from the extension
 *   - 'custom': User-uploaded image (base64 or blob URL)
 *   - 'text': Single letter with background color
 *   - 'favicon': Website favicon URL
 * @property icon.value - Icon content (varies by type)
 * @property icon.color - Background color for text icons (hex format)
 * @property position - Grid coordinates {x, y} where icon is displayed
 * @property folderId - Parent folder ID if icon is inside a folder
 * @property createdAt - Unix timestamp of creation
 * @property updatedAt - Unix timestamp of last modification
 * @property isSystemIcon - True if this is a built-in system shortcut
 * @property systemIconId - Unique system icon identifier
 * @property isHidden - True if system icon is hidden (soft-deleted)
 * @property originalPosition - Saved position for system icon restoration
 * @property originalFolderId - Saved folder for system icon restoration
 *
 * @example
 * ```ts
 * const icon: Icon = {
 *   id: 'abc-123',
 *   type: 'icon',
 *   url: 'https://github.com',
 *   title: 'GitHub',
 *   icon: { type: 'favicon', value: 'https://github.com/favicon.ico' },
 *   position: { x: 0, y: 0 },
 *   createdAt: Date.now(),
 *   updatedAt: Date.now(),
 * };
 * ```
 */
export interface Icon {
  /** Unique identifier (UUID format) */
  id: string;
  /** Discriminator field - always 'icon' */
  type: 'icon';
  /** Target URL or internal Chrome action */
  url: string;
  /** Display name shown below the icon */
  title: string;
  /** Icon display configuration */
  icon: {
    /** Icon source type: system, custom, text, or favicon */
    type: 'system' | 'custom' | 'text' | 'favicon';
    /** Icon content: Base64, SVG name, URL, or single letter */
    value: string;
    /** Background color for text/flat icons (hex format) */
    color?: string;
  };
  /** Grid position coordinates */
  position: { x: number; y: number };
  /** Parent folder ID (undefined if on main grid) */
  folderId?: string;
  /** Unix timestamp of creation */
  createdAt: number;
  /** Unix timestamp of last modification */
  updatedAt: number;

  // System icon fields (only present for default system shortcuts)
  /** True if this is a built-in system shortcut */
  isSystemIcon?: boolean;
  /** Unique system icon identifier for restoration */
  systemIconId?: SystemIconId;
  /** Hidden state - system icons are soft-deleted */
  isHidden?: boolean;
  /** Original position saved for restoration */
  originalPosition?: { x: number; y: number };
  /** Original folder saved for restoration */
  originalFolderId?: string;
}

/**
 * Folder for organizing icons on the grid.
 *
 * Folders can contain multiple icons and are displayed as expandable
 * containers on the main grid. Icons inside folders have their folderId
 * set to the folder's id.
 *
 * @property id - Unique identifier (UUID format)
 * @property type - Always 'folder' to distinguish from icons
 * @property name - Display name shown below the folder
 * @property position - Grid coordinates {x, y} where folder is displayed
 * @property createdAt - Unix timestamp of creation
 * @property updatedAt - Unix timestamp of last modification
 *
 * @example
 * ```ts
 * const folder: Folder = {
 *   id: 'folder-123',
 *   type: 'folder',
 *   name: 'Social Media',
 *   position: { x: 2, y: 0 },
 *   createdAt: Date.now(),
 *   updatedAt: Date.now(),
 * };
 * ```
 */
export interface Folder {
  /** Unique identifier (UUID format) */
  id: string;
  /** Discriminator field - always 'folder' */
  type: 'folder';
  /** Display name shown below the folder */
  name: string;
  /** Grid position coordinates */
  position: { x: number; y: number };
  /** Unix timestamp of creation */
  createdAt: number;
  /** Unix timestamp of last modification */
  updatedAt: number;
}

/**
 * Union type representing items that can be placed on the grid.
 *
 * The grid can contain both icons and folders. Use the `type` field
 * to discriminate between them.
 *
 * @example
 * ```ts
 * function handleGridItem(item: GridItem) {
 *   if (item.type === 'icon') {
 *     console.log('URL:', item.url);
 *   } else {
 *     console.log('Folder:', item.name);
 *   }
 * }
 * ```
 */
export type GridItem = Icon | Folder;

/**
 * Background wallpaper configuration.
 *
 * Supports multiple source types including local files, remote URLs,
 * and integrations with image services like Unsplash and Pexels.
 *
 * @property id - Unique identifier (UUID format)
 * @property type - Wallpaper source type:
 *   - 'url': Remote image URL
 *   - 'blob': Locally stored binary data
 *   - 'preset': Built-in wallpaper
 *   - 'unsplash': Unsplash API image
 *   - 'pexels': Pexels API image
 *   - 'pixabay': Pixabay API image
 *   - 'bing': Bing Daily Wallpaper
 *   - 'solid': Solid color background
 *   - 'gradient': CSS gradient background
 * @property source - URL, color code, or gradient CSS
 * @property blob - Binary image data (for blob type)
 * @property metadata - Image attribution and dimensions
 * @property effects - Visual effects applied to the wallpaper
 * @property createdAt - Unix timestamp of creation
 *
 * @example
 * ```ts
 * const wallpaper: Wallpaper = {
 *   id: 'wp-123',
 *   type: 'unsplash',
 *   source: 'https://images.unsplash.com/photo-xxx',
 *   metadata: { author: 'John Doe', source: 'Unsplash' },
 *   effects: { blur: 0, maskOpacity: 0.3, brightness: 100, grayscale: false },
 *   createdAt: Date.now(),
 * };
 * ```
 */
export interface Wallpaper {
  /** Unique identifier (UUID format) */
  id: string;
  /** Wallpaper source type */
  type: 'url' | 'blob' | 'preset' | 'unsplash' | 'pexels' | 'pixabay' | 'bing' | 'solid' | 'gradient';
  /** URL, color code, or gradient CSS */
  source: string;
  /** Binary image data for blob type */
  blob?: Blob;
  /** Image attribution and dimensions */
  metadata: {
    /** Image author/photographer name */
    author?: string;
    /** Source website or service */
    source?: string;
    /** License type (e.g., 'Unsplash License') */
    license?: string;
    /** Image width in pixels */
    width?: number;
    /** Image height in pixels */
    height?: number;
  };
  /** Visual effects applied to wallpaper */
  effects: {
    /** Blur radius in pixels (0 = no blur) */
    blur: number;
    /** Dark overlay opacity (0-1) */
    maskOpacity: number;
    /** Brightness percentage (100 = normal) */
    brightness: number;
    /** Whether to apply grayscale filter */
    grayscale: boolean;
  };
  /** Unix timestamp of creation */
  createdAt: number;
}

/**
 * Todo item for task management.
 *
 * Supports hierarchical tasks with parent-child relationships,
 * priorities, due dates, and tag-based organization.
 *
 * @property id - Unique identifier (UUID format)
 * @property text - Task description text (may contain #tags)
 * @property done - Whether the task is completed
 * @property priority - Task priority level
 * @property parentId - Parent task ID for sub-tasks
 * @property children - Array of child task IDs
 * @property dueDate - Optional due date (Unix timestamp)
 * @property tags - Extracted hashtags from text
 * @property createdAt - Unix timestamp of creation
 * @property updatedAt - Unix timestamp of last modification
 * @property completedAt - Unix timestamp when marked as done
 *
 * @example
 * ```ts
 * const todo: TodoItem = {
 *   id: 'todo-123',
 *   text: 'Review pull request #work',
 *   done: false,
 *   priority: 'high',
 *   children: [],
 *   tags: ['work'],
 *   createdAt: Date.now(),
 *   updatedAt: Date.now(),
 * };
 * ```
 */
export interface TodoItem {
  /** Unique identifier (UUID format) */
  id: string;
  /** Task description text (may contain #tags) */
  text: string;
  /** Whether the task is completed */
  done: boolean;
  /** Task priority level */
  priority: 'high' | 'medium' | 'low' | 'none';
  /** Parent task ID for hierarchical tasks */
  parentId?: string;
  /** Array of child task IDs */
  children: string[];
  /** Due date as Unix timestamp */
  dueDate?: number;
  /** Extracted hashtags from text */
  tags: string[];
  /** Unix timestamp of creation */
  createdAt: number;
  /** Unix timestamp of last modification */
  updatedAt: number;
  /** Unix timestamp when marked as done */
  completedAt?: number;
}

/**
 * Markdown note for the notes feature.
 *
 * Notes support Markdown formatting, optional color coding,
 * pinning to search results, and tag-based organization.
 *
 * @property id - Unique identifier (UUID format)
 * @property title - Note title
 * @property content - Markdown content body
 * @property color - Optional color tag for visual organization
 * @property isPinned - Whether pinned to search view
 * @property createdAt - Unix timestamp of creation
 * @property updatedAt - Unix timestamp of last modification
 * @property tags - Optional tags for categorization
 *
 * @example
 * ```ts
 * const note: Note = {
 *   id: 'note-123',
 *   title: 'Meeting Notes',
 *   content: '## Agenda\n- Item 1\n- Item 2',
 *   color: '#3b82f6',
 *   isPinned: true,
 *   createdAt: Date.now(),
 *   updatedAt: Date.now(),
 *   tags: ['meetings', 'work'],
 * };
 * ```
 */
export interface Note {
  /** Unique identifier (UUID format) */
  id: string;
  /** Note title */
  title: string;
  /** Markdown content body */
  content: string;
  /** Optional color tag (hex format) */
  color?: string;
  /** Whether pinned to search view */
  isPinned: boolean;
  /** Unix timestamp of creation */
  createdAt: number;
  /** Unix timestamp of last modification */
  updatedAt: number;
  /** Optional tags for categorization */
  tags?: string[];
}

/**
 * Key-value pair for application settings.
 *
 * Provides a flexible storage mechanism for user preferences
 * and application configuration.
 *
 * @property key - Unique setting identifier
 * @property value - Setting value (any JSON-serializable type)
 *
 * @example
 * ```ts
 * const setting: Settings = {
 *   key: 'theme',
 *   value: 'dark',
 * };
 * ```
 */
export interface Settings {
  /** Unique setting identifier */
  key: string;
  /** Setting value (any JSON-serializable type) */
  value: unknown;
}

/**
 * Email account configuration for notifications.
 *
 * Stores OAuth tokens and account state for email notification integrations.
 * Supports Gmail, Outlook, and generic IMAP providers.
 *
 * @property id - Unique identifier (UUID format)
 * @property provider - Email service provider
 * @property email - User's email address
 * @property enabled - Whether notifications are enabled
 * @property accessToken - OAuth access token (encrypted)
 * @property refreshToken - OAuth refresh token (encrypted)
 * @property lastChecked - Unix timestamp of last check
 * @property unreadCount - Current unread email count
 * @property createdAt - Unix timestamp of creation
 */
export interface EmailAccount {
  /** Unique identifier (UUID format) */
  id: string;
  /** Email service provider */
  provider: 'gmail' | 'outlook' | 'imap';
  /** User's email address */
  email: string;
  /** Whether notifications are enabled */
  enabled: boolean;
  /** OAuth access token */
  accessToken?: string;
  /** OAuth refresh token */
  refreshToken?: string;
  /** Unix timestamp of last check */
  lastChecked: number;
  /** Current unread email count */
  unreadCount: number;
  /** Unix timestamp of creation */
  createdAt: number;
}

/**
 * External todo service integration.
 *
 * Stores OAuth tokens and sync state for integrations with
 * external task management services.
 *
 * @property id - Unique identifier (UUID format)
 * @property provider - Task service provider
 * @property enabled - Whether sync is enabled
 * @property accessToken - OAuth access token
 * @property refreshToken - OAuth refresh token
 * @property lastSynced - Unix timestamp of last sync
 * @property taskCount - Number of synced tasks
 * @property createdAt - Unix timestamp of creation
 */
export interface TodoIntegration {
  /** Unique identifier (UUID format) */
  id: string;
  /** Task service provider */
  provider: 'google' | 'todoist' | 'ticktick' | 'microsoft';
  /** Whether sync is enabled */
  enabled: boolean;
  /** OAuth access token */
  accessToken?: string;
  /** OAuth refresh token */
  refreshToken?: string;
  /** Unix timestamp of last sync */
  lastSynced: number;
  /** Number of synced tasks */
  taskCount: number;
  /** Unix timestamp of creation */
  createdAt: number;
}

/**
 * RSS feed subscription.
 *
 * Stores configuration for RSS feed subscriptions including
 * update frequency and read state tracking.
 *
 * @property id - Unique identifier (UUID format)
 * @property url - RSS feed URL
 * @property title - Feed display title
 * @property category - User-defined category
 * @property enabled - Whether feed is active
 * @property updateInterval - Update frequency in milliseconds
 * @property lastFetched - Unix timestamp of last fetch
 * @property lastReadTime - Unix timestamp of last user read
 * @property unreadCount - Number of unread items
 * @property createdAt - Unix timestamp of creation
 */
export interface RSSSubscription {
  /** Unique identifier (UUID format) */
  id: string;
  /** RSS feed URL */
  url: string;
  /** Feed display title */
  title: string;
  /** User-defined category */
  category: string;
  /** Whether feed is active */
  enabled: boolean;
  /** Update frequency in milliseconds */
  updateInterval: number;
  /** Unix timestamp of last fetch */
  lastFetched: number;
  /** Unix timestamp of last user read */
  lastReadTime: number;
  /** Number of unread items */
  unreadCount: number;
  /** Unix timestamp of creation */
  createdAt: number;
}

/**
 * Individual RSS feed item.
 *
 * Represents a single article or post from an RSS feed.
 *
 * @property id - Unique identifier (UUID format)
 * @property subscriptionId - Parent subscription ID
 * @property title - Item title
 * @property link - URL to original article
 * @property content - HTML or text content
 * @property pubDate - Publication date (Unix timestamp)
 * @property isRead - Whether user has read this item
 * @property isStarred - Whether user has starred this item
 * @property createdAt - Unix timestamp when cached
 */
export interface RSSItem {
  /** Unique identifier (UUID format) */
  id: string;
  /** Parent subscription ID */
  subscriptionId: string;
  /** Item title */
  title: string;
  /** URL to original article */
  link: string;
  /** HTML or text content */
  content: string;
  /** Publication date (Unix timestamp) */
  pubDate: number;
  /** Whether user has read this item */
  isRead: boolean;
  /** Whether user has starred this item */
  isStarred: boolean;
  /** Unix timestamp when cached */
  createdAt: number;
}

/**
 * Notification history log entry.
 *
 * Records all notifications shown to the user for history
 * tracking and analytics.
 *
 * @property id - Unique identifier (UUID format)
 * @property type - Notification source type
 * @property source - Source identifier (email, feed URL, etc.)
 * @property title - Notification title
 * @property message - Notification body text
 * @property isRead - Whether user has read this notification
 * @property clickedAt - Unix timestamp when clicked
 * @property createdAt - Unix timestamp of creation
 */
export interface NotificationLog {
  /** Unique identifier (UUID format) */
  id: string;
  /** Notification source type */
  type: 'email' | 'task' | 'rss';
  /** Source identifier */
  source: string;
  /** Notification title */
  title: string;
  /** Notification body text */
  message: string;
  /** Whether user has read this notification */
  isRead: boolean;
  /** Unix timestamp when clicked */
  clickedAt?: number;
  /** Unix timestamp of creation */
  createdAt: number;
}

/**
 * Curated website for the website market.
 *
 * Represents a website recommendation that users can add
 * to their grid from the market.
 *
 * @property id - Unique identifier
 * @property name - Chinese display name
 * @property nameEn - English display name
 * @property url - Website URL
 * @property description - Chinese description
 * @property descriptionEn - English description
 * @property category - Website category
 * @property region - Target region (cn, intl, or both)
 * @property icon - Icon URL or data
 * @property popularity - Popularity score for sorting
 * @property tags - Searchable tags
 */
export interface PresetWebsite {
  /** Unique identifier */
  id: string;
  /** Chinese display name */
  name: string;
  /** English display name */
  nameEn: string;
  /** Website URL */
  url: string;
  /** Chinese description */
  description: string;
  /** English description */
  descriptionEn: string;
  /** Website category */
  category: string;
  /** Target region: cn (China), intl (International), both */
  region: 'cn' | 'intl' | 'both';
  /** Icon URL or base64 data */
  icon: string;
  /** Popularity score for sorting */
  popularity: number;
  /** Searchable tags */
  tags: string[];
}

/**
 * User's favorite from the website market.
 *
 * Tracks which preset websites the user has added to favorites.
 *
 * @property id - Unique identifier (UUID format)
 * @property websiteId - Reference to PresetWebsite.id
 * @property addedAt - Unix timestamp when added
 */
export interface UserFavorite {
  /** Unique identifier (UUID format) */
  id: string;
  /** Reference to PresetWebsite.id */
  websiteId: string;
  /** Unix timestamp when added */
  addedAt: number;
}

/**
 * Cached weather data for a location.
 *
 * Stores weather API responses to reduce API calls and enable
 * offline access. Cache expires after 1 hour.
 *
 * @property id - Cache key: "lat_lon_unit" format
 * @property location - Location metadata
 * @property current - Current weather conditions
 * @property forecast - 7-day weather forecast
 * @property fetchedAt - Unix timestamp when data was fetched
 * @property expiresAt - Unix timestamp when cache expires (1 hour)
 *
 * @example
 * ```ts
 * const cache: WeatherCache = {
 *   id: '39.90_116.40_celsius',
 *   location: { name: 'Beijing', latitude: 39.90, longitude: 116.40 },
 *   current: { temperature: 25, condition: 'Sunny', ... },
 *   forecast: [...],
 *   fetchedAt: Date.now(),
 *   expiresAt: Date.now() + 3600000,
 * };
 * ```
 */
export interface WeatherCache {
  /** Cache key: "lat_lon_unit" format */
  id: string;
  /** Location metadata */
  location: {
    /** Location display name */
    name: string;
    /** Latitude coordinate */
    latitude: number;
    /** Longitude coordinate */
    longitude: number;
  };
  /** Current weather conditions */
  current: {
    /** Temperature in configured unit */
    temperature: number;
    /** Weather condition description */
    condition: string;
    /** WMO weather code */
    conditionCode: number;
    /** Relative humidity percentage */
    humidity: number;
    /** Wind speed in km/h */
    windSpeed: number;
    /** Feels-like temperature */
    feelsLike: number;
  };
  /** 7-day weather forecast */
  forecast: Array<{
    /** Date in YYYY-MM-DD format */
    date: string;
    /** @deprecated Use dayIndex for i18n support */
    dayOfWeek: string;
    /** Day index 0-6 (Sunday-Saturday) for i18n */
    dayIndex?: number;
    /** High temperature */
    high: number;
    /** Low temperature */
    low: number;
    /** Weather condition description */
    condition: string;
    /** WMO weather code */
    conditionCode: number;
  }>;
  /** Unix timestamp when data was fetched */
  fetchedAt: number;
  /** Unix timestamp when cache expires (typically fetchedAt + 1 hour) */
  expiresAt: number;
}

/**
 * Cached external resource entry.
 *
 * Stores external resources (images, icons) as base64 data URLs
 * for offline-first loading and reduced network requests.
 *
 * @property id - Hash of the URL or custom identifier
 * @property url - Original resource URL
 * @property dataUrl - Base64-encoded data URL
 * @property mimeType - Resource MIME type (e.g., 'image/png')
 * @property size - Size in bytes
 * @property cachedAt - Unix timestamp when cached
 * @property version - Cache version for invalidation
 *
 * @example
 * ```ts
 * const entry: ResourceCacheEntry = {
 *   id: 'res_abc123',
 *   url: 'https://example.com/icon.png',
 *   dataUrl: 'data:image/png;base64,iVBORw0KGgo...',
 *   mimeType: 'image/png',
 *   size: 2048,
 *   cachedAt: Date.now(),
 *   version: 1,
 * };
 * ```
 */
export interface ResourceCacheEntry {
  /** Hash of URL or custom identifier */
  id: string;
  /** Original resource URL */
  url: string;
  /** Base64-encoded data URL */
  dataUrl: string;
  /** Resource MIME type */
  mimeType: string;
  /** Size in bytes */
  size: number;
  /** Unix timestamp when cached */
  cachedAt: number;
  /** Cache version for invalidation */
  version: number;
}

// ============================================================================
// Database Class
// ============================================================================

/**
 * OpenInfinity IndexedDB database class.
 *
 * Extends Dexie to provide type-safe access to all application tables.
 * Implements automatic schema migrations across versions.
 *
 * Schema Versions:
 * - v1: Core tables (icons, folders, wallpapers, todos, notes, settings)
 * - v2: Notification system + Website market
 * - v3: Weather cache
 * - v4: Fix weatherCache primary key
 * - v5: Add updatedAt index
 * - v6: Structured icon and position data
 * - v7: Remove folder.children field
 * - v8: Add isPinned index to notes
 * - v9: Schema stabilization
 * - v10: Default todo items for new users
 * - v11: Resource cache for offline-first loading
 *
 * @extends Dexie
 *
 * @example
 * ```ts
 * // Import the singleton instance
 * import { db } from './database';
 *
 * // Query icons
 * const icons = await db.icons.toArray();
 *
 * // Add a new todo
 * await db.todos.add({
 *   id: crypto.randomUUID(),
 *   text: 'New task',
 *   done: false,
 *   priority: 'medium',
 *   children: [],
 *   tags: [],
 *   createdAt: Date.now(),
 *   updatedAt: Date.now(),
 * });
 * ```
 */
class OpenInfinityDB extends Dexie {
  /** Website shortcut icons table */
  icons!: Table<Icon, string>;
  /** Folder containers table */
  folders!: Table<Folder, string>;
  /** Wallpaper configurations table */
  wallpapers!: Table<Wallpaper, string>;
  /** Todo items table */
  todos!: Table<TodoItem, string>;
  /** Notes table */
  notes!: Table<Note, string>;
  /** Settings key-value store */
  settings!: Table<Settings, string>;
  /** Email account configurations table */
  emailAccounts!: Table<EmailAccount, string>;
  /** External todo service integrations table */
  todoIntegrations!: Table<TodoIntegration, string>;
  /** RSS feed subscriptions table */
  rssSubscriptions!: Table<RSSSubscription, string>;
  /** RSS feed items cache table */
  rssItems!: Table<RSSItem, string>;
  /** Notification history log table */
  notificationLogs!: Table<NotificationLog, string>;
  /** Curated preset websites table */
  presetWebsites!: Table<PresetWebsite, string>;
  /** User favorites from website market */
  userFavorites!: Table<UserFavorite, string>;
  /** Weather data cache table */
  weatherCache!: Table<WeatherCache, string>;
  /** External resource cache table */
  resourceCache!: Table<ResourceCacheEntry, string>;

  /**
   * Creates the database instance and defines all schema versions.
   *
   * The constructor sets up all table schemas and migration handlers.
   * Each version includes the complete schema definition to support
   * upgrades from any previous version.
   */
  constructor() {
    super('OpenInfinityDB');

    // Version 1: Core tables
    this.version(1).stores({
      icons: '++id, type, url, folderId, position, createdAt',
      folders: '++id, name, position, createdAt',
      wallpapers: '++id, type, createdAt',
      todos: '++id, done, parentId, dueDate, *tags, createdAt',
      notes: '++id, *tags, createdAt',
      settings: 'key',
    });

    // Version 2: Notification system + Website market
    this.version(2).stores({
      icons: '++id, type, url, folderId, position, createdAt',
      folders: '++id, name, position, createdAt',
      wallpapers: '++id, type, createdAt',
      todos: '++id, done, parentId, dueDate, *tags, createdAt',
      notes: '++id, *tags, createdAt',
      settings: 'key',
      emailAccounts: '++id, provider, email, enabled, lastChecked',
      todoIntegrations: '++id, provider, enabled, lastSynced',
      rssSubscriptions: '++id, url, category, enabled, lastFetched',
      rssItems: '++id, subscriptionId, pubDate, isRead, isStarred',
      notificationLogs: '++id, type, source, isRead, createdAt',
      presetWebsites: '++id, category, region, popularity, *tags',
      userFavorites: '++id, websiteId, addedAt',
    });

    // Version 3: Weather cache for widgets
    this.version(3).stores({
      icons: '++id, type, url, folderId, position, createdAt',
      folders: '++id, name, position, createdAt',
      wallpapers: '++id, type, createdAt',
      todos: '++id, done, parentId, dueDate, *tags, createdAt',
      notes: '++id, *tags, createdAt',
      settings: 'key',
      emailAccounts: '++id, provider, email, enabled, lastChecked',
      todoIntegrations: '++id, provider, enabled, lastSynced',
      rssSubscriptions: '++id, url, category, enabled, lastFetched',
      rssItems: '++id, subscriptionId, pubDate, isRead, isStarred',
      notificationLogs: '++id, type, source, isRead, createdAt',
      presetWebsites: '++id, category, region, popularity, *tags',
      userFavorites: '++id, websiteId, addedAt',
      weatherCache: '++id, fetchedAt',
    });

    // Version 4: Fix weatherCache schema - use string primary key
    this.version(4).stores({
      icons: '++id, type, url, folderId, position, createdAt',
      folders: '++id, name, position, createdAt',
      wallpapers: '++id, type, createdAt',
      todos: '++id, done, parentId, dueDate, *tags, createdAt',
      notes: '++id, *tags, createdAt',
      settings: 'key',
      emailAccounts: '++id, provider, email, enabled, lastChecked',
      todoIntegrations: '++id, provider, enabled, lastSynced',
      rssSubscriptions: '++id, url, category, enabled, lastFetched',
      rssItems: '++id, subscriptionId, pubDate, isRead, isStarred',
      notificationLogs: '++id, type, source, isRead, createdAt',
      presetWebsites: '++id, category, region, popularity, *tags',
      userFavorites: '++id, websiteId, addedAt',
      weatherCache: 'id, fetchedAt, expiresAt',
    });

    // Version 5: Add updatedAt index for todos and notes
    this.version(5).stores({
      icons: '++id, type, url, folderId, position, createdAt',
      folders: '++id, name, position, createdAt',
      wallpapers: '++id, type, createdAt',
      todos: '++id, done, parentId, dueDate, *tags, createdAt, updatedAt',
      notes: '++id, *tags, createdAt, updatedAt',
      settings: 'key',
      emailAccounts: '++id, provider, email, enabled, lastChecked',
      todoIntegrations: '++id, provider, enabled, lastSynced',
      rssSubscriptions: '++id, url, category, enabled, lastFetched',
      rssItems: '++id, subscriptionId, pubDate, isRead, isStarred',
      notificationLogs: '++id, type, source, isRead, createdAt',
      presetWebsites: '++id, category, region, popularity, *tags',
      userFavorites: '++id, websiteId, addedAt',
      weatherCache: 'id, fetchedAt, expiresAt',
    });

    // Version 6: Migrate to structured icon and position data
    this.version(6)
      .stores({
        icons: '++id, type, url, folderId, createdAt',
        folders: '++id, name, createdAt',
        wallpapers: '++id, type, createdAt',
        todos: '++id, done, parentId, dueDate, *tags, createdAt, updatedAt',
        notes: '++id, *tags, createdAt, updatedAt',
        settings: 'key',
        emailAccounts: '++id, provider, email, enabled, lastChecked',
        todoIntegrations: '++id, provider, enabled, lastSynced',
        rssSubscriptions: '++id, url, category, enabled, lastFetched',
        rssItems: '++id, subscriptionId, pubDate, isRead, isStarred',
        notificationLogs: '++id, type, source, isRead, createdAt',
        presetWebsites: '++id, category, region, popularity, *tags',
        userFavorites: '++id, websiteId, addedAt',
        weatherCache: 'id, fetchedAt, expiresAt',
      })
      .upgrade(async (trans) => {
        // P0-1: Migrate with defensive normalization
        const icons = await trans.table('icons').toArray();
        const cols = 6; // Default grid columns

        for (let i = 0; i < icons.length; i++) {
          const icon = icons[i] as any;

          // P0-1: Ensure valid position (handles null/undefined/invalid)
          icon.position = ensurePosition(icon.position, cols, i);

          // P0-1: Ensure valid icon structure (handles null/undefined/invalid)
          icon.icon = ensureIcon(icon.icon, icon.title || '');

          // Remove old color field if exists
          delete icon.color;

          await trans.table('icons').put(icon);
        }

        // Migrate folders: position number -> {x, y}
        const folders = await trans.table('folders').toArray();

        for (let i = 0; i < folders.length; i++) {
          const folder = folders[i] as any;

          // P0-1: Ensure valid position
          folder.position = ensurePosition(folder.position, cols, icons.length + i);

          await trans.table('folders').put(folder);
        }
      });

    // Version 7: Remove folder.children field (P2-1)
    this.version(7)
      .stores({
        icons: '++id, type, url, folderId, createdAt',
        folders: '++id, name, createdAt',
        wallpapers: '++id, type, createdAt',
        todos: '++id, done, parentId, dueDate, *tags, createdAt, updatedAt',
        notes: '++id, *tags, createdAt, updatedAt',
        settings: 'key',
        emailAccounts: '++id, provider, email, enabled, lastChecked',
        todoIntegrations: '++id, provider, enabled, lastSynced',
        rssSubscriptions: '++id, url, category, enabled, lastFetched',
        rssItems: '++id, subscriptionId, pubDate, isRead, isStarred',
        notificationLogs: '++id, type, source, isRead, createdAt',
        presetWebsites: '++id, category, region, popularity, *tags',
        userFavorites: '++id, websiteId, addedAt',
        weatherCache: 'id, fetchedAt, expiresAt',
      })
      .upgrade(async (trans) => {
        // Remove children field from all folders
        const folders = await trans.table('folders').toArray();
        for (const folder of folders) {
          const oldFolder = folder as any;
          delete oldFolder.children;
          await trans.table('folders').put(folder);
        }
      });

    // Version 8: Add isPinned index to notes table
    this.version(8).stores({
      icons: '++id, type, url, folderId, createdAt',
      folders: '++id, name, createdAt',
      wallpapers: '++id, type, createdAt',
      todos: '++id, done, parentId, dueDate, *tags, createdAt, updatedAt',
      notes: '++id, isPinned, *tags, createdAt, updatedAt',
      settings: 'key',
      emailAccounts: '++id, provider, email, enabled, lastChecked',
      todoIntegrations: '++id, provider, enabled, lastSynced',
      rssSubscriptions: '++id, url, category, enabled, lastFetched',
      rssItems: '++id, subscriptionId, pubDate, isRead, isStarred',
      notificationLogs: '++id, type, source, isRead, createdAt',
      presetWebsites: '++id, category, region, popularity, *tags',
      userFavorites: '++id, websiteId, addedAt',
      weatherCache: 'id, fetchedAt, expiresAt',
    });

    // Version 9: NO-OP - Keep same schema as Version 8
    // IMPORTANT: IndexedDB does NOT support changing primary key type (++id to id)
    // The original Version 9 attempted this and caused "UpgradeError: Not yet support for changing primary key"
    // We keep the ++id schema which works with both auto-increment and explicit string IDs
    this.version(9).stores({
      icons: '++id, type, url, folderId, createdAt',
      folders: '++id, name, createdAt',
      wallpapers: '++id, type, createdAt',
      todos: '++id, done, parentId, dueDate, *tags, createdAt, updatedAt',
      notes: '++id, isPinned, *tags, createdAt, updatedAt',
      settings: 'key',
      emailAccounts: '++id, provider, email, enabled, lastChecked',
      todoIntegrations: '++id, provider, enabled, lastSynced',
      rssSubscriptions: '++id, url, category, enabled, lastFetched',
      rssItems: '++id, subscriptionId, pubDate, isRead, isStarred',
      notificationLogs: '++id, type, source, isRead, createdAt',
      presetWebsites: '++id, category, region, popularity, *tags',
      userFavorites: '++id, websiteId, addedAt',
      weatherCache: 'id, fetchedAt, expiresAt', // weatherCache already uses string id, keep it
    });

    // Version 10: Add default todo items for existing users (if list is empty)
    this.version(10)
      .stores({
        icons: '++id, type, url, folderId, createdAt',
        folders: '++id, name, createdAt',
        wallpapers: '++id, type, createdAt',
        todos: '++id, done, parentId, dueDate, *tags, createdAt, updatedAt',
        notes: '++id, isPinned, *tags, createdAt, updatedAt',
        settings: 'key',
        emailAccounts: '++id, provider, email, enabled, lastChecked',
        todoIntegrations: '++id, provider, enabled, lastSynced',
        rssSubscriptions: '++id, url, category, enabled, lastFetched',
        rssItems: '++id, subscriptionId, pubDate, isRead, isStarred',
        notificationLogs: '++id, type, source, isRead, createdAt',
        presetWebsites: '++id, category, region, popularity, *tags',
        userFavorites: '++id, websiteId, addedAt',
        weatherCache: 'id, fetchedAt, expiresAt',
      })
      .upgrade(async (trans) => {
        // Only add defaults if table is empty to avoid annoying existing users
        const count = await trans.table('todos').count();
        if (count === 0) {
          const now = Date.now();
          await trans.table('todos').bulkAdd([
            {
              id: crypto.randomUUID(),
              text: tr(
                '欢迎使用Open Infinity新标签页，这是一条示例待办事项。',
                'Welcome to Open Infinity New Tab, this is a sample todo item.'
              ),
              done: false,
              priority: 'high',
              children: [],
              tags: [],
              createdAt: now,
              updatedAt: now,
            },
            {
              id: crypto.randomUUID(),
              text: tr(
                '尝试输入 #工作 或 #生活 来分类你的任务',
                'Try typing #work or #life to categorize your tasks'
              ),
              done: false,
              priority: 'medium',
              children: [],
              tags: [
                tr('工作', 'work'),
                tr('生活', 'life'),
              ],
              createdAt: now - 1000,
              updatedAt: now - 1000,
            },
          ]);
        }
      });

    // Version 11: Add resource cache for offline-first asset loading
    this.version(11).stores({
      icons: '++id, type, url, folderId, createdAt',
      folders: '++id, name, createdAt',
      wallpapers: '++id, type, createdAt',
      todos: '++id, done, parentId, dueDate, *tags, createdAt, updatedAt',
      notes: '++id, isPinned, *tags, createdAt, updatedAt',
      settings: 'key',
      emailAccounts: '++id, provider, email, enabled, lastChecked',
      todoIntegrations: '++id, provider, enabled, lastSynced',
      rssSubscriptions: '++id, url, category, enabled, lastFetched',
      rssItems: '++id, subscriptionId, pubDate, isRead, isStarred',
      notificationLogs: '++id, type, source, isRead, createdAt',
      presetWebsites: '++id, category, region, popularity, *tags',
      userFavorites: '++id, websiteId, addedAt',
      weatherCache: 'id, fetchedAt, expiresAt',
      resourceCache: 'id, url, cachedAt',
    });

    // Populate hook for fresh installs
    this.on('populate', (trans) => {
      const now = Date.now();
      trans.table('todos').bulkAdd([
        {
          id: crypto.randomUUID(),
          text: tr(
            '欢迎使用Open Infinity新标签页，这是一条示例待办事项。',
            'Welcome to Open Infinity New Tab, this is a sample todo item.'
          ),
          done: false,
          priority: 'high',
          children: [],
          tags: [],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          text: tr(
            '尝试输入 #工作 或 #生活 来分类你的任务',
            'Try typing #work or #life to categorize your tasks'
          ),
          done: false,
          priority: 'medium',
          children: [],
          tags: [
            tr('工作', 'work'),
            tr('生活', 'life'),
          ],
          createdAt: now - 1000,
          updatedAt: now - 1000,
        },
      ]);
    });
  }
}

// ============================================================================
// Exports
// ============================================================================

/**
 * Singleton database instance.
 *
 * Use this exported instance for all database operations.
 * The database connection is established lazily on first access.
 *
 * @example
 * ```ts
 * import { db } from './database';
 *
 * // Read all icons
 * const icons = await db.icons.toArray();
 *
 * // Add new icon
 * await db.icons.add(newIcon);
 *
 * // Update icon
 * await db.icons.update(iconId, { title: 'New Title' });
 *
 * // Delete icon
 * await db.icons.delete(iconId);
 * ```
 */
export const db = new OpenInfinityDB();

/**
 * Generates a new UUID v4 identifier.
 *
 * Uses the browser's native crypto.randomUUID() for secure
 * random ID generation.
 *
 * @returns A new UUID string in format 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
 *
 * @example
 * ```ts
 * const newId = generateId();
 * console.log(newId); // 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
 * ```
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Exported normalization helpers for defensive use in stores.
 *
 * These functions are used internally during migrations but are
 * also exported for use in stores that need to validate or
 * normalize data before saving.
 */
export { isValidPosition, ensurePosition, isValidIcon, ensureIcon };
