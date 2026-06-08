import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, type Connect, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'

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
  plugins: [vue(), serveDictRaw()],

  optimizeDeps: {
    include: ['@sglkc/kuromoji'],
  },
}))
