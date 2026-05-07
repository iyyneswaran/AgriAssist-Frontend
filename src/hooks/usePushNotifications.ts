import { useCallback, useEffect, useState } from 'react';
import { showLocalServiceWorkerNotification } from '../pwa/registerServiceWorker';
import {
  getNotificationPreferences,
  getPushDiagnostics,
  getPushPermission,
  getPushStatus,
  getPushSupportStatus,
  isPushSubscribed,
  registerBrowserPushSubscription,
  sendTestNotification,
  syncExistingPushSubscription,
  unsubscribeFromPush,
  updateNotificationPreferences,
  type NotificationPreferences,
  type PushDiagnosticsResponse,
  type PushStatusResponse,
  type PushSupportStatus,
} from '../services/notificationService';

interface PushNotificationState {
  support: PushSupportStatus;
  permission: NotificationPermission;
  subscribed: boolean;
  status: PushStatusResponse | null;
  diagnostics: PushDiagnosticsResponse | null;
  preferences: NotificationPreferences | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  renewalRequired: boolean;
}

const initialState = (): PushNotificationState => ({
  support: getPushSupportStatus(),
  permission: getPushPermission(),
  subscribed: false,
  status: null,
  diagnostics: null,
  preferences: null,
  loading: true,
  busy: false,
  error: null,
  renewalRequired: false,
});

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>(() => initialState());

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      await syncExistingPushSubscription().catch(() => null);
      const [subscribed, status, diagnostics, preferences] = await Promise.all([
        isPushSubscribed(),
        getPushStatus(),
        getPushDiagnostics(),
        getNotificationPreferences(),
      ]);

      setState((current) => ({
        ...current,
        support: getPushSupportStatus(),
        permission: getPushPermission(),
        subscribed,
        status,
        diagnostics,
        preferences,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        support: getPushSupportStatus(),
        permission: getPushPermission(),
        loading: false,
        error: error instanceof Error ? error.message : 'Notification status failed',
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setState((current) => ({ ...current, busy: true, error: null }));
    try {
      await registerBrowserPushSubscription();
      await refresh();
      setState((current) => ({ ...current, busy: false, renewalRequired: false }));
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        permission: getPushPermission(),
        error: error instanceof Error ? error.message : 'Could not enable notifications',
      }));
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setState((current) => ({ ...current, busy: true, error: null }));
    try {
      await unsubscribeFromPush();
      await refresh();
      setState((current) => ({ ...current, busy: false }));
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        error: error instanceof Error ? error.message : 'Could not disable notifications',
      }));
    }
  }, [refresh]);

  const savePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    setState((current) => ({ ...current, busy: true, error: null }));
    try {
      const preferences = await updateNotificationPreferences(prefs);
      setState((current) => ({ ...current, preferences, busy: false }));
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        error: error instanceof Error ? error.message : 'Could not update preferences',
      }));
    }
  }, []);

  const sendBackendTest = useCallback(async () => {
    setState((current) => ({ ...current, busy: true, error: null }));
    try {
      await sendTestNotification(
        'smart_irrigation',
        'medium',
        'Your AgriAssist push notification pipeline is working.',
        '/notifications',
      );
      await refresh();
      setState((current) => ({ ...current, busy: false }));
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        error: error instanceof Error ? error.message : 'Could not send test notification',
      }));
    }
  }, [refresh]);

  const sendLocalTest = useCallback(async () => {
    setState((current) => ({ ...current, busy: true, error: null }));
    try {
      await showLocalServiceWorkerNotification();
      setState((current) => ({ ...current, busy: false }));
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        error: error instanceof Error ? error.message : 'Could not show local notification',
      }));
    }
  }, []);

  const markRenewalRequired = useCallback(() => {
    setState((current) => ({ ...current, renewalRequired: true }));
  }, []);

  return {
    ...state,
    refresh,
    enable,
    disable,
    savePreferences,
    sendBackendTest,
    sendLocalTest,
    markRenewalRequired,
  };
}
