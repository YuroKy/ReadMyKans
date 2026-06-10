import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { advanceStreak, emptyStreak, type StreakState } from './useStreak'

const at = (overrides: Partial<StreakState>): StreakState => ({ ...emptyStreak(), ...overrides })

describe('advanceStreak', () => {
  it('перша активність → стрік 1, подія started', () => {
    const r = advanceStreak(emptyStreak(), '2026-06-09')
    assert.equal(r.event, 'started')
    assert.equal(r.lost, 0)
    assert.deepEqual(r.state, { lastDate: '2026-06-09', streak: 1, todayCount: 1, freezes: 0 })
  })

  it('та сама доба → лише лічильник дня (same)', () => {
    const prev = at({ lastDate: '2026-06-09', streak: 3, todayCount: 2 })
    const r = advanceStreak(prev, '2026-06-09')
    assert.equal(r.event, 'same')
    assert.deepEqual(r.state, { lastDate: '2026-06-09', streak: 3, todayCount: 3, freezes: 0 })
  })

  it('наступна доба → стрік +1 (extended)', () => {
    const prev = at({ lastDate: '2026-06-09', streak: 3, todayCount: 5 })
    const r = advanceStreak(prev, '2026-06-10')
    assert.equal(r.event, 'extended')
    assert.deepEqual(r.state, { lastDate: '2026-06-10', streak: 4, todayCount: 1, freezes: 0 })
  })

  it('пропуск дня без заморозок → burned із втратою', () => {
    const prev = at({ lastDate: '2026-06-09', streak: 7, todayCount: 5 })
    const r = advanceStreak(prev, '2026-06-12')
    assert.equal(r.event, 'burned')
    assert.equal(r.lost, 7)
    assert.equal(r.state.streak, 1)
  })

  it('пропуск 1 дня з заморозкою → frozen, стрік живе, заморозка спалена', () => {
    const prev = at({ lastDate: '2026-06-09', streak: 7, freezes: 1 })
    const r = advanceStreak(prev, '2026-06-11')
    assert.equal(r.event, 'frozen')
    assert.equal(r.state.streak, 8)
    assert.equal(r.state.freezes, 0)
  })

  it('пропуск 2 днів з 2 заморозками → frozen, обидві спалені', () => {
    const prev = at({ lastDate: '2026-06-09', streak: 5, freezes: 2 })
    const r = advanceStreak(prev, '2026-06-12')
    assert.equal(r.event, 'frozen')
    assert.equal(r.state.streak, 6)
    assert.equal(r.state.freezes, 0)
  })

  it('пропуск 2 днів з 1 заморозкою → burned, заморозка вціліла', () => {
    const prev = at({ lastDate: '2026-06-09', streak: 5, freezes: 1 })
    const r = advanceStreak(prev, '2026-06-12')
    assert.equal(r.event, 'burned')
    assert.equal(r.lost, 5)
    assert.equal(r.state.freezes, 1)
  })

  it('старий запис без freezes (back-compat) не ламає перехід', () => {
    const legacy = { lastDate: '2026-06-09', streak: 2, todayCount: 1 } as StreakState
    const r = advanceStreak({ ...emptyStreak(), ...legacy }, '2026-06-10')
    assert.equal(r.event, 'extended')
    assert.equal(r.state.freezes, 0)
  })
})
