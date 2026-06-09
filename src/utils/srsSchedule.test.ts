import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dueKana, INTERVALS, isDue, nextCard, type SrsMap } from './srsSchedule'

describe('nextCard', () => {
  it('перша правильна відповідь → бокс 1, due через INTERVALS[1] днів', () => {
    const card = nextCard(undefined, true, '2026-06-09')
    assert.equal(card.box, 1)
    assert.equal(card.due, '2026-06-10') // +1 день
  })

  it('правильні відповіді просувають бокси й розсувають інтервали', () => {
    let card = nextCard(undefined, true, '2026-01-01') // box1 → +1
    assert.equal(card.box, 1)
    card = nextCard(card, true, '2026-01-01') // box2 → +2
    assert.equal(card.box, 2)
    assert.equal(card.due, '2026-01-03')
  })

  it('бокс не перевищує максимум', () => {
    let card = { box: INTERVALS.length - 1, due: '2026-01-01' }
    card = nextCard(card, true, '2026-01-01')
    assert.equal(card.box, INTERVALS.length - 1)
  })

  it('помилка скидає в бокс 0 і робить картку до повторення сьогодні', () => {
    const card = nextCard({ box: 4, due: '2026-05-01' }, false, '2026-06-09')
    assert.deepEqual(card, { box: 0, due: '2026-06-09' })
  })
})

describe('isDue', () => {
  it('due сьогодні або раніше = прострочена', () => {
    assert.equal(isDue({ box: 1, due: '2026-06-09' }, '2026-06-09'), true)
    assert.equal(isDue({ box: 1, due: '2026-06-08' }, '2026-06-09'), true)
  })

  it('due в майбутньому = ще не час', () => {
    assert.equal(isDue({ box: 1, due: '2026-06-10' }, '2026-06-09'), false)
  })
})

describe('dueKana', () => {
  const universe = ['あ', 'い', 'う', 'え', 'お']

  it('нові (небачені) кани йдуть у чергу', () => {
    assert.deepEqual(dueKana({}, universe, '2026-06-09'), universe)
  })

  it('прострочені перед новими; майбутні пропускаються', () => {
    const map: SrsMap = {
      あ: { box: 1, due: '2026-06-09' }, // due today
      い: { box: 3, due: '2026-07-01' }, // future → skip
      う: { box: 0, due: '2026-06-05' }, // overdue
    }
    // overdue/ due: 'う'(06-05) then 'あ'(06-09); потім нові 'え','お'. 'い' пропущена.
    assert.deepEqual(dueKana(map, universe, '2026-06-09'), ['う', 'あ', 'え', 'お'])
  })

  it('за однакової дати слабші (нижчий бокс) йдуть першими', () => {
    const map: SrsMap = {
      あ: { box: 3, due: '2026-06-09' },
      い: { box: 0, due: '2026-06-09' },
    }
    assert.deepEqual(dueKana(map, ['あ', 'い'], '2026-06-09'), ['い', 'あ'])
  })

  it('поважає денний ліміт (cap)', () => {
    const result = dueKana({}, universe, '2026-06-09', 2)
    assert.equal(result.length, 2)
    assert.deepEqual(result, ['あ', 'い'])
  })
})
