import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { EXAM_SIZE, isoWeek, buildExam, attemptedThisWeek, type ExamRecord } from './exam'

describe('isoWeek', () => {
  it('звичайна дата', () => {
    assert.equal(isoWeek(new Date('2026-06-10')), '2026-W24')
  })

  it('1 січня може належати тижню попереднього року', () => {
    // 2027-01-01 — п'ятниця → ISO-тиждень 53 2026 року
    assert.equal(isoWeek(new Date('2027-01-01')), '2026-W53')
  })

  it('кінець грудня може належати тижню наступного року', () => {
    // 2025-12-29 — понеділок ISO-тижня 1 2026 року
    assert.equal(isoWeek(new Date('2025-12-29')), '2026-W01')
  })
})

describe('buildExam', () => {
  const universe = Array.from({ length: 80 }, (_, i) => `k${i}`)

  it('рівно EXAM_SIZE білетів, формати по колу', () => {
    const items = buildExam(universe, {}, {}, '2026-06-10', () => 0.5)
    assert.equal(items.length, EXAM_SIZE)
    const formats = new Set(items.map((i) => i.format))
    assert.ok(formats.has('recognition'))
    assert.ok(formats.has('dictation'))
    assert.ok(formats.has('choice'))
  })

  it('без TTS диктант підміняється розпізнаванням', () => {
    const items = buildExam(universe, {}, {}, '2026-06-10', () => 0.5, false)
    assert.ok(items.every((i) => i.format !== 'dictation'))
  })

  it('кани не повторюються', () => {
    const items = buildExam(universe, {}, {}, '2026-06-10', () => 0.99)
    assert.equal(new Set(items.map((i) => i.kana)).size, items.length)
  })

  it('менший всесвіт — менший екзамен', () => {
    const items = buildExam(['а', 'б'], {}, {}, '2026-06-10', () => 0)
    assert.equal(items.length, 2)
  })
})

describe('attemptedThisWeek', () => {
  const record: ExamRecord = {
    week: '2026-W24',
    date: '2026-06-10T10:00:00Z',
    correct: 45,
    total: 50,
    accuracy: 90,
    passed: true,
  }

  it('знаходить спробу цього тижня', () => {
    assert.equal(attemptedThisWeek([record], '2026-W24'), true)
    assert.equal(attemptedThisWeek([record], '2026-W25'), false)
    assert.equal(attemptedThisWeek([], '2026-W24'), false)
  })
})
