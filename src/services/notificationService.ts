/**
 * Push Notification Service
 * ==========================
 * Handles VAPID key exchange, push subscription management,
 * notification preferences, and notification list operations.
 *
 * Works with the Service Worker for background push delivery.
 */

import { apiFetch } from './apiFetch';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// ─── Types ───

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
  device_name?: string;
  user_agent?: string;
}

interface NotificationPreferences {
  enabled: boolean;
  irrigation_alerts: boolean;
  disease_alerts: boolean;
  drought_alerts: boolean;
  flood_alerts: boolean;
  resource_alerts: boolean;
  system_alerts: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  min_severity: string;
  language: string;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  severity: string;
  event_type: string;
  is_read: boolean;
  is_dismissed: boolean;
  sent_at: string;
  read_at: string | null;
  payload: Record<string, unknown>;
}

interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  page_size: number;
  unread_count: number;
}

interface NotificationCountResponse {
  unread_count: number;
  total_count: number;
}

// ─── Auth Helper ───

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ─── Push Subscription Management ───

/**
 * Get the VAPID public key from the server.
 */
export async function getVAPIDPublicKey(): Promise<string> {
  const res = await apiFetch(`${API_BASE}/api/notifications/push/vapid-key`);
  if (!res.ok) throw new Error('Failed to get VAPID public key');
  const data = await res.json();
  return data.public_key;
}

/**
 * Convert a VAPID public key string to a Uint8Array for use with
 * PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe the current device for push notifications.
 * This handles the full flow:
 * 1. Get VAPID public key from server
 * 2. Request browser push permission
 * 3. Create push subscription with the browser
 * 4. Send subscription to backend
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Not supported in this browser');
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check existing subscription
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      // Already subscribed — send to backend in case it's a new session
      await sendSubscriptionToBackend(existingSub);
      return true;
    }

    // Get VAPID key from server
    const vapidKey = await getVAPIDPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    // Request permission and create subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Send to backend
    await sendSubscriptionToBackend(subscription);
    console.log('[Push] Subscription successful');
    return true;
  } catch (err) {
    console.error('[Push] Subscription failed:', err);
    return false;
  }
}

/**
 * Send the push subscription to the backend for storage.
 */
async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  const subJson = subscription.toJSON();
  const payload: PushSubscriptionPayload = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subJson.keys?.p256dh || '',
      auth: subJson.keys?.auth || '',
    },
    device_name: getDeviceName(),
    user_agent: navigator.userAgent,
  };

  const res = await apiFetch(`${API_BASE}/api/notifications/push/subscribe`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Backend subscription failed: ${res.status}`);
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}

/**
 * Check if push notifications are currently subscribed.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

/**
 * Get the current push notification permission state.
 */
export function getPushPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// ─── Notification CRUD ───

/**
 * Fetch paginated notification list.
 */
export async function getNotifications(
  page = 1,
  pageSize = 20,
  options?: { severity?: string; event_type?: string; unread_only?: boolean }
): Promise<NotificationListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (options?.severity) params.set('severity', options.severity);
  if (options?.event_type) params.set('event_type', options.event_type);
  if (options?.unread_only) params.set('unread_only', 'true');

  const res = await apiFetch(
    `${API_BASE}/api/notifications?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

/**
 * Get notification counts (unread + total).
 */
export async function getNotificationCount(): Promise<NotificationCountResponse> {
  const res = await apiFetch(`${API_BASE}/api/notifications/count`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to get notification count');
  return res.json();
}

/**
 * Mark specific notifications as read.
 */
export async function markNotificationsRead(notificationIds: string[]): Promise<void> {
  await apiFetch(`${API_BASE}/api/notifications/mark-read`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notification_ids: notificationIds }),
  });
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch(`${API_BASE}/api/notifications/mark-all-read`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}

/**
 * Dismiss a notification.
 */
export async function dismissNotification(notificationId: string): Promise<void> {
  await apiFetch(`${API_BASE}/api/notifications/dismiss/${notificationId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}

// ─── Notification Preferences ───

/**
 * Get user notification preferences.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await apiFetch(`${API_BASE}/api/notifications/preferences`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch preferences');
  return res.json();
}

/**
 * Update user notification preferences.
 */
export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const res = await apiFetch(`${API_BASE}/api/notifications/preferences`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  return res.json();
}

// ─── Pipeline Trigger ───

/**
 * Manually trigger a notification pipeline evaluation.
 */
export async function triggerEvaluation(
  lat?: number,
  lng?: number
): Promise<void> {
  const params = new URLSearchParams();
  if (lat !== undefined) params.set('latitude', String(lat));
  if (lng !== undefined) params.set('longitude', String(lng));

  await apiFetch(
    `${API_BASE}/api/notifications/evaluate?${params.toString()}`,
    { method: 'POST', headers: getAuthHeaders() }
  );
}

/**
 * Send a test notification (for debugging).
 */
export async function sendTestNotification(
  eventType = 'smart_irrigation',
  severity = 'medium',
  message?: string
): Promise<void> {
  await apiFetch(`${API_BASE}/api/notifications/test`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ event_type: eventType, severity, message }),
  });
}

// ─── Helpers ───

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iOS Device';
  if (/Android/.test(ua)) return 'Android Device';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown Device';
}

// ─── Service Worker Message Listener Setup ───

/**
 * Initialize the notification system listener for Service Worker messages.
 * Call this once in your app's entry point.
 */
export function initNotificationListener(
  onNotificationClick?: (data: { notification_id: string; event_type: string; url: string }) => void,
  onMarkRead?: (notificationId: string) => void
): () => void {
  const handler = (event: MessageEvent) => {
    const { data } = event;
    if (!data || !data.type) return;

    switch (data.type) {
      case 'NOTIFICATION_CLICK':
        onNotificationClick?.({
          notification_id: data.notification_id,
          event_type: data.event_type,
          url: data.url,
        });
        break;
      case 'MARK_NOTIFICATION_READ':
        if (data.notification_id) {
          onMarkRead?.(data.notification_id);
          markNotificationsRead([data.notification_id]).catch(() => {});
        }
        break;
    }
  };

  navigator.serviceWorker?.addEventListener('message', handler);

  // Return cleanup function
  return () => {
    navigator.serviceWorker?.removeEventListener('message', handler);
  };
}

// ─── Exports ───

export type {
  NotificationItem,
  NotificationListResponse,
  NotificationCountResponse,
  NotificationPreferences,
};
