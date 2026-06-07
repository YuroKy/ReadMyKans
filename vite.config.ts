import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, type Connect, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'

// kuromoji вантажить словник як *.dat.gz і розпаковує його сам (fflate).
// Але dev/preview-сервер за замовчуванням віддає .gz з Content-Encoding: gzip,
// тож браузер розпаковує його прозоро → fflate отримує вже розпаковані байти
// → "invalid gzip data". Тут ми віддаємо сирий gzip БЕЗ Content-Encoding.
const serveDictRaw = (): PluginOption => {
  const dictDir = resolve(import.meta.dirname, 'public', 'dict')

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url?.split('?')[0] ?? ''
    // Base-незалежно: матчимо /dict/<file>.dat.gz будь-де в шляху
    // (у preview base = /ReadMyKans/ → /ReadMyKans/dict/...)
    const marker = '/dict/'
    const idx = url.indexOf(marker)
    if (idx === -1 || !url.endsWith('.dat.gz')) {
      next()
      return
    }

    const fileName = url.slice(idx + marker.length)
    // Захист від path traversal — лише прості імена файлів
    if (fileName.includes('/') || fileName.includes('..')) {
      next()
      return
    }

    readFile(resolve(dictDir, fileName))
      .then((data) => {
        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Content-Length', data.length)
        // Навмисно НЕ ставимо Content-Encoding — нехай fflate розпакує сам.
        // no-store — щоб браузер не використав стару закешовану .gz-відповідь
        // (яку раніше віддавали з Content-Encoding: gzip → "invalid gzip data").
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
  // GitHub Pages віддає проект за /<repo>/. У dev лишаємо корінь '/'.
  base: command === 'build' ? '/ReadMyKans/' : '/',
  plugins: [vue(), serveDictRaw()],
  // Пре-бандлимо kuromoji наперед — стабільніший оптимізований чанк,
  // менше шансів на «Outdated Optimize Dep» при зміні графу імпортів.
  optimizeDeps: {
    include: ['@sglkc/kuromoji'],
  },
}))
