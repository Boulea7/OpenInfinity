/**
 * Gmail Service - Handles Gmail OAuth authorization and API interactions
 * Uses Chrome Identity API for OAuth and Gmail API for fetching emails
 */

import { useSettingsStore } from '../stores/settingsStore';

// Gmail API endpoints
const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1';

/**
 * Gmail message structure (simplified)
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
  internalDate?: string;
}

/**
 * Gmail messages list response
 */
interface GmailMessagesResponse {
  messages?: Array<{ id: string; threadId: string }>;
  resultSizeEstimate?: number;
  nextPageToken?: string;
}

/**
 * Gmail profile response
 */
interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

/**
 * Gmail Service class
 */
class GmailService {
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;
  private isPollingInFlight: boolean = false; // Prevent concurrent poll() calls

  /**
   * Get OAuth token using Chrome Identity API
   * @param interactive - Whether to show the OAuth popup
   */
  async getAuthToken(interactive: boolean = false): Promise<string | null> {
    // Check cached token
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.identity) {
        console.warn('Chrome Identity API not available');
        resolve(null);
        return;
      }

      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('OAuth error:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }

        if (token) {
          // Cache token for 50 minutes (tokens typically expire in 1 hour)
          this.cachedToken = token;
          this.tokenExpiry = Date.now() + 50 * 60 * 1000;
        }

        resolve(token || null);
      });
    });
  }

  /**
   * Revoke the current OAuth token
   */
  async revokeToken(): Promise<void> {
    const token = this.cachedToken;
    if (!token) return;

    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.identity) {
        resolve();
        return;
      }

      chrome.identity.removeCachedAuthToken({ token }, () => {
        this.cachedToken = null;
        this.tokenExpiry = 0;
        resolve();
      });
    });
  }

  /**
   * Authorize Gmail access
   * Opens OAuth popup if not already authorized
   */
  async authorize(): Promise<boolean> {
    // Check if OAuth client_id is properly configured
    const manifest = typeof chrome !== 'undefined' ? chrome.runtime?.getManifest?.() : null;
    const clientId = manifest?.oauth2?.client_id;
    if (!clientId || clientId.includes('YOUR_CLIENT_ID') || clientId.includes('placeholder')) {
      console.warn('[Gmail] OAuth client_id is not configured, skipping authorization.');
      useSettingsStore.getState().setNotificationSettings({
        gmailEnabled: false,
        gmailAuthorized: false,
        gmailEmail: null,
      });
      return false;
    }

    const token = await this.getAuthToken(true);
    if (!token) {
      return false;
    }

    // Fetch user profile to get email address
    try {
      const profile = await this.getProfile(token);
      if (profile) {
        // Update settings store with authorization state
        useSettingsStore.getState().setNotificationSettings({
          gmailAuthorized: true,
          gmailEmail: profile.emailAddress,
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to fetch Gmail profile:', error);
    }

    return false;
  }

  /**
   * Revoke Gmail authorization
   */
  async revokeAuthorization(): Promise<void> {
    await this.revokeToken();
    this.stopPolling();

    // Update settings store
    useSettingsStore.getState().setNotificationSettings({
      gmailEnabled: false,
      gmailAuthorized: false,
      gmailEmail: null,
    });
  }

  /**
   * Check if Gmail is authorized
   */
  async isAuthorized(): Promise<boolean> {
    const token = await this.getAuthToken(false);
    return token !== null;
  }

  /**
   * Get Gmail user profile
   */
  async getProfile(token?: string): Promise<GmailProfile | null> {
    const authToken = token || (await this.getAuthToken(false));
    if (!authToken) return null;

    try {
      const response = await fetch(`${GMAIL_API_BASE}/users/me/profile`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear cache
          this.cachedToken = null;
          this.tokenExpiry = 0;
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Gmail profile:', error);
      return null;
    }
  }

  /**
   * Get unread email count
   */
  async getUnreadCount(): Promise<number> {
    const token = await this.getAuthToken(false);
    if (!token) return 0;

    try {
      // Query for unread messages in inbox
      const response = await fetch(
        `${GMAIL_API_BASE}/users/me/messages?q=is:unread+in:inbox&maxResults=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          this.cachedToken = null;
          this.tokenExpiry = 0;
        }
        return 0;
      }

      const data: GmailMessagesResponse = await response.json();
      return data.resultSizeEstimate || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  /**
   * Get unread emails with details
   * @param maxResults - Maximum number of emails to fetch
   */
  async getUnreadEmails(maxResults: number = 5): Promise<GmailMessage[]> {
    const token = await this.getAuthToken(false);
    if (!token) return [];

    try {
      // Get list of unread message IDs
      const listResponse = await fetch(
        `${GMAIL_API_BASE}/users/me/messages?q=is:unread+in:inbox&maxResults=${maxResults}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!listResponse.ok) return [];

      const listData: GmailMessagesResponse = await listResponse.json();
      if (!listData.messages || listData.messages.length === 0) return [];

      // Fetch details for each message
      const messages = await Promise.all(
        listData.messages.map(async (msg) => {
          const msgResponse = await fetch(
            `${GMAIL_API_BASE}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!msgResponse.ok) return null;
          return await msgResponse.json();
        })
      );

      return messages.filter((msg): msg is GmailMessage => msg !== null);
    } catch (error) {
      console.error('Failed to fetch unread emails:', error);
      return [];
    }
  }

  /**
   * Start polling for new emails
   * @param intervalMinutes - Polling interval in minutes
   */
  startPolling(intervalMinutes: number = 5): void {
    this.stopPolling();

    const poll = async () => {
      // Prevent concurrent poll() calls (race condition if request takes longer than interval)
      if (this.isPollingInFlight) {
        console.log('[Gmail] Skipping poll - previous request still in flight');
        return;
      }

      const settings = useSettingsStore.getState();
      if (!settings.notificationSettings.gmailEnabled) {
        this.stopPolling();
        return;
      }

      this.isPollingInFlight = true;
      try {
        const count = await this.getUnreadCount();

        // Show notification if enabled and there are new unread emails
        if (settings.notificationSettings.showUnreadCount && count > 0) {
          this.showBadge(count);
        } else {
          this.clearBadge();
        }
      } catch (error) {
        console.error('[Gmail] Polling error:', error);
      } finally {
        this.isPollingInFlight = false;
      }
    };

    // Poll immediately, then at interval
    poll();
    this.pollingInterval = setInterval(poll, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop polling for new emails
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Show unread count badge on extension icon
   */
  private showBadge(count: number): void {
    if (typeof chrome === 'undefined' || !chrome.action) return;

    chrome.action.setBadgeText({ text: count > 99 ? '99+' : String(count) });
    chrome.action.setBadgeBackgroundColor({ color: '#EA4335' }); // Gmail red
  }

  /**
   * Clear badge from extension icon
   */
  private clearBadge(): void {
    if (typeof chrome === 'undefined' || !chrome.action) return;

    chrome.action.setBadgeText({ text: '' });
  }

  /**
   * Show desktop notification for new email
   */
  async showNotification(title: string, body: string): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.notifications) return;

    const settings = useSettingsStore.getState();
    if (!settings.notificationSettings.gmailEnabled) return;

    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title,
      message: body,
      priority: 1,
    });

    // Play sound if enabled
    if (settings.notificationSettings.gmailSound) {
      this.playNotificationSound();
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      // Use Web Audio API for notification sound
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);

      // Close AudioContext after sound completes to prevent memory leak
      oscillator.onended = () => {
        audioContext.close().catch(() => {
          // Ignore close errors (already closed, etc.)
        });
      };
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }
}

// Export singleton instance
export const gmailService = new GmailService();

// Export helper functions
export const authorizeGmail = () => gmailService.authorize();
export const revokeGmailAuthorization = () => gmailService.revokeAuthorization();
export const getGmailUnreadCount = () => gmailService.getUnreadCount();
export const startGmailPolling = (interval?: number) => gmailService.startPolling(interval);
export const stopGmailPolling = () => gmailService.stopPolling();
