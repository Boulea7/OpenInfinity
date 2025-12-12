/**
 * OpenInfinity Database Schema
 * Using Dexie.js for IndexedDB access
 */
import Dexie, { type Table } from 'dexie';

// Icon type definition
export interface Icon {
  id: string;
  type: 'icon';
  url: string;
  title: string;
  icon: string; // Base64, SVG, or URL
  color?: string;
  position: number;
  folderId?: string;
  createdAt: number;
  updatedAt: number;
}

// Folder type definition
export interface Folder {
  id: string;
  type: 'folder';
  name: string;
  children: string[];
  position: number;
  createdAt: number;
  updatedAt: number;
}

// Grid item can be either Icon or Folder
export type GridItem = Icon | Folder;

// Wallpaper type definition
export interface Wallpaper {
  id: string;
  type: 'url' | 'blob' | 'unsplash' | 'bing' | 'solid' | 'gradient';
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
  priority: 'high' | 'medium' | 'low';
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
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
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
    dayOfWeek: string;
    high: number;
    low: number;
    condition: string;
    conditionCode: number;
  }>;
  fetchedAt: number;
  expiresAt: number; // Cache expiration time (1 hour)
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
  }
}

// Export singleton database instance
export const db = new OpenInfinityDB();

// Helper function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}
