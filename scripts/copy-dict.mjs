import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'node_modules', '@sglkc', 'kuromoji', 'dict')
const destDir = join(root, 'public', 'dict')

if (!existsSync(srcDir)) {
  console.warn('[copy-dict] kuromoji dict не знайдено — пропускаю (встановіть залежності).')
  process.exit(0)
}

mkdirSync(destDir, { recursive: true })

let copied = 0
for (const file of readdirSync(srcDir)) {
  if (file.endsWith('.dat.gz')) {
    copyFileSync(join(srcDir, file), join(destDir, file))
    copied += 1
  }
}

console.log(`[copy-dict] Скопійовано ${copied} файлів словника у public/dict`)
