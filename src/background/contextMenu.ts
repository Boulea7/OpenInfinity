/**
 * Setup right-click context menu
 */
export function setupContextMenus(): void {
  const MENU_ID = 'add-to-openinfinity';

  async function ensureContextMenu(): Promise<void> {
    const hasPermission = await chrome.permissions.contains({ permissions: ['contextMenus'] });
    if (!hasPermission) return;

    chrome.contextMenus.create(
      {
        id: MENU_ID,
        title: '添加到 OpenInfinity',
        contexts: ['page', 'link'],
      },
      () => {
        // Swallow duplicate-creation errors to avoid console noise.
        void chrome.runtime.lastError;
      }
    );
  }

  chrome.runtime.onInstalled.addListener(() => {
    void ensureContextMenu();
  });

  // If user grants optional contextMenus permission later, create the menu then.
  chrome.permissions.onAdded.addListener((added) => {
    if (added.permissions?.includes('contextMenus')) {
      void ensureContextMenu();
    }
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU_ID) return;

    // tabs/activeTab are optional; request on demand (context menu click is a user gesture).
    const grantedTabs = await chrome.permissions.request({ permissions: ['tabs', 'activeTab'] });

    const url = info.linkUrl || (grantedTabs ? tab?.url : '') || '';
    const title = (grantedTabs ? tab?.title : '') || '';

    // Store pending add icon data
    await chrome.storage.local.set({
      pendingAddIcon: { url, title, timestamp: Date.now() },
    });

    // Open popup
    chrome.action.openPopup();
  });
}
