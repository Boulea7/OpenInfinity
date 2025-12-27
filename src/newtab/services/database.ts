/**
 * OpenInfinity Database Schema
 * Using Dexie.js for IndexedDB access
 */
import Dexie, { type Table } from 'dexie';

/**
 * Data normalization helpers for migration safety
 * Ensures all data has valid structure even if corrupted
 */
function isValidPosition(p: any): p is { x: number; y: number } {
  return p && typeof p === 'object' && Number.isFinite(p.x) && Number.isFinite(p.y);
}

function ensurePosition(pos: any, cols: number, fallbackIndex: number): { x: number; y: number } {
  if (isValidPosition(pos)) return pos;
  if (typeof pos === 'number' && Number.isFinite(pos)) {
    return { x: pos % cols, y: Math.floor(pos / cols) };
  }
  // Fallback: use fallbackIndex as position
  return { x: fallbackIndex % cols, y: Math.floor(fallbackIndex / cols) };
}

function isValidIcon(raw: any): raw is { type: string; value: string; color?: string } {
  return (
    raw &&
    typeof raw === 'object' &&
    typeof raw.type === 'string' &&
    typeof raw.value === 'string'
  );
}

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

// System icon ID type - identifies default system shortcuts
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

// Icon type definition
export interface Icon {
  id: string;
  type: 'icon';
  url: string;
  title: string;
  icon: {
    type: 'system' | 'custom' | 'text' | 'favicon';
    value: string; // Base64, SVG, URL, or single letter
    color?: string; // Background color for text/flat icons
  };
  position: { x: number; y: number }; // Grid position
  folderId?: string;
  createdAt: number;
  updatedAt: number;

  // System icon fields (only present for default system shortcuts)
  isSystemIcon?: boolean;           // True if this is a system shortcut
  systemIconId?: SystemIconId;      // Unique system icon identifier
  isHidden?: boolean;               // Hidden state (delete = hide for system icons)
  originalPosition?: { x: number; y: number }; // Original position for restore
  originalFolderId?: string;        // Original folder for restore
}

// Folder type definition
export interface Folder {
  id: string;
  type: 'folder';
  name: string;
  position: { x: number; y: number }; // Grid position
  createdAt: number;
  updatedAt: number;
}

// Grid item can be either Icon or Folder
export type GridItem = Icon | Folder;

// Wallpaper type definition
export interface Wallpaper {
  id: string;
  type: 'url' | 'blob' | 'preset' | 'unsplash' | 'pexels' | 'pixabay' | 'bing' | 'solid' | 'gradient';
  source: string;
  blob?: Blob;
  metadata: {
    author?: string;
    source?: string;
    license?: string;
    width?: number;
    height?: number;
  };
  effects: {
    blur: number;
    maskOpacity: number;
    brightness: number;
    grayscale: boolean;
  };
  createdAt: number;
}

// Todo item type definition
export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low' | 'none';
  parentId?: string;
  children: string[];
  dueDate?: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

// Note type definition
export interface Note {
  id: string;
  title: string;           // Note title
  content: string;         // Markdown content
  color?: string;          // Optional color tag
  isPinned: boolean;       // Whether pinned to search view
  createdAt: number;
  updatedAt: number;
  tags?: string[];         // Optional tags
}

// Settings key-value store
export interface Settings {
  key: string;
  value: unknown;
}

// Email account for notifications
export interface EmailAccount {
  id: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email: string;
  enabled: boolean;
  accessToken?: string;
  refreshToken?: string;
  lastChecked: number;
  unreadCount: number;
  createdAt: number;
}

// Todo integration for external services
export interface TodoIntegration {
  id: string;
  provider: 'google' | 'todoist' | 'ticktick' | 'microsoft';
  enabled: boolean;
  accessToken?: string;
  refreshToken?: string;
  lastSynced: number;
  taskCount: number;
  createdAt: number;
}

// RSS subscription
export interface RSSSubscription {
  id: string;
  url: string;
  title: string;
  category: string;
  enabled: boolean;
  updateInterval: number;
  lastFetched: number;
  lastReadTime: number;
  unreadCount: number;
  createdAt: number;
}

// RSS item
export interface RSSItem {
  id: string;
  subscriptionId: string;
  title: string;
  link: string;
  content: string;
  pubDate: number;
  isRead: boolean;
  isStarred: boolean;
  createdAt: number;
}

// Notification log
export interface NotificationLog {
  id: string;
  type: 'email' | 'task' | 'rss';
  source: string;
  title: string;
  message: string;
  isRead: boolean;
  clickedAt?: number;
  createdAt: number;
}

// Preset website for market
export interface PresetWebsite {
  id: string;
  name: string;
  nameEn: string;
  url: string;
  description: string;
  descriptionEn: string;
  category: string;
  region: 'cn' | 'intl' | 'both';
  icon: string;
  popularity: number;
  tags: string[];
}

// User favorite from market
export interface UserFavorite {
  id: string;
  websiteId: string;
  addedAt: number;
}

// Weather cache for reducing API calls
export interface WeatherCache {
  id: string; // location key: "lat_lon"
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  current: {
    temperature: number;
    condition: string;
    conditionCode: number; // WMO code
    humidity: number;
    windSpeed: number;
    feelsLike: number;
  };
  forecast: Array<{
    date: string; // YYYY-MM-DD
    dayOfWeek: string; // DEPRECATED: Use dayIndex
    dayIndex?: number; // Day index 0-6 for i18n
    high: number;
    low: number;
    condition: string;
    conditionCode: number;
  }>;
  fetchedAt: number;
  expiresAt: number; // Cache expiration time (1 hour)
}

// Resource cache entry for offline-first loading
export interface ResourceCacheEntry {
  id: string; // URL hash or custom ID
  url: string;
  dataUrl: string; // Base64 encoded data
  mimeType: string;
  size: number;
  cachedAt: number;
  version: number;
}

/**
 * OpenInfinity Database class
 */
class OpenInfinityDB extends Dexie {
  icons!: Table<Icon, string>;
  folders!: Table<Folder, string>;
  wallpapers!: Table<Wallpaper, string>;
  todos!: Table<TodoItem, string>;
  notes!: Table<Note, string>;
  settings!: Table<Settings, string>;
  emailAccounts!: Table<EmailAccount, string>;
  todoIntegrations!: Table<TodoIntegration, string>;
  rssSubscriptions!: Table<RSSSubscription, string>;
  rssItems!: Table<RSSItem, string>;
  notificationLogs!: Table<NotificationLog, string>;
  presetWebsites!: Table<PresetWebsite, string>;
  userFavorites!: Table<UserFavorite, string>;
  weatherCache!: Table<WeatherCache, string>;
  resourceCache!: Table<ResourceCacheEntry, string>;

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
              text: '欢迎使用Open Infinity新标签页，这是一条示例待办事项。',
              done: false,
              priority: 'high',
              children: [],
              tags: [],
              createdAt: now,
              updatedAt: now,
            },
            {
              id: crypto.randomUUID(),
              text: '尝试输入 #工作 或 #生活 来分类你的任务',
              done: false,
              priority: 'medium',
              children: [],
              tags: ['工作', '生活'],
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
          text: '欢迎使用Open Infinity新标签页，这是一条示例待办事项。',
          done: false,
          priority: 'high',
          children: [],
          tags: [],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          text: '尝试输入 #工作 或 #生活 来分类你的任务',
          done: false,
          priority: 'medium',
          children: [],
          tags: ['工作', '生活'],
          createdAt: now - 1000,
          updatedAt: now - 1000,
        },
      ]);
    });
  }
}

// Export singleton database instance
export const db = new OpenInfinityDB();

// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Export normalization helpers for defensive use in stores
export { isValidPosition, ensurePosition, isValidIcon, ensureIcon };
