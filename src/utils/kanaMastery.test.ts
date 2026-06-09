import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { classifyMastery } from './kanaMastery'

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
