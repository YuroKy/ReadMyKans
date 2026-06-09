import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { toRubySegments, hasKanji } from './furigana'
import type { ReadingToken } from './reading'

describe('hasKanji', () => {
  it('розрізняє кандзі й кану', () => {
    assert.equal(hasKanji('今日'), true)
    assert.equal(hasKanji('はな'), false)
    assert.equal(hasKanji('カナ'), false)
  })
})

describe('toRubySegments', () => {
  const tokens: ReadingToken[] = [
    { surface: '今日', reading: 'きょう' },
    { surface: 'は', reading: 'は' },
    { surface: 'はな', reading: 'はな' },
  ]

  it('додає ruby лише над кандзі з відмінним читанням', () => {
    const r = toRubySegments(tokens, 'furigana')
    assert.deepEqual(r, [
      { base: '今日', ruby: 'きょう' },
      { base: 'は', ruby: '' },
      { base: 'はな', ruby: '' },
    ])
  })

  it('режим romaji конвертує читання кандзі в ромадзі', () => {
    const r = toRubySegments(tokens, 'romaji')
    assert.equal(r[0]!.base, '今日')
    assert.equal(r[0]!.ruby, 'kyou')
    assert.equal(r[1]!.ruby, '')
  })

  it('без читання — ruby порожній', () => {
    assert.deepEqual(toRubySegments([{ surface: '〜', reading: '' }]), [{ base: '〜', ruby: '' }])
  })
})
