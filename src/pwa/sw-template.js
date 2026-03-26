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
