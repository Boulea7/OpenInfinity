/**
 * OpenInfinity Background Service Worker
 * Handles background tasks like alarms, notifications, and data sync
 */

import { setupContextMenus } from './contextMenu';
import { setupCommands } from './commands';
import { handleMessage } from './messaging';

// Initialize context menus and keyboard commands
setupContextMenus();
setupCommands();

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.info('OpenInfinity installed successfully');
    // Initialize default settings or show welcome page
  } else if (details.reason === 'update') {
    console.info(`OpenInfinity updated to version ${chrome.runtime.getManifest().version}`);
  }
});

// Listen for alarms (for wallpaper auto-change, RSS updates, etc.)
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'wallpaper-auto-change':
      handleWallpaperAutoChange();
      break;
    case 'rss-update':
      handleRSSUpdate();
      break;
    case 'notification-check':
      handleNotificationCheck();
      break;
    default:
      console.info(`Unknown alarm: ${alarm.name}`);
  }
});

/**
 * Handle wallpaper auto-change alarm
 */
async function handleWallpaperAutoChange(): Promise<void> {
  // This will be implemented to fetch a new random wallpaper
  console.info('Wallpaper auto-change triggered');
}

/**
 * Handle RSS feed update alarm
 */
async function handleRSSUpdate(): Promise<void> {
  // This will be implemented to fetch and update RSS feeds
  console.info('RSS update triggered');
}

/**
 * Handle notification check alarm
 */
async function handleNotificationCheck(): Promise<void> {
  // This will be implemented to check for new emails/tasks
  console.info('Notification check triggered');
}

// Setup default alarms on startup
chrome.runtime.onStartup.addListener(() => {
  setupDefaultAlarms();
});

/**
 * Setup default alarms for background tasks
 */
function setupDefaultAlarms(): void {
  // Check for notifications every 15 minutes
  chrome.alarms.create('notification-check', {
    periodInMinutes: 15,
  });

  // RSS update every hour
  chrome.alarms.create('rss-update', {
    periodInMinutes: 60,
  });
}

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle Popup messages
  handleMessage(message, sender).then(sendResponse);

  // Handle legacy messages
  switch (message.type) {
    case 'GET_STORAGE_USAGE':
      getStorageUsage().then(sendResponse);
      return true; // Indicates async response

    case 'CLEAR_CACHE':
      clearCache().then(sendResponse);
      return true;

    case 'EXPORT_DATA':
      exportAllData().then(sendResponse);
      return true;

    case 'IMPORT_DATA':
      importData(message.data).then(sendResponse);
      return true;

    default:
      // Already handled by handleMessage
      break;
  }

  return true; // Keep message channel open for async response
});

/**
 * Get storage usage statistics
 */
async function getStorageUsage(): Promise<{ local: number; sync: number }> {
  const local = await chrome.storage.local.getBytesInUse();
  const sync = await chrome.storage.sync.getBytesInUse();
  return { local, sync };
}

/**
 * Clear cached data
 */
async function clearCache(): Promise<{ success: boolean }> {
  try {
    // Clear specific cache keys while preserving user data
    await chrome.storage.local.remove(['wallpaperCache', 'faviconCache']);
    return { success: true };
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return { success: false };
  }
}

/**
 * Export all user data for backup
 */
async function exportAllData(): Promise<{ data: string; timestamp: number }> {
  const localData = await chrome.storage.local.get(null);
  const syncData = await chrome.storage.sync.get(null);

  const exportData = {
    version: chrome.runtime.getManifest().version,
    exportedAt: Date.now(),
    local: localData,
    sync: syncData,
  };

  return {
    data: JSON.stringify(exportData, null, 2),
    timestamp: Date.now(),
  };
}

/**
 * Import user data from backup
 */
async function importData(data: string): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = JSON.parse(data);

    if (!parsed.version || !parsed.local) {
      return { success: false, error: 'Invalid backup format' };
    }

    // Restore local storage
    await chrome.storage.local.set(parsed.local);

    // Restore sync storage if present
    if (parsed.sync) {
      await chrome.storage.sync.set(parsed.sync);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
}

// Log service worker activation
console.info('OpenInfinity background service worker activated');
