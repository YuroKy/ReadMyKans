import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { classifyMastery, masterySummary } from './kanaMastery'

describe('classifyMastery', () => {
  it('untouched, коли спроб немає', () => {
    assert.equal(classifyMastery(undefined), 'untouched')
    assert.equal(classifyMastery({ correct: 0, wrong: 0 }), 'untouched')
  })

  it('weak, коли помилок ≥2 і їх частка ≥34%', () => {
    assert.equal(classifyMastery({ correct: 1, wrong: 2 }), 'weak') // 2/3 ≈ 0.67
    assert.equal(classifyMastery({ correct: 3, wrong: 2 }), 'weak') // 2/5 = 0.40
  })

  it('mastered, коли точність ≥85% і достатньо спроб', () => {
    assert.equal(classifyMastery({ correct: 6, wrong: 0 }), 'mastered')
    assert.equal(classifyMastery({ correct: 9, wrong: 1 }), 'mastered') // 0.90, wrong<2
  })

  it('learning в інших випадках', () => {
    assert.equal(classifyMastery({ correct: 1, wrong: 0 }), 'learning') // total<3
    assert.equal(classifyMastery({ correct: 2, wrong: 1 }), 'learning') // 0.67 < 0.85, wrong<2
  })

  it('одна помилка не робить слабкою (≤34% і <2 помилок)', () => {
    assert.equal(classifyMastery({ correct: 5, wrong: 1 }), 'learning') // 5/6 ≈ 0.83 < 0.85
    assert.equal(classifyMastery({ correct: 10, wrong: 1 }), 'mastered') // 10/11 ≈ 0.91
  })
})

describe('masterySummary', () => {
  it('усе untouched на порожній статистиці', () => {
    const summary = masterySummary({}, ['あ', 'い', 'う'])
    assert.deepEqual(summary, {
      mastered: 0,
      learning: 0,
      weak: 0,
      untouched: 3,
      total: 3,
      masteredPct: 0,
    })
  })

  it('нульовий total для порожнього всесвіту', () => {
    const summary = masterySummary({ あ: { correct: 9, wrong: 0 } }, [])
    assert.equal(summary.total, 0)
    assert.equal(summary.masteredPct, 0)
  })

  it('рахує тіри та відсоток засвоєного', () => {
    const stats = {
      あ: { correct: 6, wrong: 0 }, // mastered
      い: { correct: 1, wrong: 2 }, // weak
      う: { correct: 2, wrong: 1 }, // learning
      // 'え' відсутня → untouched
    }
    const summary = masterySummary(stats, ['あ', 'い', 'う', 'え'])
    assert.equal(summary.mastered, 1)
    assert.equal(summary.weak, 1)
    assert.equal(summary.learning, 1)
    assert.equal(summary.untouched, 1)
    assert.equal(summary.total, 4)
    assert.equal(summary.masteredPct, 25) // 1/4
  })

  it('ігнорує зайві ключі статистики поза всесвітом', () => {
    const stats = { ア: { correct: 9, wrong: 0 } } // катакана поза переданим списком
    const summary = masterySummary(stats, ['あ'])
    assert.equal(summary.untouched, 1)
    assert.equal(summary.mastered, 0)
  })
})
