const CACHE_VERSION = '__CACHE_VERSION__'
const PRECACHE_NAME = `agriassist-precache-${CACHE_VERSION}`
const RUNTIME_NAME = `agriassist-runtime-${CACHE_VERSION}`
const PRECACHE_URLS = __PRECACHE_URLS__
const STATIC_DESTINATIONS = new Set(['style', 'script', 'worker', 'image', 'font', 'manifest'])
const LEGACY_CACHE_NAMES = new Set([
  'google-fonts-stylesheets',
  'google-fonts-webfonts',
  'api-cache',
  'image-cache',
])

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE_NAME)
      await cache.addAll(PRECACHE_URLS)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable()
      }

      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((cacheName) => shouldDeleteCache(cacheName))
          .map((cacheName) => caches.delete(cacheName)),
      )

      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event))
    return
  }

  if (isGoogleFontRequest(url)) {
    event.respondWith(handleStaticRequest(event))
    return
  }

  if (url.origin === self.location.origin && shouldHandleStaticAsset(url, request)) {
    event.respondWith(handleStaticRequest(event))
  }
})

function shouldDeleteCache(cacheName) {
  if (cacheName === PRECACHE_NAME || cacheName === RUNTIME_NAME) {
    return false
  }

  if (LEGACY_CACHE_NAMES.has(cacheName)) {
    return true
  }

  return cacheName.startsWith('workbox') || cacheName.startsWith('agriassist-')
}

function isGoogleFontRequest(url) {
  return url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com'
}

function shouldHandleStaticAsset(url, request) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname.endsWith('.svg') ||
    STATIC_DESTINATIONS.has(request.destination)
  )
}

async function handleNavigationRequest(event) {
  try {
    const preloadResponse = await event.preloadResponse
    if (preloadResponse) {
      return preloadResponse
    }

    const networkResponse = await fetch(event.request)
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_NAME)
      await cache.put(event.request, networkResponse.clone())
      await cache.put('/index.html', networkResponse.clone())
    }

    return networkResponse
  } catch {
    const cachedResponse = await caches.match(event.request)
    if (cachedResponse) {
      return cachedResponse
    }

    return (
      (await caches.match('/index.html')) ||
      (await caches.match('/')) ||
      Response.error()
    )
  }
}

async function handleStaticRequest(event) {
  const cache = await caches.open(RUNTIME_NAME)
  const cachedResponse = await caches.match(event.request)
  const networkPromise = fetch(event.request)
    .then((response) => {
      if (response.ok) {
        void cache.put(event.request, response.clone())
      }
      return response
    })
    .catch(() => undefined)

  if (cachedResponse) {
    event.waitUntil(networkPromise)
    return cachedResponse
  }

  const networkResponse = await networkPromise
  return networkResponse || Response.error()
}


// ══════════════════════════════════════════════════════════════
//  PUSH NOTIFICATION SYSTEM
// ══════════════════════════════════════════════════════════════

const NOTIF_DB_NAME = 'agriassist-notifications'
const NOTIF_DB_VERSION = 1
const NOTIF_STORE_NAME = 'notifications'

// Severity → icon/badge mapping
const SEVERITY_ICONS = {
  critical: '/pwa-192x192.png',
  high: '/pwa-192x192.png',
  medium: '/pwa-192x192.png',
  low: '/pwa-192x192.png',
}

// Event type → color tag for notification badge
const EVENT_TYPE_TAGS = {
  smart_irrigation: 'irrigation',
  disease_warning: 'disease',
  drought_intelligence: 'drought',
  flood_prevention: 'flood',
  resource_optimization: 'resource',
  iot_offline: 'system',
}

/**
 * Handle incoming push notifications.
 * Works even when the PWA is closed or in background.
 */
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = {
      title: 'AgriAssist',
      body: event.data.text() || 'New notification',
      severity: 'medium',
      event_type: 'unknown',
    }
  }

  const title = payload.title || 'AgriAssist Alert'
  const severity = payload.severity || 'medium'
  const eventType = payload.event_type || 'unknown'
  const tag = EVENT_TYPE_TAGS[eventType] || eventType

  const options = {
    body: payload.body || '',
    icon: SEVERITY_ICONS[severity] || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `agriassist-${tag}`,
    renotify: severity === 'critical',
    requireInteraction: severity === 'critical' || severity === 'high',
    vibrate: severity === 'critical' ? [200, 100, 200, 100, 200] : [200, 100, 200],
    data: {
      notification_id: payload.notification_id,
      event_type: eventType,
      severity: severity,
      url: getNotificationUrl(eventType),
      timestamp: payload.timestamp || new Date().toISOString(),
      payload: payload.data || {},
    },
    actions: getNotificationActions(eventType),
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      saveNotificationToIndexedDB(payload),
    ]),
  )
})

/**
 * Handle notification click — navigate to appropriate page.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  let targetUrl = data.url || '/home'

  // Handle action button clicks
  if (event.action === 'view_details') {
    targetUrl = '/farm-details'
  } else if (event.action === 'dismiss') {
    // Mark as read via API if notification_id exists
    if (data.notification_id) {
      event.waitUntil(markNotificationRead(data.notification_id))
    }
    return
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            notification_id: data.notification_id,
            event_type: data.event_type,
            url: targetUrl,
          })
          return
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    }),
  )
})

/**
 * Handle notification close (dismiss without clicking).
 */
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {}
  if (data.notification_id) {
    event.waitUntil(markNotificationRead(data.notification_id))
  }
})

/**
 * Listen for messages from the main app thread.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_UNREAD_COUNT') {
    event.waitUntil(
      getUnreadCount().then((count) => {
        event.source.postMessage({ type: 'UNREAD_COUNT', count })
      }),
    )
  }
})

// ─── Helper Functions ───

function getNotificationUrl(eventType) {
  const urlMap = {
    smart_irrigation: '/farm-details',
    disease_warning: '/scan-crop',
    drought_intelligence: '/farm-details',
    flood_prevention: '/farm-details',
    resource_optimization: '/farm-details',
    iot_offline: '/farm-details',
  }
  return urlMap[eventType] || '/home'
}

function getNotificationActions(eventType) {
  if (eventType === 'disease_warning') {
    return [
      { action: 'view_details', title: '🔍 View Details' },
      { action: 'dismiss', title: '✓ Got it' },
    ]
  }
  return [
    { action: 'view_details', title: '📋 View Details' },
    { action: 'dismiss', title: '✓ Dismiss' },
  ]
}

// ─── IndexedDB Persistence for Offline Notifications ───

function openNotifDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTIF_DB_NAME, NOTIF_DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(NOTIF_STORE_NAME)) {
        const store = db.createObjectStore(NOTIF_STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('is_read', 'is_read', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveNotificationToIndexedDB(payload) {
  try {
    const db = await openNotifDB()
    const tx = db.transaction(NOTIF_STORE_NAME, 'readwrite')
    tx.objectStore(NOTIF_STORE_NAME).add({
      notification_id: payload.notification_id,
      title: payload.title,
      body: payload.body,
      severity: payload.severity,
      event_type: payload.event_type,
      timestamp: payload.timestamp || new Date().toISOString(),
      is_read: false,
      data: payload.data || {},
    })
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (err) {
    // Non-critical: don't block push notification display
    console.warn('[SW] Failed to save notification to IndexedDB:', err)
  }
}

async function getUnreadCount() {
  try {
    const db = await openNotifDB()
    const tx = db.transaction(NOTIF_STORE_NAME, 'readonly')
    const index = tx.objectStore(NOTIF_STORE_NAME).index('is_read')
    const request = index.count(IDBKeyRange.only(false))
    const count = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(0)
    })
    db.close()
    return count
  } catch {
    return 0
  }
}

async function markNotificationRead(notificationId) {
  try {
    // Try to mark read via API
    const clients = await self.clients.matchAll({ type: 'window' })
    for (const client of clients) {
      client.postMessage({
        type: 'MARK_NOTIFICATION_READ',
        notification_id: notificationId,
      })
    }
  } catch {
    // Non-critical
  }
}
