import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, type Connect, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const serveDictRaw = (): PluginOption => {
  const dictDir = resolve(import.meta.dirname, 'public', 'dict')

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url?.split('?')[0] ?? ''

    const marker = '/dict/'
    const idx = url.indexOf(marker)
    if (idx === -1 || !url.endsWith('.dat.gz')) {
      next()
      return
    }

    const fileName = url.slice(idx + marker.length)

    if (fileName.includes('/') || fileName.includes('..')) {
      next()
      return
    }

    readFile(resolve(dictDir, fileName))
      .then((data) => {
        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Content-Length', data.length)

        res.setHeader('Cache-Control', 'no-store')
        res.end(data)
      })
      .catch(() => next())
  }

  return {
    name: 'serve-dict-raw',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ReadMyKans/' : '/',
  plugins: [
    vue(),
    serveDictRaw(),
    VitePWA({
      // 'prompt' (not 'autoUpdate') so a new version waits for the user to tap
      // «Оновити» in the toast instead of silently reloading mid-session.
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Kana Reader',
        short_name: 'Kana',
        description: 'Тренування читання японської кани вголос',
        lang: 'uk',
        // У тон фону сторінки — інакше системна смуга зверху виглядає чужою.
        theme_color: '#fff3f5',
        background_color: '#fff7f8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell only. The kuromoji dictionary (~15 MB of
        // *.dat.gz) is deliberately excluded — it loads/caches at runtime.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: ['**/dict/**'],
        navigateFallbackDenylist: [/\.dat\.gz$/],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],

  optimizeDeps: {
    include: ['@sglkc/kuromoji'],
  },
}))
