import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { ComparisonSegment } from '../types'
import { collectConfusions, collectConfusionPairs } from './confusions'

describe('collectConfusions', () => {
  it('збирає пари з mismatch-сегментів і рахує повтори', () => {
    const segments: ComparisonSegment[] = [
      { type: 'correct', original: 'お', spoken: 'お' },
      { type: 'mismatch', original: 'あ', spoken: 'お' },
      { type: 'mismatch', original: 'あ', spoken: 'お' },
    ]
    const r = collectConfusions(segments)
    assert.equal(r.length, 1)
    assert.equal(r[0]!.count, 2)
    assert.deepEqual([r[0]!.a, r[0]!.b].sort(), ['あ', 'お'])
  })

  it('симетричні плутанини обʼєднуються в одну пару', () => {
    const segments: ComparisonSegment[] = [
      { type: 'mismatch', original: 'あ', spoken: 'お' },
      { type: 'mismatch', original: 'お', spoken: 'あ' },
    ]
    const r = collectConfusions(segments)
    assert.equal(r.length, 1)
    assert.equal(r[0]!.count, 2)
  })

  it('розбиває злиті mismatch-сегменти посимвольно', () => {
    const segments: ComparisonSegment[] = [{ type: 'mismatch', original: 'あて', spoken: 'おで' }]
    const r = collectConfusions(segments)
    assert.equal(r.length, 2)
  })

  it('пропускає романі-еквівалентні (ぢ/じ)', () => {
    const segments: ComparisonSegment[] = [{ type: 'mismatch', original: 'ぢ', spoken: 'じ' }]
    assert.deepEqual(collectConfusions(segments), [])
  })

  it('обмежує кількість результатів параметром limit', () => {
    const segments: ComparisonSegment[] = [
      { type: 'mismatch', original: 'あ', spoken: 'お' },
      { type: 'mismatch', original: 'か', spoken: 'き' },
      { type: 'mismatch', original: 'さ', spoken: 'し' },
    ]
    assert.equal(collectConfusions(segments, 2).length, 2)
  })
})

describe('collectConfusionPairs', () => {
  it('рахує пари (очікувано → почуто) і сортує за частотою', () => {
    const r = collectConfusionPairs([
      ['あ', 'お'],
      ['あ', 'お'],
      ['か', 'き'],
    ])
    assert.equal(r.length, 2)
    assert.equal(r[0]!.count, 2)
    assert.deepEqual([r[0]!.a, r[0]!.b], ['あ', 'お'])
  })

  it('обʼєднує симетричні та пропускає не-кану / романі-еквівалентні', () => {
    const r = collectConfusionPairs([
      ['お', 'あ'],
      ['あ', 'お'],
      ['ぢ', 'じ'],
      ['か', ''],
    ])
    assert.equal(r.length, 1)
    assert.equal(r[0]!.count, 2)
  })
})
