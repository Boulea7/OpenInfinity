/**
 * Setup keyboard commands
 */
export function setupCommands(): void {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'add-current-page') {
      // Request optional permissions on demand (keyboard shortcut is a user gesture).
      const granted = await chrome.permissions.request({ permissions: ['tabs', 'activeTab'] });
      if (!granted) return;

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab) {
        await chrome.storage.local.set({
          pendingAddIcon: {
            url: tab.url || '',
            title: tab.title || '',
            timestamp: Date.now(),
          },
        });

        chrome.action.openPopup();
      }
    }
  });
}
