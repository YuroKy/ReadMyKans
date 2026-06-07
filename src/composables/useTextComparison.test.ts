import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { compareTexts } from './useTextComparison'

// Примітка: словник kuromoji у тестах не ініціалізований, тому toReadingHiragana
// повертає вхід без змін. Тести працюють на кана-входах (без кандзі).

describe('compareTexts', () => {
  it('повний збіг → 100% і всі сегменти correct', () => {
    const r = compareTexts('おじいさん', 'おじいさん')
    assert.equal(r.similarity, 100)
    assert.equal(r.mismatchCount, 0)
    assert.deepEqual(r.kanaToReview, [])
    assert.ok(r.segments.every((s) => s.type === 'correct'))
  })

  it('пропущений хвіст → нижча точність і кана для повторення', () => {
    const r = compareTexts('おじいさん', 'おじ')
    assert.ok(r.similarity < 100)
    assert.ok(r.kanaToReview.length > 0)
  })

  it('романі-толерантність: ぢ vs じ зараховується', () => {
    const r = compareTexts('はなぢ', 'はなじ')
    assert.equal(r.similarity, 100)
    assert.equal(r.mismatchCount, 0)
  })

  it('ігнорує японську пунктуацію', () => {
    const r = compareTexts('はい。', 'はい')
    assert.equal(r.similarity, 100)
  })

  it('порожнє розпізнане → точність 0, є кана для повторення', () => {
    const r = compareTexts('おじ', '')
    assert.equal(r.similarity, 0)
    assert.ok(r.kanaToReview.includes('お'))
  })
})
