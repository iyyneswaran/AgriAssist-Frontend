const CACHE_VERSION = '__CACHE_VERSION__'
const IS_DEV = __IS_DEV__
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

const NOTIF_DB_NAME = 'agriassist-notifications'
const NOTIF_DB_VERSION = 2
const NOTIF_STORE_NAME = 'notifications'
const META_STORE_NAME = 'metadata'

const EVENT_TYPE_TAGS = {
  smart_irrigation: 'irrigation',
  disease_warning: 'disease',
  drought_intelligence: 'drought',
  flood_prevention: 'flood',
  resource_optimization: 'resource',
  iot_offline: 'system',
}

const EVENT_TYPE_URLS = {
  smart_irrigation: '/farm-details',
  disease_warning: '/alerts/disease/latest',
  drought_intelligence: '/forecast',
  flood_prevention: '/forecast',
  resource_optimization: '/farm-details',
  iot_offline: '/farm-details',
}

const SEVERITY_OPTIONS = {
  critical: { requireInteraction: true, renotify: true, vibrate: [220, 100, 220, 100, 220] },
  high: { requireInteraction: true, renotify: true, vibrate: [220, 100, 220] },
  medium: { requireInteraction: false, renotify: false, vibrate: [180, 80, 180] },
  low: { requireInteraction: false, renotify: false, vibrate: [120] },
  info: { requireInteraction: false, renotify: false, vibrate: [80] },
}

function debugLog(...args) {
  if (IS_DEV) {
    console.log('[AgriAssist SW]', ...args)
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      if (!IS_DEV) {
        const cache = await caches.open(PRECACHE_NAME)
        await cache.addAll(PRECACHE_URLS)
      }
      await self.skipWaiting()
      debugLog('installed', CACHE_VERSION)
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
      debugLog('activated', CACHE_VERSION)
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  if (IS_DEV) {
    return
  }

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

self.addEventListener('push', (event) => {
  event.waitUntil(handlePushEvent(event))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  if (event.action === 'dismiss') {
    event.waitUntil(postMessageToWindowClients({ type: 'DISMISS_NOTIFICATION', ...data }))
    return
  }

  event.waitUntil(openOrFocusApp(data.url || '/home', data))
})

self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {}
  event.waitUntil(
    Promise.all([
      markIndexedNotification(data.notification_id, { is_dismissed: true }),
      postMessageToWindowClients({ type: 'NOTIFICATION_CLOSED', ...data }),
    ]),
  )
})

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(handlePushSubscriptionChange(event))
})

self.addEventListener('message', (event) => {
  const message = event.data || {}

  if (message.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting())
    return
  }

  if (message.type === 'SET_VAPID_PUBLIC_KEY' && message.publicKey) {
    event.waitUntil(setMetadata('vapidPublicKey', message.publicKey))
    return
  }

  if (message.type === 'GET_UNREAD_COUNT') {
    event.waitUntil(
      getUnreadCount().then((count) => {
        event.source?.postMessage({ type: 'UNREAD_COUNT', count })
      }),
    )
    return
  }

  if (message.type === 'SHOW_LOCAL_TEST_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification('AgriAssist Test Alert', {
        body: message.body || 'Local service worker notification is working.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'agriassist-local-test',
        data: buildNotificationData({
          event_type: 'system_test',
          severity: 'info',
          url: '/notifications',
        }),
      }),
    )
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
  } catch (error) {
    debugLog('navigation fallback', error)
    return (
      (await caches.match(event.request)) ||
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
    .catch((error) => {
      debugLog('static fetch failed', error)
      return undefined
    })

  if (cachedResponse) {
    event.waitUntil(networkPromise)
    return cachedResponse
  }

  return (await networkPromise) || Response.error()
}

async function handlePushEvent(event) {
  const payload = readPushPayload(event)
  const severity = payload.severity || 'medium'
  const eventType = payload.event_type || 'system'
  const severityOptions = SEVERITY_OPTIONS[severity] || SEVERITY_OPTIONS.medium
  const tag = payload.notification_id || `${EVENT_TYPE_TAGS[eventType] || eventType}-${Date.now()}`

  const options = {
    body: payload.body || 'Open AgriAssist for the latest farm update.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    tag: `agriassist-${tag}`,
    renotify: severityOptions.renotify,
    requireInteraction: severityOptions.requireInteraction,
    vibrate: severityOptions.vibrate,
    timestamp: Date.now(),
    data: buildNotificationData(payload),
    actions: buildNotificationActions(eventType),
  }

  try {
    await Promise.all([
      self.registration.showNotification(payload.title || 'AgriAssist Alert', options),
      saveNotificationToIndexedDB(payload),
    ])
    debugLog('push displayed', payload.notification_id || eventType)
  } catch (error) {
    console.error('[AgriAssist SW] failed to display push notification', error)
  }
}

function readPushPayload(event) {
  if (!event.data) {
    return {
      title: 'AgriAssist Alert',
      body: 'A new farm alert is available.',
      severity: 'medium',
      event_type: 'system',
    }
  }

  try {
    return event.data.json()
  } catch {
    return {
      title: 'AgriAssist Alert',
      body: event.data.text() || 'A new farm alert is available.',
      severity: 'medium',
      event_type: 'system',
    }
  }
}

function buildNotificationData(payload) {
  const eventType = payload.event_type || 'system'
  const targetUrl = buildTargetUrl(payload)

  return {
    notification_id: payload.notification_id,
    history_id: payload.history_id,
    event_id: payload.event_id,
    event_type: eventType,
    severity: payload.severity || 'medium',
    url: targetUrl,
    timestamp: payload.timestamp || new Date().toISOString(),
    payload: payload.data || {},
  }
}

function buildTargetUrl(payload) {
  const eventType = payload.event_type || 'system'
  const basePath = payload.url || EVENT_TYPE_URLS[eventType] || '/home'
  const url = new URL(basePath, self.location.origin)

  if (url.origin !== self.location.origin) {
    return '/home'
  }

  if (payload.event_id && url.pathname.includes('/latest')) {
    url.pathname = url.pathname.replace('/latest', `/${encodeURIComponent(payload.event_id)}`)
  }

  url.searchParams.set('from_push', '1')
  if (payload.notification_id) {
    url.searchParams.set('notification_id', payload.notification_id)
  }
  if (payload.history_id) {
    url.searchParams.set('history_id', payload.history_id)
  }
  if (eventType) {
    url.searchParams.set('event_type', eventType)
  }

  return `${url.pathname}${url.search}${url.hash}`
}

function buildNotificationActions() {
  return [
    { action: 'open', title: 'View' },
    { action: 'dismiss', title: 'Dismiss' },
  ]
}

async function openOrFocusApp(targetUrl, data) {
  const absoluteTarget = new URL(targetUrl, self.location.origin).href
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

  for (const client of clientList) {
    const clientUrl = new URL(client.url)
    if (clientUrl.origin !== self.location.origin) {
      continue
    }

    if ('navigate' in client) {
      await client.navigate(absoluteTarget)
    }
    if ('focus' in client) {
      await client.focus()
    }
    client.postMessage({ type: 'NOTIFICATION_CLICK', ...data, url: targetUrl })
    return
  }

  if (self.clients.openWindow) {
    await self.clients.openWindow(absoluteTarget)
  }
}

async function postMessageToWindowClients(message) {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  await Promise.all(clientList.map((client) => client.postMessage(message)))
}

async function handlePushSubscriptionChange(event) {
  debugLog('push subscription changed')
  const publicKey = await getMetadata('vapidPublicKey')
  if (!publicKey) {
    await postMessageToWindowClients({ type: 'PUSH_SUBSCRIPTION_RENEWAL_REQUIRED' })
    return
  }

  try {
    const subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
    await postMessageToWindowClients({
      type: 'PUSH_SUBSCRIPTION_CHANGED',
      subscription: subscription.toJSON(),
    })
    event.oldSubscription?.unsubscribe?.()
  } catch (error) {
    console.error('[AgriAssist SW] push subscription renewal failed', error)
    await postMessageToWindowClients({ type: 'PUSH_SUBSCRIPTION_RENEWAL_REQUIRED' })
  }
}

function openNotifDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTIF_DB_NAME, NOTIF_DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      let store
      if (!db.objectStoreNames.contains(NOTIF_STORE_NAME)) {
        store = db.createObjectStore(NOTIF_STORE_NAME, { keyPath: 'id', autoIncrement: true })
      } else {
        store = event.target.transaction.objectStore(NOTIF_STORE_NAME)
      }

      if (!store.indexNames.contains('notification_id')) {
        store.createIndex('notification_id', 'notification_id', { unique: false })
      }
      if (!store.indexNames.contains('timestamp')) {
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
      if (!store.indexNames.contains('is_read')) {
        store.createIndex('is_read', 'is_read', { unique: false })
      }

      if (!db.objectStoreNames.contains(META_STORE_NAME)) {
        db.createObjectStore(META_STORE_NAME, { keyPath: 'key' })
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
      history_id: payload.history_id,
      title: payload.title,
      body: payload.body,
      severity: payload.severity,
      event_type: payload.event_type,
      timestamp: payload.timestamp || new Date().toISOString(),
      is_read: false,
      is_dismissed: false,
      data: payload.data || {},
    })
    await waitForTransaction(tx)
    db.close()
  } catch (error) {
    debugLog('failed to save notification to IndexedDB', error)
  }
}

async function markIndexedNotification(notificationId, updates) {
  if (!notificationId) {
    return
  }

  try {
    const db = await openNotifDB()
    const tx = db.transaction(NOTIF_STORE_NAME, 'readwrite')
    const store = tx.objectStore(NOTIF_STORE_NAME)
    const index = store.index('notification_id')
    const request = index.openCursor(IDBKeyRange.only(notificationId))
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        cursor.update({ ...cursor.value, ...updates })
        cursor.continue()
      }
    }
    await waitForTransaction(tx)
    db.close()
  } catch (error) {
    debugLog('failed to update IndexedDB notification', error)
  }
}

async function getUnreadCount() {
  try {
    const db = await openNotifDB()
    const tx = db.transaction(NOTIF_STORE_NAME, 'readonly')
    const request = tx.objectStore(NOTIF_STORE_NAME).index('is_read').count(IDBKeyRange.only(false))
    const count = await waitForRequest(request, 0)
    db.close()
    return count
  } catch {
    return 0
  }
}

async function setMetadata(key, value) {
  const db = await openNotifDB()
  const tx = db.transaction(META_STORE_NAME, 'readwrite')
  tx.objectStore(META_STORE_NAME).put({ key, value })
  await waitForTransaction(tx)
  db.close()
}

async function getMetadata(key) {
  try {
    const db = await openNotifDB()
    const tx = db.transaction(META_STORE_NAME, 'readonly')
    const request = tx.objectStore(META_STORE_NAME).get(key)
    const result = await waitForRequest(request, null)
    db.close()
    return result?.value || null
  } catch {
    return null
  }
}

function waitForTransaction(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function waitForRequest(request, fallback) {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(fallback)
  })
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = self.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
