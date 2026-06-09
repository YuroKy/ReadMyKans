import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isNewBest, isNewLow } from './useBestScores'

describe('isNewBest', () => {
  it('будь-який бал > 0 б\'є відсутній рекорд', () => {
    assert.equal(isNewBest(undefined, 1), true)
    assert.equal(isNewBest(undefined, 0), false)
  })

  it('тільки строго більший бал — новий рекорд', () => {
    assert.equal(isNewBest(10, 11), true)
    assert.equal(isNewBest(10, 10), false)
    assert.equal(isNewBest(10, 9), false)
  })
})

describe('isNewLow', () => {
  it('відсутній рекорд — завжди новий', () => {
    assert.equal(isNewLow(undefined, 50), true)
  })

  it('тільки строго менший — новий рекорд', () => {
    assert.equal(isNewLow(20, 19), true)
    assert.equal(isNewLow(20, 20), false)
    assert.equal(isNewLow(20, 21), false)
  })
})
