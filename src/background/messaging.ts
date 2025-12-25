import { db } from '../newtab/services/database';
import { fetchFaviconAsDataUrl } from './favicon';

// Message types
type MessageType =
  | 'GET_CURRENT_TAB'
  | 'ADD_ICON'
  | 'GET_PENDING_ADD_ICON'
  | 'CLEAR_PENDING_ADD_ICON'
  | 'FETCH_FAVICON';

interface Message {
  type: MessageType;
  payload?: any;
}

interface Response {
  success: boolean;
  data?: any;
  error?: string;
}

// Main message handler
export async function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender
): Promise<Response> {
  try {
    switch (message.type) {
      case 'GET_CURRENT_TAB':
        return await handleGetCurrentTab();

      case 'ADD_ICON':
        return await handleAddIcon(message.payload);

      case 'GET_PENDING_ADD_ICON':
        return await handleGetPendingAddIcon();

      case 'CLEAR_PENDING_ADD_ICON':
        return await handleClearPendingAddIcon();

      case 'FETCH_FAVICON':
        return await handleFetchFavicon(message.payload.url);

      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error) {
    console.error('Message handling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get current tab info
async function handleGetCurrentTab(): Promise<Response> {
  const hasTabs = await chrome.permissions.contains({ permissions: ['tabs'] });
  if (!hasTabs) {
    return { success: false, error: 'TAB_PERMISSION_REQUIRED' };
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    return { success: false, error: 'No active tab' };
  }

  return {
    success: true,
    data: {
      url: tab.url || '',
      title: tab.title || '',
      favIconUrl: tab.favIconUrl || '',
    },
  };
}

// Default grid columns for position calculation
const DEFAULT_GRID_COLUMNS = 6;

/**
 * Calculate next available position in the grid
 * Similar logic to iconStore.ts getNextPosition
 */
async function calculateNextPosition(): Promise<{ x: number; y: number }> {
  try {
    // Get current icons and folders
    const icons = await db.icons.toArray();
    const folders = await db.folders.toArray();

    // Get grid columns from settings, default to 6
    let columns = DEFAULT_GRID_COLUMNS;
    try {
      const settings = await db.settings.get('viewSettings');
      if (settings?.value && typeof settings.value === 'object') {
        const viewSettings = settings.value as { columns?: number };
        if (viewSettings.columns && viewSettings.columns > 0) {
          columns = viewSettings.columns;
        }
      }
    } catch {
      // Use default columns on error
    }

    // Filter root icons (not in folders)
    const rootIcons = icons.filter(i => !i.folderId);
    const allItems = [...rootIcons, ...folders];

    if (allItems.length === 0) {
      return { x: 0, y: 0 };
    }

    // Find max y, then find max x in that row
    const maxY = Math.max(...allItems.map(item => item.position?.y ?? 0));
    const itemsInLastRow = allItems.filter(item => (item.position?.y ?? 0) === maxY);
    const maxX = Math.max(...itemsInLastRow.map(item => item.position?.x ?? 0));

    // If last row is full, start new row
    if (maxX >= columns - 1) {
      return { x: 0, y: maxY + 1 };
    }

    return { x: maxX + 1, y: maxY };
  } catch (error) {
    console.error('Failed to calculate next position:', error);
    return { x: 0, y: 0 };
  }
}

// Add icon (core logic)
async function handleAddIcon(iconData: any): Promise<Response> {
  const now = Date.now();
  const id = `icon_${now}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate position if not provided or is default {0, 0}
  let position = iconData.position;
  if (!position || (position.x === 0 && position.y === 0)) {
    position = await calculateNextPosition();
  }

  const newIcon = {
    ...iconData,
    id,
    type: 'icon' as const,
    position,
    createdAt: now,
    updatedAt: now,
  };

  // Write to IndexedDB
  await db.icons.add(newIcon);

  // Notify all new tabs via BroadcastChannel
  const channel = new BroadcastChannel('openinfinity-sync');
  channel.postMessage({
    type: 'ICON_ADDED',
    payload: newIcon,
  });
  channel.close();

  return { success: true, data: { id } };
}

// Get pending icon (triggered by context menu/keyboard shortcut)
async function handleGetPendingAddIcon(): Promise<Response> {
  const result = await chrome.storage.local.get('pendingAddIcon');

  if (result.pendingAddIcon) {
    return { success: true, data: result.pendingAddIcon };
  }

  return { success: false, error: 'No pending icon' };
}

// Clear pending icon
async function handleClearPendingAddIcon(): Promise<Response> {
  await chrome.storage.local.remove('pendingAddIcon');
  return { success: true };
}

// Fetch favicon (proxy to avoid CORS issues)
async function handleFetchFavicon(url: string): Promise<Response> {
  try {
    const dataUrl = await fetchFaviconAsDataUrl(url);
    return { success: true, data: dataUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch favicon',
    };
  }
}
