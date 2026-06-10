// Генерує src/data/kanaStrokes.ts із SVG-файлів KanjiVG (CC BY-SA 3.0,
// © Ulrich Apel, https://kanjivg.tagaini.net). Витягує лише `d`-атрибути
// рисок у порядку написання; viewBox у KanjiVG — 0 0 109 109.
//
// Запуск (разово, результат комітиться): node scripts/build-strokes.mjs

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'kanaStrokes.ts')

// Хіраґана (включно з малими і ゔ), катакана (включно з малими), знак довготи.
const RANGES = [
  [0x3041, 0x3096],
  [0x30a1, 0x30fa],
  [0x30fc, 0x30fc],
]

const chars = RANGES.flatMap(([from, to]) =>
  Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)),
)

const fileUrl = (char) =>
  `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${char
    .codePointAt(0)
    .toString(16)
    .padStart(5, '0')}.svg`

const extractPaths = (svg) =>
  [...svg.matchAll(/<path[^>]*?\bd="([^"]+)"/g)].map((match) => match[1])

const fetchStrokes = async (char) => {
  const response = await fetch(fileUrl(char))
  if (!response.ok) {
    console.warn(`  ⚠ ${char} (U+${char.codePointAt(0).toString(16)}): HTTP ${response.status} — пропущено`)
    return null
  }
  const paths = extractPaths(await response.text())
  if (paths.length === 0) {
    console.warn(`  ⚠ ${char}: SVG без <path> — пропущено`)
    return null
  }
  return paths
}

const main = async () => {
  console.log(`Завантажую ${chars.length} гліфів із KanjiVG…`)
  const entries = []

  // Невеликими партіями, щоб не довбати raw.githubusercontent.com.
  const BATCH = 10
  for (let i = 0; i < chars.length; i += BATCH) {
    const batch = chars.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(fetchStrokes))
    for (let j = 0; j < batch.length; j += 1) {
      if (results[j]) entries.push([batch[j], results[j]])
    }
  }

  console.log(`Отримано ${entries.length} / ${chars.length}`)

  const body = entries
    .map(([char, paths]) => `  '${char}': ${JSON.stringify(paths)},`)
    .join('\n')

  const content = `// AUTO-GENERATED файлом scripts/build-strokes.mjs — не редагуй руками.
// Дані рисок: KanjiVG (https://kanjivg.tagaini.net), © Ulrich Apel,
// ліцензія CC BY-SA 3.0. viewBox гліфів — 0 0 109 109.

export const STROKES_VIEWBOX = 109

export const KANA_STROKES: Record<string, string[]> = {
${body}
}
`
  await writeFile(OUT, content, 'utf8')
  console.log(`Записано ${OUT}`)
}

await main()
