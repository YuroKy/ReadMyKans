import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { NUMBER_WORDS } from './numbers'
import { isKana } from '../utils/kana'

describe('numbers', () => {
  it('містить достатньо записів', () => {
    assert.ok(NUMBER_WORDS.length >= 60, `лише ${NUMBER_WORDS.length} записів`)
  })

  it('кана-ключі унікальні', () => {
    const keys = NUMBER_WORDS.map((entry) => entry.kana)
    assert.equal(new Set(keys).size, keys.length)
  })

  it('записи — лише кана, переклади непорожні', () => {
    for (const entry of NUMBER_WORDS) {
      assert.ok(entry.kana.length > 0)
      assert.ok([...entry.kana].every(isKana), `«${entry.kana}» містить не-кану`)
      assert.ok(entry.translation.trim().length > 0, `«${entry.kana}» без перекладу`)
    }
  })

  it('покриває базові групи: числа, години, дні тижня, дати, лічильники', () => {
    const keys = new Set(NUMBER_WORDS.map((entry) => entry.kana))
    for (const probe of ['なな', 'よじ', 'げつようび', 'ついたち', 'ひとつ']) {
      assert.ok(keys.has(probe), `немає «${probe}»`)
    }
  })
})
