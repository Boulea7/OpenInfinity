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
 * Data Backup and Restore Utilities
 *
 * This module provides comprehensive backup and restore functionality for all user data
 * stored in the OpenInfinity extension. It handles data from multiple storage layers:
 * - chrome.storage.local: Extension settings and preferences
 * - localStorage: Zustand persisted state
 * - IndexedDB: Icons, folders, todos, notes, wallpapers, and weather cache
 *
 * Key Features:
 * - Complete data export to portable JSON format
 * - Secure import with validation and size limits
 * - Blob-to-Base64 conversion for wallpaper images
 * - Atomic database transactions for data integrity
 * - Security measures against DoS and SSRF attacks
 *
 * Data Flow:
 * 1. Export: Collect all data -> Convert blobs to base64 -> Serialize to JSON
 * 2. Import: Validate JSON -> Clear existing data -> Restore all tables -> Reload
 *
 * @module utils/backup
 */

import { db } from '../services/database';

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum allowed backup file size in bytes (50MB).
 * This limit prevents potential denial-of-service attacks from
 * processing excessively large backup files.
 */
const MAX_BACKUP_SIZE = 50 * 1024 * 1024;

/**
 * Current backup format version.
 * Used for future migration support when backup format changes.
 */
const BACKUP_FORMAT_VERSION = '1.0.0';

/**
 * LocalStorage key for Zustand persisted settings.
 */
const SETTINGS_STORAGE_KEY = 'openinfinity-settings';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Complete backup data structure.
 *
 * Contains all user data from various storage layers, serialized
 * in a portable JSON format. Wallpaper blobs are converted to
 * base64 strings for JSON compatibility.
 *
 * @property {string} version - Backup format version for migration support
 * @property {string} appVersion - Extension version at export time
 * @property {number} exportedAt - Unix timestamp of export
 * @property {Record<string, any>} settings - chrome.storage.local data
 * @property {Record<string, any>} [localStorage] - Zustand persisted state
 * @property {Object} indexedDB - All IndexedDB table contents
 *
 * @example
 * ```ts
 * const backup: BackupData = {
 *   version: '1.0.0',
 *   appVersion: '2.1.0',
 *   exportedAt: 1704067200000,
 *   settings: { theme: 'dark', language: 'en' },
 *   localStorage: { 'openinfinity-settings': { ... } },
 *   indexedDB: {
 *     icons: [...],
 *     folders: [...],
 *     todos: [...],
 *     notes: [...],
 *     wallpapers: [...],
 *     weatherCache: [...]
 *   }
 * };
 * ```
 */
export interface BackupData {
  /** Backup format version for migration support */
  version: string;
  /** Extension version at the time of export */
  appVersion: string;
  /** Unix timestamp when the backup was created */
  exportedAt: number;
  /** Settings from chrome.storage.local */
  settings: Record<string, any>;
  /** Optional localStorage data (Zustand persist settings) */
  localStorage?: Record<string, any>;
  /** All IndexedDB table contents */
  indexedDB: {
    /** User's saved icons/bookmarks */
    icons: any[];
    /** Folder organization structure */
    folders: any[];
    /** Todo list items */
    todos: any[];
    /** User notes */
    notes: any[];
    /** Wallpaper images (blobs converted to base64) */
    wallpapers: any[];
    /** Cached weather data */
    weatherCache: any[];
  };
}

// ============================================================================
// Internal Functions - Blob Conversion
// ============================================================================

/**
 * Converts a Blob to a Base64 data URL string.
 *
 * Uses FileReader API to asynchronously read the blob and convert it
 * to a data URL format (e.g., "data:image/png;base64,iVBORw0KGgo...").
 * This allows binary data to be included in JSON exports.
 *
 * @param {Blob} blob - The binary blob to convert
 * @returns {Promise<string>} A promise resolving to the base64 data URL
 * @throws {Error} If the FileReader fails to produce a string result
 *
 * @example
 * ```ts
 * const imageBlob = new Blob([imageData], { type: 'image/png' });
 * const base64Url = await blobToBase64(imageBlob);
 * // Result: "data:image/png;base64,iVBORw0KGgo..."
 * ```
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      // FileReader.result is string when using readAsDataURL
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
 * Converts a Base64 data URL string back to a Blob.
 *
 * Uses the fetch API to parse the data URL and extract the blob.
 * For security, only allows data:image/ URLs to prevent SSRF attacks.
 *
 * @param {string} base64 - The base64 data URL to convert
 * @returns {Promise<Blob>} A promise resolving to the binary blob
 * @throws {Error} If the input is not a valid data:image/ URL
 *
 * @example
 * ```ts
 * const base64Url = "data:image/png;base64,iVBORw0KGgo...";
 * const blob = await base64ToBlob(base64Url);
 * // Result: Blob { size: 1234, type: "image/png" }
 * ```
 */
async function base64ToBlob(base64: string): Promise<Blob> {
  // Security: Only allow data:image/ URLs to prevent SSRF and other attacks
  if (!base64.startsWith('data:image/')) {
    throw new Error('Invalid base64 data: must be a data:image/ URL');
  }

  const response = await fetch(base64);
  return response.blob();
}

// ============================================================================
// Public API - Export
// ============================================================================

/**
 * Exports all user data to a JSON string.
 *
 * Collects data from all storage layers (chrome.storage.local, localStorage,
 * and IndexedDB) and serializes it to a portable JSON format. Wallpaper
 * blobs are converted to base64 strings for JSON compatibility.
 *
 * The export includes:
 * - Extension settings from chrome.storage.local
 * - Zustand persisted state from localStorage
 * - All IndexedDB tables (icons, folders, todos, notes, wallpapers, weatherCache)
 *
 * @description Creates a complete backup of all user data as JSON
 * @returns {Promise<string>} A promise resolving to the formatted JSON backup string
 * @throws {Error} If any data source fails to export
 *
 * @example
 * ```ts
 * // Export and download backup file
 * try {
 *   const jsonBackup = await exportAllData();
 *   const blob = new Blob([jsonBackup], { type: 'application/json' });
 *   const url = URL.createObjectURL(blob);
 *
 *   const link = document.createElement('a');
 *   link.href = url;
 *   link.download = `openinfinity-backup-${Date.now()}.json`;
 *   link.click();
 *
 *   URL.revokeObjectURL(url);
 * } catch (error) {
 *   console.error('Backup failed:', error);
 * }
 * ```
 */
export async function exportAllData(): Promise<string> {
  try {
    // Step 1: Export chrome.storage.local
    const chromeStorage = await chrome.storage.local.get();

    // Step 2: Export localStorage (Zustand persist settings)
    const localStorageData: Record<string, any> = {};
    const settingsValue = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (settingsValue) {
      try {
        localStorageData[SETTINGS_STORAGE_KEY] = JSON.parse(settingsValue);
      } catch {
        // If parsing fails, store raw string value
        localStorageData[SETTINGS_STORAGE_KEY] = settingsValue;
      }
    }

    // Step 3: Export all IndexedDB tables in parallel
    const [icons, folders, todos, notes, wallpapers, weatherCache] = await Promise.all([
      db.icons.toArray(),
      db.folders.toArray(),
      db.todos.toArray(),
      db.notes.toArray(),
      db.wallpapers.toArray(),
      db.weatherCache.toArray(),
    ]);

    // Step 4: Serialize wallpapers (convert Blob to base64)
    const wallpapersWithBase64 = await Promise.all(
      wallpapers.map(async (w) => {
        // Convert blob once and reuse to avoid duplicate serialization
        const base64 = w.blob ? await blobToBase64(w.blob) : undefined;
        return {
          ...w,
          blob: base64,
          // Store blob as base64 for JSON compatibility (used during import)
          _blobBase64: base64,
        };
      })
    );

    // Step 5: Construct backup object with metadata
    const backup: BackupData = {
      version: BACKUP_FORMAT_VERSION,
      appVersion: chrome.runtime.getManifest().version,
      exportedAt: Date.now(),
      settings: chromeStorage,
      localStorage: localStorageData,
      indexedDB: {
        icons,
        folders,
        todos,
        notes,
        wallpapers: wallpapersWithBase64,
        weatherCache,
      },
    };

    // Step 6: Stringify with 2-space indentation for readability
    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// Public API - Import
// ============================================================================

/**
 * Imports all user data from a JSON backup string.
 *
 * Validates and restores a complete backup, replacing all existing data.
 * The import process is performed atomically using a database transaction
 * to ensure data integrity.
 *
 * Security measures:
 * - File size limit (50MB) to prevent DoS attacks
 * - Base64 validation to prevent SSRF attacks
 * - Format validation before data restoration
 *
 * After successful import, the page is automatically reloaded to refresh
 * all application state.
 *
 * WARNING: This operation is destructive - all existing data will be replaced.
 *
 * @description Restores all user data from a backup JSON string
 * @param {string} jsonString - The JSON backup string to import
 * @returns {Promise<void>} A promise that resolves when import is complete
 * @throws {Error} If file exceeds size limit (50MB)
 * @throws {Error} If backup format is invalid (missing version or indexedDB)
 * @throws {Error} If JSON parsing fails
 * @throws {Error} If database transaction fails
 *
 * @example
 * ```ts
 * // Import from file input
 * const fileInput = document.querySelector<HTMLInputElement>('#backup-file');
 * fileInput.addEventListener('change', async (e) => {
 *   const file = (e.target as HTMLInputElement).files?.[0];
 *   if (!file) return;
 *
 *   try {
 *     const jsonString = await file.text();
 *
 *     // Validate before import
 *     validateBackupFile(jsonString);
 *
 *     // Confirm with user
 *     if (confirm('This will replace all existing data. Continue?')) {
 *       await importAllData(jsonString);
 *       // Page will reload automatically
 *     }
 *   } catch (error) {
 *     alert(`Import failed: ${error.message}`);
 *   }
 * });
 * ```
 */
export async function importAllData(jsonString: string): Promise<void> {
  try {
    // Security: Check file size limit to prevent DoS attacks
    if (jsonString.length > MAX_BACKUP_SIZE) {
      throw new Error('Backup file exceeds 50MB limit');
    }

    // Step 1: Parse and validate backup structure
    const backup: BackupData = JSON.parse(jsonString);

    if (!backup.version) {
      throw new Error('Invalid backup file: missing version');
    }

    if (!backup.indexedDB) {
      throw new Error('Invalid backup file: missing IndexedDB data');
    }

    console.info('Importing backup from version:', backup.version);
    console.info('Backup created at:', new Date(backup.exportedAt).toLocaleString());

    // Step 2: Restore chrome.storage.local
    await chrome.storage.local.clear();
    await chrome.storage.local.set(backup.settings);

    // Step 3: Restore localStorage (Zustand persist settings)
    if (backup.localStorage) {
      for (const [key, value] of Object.entries(backup.localStorage)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
      }
    }

    // Step 4: Restore IndexedDB with atomic transaction
    await db.transaction(
      'rw',
      [db.icons, db.folders, db.todos, db.notes, db.wallpapers, db.weatherCache],
      async () => {
        // Clear all existing data first
        await Promise.all([
          db.icons.clear(),
          db.folders.clear(),
          db.todos.clear(),
          db.notes.clear(),
          db.wallpapers.clear(),
          db.weatherCache.clear(),
        ]);

        // Import non-blob tables directly
        await db.icons.bulkAdd(backup.indexedDB.icons);
        await db.folders.bulkAdd(backup.indexedDB.folders);
        await db.todos.bulkAdd(backup.indexedDB.todos);
        await db.notes.bulkAdd(backup.indexedDB.notes);
        await db.weatherCache.bulkAdd(backup.indexedDB.weatherCache);

        // Convert base64 back to Blob for wallpapers
        const wallpapersWithBlob = await Promise.all(
          backup.indexedDB.wallpapers.map(async (w: any) => {
            const wallpaper = { ...w };

            // Restore blob from base64 if present
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

    // Step 5: Reload page to refresh all stores and UI
    window.location.reload();
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// Public API - Validation
// ============================================================================

/**
 * Validates a backup file format without importing.
 *
 * Performs structural validation to ensure the backup file contains
 * all required fields and tables. Use this before importing to give
 * users feedback about invalid files.
 *
 * Validation checks:
 * - Valid JSON syntax
 * - Required `version` field present
 * - Required `exportedAt` field is a number
 * - Required `indexedDB` object present
 * - All required tables exist and are arrays
 *
 * @description Validates backup file structure without modifying any data
 * @param {string} jsonString - The JSON backup string to validate
 * @returns {boolean} Always returns true if validation passes
 * @throws {Error} If JSON syntax is invalid
 * @throws {Error} If version field is missing
 * @throws {Error} If exportedAt field is invalid or missing
 * @throws {Error} If indexedDB data is missing
 * @throws {Error} If any required table is missing or not an array
 *
 * @example
 * ```ts
 * const fileInput = document.querySelector<HTMLInputElement>('#backup-file');
 *
 * fileInput.addEventListener('change', async (e) => {
 *   const file = (e.target as HTMLInputElement).files?.[0];
 *   if (!file) return;
 *
 *   const jsonString = await file.text();
 *
 *   try {
 *     validateBackupFile(jsonString);
 *     showSuccess('Valid backup file! Ready to import.');
 *     enableImportButton();
 *   } catch (error) {
 *     showError(`Invalid backup: ${error.message}`);
 *     disableImportButton();
 *   }
 * });
 * ```
 */
export function validateBackupFile(jsonString: string): boolean {
  try {
    const backup = JSON.parse(jsonString);

    // Check required version field
    if (!backup.version) {
      throw new Error('Missing version field');
    }

    // Check exportedAt is a valid timestamp
    if (!backup.exportedAt || typeof backup.exportedAt !== 'number') {
      throw new Error('Invalid or missing exportedAt field');
    }

    // Check indexedDB object exists
    if (!backup.indexedDB || typeof backup.indexedDB !== 'object') {
      throw new Error('Missing indexedDB data');
    }

    // Validate all required tables exist and are arrays
    const requiredTables = ['icons', 'folders', 'todos', 'notes', 'wallpapers'];
    for (const table of requiredTables) {
      if (!Array.isArray(backup.indexedDB[table])) {
        throw new Error(`Invalid or missing table: ${table}`);
      }
    }

    return true;
  } catch (error) {
    // Re-throw with more descriptive message for JSON syntax errors
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}
