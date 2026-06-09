import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sparkline, polyline, areaPath } from './trend'

describe('sparkline', () => {
  it('порожній масив → []', () => {
    assert.deepEqual(sparkline([], 100, 40), [])
  })

  it('один елемент центрується по X', () => {
    const pts = sparkline([50], 100, 40, 0, 100)
    assert.equal(pts.length, 1)
    assert.equal(pts[0]!.x, 50)
  })

  it('відображає 0..100 у висоту (0 знизу, 100 зверху)', () => {
    const pts = sparkline([0, 100], 100, 40, 0, 100)
    assert.equal(pts[0]!.x, 0)
    assert.equal(pts[0]!.y, 40) // 0% → низ
    assert.equal(pts[1]!.x, 100)
    assert.equal(pts[1]!.y, 0) // 100% → верх
  })

  it('пласка серія з фіксованими min/max не колапсує', () => {
    const pts = sparkline([90, 90, 90], 100, 40, 0, 100)
    for (const p of pts) assert.equal(p.y, 4) // 40 - 0.9*40
  })
})

describe('polyline / areaPath', () => {
  it('polyline формує рядок "x,y x,y"', () => {
    const pts = sparkline([0, 100], 100, 40, 0, 100)
    assert.equal(polyline(pts), '0,40 100,0')
  })

  it('areaPath замикає фігуру донизу', () => {
    const pts = sparkline([0, 100], 100, 40, 0, 100)
    const path = areaPath(pts, 40)
    assert.ok(path.startsWith('M0,40'))
    assert.ok(path.endsWith('Z'))
  })

  it('areaPath порожній для порожніх точок', () => {
    assert.equal(areaPath([], 40), '')
  })
})
