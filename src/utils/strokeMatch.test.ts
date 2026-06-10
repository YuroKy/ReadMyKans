import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pathLength, totalLength, traceScore, passesTrace, dilate, tolerantTraceScore } from './strokeMatch'

describe('pathLength / totalLength', () => {
  it('довжина прямої лінії', () => {
    assert.equal(pathLength([{ x: 0, y: 0 }, { x: 3, y: 4 }]), 5)
  })

  it('порожній / одноточковий шлях = 0', () => {
    assert.equal(pathLength([]), 0)
    assert.equal(pathLength([{ x: 1, y: 1 }]), 0)
  })

  it('totalLength підсумовує штрихи', () => {
    const strokes = [
      [{ x: 0, y: 0 }, { x: 0, y: 2 }],
      [{ x: 0, y: 0 }, { x: 2, y: 0 }],
    ]
    assert.equal(totalLength(strokes), 4)
  })
})

describe('traceScore', () => {
  const target = [true, true, false, false]

  it('ідеальне покриття', () => {
    const s = traceScore(target, [true, true, false, false])
    assert.equal(s.covered, 1)
    assert.equal(s.spill, 0)
  })

  it('нічого не намальовано', () => {
    const s = traceScore(target, [false, false, false, false])
    assert.equal(s.covered, 0)
    assert.equal(s.spill, 0)
  })

  it('часткове покриття + вихід за межі', () => {
    // покрив 1 з 2 клітинок гліфа; одна намальована клітинка поза гліфом
    const s = traceScore(target, [true, false, true, false])
    assert.equal(s.covered, 0.5)
    assert.equal(s.spill, 0.5)
  })

  it('кидає помилку при різних розмірах', () => {
    assert.throws(() => traceScore([true], [true, false]))
  })
})

describe('passesTrace', () => {
  it('проходить при достатньому покритті й малому виході', () => {
    assert.equal(passesTrace({ covered: 0.7, spill: 0.2 }), true)
  })

  it('не проходить при низькому покритті', () => {
    assert.equal(passesTrace({ covered: 0.4, spill: 0.1 }), false)
  })

  it('не проходить при великому виході за межі', () => {
    assert.equal(passesTrace({ covered: 0.9, spill: 0.8 }), false)
  })

  it('поважає кастомні пороги', () => {
    assert.equal(passesTrace({ covered: 0.5, spill: 0.5 }, { minCovered: 0.5, maxSpill: 0.5 }), true)
  })
})

describe('tolerantTraceScore', () => {
  // Вертикальна риска у стовпці 1 сітки 4x4.
  const line = (col: number): boolean[] => {
    const g = new Array<boolean>(16).fill(false)
    for (let y = 0; y < 4; y += 1) g[y * 4 + col] = true
    return g
  }

  it('точне обведення = повне покриття без виходу', () => {
    const s = tolerantTraceScore(line(1), line(1), 4, 4)
    assert.equal(s.covered, 1)
    assert.equal(s.spill, 0)
  })

  it('штрих, зсунутий на одну клітинку, все одно зараховується', () => {
    const s = tolerantTraceScore(line(1), line(2), 4, 4)
    assert.equal(s.covered, 1)
    assert.equal(s.spill, 0)
  })

  it('штрих далеко від гліфа — низьке покриття і spill', () => {
    const s = tolerantTraceScore(line(0), line(3), 4, 4)
    assert.equal(s.covered, 0)
    assert.equal(s.spill, 1)
  })
})

describe('dilate', () => {
  it('розширює центральну клітинку на сусідів (3x3)', () => {
    const grid = [false, false, false, false, true, false, false, false, false]
    const out = dilate(grid, 3, 3)
    assert.deepEqual(out, [true, true, true, true, true, true, true, true, true])
  })

  it('поважає межі сітки', () => {
    const grid = [true, false, false, false]
    const out = dilate(grid, 2, 2)
    assert.deepEqual(out, [true, true, true, true])
  })
})
