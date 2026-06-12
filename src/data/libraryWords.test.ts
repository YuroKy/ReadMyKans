import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { LIBRARY } from './library'
import { LIBRARY_WORDS } from './libraryWords'
import { translationFor } from './wordSources'
import { isKana } from '../utils/kana'

describe('libraryWords', () => {
  it('кожне слово кожного тексту бібліотеки має переклад', () => {
    // Той самий поділ на слова, що в useKanaDrill (повноширинні пробіли).
    // Лукап канонізований, тож збіг із kuromoji-формою перевіряє
    // scripts/check-translations.mts, а тут — покриття орфографічних форм.
    for (const entry of LIBRARY) {
      const words = entry.text
        .split(/\s+/u)
        .map((word) => [...word].filter(isKana).join(''))
        .filter((word) => word.length > 0)
      const missing = [...new Set(words)].filter((word) => translationFor(word) === '')
      assert.deepEqual(missing, [], `${entry.id}: без перекладу: ${missing.join('、')}`)
    }
  })

  it('записи без порожніх полів і без дублів кани', () => {
    const seen = new Set<string>()
    for (const entry of LIBRARY_WORDS) {
      assert.ok(entry.kana.length > 0, 'порожня кана')
      assert.ok(entry.translation.length > 0, `порожній переклад: ${entry.kana}`)
      assert.ok(!seen.has(entry.kana), `дубль: ${entry.kana}`)
      seen.add(entry.kana)
    }
  })
})
