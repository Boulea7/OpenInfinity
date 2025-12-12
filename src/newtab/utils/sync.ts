/**
 * Multi-tab Synchronization using BroadcastChannel API
 * Keeps icon/folder data synced across all open tabs
 */

import type { Icon, Folder } from '../services/database';

// Sync message types
export type SyncMessageType =
  | 'ICON_ADDED'
  | 'ICON_UPDATED'
  | 'ICON_DELETED'
  | 'FOLDER_ADDED'
  | 'FOLDER_UPDATED'
  | 'FOLDER_DELETED'
  | 'SETTINGS_UPDATED'
  | 'WALLPAPER_CHANGED';

export interface SyncMessage {
  type: SyncMessageType;
  payload: any;
  timestamp: number;
  tabId: string; // To prevent echo
}

// Generate unique tab ID
const TAB_ID = crypto.randomUUID();

// Create BroadcastChannel instance
const channel = new BroadcastChannel('openinfinity-sync');

/**
 * Broadcast a sync message to all other tabs
 */
export function broadcastSync(type: SyncMessageType, payload: any): void {
  const message: SyncMessage = {
    type,
    payload,
    timestamp: Date.now(),
    tabId: TAB_ID,
  };

  channel.postMessage(message);
}

/**
 * Listen for sync messages from other tabs
 */
export function listenForSync(
  callback: (message: SyncMessage) => void
): () => void {
  const handler = (event: MessageEvent<SyncMessage>) => {
    const message = event.data;

    // Ignore messages from this tab
    if (message.tabId === TAB_ID) {
      return;
    }

    callback(message);
  };

  channel.addEventListener('message', handler);

  // Return cleanup function
  return () => {
    channel.removeEventListener('message', handler);
  };
}

/**
 * Broadcast icon operations
 */
export const syncIcon = {
  added: (icon: Icon) => broadcastSync('ICON_ADDED', icon),
  updated: (icon: Partial<Icon> & { id: string }) => broadcastSync('ICON_UPDATED', icon),
  deleted: (id: string) => broadcastSync('ICON_DELETED', { id }),
};

/**
 * Broadcast folder operations
 */
export const syncFolder = {
  added: (folder: Folder) => broadcastSync('FOLDER_ADDED', folder),
  updated: (folder: Partial<Folder> & { id: string }) => broadcastSync('FOLDER_UPDATED', folder),
  deleted: (id: string) => broadcastSync('FOLDER_DELETED', { id }),
};

/**
 * Broadcast settings updates
 */
export function syncSettings(settings: Record<string, any>): void {
  broadcastSync('SETTINGS_UPDATED', settings);
}

/**
 * Broadcast wallpaper changes
 */
export function syncWallpaper(wallpaperId: string): void {
  broadcastSync('WALLPAPER_CHANGED', { wallpaperId });
}

/**
 * Close the broadcast channel (cleanup)
 */
export function closeSyncChannel(): void {
  channel.close();
}
