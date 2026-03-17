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
 * Multi-tab Synchronization Utilities
 *
 * This module provides real-time synchronization of data across multiple browser tabs
 * using the BroadcastChannel API. It enables seamless updates to icons, folders,
 * settings, and wallpapers without requiring page refreshes.
 *
 * Key Features:
 * - Type-safe message broadcasting using discriminated unions
 * - Automatic tab identification to prevent self-messaging
 * - Support for icons, folders, bookmarks, settings, and wallpaper sync
 * - Clean event listener management with unsubscribe callbacks
 *
 * Architecture:
 * - Uses BroadcastChannel API for cross-tab communication
 * - Each tab has a unique identifier (UUID) to filter out its own messages
 * - Messages are timestamped for potential conflict resolution
 *
 * @module utils/sync
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
 */

import type { Icon, Folder } from '../services/database';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Discriminated union type for all sync messages.
 *
 * Each message type has a specific payload structure, enabling type-safe
 * handling in message consumers. The discriminant is the `type` field.
 *
 * Common fields for all message types:
 * - `type`: Message type identifier (discriminant)
 * - `payload`: Type-specific data payload
 * - `timestamp`: Unix timestamp when message was created
 * - `tabId`: Unique identifier of the sending tab
 *
 * @example
 * ```ts
 * // Type guard example
 * function handleMessage(msg: SyncMessage) {
 *   switch (msg.type) {
 *     case 'ICON_ADDED':
 *       console.log('New icon:', msg.payload.title);
 *       break;
 *     case 'SETTINGS_UPDATED':
 *       console.log('Settings changed:', msg.payload);
 *       break;
 *   }
 * }
 * ```
 */
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

/**
 * Union of all valid sync message type strings.
 * Useful for type guards and message filtering.
 */
export type SyncMessageType = SyncMessage['type'];

// ============================================================================
// Constants
// ============================================================================

/**
 * Unique identifier for the current tab.
 * Generated once per tab lifecycle using crypto.randomUUID().
 * Used to filter out messages sent by this tab to prevent echo.
 */
const TAB_ID = crypto.randomUUID();

/**
 * BroadcastChannel instance for cross-tab communication.
 * Channel name: 'openinfinity-sync'
 * All OpenInfinity tabs use this same channel for synchronization.
 */
const channel = new BroadcastChannel('openinfinity-sync');

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Broadcasts a type-safe sync message to all other tabs.
 *
 * This is an internal function that constructs properly typed messages
 * and posts them to the BroadcastChannel. The generic type parameter
 * ensures that the payload matches the expected type for the given message type.
 *
 * @template T - The sync message type (e.g., 'ICON_ADDED', 'SETTINGS_UPDATED')
 * @param {T} type - The message type identifier
 * @param {Extract<SyncMessage, { type: T }>['payload']} payload - The payload data,
 *        must match the expected type for the given message type
 * @returns {void}
 *
 * @example
 * ```ts
 * // Internal usage - type-safe payload
 * broadcastSync('ICON_ADDED', { id: '1', title: 'Example', url: 'https://...' });
 *
 * // TypeScript will error if payload doesn't match:
 * broadcastSync('ICON_ADDED', { wrongField: true }); // Error!
 * ```
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

// ============================================================================
// Public API - Listeners
// ============================================================================

/**
 * Registers a listener for sync messages from other tabs.
 *
 * The callback will be invoked for every message received from other tabs.
 * Messages from the current tab are automatically filtered out.
 *
 * @description Subscribes to cross-tab sync events via BroadcastChannel
 * @param {function(SyncMessage): void} callback - Function to call when a sync message is received
 * @returns {function(): void} A cleanup function that removes the event listener when called
 *
 * @example
 * ```ts
 * // In a React component
 * useEffect(() => {
 *   const unsubscribe = listenForSync((message) => {
 *     switch (message.type) {
 *       case 'ICON_ADDED':
 *         // Refresh icons list
 *         refetchIcons();
 *         break;
 *       case 'SETTINGS_UPDATED':
 *         // Update local settings state
 *         setSettings(prev => ({ ...prev, ...message.payload }));
 *         break;
 *     }
 *   });
 *
 *   // Cleanup on unmount
 *   return unsubscribe;
 * }, []);
 * ```
 */
export function listenForSync(
  callback: (message: SyncMessage) => void
): () => void {
  const handler = (event: MessageEvent<SyncMessage>) => {
    const message = event.data;

    // Ignore messages from this tab to prevent echo
    if (message.tabId === TAB_ID) {
      return;
    }

    callback(message);
  };

  channel.addEventListener('message', handler);

  // Return cleanup function for proper resource management
  return () => {
    channel.removeEventListener('message', handler);
  };
}

// ============================================================================
// Public API - Icon Sync
// ============================================================================

/**
 * Icon synchronization operations.
 *
 * Provides methods to broadcast icon-related changes to other tabs.
 * Use these methods after successfully modifying icons in the database.
 *
 * @description Object containing icon sync operations: added, updated, deleted
 *
 * @example
 * ```ts
 * // After adding a new icon to the database
 * const newIcon = await db.icons.add({ ... });
 * syncIcon.added(newIcon);
 *
 * // After updating an icon
 * await db.icons.update(iconId, changes);
 * syncIcon.updated({ id: iconId, ...changes });
 *
 * // After deleting an icon
 * await db.icons.delete(iconId);
 * syncIcon.deleted(iconId);
 * ```
 */
export const syncIcon = {
  /**
   * Broadcasts that a new icon was added.
   *
   * @param {Icon} icon - The complete icon object that was added
   * @returns {void}
   */
  added: (icon: Icon) => broadcastSync('ICON_ADDED', icon),

  /**
   * Broadcasts that an icon was updated.
   *
   * @param {Partial<Icon> & { id: string }} icon - Partial icon object with id and changed fields
   * @returns {void}
   */
  updated: (icon: Partial<Icon> & { id: string }) => broadcastSync('ICON_UPDATED', icon),

  /**
   * Broadcasts that an icon was deleted.
   *
   * @param {string} id - The ID of the deleted icon
   * @returns {void}
   */
  deleted: (id: string) => broadcastSync('ICON_DELETED', { id }),
};

// ============================================================================
// Public API - Bookmark Sync
// ============================================================================

/**
 * Bookmark import synchronization operations.
 *
 * Used to notify other tabs when bookmarks have been bulk imported.
 * This triggers a full refresh of the icons list in other tabs.
 *
 * @description Object containing bookmark sync operations
 *
 * @example
 * ```ts
 * // After importing bookmarks
 * const importedCount = await importBrowserBookmarks();
 * syncBookmarks.imported(importedCount);
 * ```
 */
export const syncBookmarks = {
  /**
   * Broadcasts that bookmarks were imported.
   *
   * @param {number} imported - Number of bookmarks that were imported
   * @returns {void}
   */
  imported: (imported: number) => broadcastSync('BOOKMARKS_IMPORTED', { imported }),
};

// ============================================================================
// Public API - Folder Sync
// ============================================================================

/**
 * Folder synchronization operations.
 *
 * Provides methods to broadcast folder-related changes to other tabs.
 * Use these methods after successfully modifying folders in the database.
 *
 * @description Object containing folder sync operations: added, updated, deleted
 *
 * @example
 * ```ts
 * // After creating a new folder
 * const newFolder = await db.folders.add({ ... });
 * syncFolder.added(newFolder);
 *
 * // After renaming a folder
 * await db.folders.update(folderId, { name: newName });
 * syncFolder.updated({ id: folderId, name: newName });
 *
 * // After deleting a folder
 * await db.folders.delete(folderId);
 * syncFolder.deleted(folderId);
 * ```
 */
export const syncFolder = {
  /**
   * Broadcasts that a new folder was added.
   *
   * @param {Folder} folder - The complete folder object that was added
   * @returns {void}
   */
  added: (folder: Folder) => broadcastSync('FOLDER_ADDED', folder),

  /**
   * Broadcasts that a folder was updated.
   *
   * @param {Partial<Folder> & { id: string }} folder - Partial folder object with id and changed fields
   * @returns {void}
   */
  updated: (folder: Partial<Folder> & { id: string }) => broadcastSync('FOLDER_UPDATED', folder),

  /**
   * Broadcasts that a folder was deleted.
   *
   * @param {string} id - The ID of the deleted folder
   * @returns {void}
   */
  deleted: (id: string) => broadcastSync('FOLDER_DELETED', { id }),
};

// ============================================================================
// Public API - Settings Sync
// ============================================================================

/**
 * Broadcasts settings updates to other tabs.
 *
 * Call this function whenever user settings are modified to ensure
 * all open tabs reflect the latest configuration.
 *
 * @description Syncs settings changes across all open tabs
 * @param {Record<string, any>} settings - Object containing the updated settings key-value pairs
 * @returns {void}
 *
 * @example
 * ```ts
 * // After updating theme setting
 * await chrome.storage.local.set({ theme: 'dark' });
 * syncSettings({ theme: 'dark' });
 *
 * // After updating multiple settings
 * const updates = { theme: 'dark', language: 'zh-CN' };
 * await chrome.storage.local.set(updates);
 * syncSettings(updates);
 * ```
 */
export function syncSettings(settings: Record<string, any>): void {
  broadcastSync('SETTINGS_UPDATED', settings);
}

// ============================================================================
// Public API - Wallpaper Sync
// ============================================================================

/**
 * Broadcasts wallpaper change to other tabs.
 *
 * Call this function when the user selects a new wallpaper to ensure
 * all open tabs display the same wallpaper.
 *
 * @description Syncs wallpaper selection across all open tabs
 * @param {string} wallpaperId - The ID of the newly selected wallpaper
 * @returns {void}
 *
 * @example
 * ```ts
 * // After user selects a new wallpaper
 * await setActiveWallpaper(wallpaperId);
 * syncWallpaper(wallpaperId);
 * ```
 */
export function syncWallpaper(wallpaperId: string): void {
  broadcastSync('WALLPAPER_CHANGED', { wallpaperId });
}

// ============================================================================
// Public API - Cleanup
// ============================================================================

/**
 * Closes the BroadcastChannel connection.
 *
 * Call this function during application cleanup to release resources.
 * After calling this function, no further messages can be sent or received.
 *
 * Note: In most cases, you don't need to call this manually as the channel
 * will be automatically closed when the page unloads.
 *
 * @description Releases the BroadcastChannel resources
 * @returns {void}
 *
 * @example
 * ```ts
 * // In app cleanup logic
 * window.addEventListener('beforeunload', () => {
 *   closeSyncChannel();
 * });
 * ```
 */
export function closeSyncChannel(): void {
  channel.close();
}
