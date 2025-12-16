/**
 * Setup right-click context menu
 */
export function setupContextMenus(): void {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'add-to-openinfinity',
      title: '添加到 OpenInfinity',
      contexts: ['page', 'link'],
    });
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'add-to-openinfinity' && tab) {
      const url = info.linkUrl || tab.url || '';
      const title = tab.title || '';

      // Store pending add icon data
      await chrome.storage.local.set({
        pendingAddIcon: { url, title, timestamp: Date.now() },
      });

      // Open popup
      chrome.action.openPopup();
    }
  });
}
