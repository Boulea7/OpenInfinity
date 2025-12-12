/**
 * Data Backup and Restore Utilities
 * Complete backup of all user data (chrome.storage + IndexedDB)
 */

import { db } from '../services/database';

/**
 * Backup data structure
 */
export interface BackupData {
  version: string;
  appVersion: string;
  exportedAt: number;
  settings: Record<string, any>; // From chrome.storage.local
  indexedDB: {
    icons: any[];
    folders: any[];
    todos: any[];
    notes: any[];
    wallpapers: any[];
    weatherCache: any[];
  };
}

/**
 * Convert Blob to Base64 string for JSON serialization
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert Base64 string back to Blob
 */
async function base64ToBlob(base64: string): Promise<Blob> {
  const response = await fetch(base64);
  return response.blob();
}

/**
 * Export all user data to JSON
 * Includes chrome.storage and all IndexedDB tables
 *
 * @returns JSON string of complete backup
 */
export async function exportAllData(): Promise<string> {
  try {
    // 1. Export chrome.storage.local
    const chromeStorage = await chrome.storage.local.get();

    // 2. Export all IndexedDB tables
    const [icons, folders, todos, notes, wallpapers, weatherCache] = await Promise.all([
      db.icons.toArray(),
      db.folders.toArray(),
      db.todos.toArray(),
      db.notes.toArray(),
      db.wallpapers.toArray(),
      db.weatherCache.toArray(),
    ]);

    // 3. Serialize wallpapers (convert Blob to base64)
    const wallpapersWithBase64 = await Promise.all(
      wallpapers.map(async (w) => ({
        ...w,
        blob: w.blob ? await blobToBase64(w.blob) : undefined,
        // Store blob as base64 for JSON compatibility
        _blobBase64: w.blob ? await blobToBase64(w.blob) : undefined,
      }))
    );

    // 4. Construct backup object
    const backup: BackupData = {
      version: '1.0.0',
      appVersion: chrome.runtime.getManifest().version,
      exportedAt: Date.now(),
      settings: chromeStorage,
      indexedDB: {
        icons,
        folders,
        todos,
        notes,
        wallpapers: wallpapersWithBase64,
        weatherCache,
      },
    };

    // 5. Stringify with formatting
    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import all user data from JSON backup
 * Replaces all existing data
 *
 * @param jsonString - JSON backup string
 */
export async function importAllData(jsonString: string): Promise<void> {
  try {
    // 1. Parse and validate backup
    const backup: BackupData = JSON.parse(jsonString);

    if (!backup.version) {
      throw new Error('Invalid backup file: missing version');
    }

    if (!backup.indexedDB) {
      throw new Error('Invalid backup file: missing IndexedDB data');
    }

    console.info('Importing backup from version:', backup.version);
    console.info('Backup created at:', new Date(backup.exportedAt).toLocaleString());

    // 2. Restore chrome.storage.local
    await chrome.storage.local.clear();
    await chrome.storage.local.set(backup.settings);

    // 3. Restore IndexedDB
    await db.transaction(
      'rw',
      [db.icons, db.folders, db.todos, db.notes, db.wallpapers, db.weatherCache],
      async () => {
        // Clear existing data
        await Promise.all([
          db.icons.clear(),
          db.folders.clear(),
          db.todos.clear(),
          db.notes.clear(),
          db.wallpapers.clear(),
          db.weatherCache.clear(),
        ]);

        // Import new data
        await db.icons.bulkAdd(backup.indexedDB.icons);
        await db.folders.bulkAdd(backup.indexedDB.folders);
        await db.todos.bulkAdd(backup.indexedDB.todos);
        await db.notes.bulkAdd(backup.indexedDB.notes);
        await db.weatherCache.bulkAdd(backup.indexedDB.weatherCache);

        // Convert base64 back to Blob for wallpapers
        const wallpapersWithBlob = await Promise.all(
          backup.indexedDB.wallpapers.map(async (w: any) => {
            const wallpaper = { ...w };

            // Restore blob from base64
            if (w._blobBase64) {
              wallpaper.blob = await base64ToBlob(w._blobBase64);
              delete wallpaper._blobBase64;
            }

            return wallpaper;
          })
        );

        await db.wallpapers.bulkAdd(wallpapersWithBlob);
      }
    );

    console.info('Import completed successfully');

    // 4. Reload page to refresh all stores
    window.location.reload();
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate backup file format
 *
 * @param jsonString - JSON backup string
 * @returns true if valid, throws error if invalid
 */
export function validateBackupFile(jsonString: string): boolean {
  try {
    const backup = JSON.parse(jsonString);

    if (!backup.version) {
      throw new Error('Missing version field');
    }

    if (!backup.exportedAt || typeof backup.exportedAt !== 'number') {
      throw new Error('Invalid or missing exportedAt field');
    }

    if (!backup.indexedDB || typeof backup.indexedDB !== 'object') {
      throw new Error('Missing indexedDB data');
    }

    const requiredTables = ['icons', 'folders', 'todos', 'notes', 'wallpapers'];
    for (const table of requiredTables) {
      if (!Array.isArray(backup.indexedDB[table])) {
        throw new Error(`Invalid or missing table: ${table}`);
      }
    }

    return true;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}
