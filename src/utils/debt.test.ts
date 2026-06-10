import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DEBT_THRESHOLD, RANSOM_SIZE, overdueKana, ransomPool, gamesLocked } from './debt'
import type { SrsMap } from './srs'

const TODAY = '2026-06-10'

const overdueMap = (count: number): SrsMap => {
  const map: SrsMap = {}
  for (let i = 0; i < count; i += 1) {
    map[`kana${i}`] = { box: i % 3, due: '2026-06-01' }
  }
  return map
}

describe('overdueKana', () => {
  it('невидані кани не рахуються боргом (їх немає в map)', () => {
    assert.deepEqual(overdueKana({}, TODAY), [])
  })

  it('майбутні картки не в боргу', () => {
    const map: SrsMap = {
      あ: { box: 2, due: '2026-06-20' },
      い: { box: 1, due: '2026-06-09' },
    }
    assert.deepEqual(overdueKana(map, TODAY), ['い'])
  })

  it('найдавніші і найслабші першими', () => {
    const map: SrsMap = {
      あ: { box: 3, due: '2026-06-08' },
      い: { box: 0, due: '2026-06-08' },
      う: { box: 0, due: '2026-06-01' },
    }
    assert.deepEqual(overdueKana(map, TODAY), ['う', 'い', 'あ'])
  })
})

describe('ransomPool', () => {
  it('бере перші RANSOM_SIZE', () => {
    assert.equal(ransomPool(overdueMap(30), TODAY).length, RANSOM_SIZE)
  })
})

describe('gamesLocked', () => {
  it('нижче порога — вільно', () => {
    assert.equal(gamesLocked(overdueMap(DEBT_THRESHOLD - 1), TODAY, null), false)
  })

  it('на порозі — лок', () => {
    assert.equal(gamesLocked(overdueMap(DEBT_THRESHOLD), TODAY, null), true)
  })

  it('сплачений відкуп сьогодні знімає лок', () => {
    assert.equal(
      gamesLocked(overdueMap(50), TODAY, { date: TODAY, paid: true }),
      false,
    )
  })

  it('вчорашній відкуп не діє', () => {
    assert.equal(
      gamesLocked(overdueMap(50), TODAY, { date: '2026-06-09', paid: true }),
      true,
    )
  })
})
