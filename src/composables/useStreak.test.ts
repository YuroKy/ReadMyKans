import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { advanceStreak, emptyStreak } from './useStreak'

describe('advanceStreak', () => {
  it('перша активність → стрік 1', () => {
    const r = advanceStreak(emptyStreak(), '2026-06-09')
    assert.deepEqual(r, { lastDate: '2026-06-09', streak: 1, todayCount: 1 })
  })

  it('та сама доба → лише лічильник дня', () => {
    const prev = { lastDate: '2026-06-09', streak: 3, todayCount: 2 }
    assert.deepEqual(advanceStreak(prev, '2026-06-09'), {
      lastDate: '2026-06-09',
      streak: 3,
      todayCount: 3,
    })
  })

  it('наступна доба → стрік +1, лічильник скинуто', () => {
    const prev = { lastDate: '2026-06-09', streak: 3, todayCount: 5 }
    assert.deepEqual(advanceStreak(prev, '2026-06-10'), {
      lastDate: '2026-06-10',
      streak: 4,
      todayCount: 1,
    })
  })

  it('пропуск дня → стрік скидається до 1', () => {
    const prev = { lastDate: '2026-06-09', streak: 7, todayCount: 5 }
    assert.equal(advanceStreak(prev, '2026-06-12').streak, 1)
  })
})
