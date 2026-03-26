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

  return {
    name: 'manual-pwa',
    apply: 'build',
    configResolved(config) {
      rootDir = config.root
    },
    generateBundle(_, bundle) {
      const assetUrls = Object.values(bundle)
        .map((entry) => `/${entry.fileName}`)
        .filter((url) => url !== '/sw.js')

      const precacheUrls = Array.from(new Set([...APP_SHELL_URLS, ...assetUrls]))
      const cacheVersion = createHash('sha256')
        .update(precacheUrls.join('|'))
        .digest('hex')
        .slice(0, 12)

      const template = readFileSync(resolve(rootDir, 'src/pwa/sw-template.js'), 'utf8')
      const source = template
        .replace('__CACHE_VERSION__', cacheVersion)
        .replace('__PRECACHE_URLS__', JSON.stringify(precacheUrls, null, 2))

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    manualPwaPlugin(),
  ],
})
