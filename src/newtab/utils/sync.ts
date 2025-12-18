/**
 * Multi-tab Synchronization using BroadcastChannel API
 * Keeps icon/folder data synced across all open tabs
 */

import type { Icon, Folder } from '../services/database';

// P2-3: Type-safe sync messages using discriminated union
export type SyncMessage =
  | { type: 'ICON_ADDED'; payload: Icon; timestamp: number; tabId: string }
  | { type: 'ICON_UPDATED'; payload: Partial<Icon> & { id: string }; timestamp: number; tabId: string }
  | { type: 'ICON_DELETED'; payload: { id: string }; timestamp: number; tabId: string }
  | { type: 'BOOKMARKS_IMPORTED'; payload: { imported: number }; timestamp: number; tabId: string }
  | { type: 'FOLDER_ADDED'; payload: Folder; timestamp: number; tabId: string }
  | { type: 'FOLDER_UPDATED'; payload: Partial<Folder> & { id: string }; timestamp: number; tabId: string }
  | { type: 'FOLDER_DELETED'; payload: { id: string }; timestamp: number; tabId: string }
  | { type: 'SETTINGS_UPDATED'; payload: Record<string, any>; timestamp: number; tabId: string }
  | { type: 'WALLPAPER_CHANGED'; payload: { wallpaperId: string }; timestamp: number; tabId: string };

// Sync message types
export type SyncMessageType = SyncMessage['type'];

// Generate unique tab ID
const TAB_ID = crypto.randomUUID();

// Create BroadcastChannel instance
const channel = new BroadcastChannel('openinfinity-sync');

/**
 * Broadcast a sync message to all other tabs
 * P2-3: Type-safe message construction
 */
function broadcastSync<T extends SyncMessage['type']>(
  type: T,
  payload: Extract<SyncMessage, { type: T }>['payload']
): void {
  const message = {
    type,
    payload,
    timestamp: Date.now(),
    tabId: TAB_ID,
  } as SyncMessage;

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
 * Broadcast bookmark import completion (batch sync)
 */
export const syncBookmarks = {
  imported: (imported: number) => broadcastSync('BOOKMARKS_IMPORTED', { imported }),
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
