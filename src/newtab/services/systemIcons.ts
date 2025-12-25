/**
 * System Icons Service
 *
 * Manages the 9 default system shortcuts that are injected on first load.
 * These icons can be dragged, sorted, placed in folders, and hidden (not deleted).
 */

import { db, type Icon, type SystemIconId } from './database';

/**
 * System icon action types
 */
export type SystemIconAction =
  | { type: 'openSidePanel'; panel: 'todo' | 'bookmarks' | 'history' | 'extensions' }
  | { type: 'openSettings'; tab?: string }
  | { type: 'openUrl'; url: string }
  | { type: 'switchView'; view: 'search' | 'notes' }
  | { type: 'toggleWeatherExpand' };

/**
 * System icon definition
 */
export interface SystemIconDefinition {
  id: SystemIconId;
  name: string;
  nameEn: string;
  action: SystemIconAction;
  // Visual properties
  iconType: 'svg' | 'dynamic'; // 'dynamic' for weather (background changes)
  svgName?: string; // SVG component name for static icons
  defaultColor?: string; // Default background color
}

/**
 * All 9 system icon definitions
 */
export const SYSTEM_ICONS: SystemIconDefinition[] = [
  {
    id: 'system-weather',
    name: '天气',
    nameEn: 'Weather',
    action: { type: 'toggleWeatherExpand' },
    iconType: 'dynamic',
    // Keep a stable icon name for rendering (DB may contain legacy values).
    svgName: 'weather',
    defaultColor: '#60a5fa', // sky-400 default
  },
  {
    id: 'system-todo',
    name: '待办事项',
    nameEn: 'Todo',
    action: { type: 'openSidePanel', panel: 'todo' },
    iconType: 'svg',
    svgName: 'todo',
    defaultColor: '#ffffff',
  },
  {
    id: 'system-notes',
    name: '笔记',
    nameEn: 'Notes',
    action: { type: 'switchView', view: 'notes' },
    iconType: 'svg',
    svgName: 'notes',
    defaultColor: '#ffffff',
  },
  {
    id: 'system-settings',
    name: '设置',
    nameEn: 'Settings',
    action: { type: 'openSettings' },
    iconType: 'svg',
    svgName: 'settings',
    defaultColor: '#ffffff',
  },
  {
    id: 'system-wallpaper',
    name: '壁纸库',
    nameEn: 'Wallpaper',
    action: { type: 'openSettings', tab: 'wallpaper' },
    iconType: 'svg',
    svgName: 'wallpaper',
    defaultColor: '#ffffff',
  },
  {
    id: 'system-openinfinity',
    name: 'OpenInfinity',
    nameEn: 'OpenInfinity',
    action: { type: 'openUrl', url: 'https://github.com/Boulea7/OpenInfinity' },
    iconType: 'svg',
    svgName: 'openinfinity',
    defaultColor: '#ffffff',
  },
  {
    id: 'system-bookmarks',
    name: '书签',
    nameEn: 'Bookmarks',
    action: { type: 'openSidePanel', panel: 'bookmarks' },
    iconType: 'svg',
    svgName: 'bookmarks',
    defaultColor: '#ffffff',
  },
  {
    id: 'system-history',
    name: '历史记录',
    nameEn: 'History',
    action: { type: 'openSidePanel', panel: 'history' },
    iconType: 'svg',
    svgName: 'history',
    defaultColor: '#ffffff',
  },
  {
    id: 'system-extensions',
    name: '扩展管理',
    nameEn: 'Extensions',
    action: { type: 'openSidePanel', panel: 'extensions' },
    iconType: 'svg',
    svgName: 'extensions',
    defaultColor: '#ffffff',
  },
];

/**
 * Get system icon definition by ID
 */
export function getSystemIconDef(id: SystemIconId): SystemIconDefinition | undefined {
  return SYSTEM_ICONS.find((icon) => icon.id === id);
}

/**
 * Check if any system icons exist in the database
 * Note: isSystemIcon is not indexed, so we use filter instead of where
 */
export async function hasSystemIcons(): Promise<boolean> {
  const icons = await db.icons.toArray();
  return icons.some((icon) => icon.isSystemIcon === true);
}

/**
 * Inject all system icons into the database
 * Called on first load or after data reset
 *
 * @param visibility - Record of which icons should be visible (from settings)
 * @returns Number of icons injected
 */
export async function injectSystemIcons(
  visibility: Record<SystemIconId, boolean>
): Promise<number> {
  // Note: isSystemIcon is not indexed, so we filter in JS
  const allIcons = await db.icons.toArray();
  const existingIds = new Set(
    allIcons.filter((icon) => icon.isSystemIcon === true).map((icon) => icon.systemIconId)
  );

  const iconsToInject: Icon[] = [];
  let position = 0;

  for (const def of SYSTEM_ICONS) {
    // Skip if already exists
    if (existingIds.has(def.id)) continue;

    // Skip if hidden in settings
    if (!visibility[def.id]) continue;

    const now = Date.now();
    const icon: Icon = {
      id: def.id, // Use system icon ID as database ID
      type: 'icon',
      title: def.name,
      url: `system://${def.id}`, // Special URL scheme for system icons
      icon: {
        type: 'system',
        value: def.svgName || def.id,
      },
      position: { x: position, y: 0 },
      createdAt: now,
      updatedAt: now,
      isSystemIcon: true,
      systemIconId: def.id,
      isHidden: false,
    };

    iconsToInject.push(icon);
    position++;
  }

  if (iconsToInject.length > 0) {
    await db.icons.bulkAdd(iconsToInject);
  }

  return iconsToInject.length;
}

/**
 * Hide a system icon (instead of deleting it)
 * Saves the original position for potential restoration
 *
 * @param iconId - The system icon ID to hide
 */
export async function hideSystemIcon(iconId: SystemIconId): Promise<void> {
  const icon = await db.icons.get(iconId);
  if (!icon || !icon.isSystemIcon) return;

  await db.icons.update(iconId, {
    isHidden: true,
    originalPosition: icon.position,
    originalFolderId: icon.folderId,
    // Remove from folder if in one
    folderId: undefined,
  });
}

/**
 * Find next available position in a folder or root level
 * Scans existing icons to find an unoccupied grid position
 */
async function findNextAvailablePosition(
  folderId: string | undefined,
  excludeIconId: string
): Promise<{ x: number; y: number }> {
  const allIcons = await db.icons.toArray();
  const iconsInScope = allIcons.filter(
    (i) => i.id !== excludeIconId && !i.isHidden && (folderId ? i.folderId === folderId : !i.folderId)
  );

  const occupiedPositions = new Set(iconsInScope.map((i) => `${i.position.x},${i.position.y}`));

  // Scan grid positions (assumes reasonable max columns)
  const MAX_COLS = 20;
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < MAX_COLS; x++) {
      if (!occupiedPositions.has(`${x},${y}`)) {
        return { x, y };
      }
    }
  }

  // Fallback to origin if no position found (shouldn't happen)
  return { x: 0, y: 0 };
}

/**
 * Restore a hidden system icon
 * Attempts to restore to original position if available
 * Validates folder existence and checks for position conflicts
 *
 * @param iconId - The system icon ID to restore
 */
export async function restoreSystemIcon(iconId: SystemIconId): Promise<void> {
  const icon = await db.icons.get(iconId);
  if (!icon || !icon.isSystemIcon) return;

  // Validate folder existence - if original folder was deleted, restore to root
  let targetFolderId = icon.originalFolderId;
  if (targetFolderId) {
    const folder = await db.folders.get(targetFolderId);
    if (!folder) {
      // Folder was deleted, restore to root level
      targetFolderId = undefined;
    }
  }

  // Try to restore original position, check for conflicts
  let position = icon.originalPosition || { x: 0, y: 0 };

  // Check if position is occupied
  const allIcons = await db.icons.toArray();
  const iconsInScope = allIcons.filter(
    (i) =>
      i.id !== iconId &&
      !i.isHidden &&
      (targetFolderId ? i.folderId === targetFolderId : !i.folderId)
  );
  const isOccupied = iconsInScope.some(
    (i) => i.position.x === position.x && i.position.y === position.y
  );

  if (isOccupied) {
    // Find next available position
    position = await findNextAvailablePosition(targetFolderId, iconId);
  }

  await db.icons.update(iconId, {
    isHidden: false,
    position,
    folderId: targetFolderId,
    // Clear saved original values
    originalPosition: undefined,
    originalFolderId: undefined,
  });
}

/**
 * Get all visible (non-hidden) system icons
 * Note: isSystemIcon is not indexed, so we filter in JS
 */
export async function getVisibleSystemIcons(): Promise<Icon[]> {
  const allIcons = await db.icons.toArray();
  return allIcons.filter((icon) => icon.isSystemIcon === true && !icon.isHidden);
}

/**
 * Get all hidden system icons
 * Note: isSystemIcon is not indexed, so we filter in JS
 */
export async function getHiddenSystemIcons(): Promise<Icon[]> {
  const allIcons = await db.icons.toArray();
  return allIcons.filter((icon) => icon.isSystemIcon === true && icon.isHidden === true);
}

/**
 * Re-inject a single system icon (used when restoring from settings)
 *
 * @param iconId - The system icon ID to reinject
 * @param position - Optional position, defaults to {x: 0, y: 0}
 */
export async function reinjectSystemIcon(
  iconId: SystemIconId,
  position?: { x: number; y: number }
): Promise<void> {
  const def = getSystemIconDef(iconId);
  if (!def) return;

  // Check if already exists
  const existing = await db.icons.get(iconId);
  if (existing) {
    // Just unhide it
    await restoreSystemIcon(iconId);
    return;
  }

  // Create new icon
  const now = Date.now();
  const icon: Icon = {
    id: iconId,
    type: 'icon',
    title: def.name,
    url: `system://${def.id}`,
    icon: {
      type: 'system',
      value: def.svgName || def.id,
    },
    position: position || { x: 0, y: 0 },
    createdAt: now,
    updatedAt: now,
    isSystemIcon: true,
    systemIconId: def.id,
    isHidden: false,
  };

  await db.icons.add(icon);
}

/**
 * Delete a system icon completely (used for reset)
 * This permanently removes the icon - use hideSystemIcon for normal "delete" operations
 */
export async function deleteSystemIconPermanently(iconId: SystemIconId): Promise<void> {
  await db.icons.delete(iconId);
}

/**
 * Delete all system icons (used for reset)
 * Note: isSystemIcon is not indexed, so we filter in JS
 */
export async function deleteAllSystemIcons(): Promise<void> {
  const allIcons = await db.icons.toArray();
  const systemIcons = allIcons.filter((icon) => icon.isSystemIcon === true);
  const ids = systemIcons.map((icon) => icon.id).filter((id): id is string => typeof id === 'string');
  await db.icons.bulkDelete(ids);
}
