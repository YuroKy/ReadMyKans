// Перевірка покриття перекладами слів бібліотечних текстів у дрилі.
// Ганяє слова через ТОЙ САМИЙ пайплайн, що й дрил: kuromoji-читання
// (pronunciation) → хіраґана → фільтр isKana → translationFor.
// Запуск: npx tsx scripts/check-translations.mts
import type { IpadicFeatures, Tokenizer } from '@sglkc/kuromoji'
import { LIBRARY } from '../src/data/library'
import { translationFor } from '../src/data/wordSources'
import { isKana } from '../src/utils/kana'

const kuromoji = (await import('@sglkc/kuromoji')).default

const tokenizer = await new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
  kuromoji.builder({ dicPath: 'public/dict' }).build((err, t) => {
    if (err) reject(err)
    else resolve(t)
  })
})

const katakanaToHiragana = (text: string): string =>
  [...text]
    .map((char) => {
      const code = char.charCodeAt(0)
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char
    })
    .join('')

// Копія toReadingHiragana з src/utils/reading.ts (там tokenizer приватний)
const toReadingHiragana = (text: string): string =>
  tokenizer
    .tokenize(text)
    .map((token) => {
      const kana =
        token.pronunciation && token.pronunciation !== '*'
          ? token.pronunciation
          : token.reading && token.reading !== '*'
            ? token.reading
            : token.surface_form
      return katakanaToHiragana(kana)
    })
    .join('')

for (const entry of LIBRARY) {
  const words = entry.text
    .split(/\s+/u)
    .map((word) => [...toReadingHiragana(word)].filter(isKana).join(''))
    .filter((word) => word.length > 0)
  const unique = [...new Set(words)]
  const missing = unique.filter((word) => translationFor(word) === '')
  const covered = unique.length - missing.length
  console.log(`\n=== ${entry.id} (${entry.title}): ${covered}/${unique.length} слів з перекладом`)
  if (missing.length > 0) console.log('Без перекладу (форма з kuromoji): ' + missing.join('、'))
}
