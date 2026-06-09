import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rollDay, addToday, setGoal, emptyDaily, DEFAULT_GOAL } from './useDailyProgress'

describe('useDailyProgress (чисті переходи)', () => {
  it('emptyDaily має дефолтну ціль', () => {
    assert.equal(emptyDaily().goal, DEFAULT_GOAL)
    assert.equal(emptyDaily().count, 0)
  })

  it('rollDay зберігає лічильник у той самий день', () => {
    const s = { date: '2026-06-09', count: 5, goal: 20 }
    assert.deepEqual(rollDay(s, '2026-06-09'), s)
  })

  it('rollDay обнуляє лічильник наступного дня, але тримає ціль', () => {
    const s = { date: '2026-06-09', count: 5, goal: 30 }
    assert.deepEqual(rollDay(s, '2026-06-10'), { date: '2026-06-10', count: 0, goal: 30 })
  })

  it('addToday додає в межах дня', () => {
    const s = { date: '2026-06-09', count: 5, goal: 20 }
    assert.equal(addToday(s, '2026-06-09', 2).count, 7)
  })

  it('addToday починає з нуля новий день', () => {
    const s = { date: '2026-06-09', count: 5, goal: 20 }
    const next = addToday(s, '2026-06-10', 1)
    assert.equal(next.count, 1)
    assert.equal(next.date, '2026-06-10')
  })

  it('setGoal не дозволяє ціль < 1', () => {
    const s = emptyDaily()
    assert.equal(setGoal(s, 0).goal, 1)
    assert.equal(setGoal(s, 50).goal, 50)
    assert.equal(setGoal(s, 7.9).goal, 7)
  })
})
