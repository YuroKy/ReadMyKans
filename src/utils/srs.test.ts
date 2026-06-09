import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { boxLevel, srsPriority, orderBySrs } from './srs'

describe('boxLevel', () => {
  it('росте з правильними, падає з помилками, у межах 0..5', () => {
    assert.equal(boxLevel(undefined), 0)
    assert.equal(boxLevel({ correct: 0, wrong: 0 }), 0)
    assert.equal(boxLevel({ correct: 5, wrong: 0 }), 5)
    assert.equal(boxLevel({ correct: 9, wrong: 0 }), 5) // clamp
    assert.equal(boxLevel({ correct: 1, wrong: 3 }), 0) // clamp low
  })
})

describe('srsPriority', () => {
  it('слабкі > незаймані > засвоєні', () => {
    const weak = srsPriority({ correct: 1, wrong: 4 })
    const untouched = srsPriority(undefined)
    const mastered = srsPriority({ correct: 10, wrong: 0 })
    assert.ok(weak > untouched)
    assert.ok(untouched > mastered)
  })
})

describe('orderBySrs', () => {
  it('ставить слабші кани першими', () => {
    const stats = {
      あ: { correct: 10, wrong: 0 }, // mastered
      い: { correct: 1, wrong: 4 }, // weak
      う: { correct: 2, wrong: 1 }, // medium
    }
    const ordered = orderBySrs(['あ', 'い', 'う'], stats)
    assert.equal(ordered[0], 'い')
    assert.equal(ordered[ordered.length - 1], 'あ')
  })

  it('не мутує вхідний масив', () => {
    const input = ['あ', 'い']
    orderBySrs(input, {})
    assert.deepEqual(input, ['あ', 'い'])
  })
})
