import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { evaluate, ACHIEVEMENTS, achievementById, type ProgressSnapshot } from './achievements'

const base: ProgressSnapshot = {
  totalAnswered: 0,
  totalCorrect: 0,
  bestSessionAccuracy: 0,
  streak: 0,
  hiraganaMasteredPct: 0,
  katakanaMasteredPct: 0,
  bestSprint: 0,
  bestSuddenDeath: 0,
  formatsSeen: [],
}

describe('achievements.evaluate', () => {
  it('порожній снапшот не відкриває нічого', () => {
    assert.deepEqual(evaluate(base), [])
  })

  it('100 карток відкриває cards-100, але не cards-500', () => {
    const ids = evaluate({ ...base, totalAnswered: 120 })
    assert.ok(ids.includes('cards-100'))
    assert.ok(!ids.includes('cards-500'))
  })

  it('межові пороги стріку', () => {
    assert.ok(!evaluate({ ...base, streak: 6 }).includes('streak-7'))
    assert.ok(evaluate({ ...base, streak: 7 }).includes('streak-7'))
  })

  it('опанування скриптів', () => {
    assert.ok(evaluate({ ...base, hiraganaMasteredPct: 100 }).includes('hiragana-master'))
    assert.ok(!evaluate({ ...base, hiraganaMasteredPct: 99 }).includes('hiragana-master'))
  })

  it('усі формати потрібні для all-formats', () => {
    const three = ['recognition', 'dictation', 'choice']
    assert.ok(!evaluate({ ...base, formatsSeen: three }).includes('all-formats'))
    assert.ok(
      evaluate({ ...base, formatsSeen: [...three, 'writing'] }).includes('all-formats'),
    )
  })

  it('усе максимальне відкриває весь каталог', () => {
    const ids = evaluate({
      totalAnswered: 1000,
      totalCorrect: 1000,
      bestSessionAccuracy: 100,
      streak: 100,
      hiraganaMasteredPct: 100,
      katakanaMasteredPct: 100,
      bestSprint: 99,
      bestSuddenDeath: 99,
      formatsSeen: ['recognition', 'dictation', 'choice', 'writing'],
    })
    assert.equal(ids.length, ACHIEVEMENTS.length)
  })

  it('sudden-death серія не зараховується як спідран і навпаки', () => {
    const ids = evaluate({ ...base, bestSuddenDeath: 15 })
    assert.ok(ids.includes('suddendeath-15'))
    assert.ok(!ids.includes('sprint-30'))
    const sprintIds = evaluate({ ...base, bestSprint: 30 })
    assert.ok(sprintIds.includes('sprint-30'))
    assert.ok(!sprintIds.includes('suddendeath-15'))
  })
})

describe('achievementById', () => {
  it('знаходить за id', () => {
    assert.equal(achievementById('streak-7')?.icon, '🔥')
    assert.equal(achievementById('nope'), undefined)
  })

  it('усі id унікальні', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    assert.equal(new Set(ids).size, ids.length)
  })
})
