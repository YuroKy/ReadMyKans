import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { KANJI_N5 } from './kanjiN5'
import { isKana } from '../utils/kana'

describe('kanjiN5', () => {
  it('містить достатньо слів', () => {
    assert.ok(KANJI_N5.length >= 80, `лише ${KANJI_N5.length} слів`)
  })

  it('читання унікальні (ключ лукапа kanjiWordFor)', () => {
    const keys = KANJI_N5.map((entry) => entry.kana)
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i)
    assert.equal(dupes.length, 0, `дублі читань: ${dupes.join(', ')}`)
  })

  it('читання — лише кана, display містить кандзі, переклади непорожні', () => {
    for (const entry of KANJI_N5) {
      assert.ok([...entry.kana].every(isKana), `«${entry.kana}» містить не-кану`)
      assert.ok(entry.display && entry.display.length > 0, `«${entry.kana}» без display`)
      assert.ok(
        [...entry.display].some((ch) => !isKana(ch)),
        `display «${entry.display}» без жодного кандзі`,
      )
      assert.ok(entry.translation.trim().length > 0, `«${entry.kana}» без перекладу`)
    }
  })
})
