/**
 * NotificationSection - Gmail notification settings with OAuth authorization
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, LogOut, Loader2 } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { useSettingsStore } from '../../../stores/settingsStore';
import { authorizeGmail, revokeGmailAuthorization, startGmailPolling, stopGmailPolling } from '../../../services/gmail';
import { Toggle } from '../components/Toggle';

export const NotificationSection: React.FC = () => {
  const { t } = useTranslation();
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const notificationSettings = useSettingsStore((state) => state.notificationSettings);
  const setNotificationSettings = useSettingsStore((state) => state.setNotificationSettings);

  // Handle Gmail authorization
  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    try {
      const success = await authorizeGmail();
      if (success) {
        setNotificationSettings({ gmailEnabled: true });
        startGmailPolling(5); // Poll every 5 minutes
      }
    } catch (error) {
      console.error('Gmail authorization failed:', error);
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Handle Gmail deauthorization
  const handleRevoke = async () => {
    await revokeGmailAuthorization();
    stopGmailPolling();
  };

  // Handle Gmail enabled toggle
  const handleGmailEnabledChange = async (enabled: boolean) => {
    if (enabled && !notificationSettings.gmailAuthorized) {
      // Need to authorize first
      await handleAuthorize();
    } else {
      setNotificationSettings({ gmailEnabled: enabled });
      if (enabled) {
        startGmailPolling(5);
      } else {
        stopGmailPolling();
      }
    }
  };

  return (
    <CollapsibleSection
      id="notification"
      title={t('settings.notification.title', '通知')}
    >
      {/* Gmail Authorization Status */}
      {notificationSettings.gmailAuthorized ? (
        <div className="flex items-center justify-between py-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded px-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {notificationSettings.gmailEmail}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRevoke}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            {t('settings.notification.revoke', '取消授权')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAuthorize}
          disabled={isAuthorizing}
          className="
            w-full mb-4 py-2 px-4
            bg-gray-100 dark:bg-gray-800
            text-gray-700 dark:text-gray-300
            text-sm font-medium
            rounded
            hover:bg-gray-200 dark:hover:bg-gray-700
            transition-colors
            flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isAuthorizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('settings.notification.authorizing', '授权中...')}
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              {t('settings.notification.authorize', '授权 Gmail')}
            </>
          )}
        </button>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        <Toggle
          label={t('settings.notification.gmailEnabled', 'Gmail邮件通知')}
          checked={notificationSettings.gmailEnabled}
          onChange={handleGmailEnabledChange}
        />
        <Toggle
          label={t('settings.notification.gmailSound', 'Gmail邮件通知铃声')}
          checked={notificationSettings.gmailSound}
          onChange={(checked) => setNotificationSettings({ gmailSound: checked })}
          disabled={!notificationSettings.gmailEnabled}
        />
        <Toggle
          label={t('settings.notification.showUnreadCount', '在图标上显示未读Gmail邮件数量')}
          checked={notificationSettings.showUnreadCount}
          onChange={(checked) => setNotificationSettings({ showUnreadCount: checked })}
          disabled={!notificationSettings.gmailEnabled}
        />
        <Toggle
          label={t('settings.notification.showTodoCount', '在图标上显示待办事项数量')}
          checked={notificationSettings.showTodoCount}
          onChange={(checked) => setNotificationSettings({ showTodoCount: checked })}
        />
      </div>
    </CollapsibleSection>
  );
};

export default NotificationSection;
