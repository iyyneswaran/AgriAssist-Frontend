import { registerAgriAssistServiceWorker, sendVapidKeyToServiceWorker } from '../pwa/registerServiceWorker';
import { apiFetch } from './apiFetch';

const CHAT_API_URL = (
  import.meta.env.VITE_CHAT_API_URL ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:8001'
).replace(/\/$/, '');

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface BrowserPushSubscriptionJSON {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: Partial<PushSubscriptionKeys>;
}

interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
  device_name?: string;
  user_agent?: string;
  browser?: string;
  platform?: string;
  expiration_time?: number | null;
  content_encoding?: string;
}

export interface PushSubscriptionResponse {
  id: string;
  endpoint: string;
  device_name: string | null;
  browser: string | null;
  platform: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  last_success_at: string | null;
  failure_count: number;
}

export interface PushStatusResponse {
  vapid_configured: boolean;
  subscriptions: PushSubscriptionResponse[];
}

export interface PushDiagnosticsResponse {
  vapid_configured: boolean;
  active_subscription_count: number;
  inactive_subscription_count: number;
  last_delivery_status: string | null;
  last_delivery_error: string | null;
  last_delivery_at: string | null;
  last_subscription_success_at: string | null;
  max_subscriptions_per_user: number;
}

export interface PushSupportStatus {
  supported: boolean;
  serviceWorker: boolean;
  notification: boolean;
  pushManager: boolean;
  secureContext: boolean;
  permission: NotificationPermission;
}

export interface NotificationPreferences {
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

export interface NotificationItem {
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

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  page_size: number;
  unread_count: number;
}

export interface NotificationCountResponse {
  unread_count: number;
  total_count: number;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferEquals(left: ArrayBuffer | null, right: Uint8Array): boolean {
  if (!left || left.byteLength !== right.byteLength) {
    return false;
  }

  const leftView = new Uint8Array(left);
  for (let i = 0; i < leftView.length; i += 1) {
    if (leftView[i] !== right[i]) {
      return false;
    }
  }
  return true;
}

function getPushJson(subscription: PushSubscription): BrowserPushSubscriptionJSON {
  return subscription.toJSON() as BrowserPushSubscriptionJSON;
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iOS Device';
  if (/Android/.test(ua)) return 'Android Device';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Browser Device';
}

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome|CriOS/.test(ua)) return 'Chrome';
  if (/Firefox/.test(ua)) return 'Firefox';
  if (/Safari/.test(ua)) return 'Safari';
  return 'Unknown';
}

export function getPushSupportStatus(): PushSupportStatus {
  const serviceWorker = 'serviceWorker' in navigator;
  const notification = 'Notification' in window;
  const pushManager = 'PushManager' in window;
  const secureContext = window.isSecureContext || window.location.hostname === 'localhost';

  return {
    supported: serviceWorker && notification && pushManager && secureContext,
    serviceWorker,
    notification,
    pushManager,
    secureContext,
    permission: notification ? Notification.permission : 'denied',
  };
}

export function getPushPermission(): NotificationPermission {
  return getPushSupportStatus().permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const support = getPushSupportStatus();
  if (!support.notification) {
    return 'denied';
  }

  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

export async function getVAPIDPublicKey(): Promise<string> {
  let publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  
  if (!publicKey) {
    const response = await apiFetch(`${CHAT_API_URL}/api/notifications/push/vapid-key`);
    if (!response.ok) {
      throw new Error('Failed to get VAPID public key');
    }
    const data = await response.json() as { public_key: string };
    publicKey = data.public_key;
  }
  
  if (!publicKey) {
    throw new Error('VAPID public key is completely missing');
  }
  
  sendVapidKeyToServiceWorker(publicKey);
  return publicKey;
}

export async function registerBrowserPushSubscription(): Promise<PushSubscriptionResponse> {
  const support = getPushSupportStatus();
  if (!support.supported) {
    throw new Error('Browser push notifications are not supported in this browser context');
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error(`Notification permission is ${permission}`);
  }

  const swResult = await registerAgriAssistServiceWorker();
  if (!swResult.registration) {
    throw new Error(swResult.error || 'Service worker is not registered');
  }

  const registration = await navigator.serviceWorker.ready;
  const vapidKey = await getVAPIDPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(vapidKey);

  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    const existingKey = existingSubscription.options.applicationServerKey as ArrayBuffer | null;
    if (arrayBufferEquals(existingKey, applicationServerKey)) {
      return sendSubscriptionToBackend(existingSubscription);
    }

    await existingSubscription.unsubscribe();
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  return sendSubscriptionToBackend(subscription);
}

export async function subscribeToPush(): Promise<boolean> {
  await registerBrowserPushSubscription();
  return true;
}

export async function syncExistingPushSubscription(): Promise<PushSubscriptionResponse | null> {
  const support = getPushSupportStatus();
  if (!support.serviceWorker || !support.pushManager || Notification.permission !== 'granted') {
    return null;
  }

  await registerAgriAssistServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return null;
  }

  return sendSubscriptionToBackend(subscription);
}

async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<PushSubscriptionResponse> {
  const subJson = getPushJson(subscription);
  if (!subscription.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
    throw new Error('Browser returned an incomplete push subscription');
  }

  const payload: PushSubscriptionPayload = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
    },
    device_name: getDeviceName(),
    user_agent: navigator.userAgent,
    browser: getBrowserName(),
    platform: navigator.platform || getDeviceName(),
    expiration_time: subJson.expirationTime ?? null,
    content_encoding: 'aes128gcm',
  };

  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/push/subscribe`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(detail?.detail || `Backend subscription failed: ${response.status}`);
  }

  return response.json();
}

export async function unsubscribeFromPush(): Promise<void> {
  const support = getPushSupportStatus();
  if (!support.serviceWorker || !support.pushManager) {
    return;
  }

  await registerAgriAssistServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  const endpoint = subscription?.endpoint;

  if (subscription) {
    await subscription.unsubscribe();
  }

  if (endpoint) {
    const response = await apiFetch(`${CHAT_API_URL}/api/notifications/push/unsubscribe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ endpoint }),
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Backend unsubscribe failed: ${response.status}`);
    }
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  const support = getPushSupportStatus();
  if (!support.serviceWorker || !support.pushManager) return false;

  try {
    await registerAgriAssistServiceWorker();
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

export async function getPushStatus(): Promise<PushStatusResponse> {
  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/push/status`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch push status');
  return response.json();
}

export async function getPushDiagnostics(): Promise<PushDiagnosticsResponse> {
  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/push/diagnostics`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch push diagnostics');
  return response.json();
}

export async function getNotifications(
  page = 1,
  pageSize = 20,
  options?: { severity?: string; event_type?: string; unread_only?: boolean },
): Promise<NotificationListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (options?.severity) params.set('severity', options.severity);
  if (options?.event_type) params.set('event_type', options.event_type);
  if (options?.unread_only) params.set('unread_only', 'true');

  const response = await apiFetch(`${CHAT_API_URL}/api/notifications?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

export async function getNotificationCount(): Promise<NotificationCountResponse> {
  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/count`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get notification count');
  return response.json();
}

export async function markNotificationsRead(notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return;

  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/mark-read`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notification_ids: notificationIds }),
  });
  if (!response.ok) throw new Error('Failed to mark notifications read');
}

export async function trackNotificationClick(payload: {
  notification_id?: string | null;
  history_id?: string | null;
  action?: string | null;
}): Promise<void> {
  if (!payload.notification_id && !payload.history_id) return;

  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/track-click`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to track notification click');
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/mark-all-read`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to mark all notifications read');
}

export async function dismissNotification(notificationId: string): Promise<void> {
  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/dismiss/${notificationId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok && response.status !== 404) throw new Error('Failed to dismiss notification');
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/preferences`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch preferences');
  return response.json();
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/preferences`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(prefs),
  });
  if (!response.ok) throw new Error('Failed to update preferences');
  return response.json();
}

export async function triggerEvaluation(lat?: number, lng?: number): Promise<void> {
  const params = new URLSearchParams();
  if (lat !== undefined) params.set('latitude', String(lat));
  if (lng !== undefined) params.set('longitude', String(lng));

  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/evaluate?${params.toString()}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to trigger notification evaluation');
}

export async function sendTestNotification(
  eventType = 'smart_irrigation',
  severity = 'medium',
  message?: string,
  url?: string,
): Promise<void> {
  const response = await apiFetch(`${CHAT_API_URL}/api/notifications/test`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ event_type: eventType, severity, message, url }),
  });
  if (!response.ok) throw new Error('Failed to send test notification');
}

export function initNotificationListener(
  onNotificationClick?: (data: { notification_id?: string; history_id?: string; event_type?: string; url: string }) => void,
  onPushRenewalRequired?: () => void,
): () => void {
  const handler = (event: MessageEvent) => {
    const data = event.data as {
      type?: string;
      notification_id?: string;
      history_id?: string;
      event_type?: string;
      url?: string;
    } | null;

    if (!data?.type) return;

    switch (data.type) {
      case 'NOTIFICATION_CLICK':
        onNotificationClick?.({
          notification_id: data.notification_id,
          history_id: data.history_id,
          event_type: data.event_type,
          url: data.url || '/home',
        });
        void trackNotificationClick({
          notification_id: data.notification_id,
          history_id: data.history_id,
          action: 'click',
        }).catch(() => undefined);
        break;
      case 'DISMISS_NOTIFICATION':
        void dismissNotification(data.history_id || data.notification_id || '').catch(() => undefined);
        break;
      case 'PUSH_SUBSCRIPTION_CHANGED':
        void syncExistingPushSubscription().catch(() => undefined);
        break;
      case 'PUSH_SUBSCRIPTION_RENEWAL_REQUIRED':
        onPushRenewalRequired?.();
        break;
    }
  };

  navigator.serviceWorker?.addEventListener('message', handler);
  return () => navigator.serviceWorker?.removeEventListener('message', handler);
}
