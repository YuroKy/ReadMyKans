import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  addDays,
  mondayIndex,
  activityLevel,
  buildCalendar,
  activeDays,
  monthShort,
} from './calendar'

describe('addDays', () => {
  it('додає та віднімає дні через межу місяця', () => {
    assert.equal(addDays('2026-01-31', 1), '2026-02-01')
    assert.equal(addDays('2026-03-01', -1), '2026-02-28')
  })
})

describe('mondayIndex', () => {
  it('понеділок = 0, неділя = 6', () => {
    // 2026-06-08 — понеділок
    assert.equal(mondayIndex('2026-06-08'), 0)
    assert.equal(mondayIndex('2026-06-14'), 6) // неділя
  })
})

describe('activityLevel', () => {
  it('відображає кількість у бакети 0..4', () => {
    assert.equal(activityLevel(0), 0)
    assert.equal(activityLevel(1), 1)
    assert.equal(activityLevel(2), 1)
    assert.equal(activityLevel(3), 2)
    assert.equal(activityLevel(5), 2)
    assert.equal(activityLevel(6), 3)
    assert.equal(activityLevel(11), 4)
    assert.equal(activityLevel(99), 4)
  })
})

describe('buildCalendar', () => {
  const activity = { '2026-06-09': 4, '2026-06-08': 12, '2026-01-01': 1 }

  it('повертає N тижнів по 7 днів', () => {
    const weeks = buildCalendar(activity, '2026-06-09', 12)
    assert.equal(weeks.length, 12)
    for (const week of weeks) assert.equal(week.length, 7)
  })

  it('останній стовпець містить сьогодні', () => {
    const weeks = buildCalendar(activity, '2026-06-09', 12)
    const lastWeek = weeks[weeks.length - 1]!
    assert.ok(lastWeek.some((d) => d.date === '2026-06-09'))
  })

  it('підставляє кількість і рівень', () => {
    const weeks = buildCalendar(activity, '2026-06-09', 12)
    const all = weeks.flat()
    const today = all.find((d) => d.date === '2026-06-09')!
    assert.equal(today.count, 4)
    assert.equal(today.level, 2)
    const busy = all.find((d) => d.date === '2026-06-08')!
    assert.equal(busy.level, 4)
  })

  it('позначає майбутні дні поточного тижня', () => {
    // 2026-06-09 — вівторок; решта тижня (ср-нд) у майбутньому
    const weeks = buildCalendar(activity, '2026-06-09', 4)
    const lastWeek = weeks[weeks.length - 1]!
    assert.ok(lastWeek.some((d) => d.future))
    assert.equal(lastWeek.find((d) => d.date === '2026-06-09')!.future, false)
  })

  it('activeDays рахує дні з активністю в сітці', () => {
    const weeks = buildCalendar({ '2026-06-09': 4, '2026-06-08': 1 }, '2026-06-09', 4)
    assert.equal(activeDays(weeks), 2)
  })
})

describe('monthShort', () => {
  it('дає укр-скорочення місяця', () => {
    assert.equal(monthShort('2026-06-09'), 'чер')
    assert.equal(monthShort('2026-01-01'), 'січ')
  })
})
