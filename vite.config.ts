import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/vite.svg',
]

function manualPwaPlugin(): Plugin {
  let rootDir = ''

  const buildServiceWorkerSource = (precacheUrls: string[], isDev: boolean) => {
    const cacheVersion = isDev
      ? 'dev'
      : createHash('sha256')
        .update(precacheUrls.join('|'))
        .digest('hex')
        .slice(0, 12)

    const template = readFileSync(resolve(rootDir, 'src/pwa/sw-template.js'), 'utf8')
    return template
      .replace('__CACHE_VERSION__', JSON.stringify(cacheVersion))
      .replace('__IS_DEV__', JSON.stringify(isDev))
      .replace('__PRECACHE_URLS__', JSON.stringify(precacheUrls, null, 2))
  }

  return {
    name: 'manual-pwa',
    configResolved(config) {
      rootDir = config.root
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestUrl = request.url?.split('?')[0]
        if (requestUrl !== '/sw.js') {
          next()
          return
        }

        response.statusCode = 200
        response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(buildServiceWorkerSource(APP_SHELL_URLS, true))
      })
    },
    generateBundle(_, bundle) {
      const assetUrls = Object.values(bundle)
        .map((entry) => `/${entry.fileName}`)
        .filter((url) => url !== '/sw.js')

      const precacheUrls = Array.from(new Set([...APP_SHELL_URLS, ...assetUrls]))
      const source = buildServiceWorkerSource(precacheUrls, false)

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source,
      })
    },
  }
}

function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) {
    return undefined
  }

  if (id.includes('react-dom') || id.includes('react-router-dom') || /node_modules[/\\]react[/\\]/.test(id)) {
    return 'vendor-react'
  }

  if (id.includes('gsap') || id.includes('@gsap')) {
    return 'vendor-animation'
  }

  if (
    id.includes('react-markdown') ||
    id.includes('remark-') ||
    id.includes('rehype-') ||
    id.includes('micromark') ||
    id.includes('unified') ||
    id.includes('unist-') ||
    id.includes('mdast-') ||
    id.includes('hast-') ||
    id.includes('vfile') ||
    id.includes('property-information') ||
    id.includes('decode-named-character-reference')
  ) {
    return 'vendor-markdown'
  }

  if (id.includes('@supabase')) {
    return 'vendor-supabase'
  }

  if (id.includes('i18next') || id.includes('react-i18next')) {
    return 'vendor-i18n'
  }

  if (id.includes('lucide-react') || id.includes('lucide-static')) {
    return 'vendor-icons'
  }

  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
  plugins: [
    react(),
    manualPwaPlugin(),
  ],
})
