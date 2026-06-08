import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyStat,
  recordOutcome,
  topConfusion,
  isWeak,
  rankWeak,
  type KanaStatsMap,
} from './useKanaStats'

describe('recordOutcome', () => {
  it('рахує правильні та помилки', () => {
    let m: KanaStatsMap = {}
    m = recordOutcome(m, 'む', true)
    m = recordOutcome(m, 'む', false, 'も')
    assert.equal(m['む']!.correct, 1)
    assert.equal(m['む']!.wrong, 1)
    assert.equal(m['む']!.confusedWith['も'], 1)
  })

  it('накопичує плутанину', () => {
    let m: KanaStatsMap = {}
    m = recordOutcome(m, 'む', false, 'も')
    m = recordOutcome(m, 'む', false, 'も')
    m = recordOutcome(m, 'む', false, 'ぬ')
    assert.equal(m['む']!.confusedWith['も'], 2)
    assert.equal(m['む']!.confusedWith['ぬ'], 1)
  })

  it('не записує плутанину саму з собою', () => {
    const m = recordOutcome({}, 'む', false, 'む')
    assert.deepEqual(m['む']!.confusedWith, {})
  })

  it('імутабельний — не мутує вхід', () => {
    const m0: KanaStatsMap = {}
    recordOutcome(m0, 'む', true)
    assert.deepEqual(m0, {})
  })
})

describe('topConfusion', () => {
  it('повертає найчастішу плутанину', () => {
    const stat = { correct: 0, wrong: 3, confusedWith: { も: 2, ぬ: 1 } }
    assert.equal(topConfusion(stat), 'も')
  })

  it('порожньо коли немає плутанини', () => {
    assert.equal(topConfusion(emptyStat()), '')
    assert.equal(topConfusion(undefined), '')
  })
})

describe('isWeak', () => {
  it('слабка: ≥2 помилки і висока частка', () => {
    assert.equal(isWeak({ correct: 1, wrong: 3, confusedWith: {} }), true)
  })

  it('не слабка: мало помилок', () => {
    assert.equal(isWeak({ correct: 10, wrong: 1, confusedWith: {} }), false)
  })

  it('не слабка: висока точність', () => {
    assert.equal(isWeak({ correct: 20, wrong: 2, confusedWith: {} }), false)
  })

  it('undefined → false', () => {
    assert.equal(isWeak(undefined), false)
  })
})

describe('rankWeak', () => {
  it('сортує за кількістю помилок', () => {
    const m: KanaStatsMap = {
      む: { correct: 1, wrong: 1, confusedWith: {} },
      も: { correct: 0, wrong: 5, confusedWith: {} },
      か: { correct: 3, wrong: 0, confusedWith: {} },
    }
    const r = rankWeak(m)
    assert.deepEqual(
      r.map((x) => x.kana),
      ['も', 'む'],
    )
  })
})
