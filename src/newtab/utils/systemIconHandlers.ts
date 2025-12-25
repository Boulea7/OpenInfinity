/**
 * System Icon Click Handlers
 *
 * Handles click actions for system icons, routing to appropriate views.
 */

import type { Icon, SystemIconId } from '../services/database';
import { getSystemIconDef, type SystemIconAction } from '../services/systemIcons';
import { useNavigationStore } from '../stores/navigationStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useWeatherUiStore } from '../stores/weatherUiStore';
import { isSafeUrl } from './navigation';

/**
 * Handle system icon click
 * Returns true if handled, false if should use default behavior
 */
export function handleSystemIconClick(icon: Icon): boolean {
  if (!icon.isSystemIcon || !icon.systemIconId) {
    return false;
  }

  const def = getSystemIconDef(icon.systemIconId);
  if (!def) {
    console.warn('Unknown system icon:', icon.systemIconId);
    return false;
  }

  executeSystemIconAction(def.action, icon.systemIconId);
  return true;
}

/**
 * Execute a system icon action
 */
export function executeSystemIconAction(action: SystemIconAction, iconId: SystemIconId): void {
  const store = useNavigationStore.getState();

  switch (action.type) {
    case 'openSidePanel':
      store.openSidePanel(action.panel);
      break;

    case 'openSettings':
      if (action.tab) {
        store.openPanel('settings', action.tab as any);
      } else {
        store.openPanel('settings');
      }
      break;

    case 'openUrl':
      if (isSafeUrl(action.url)) {
        window.open(action.url, '_blank', 'noopener,noreferrer');
      } else {
        console.error('Blocked unsafe URL:', action.url);
      }
      break;

    case 'switchView':
      // Switch to NotesView or SearchView
      useSettingsStore.getState().setViewSettings({ currentView: action.view });
      break;

    case 'toggleWeatherExpand':
      // Toggle the CompactWeather expanded state
      useWeatherUiStore.getState().toggle();
      break;

    default:
      console.warn('Unknown action type for system icon:', iconId);
  }
}

/**
 * Check if an icon is a system icon
 */
export function isSystemIcon(icon: Icon): boolean {
  return icon.isSystemIcon === true && !!icon.systemIconId;
}
