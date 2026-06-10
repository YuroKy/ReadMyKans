import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bestKeyFor, pickTarget, SPRINT_DURATION } from './sprint'

describe('pickTarget', () => {
  it('порожній пул → порожній рядок', () => {
    assert.equal(pickTarget([], '', () => 0), '')
  })

  it('пул з одного — завжди він', () => {
    assert.equal(pickTarget(['あ'], 'あ', () => 0), 'あ')
  })

  it('уникає негайного повтору', () => {
    const pool = ['あ', 'い', 'う']
    // rng=0 → pool[0]='あ', що дорівнює prev → бере сусіда 'い'
    assert.equal(pickTarget(pool, 'あ', () => 0), 'い')
  })

  it('повертає вибір rng, якщо він не дорівнює prev', () => {
    const pool = ['あ', 'い', 'う']
    assert.equal(pickTarget(pool, 'あ', () => 0.5), 'い') // floor(0.5*3)=1
  })

  it('тривалість — 60 секунд', () => {
    assert.equal(SPRINT_DURATION, 60)
  })
})

describe('bestKeyFor', () => {
  it('режими мають окремі ключі рекордів', () => {
    assert.equal(bestKeyFor('classic'), 'sprint:overall')
    assert.equal(bestKeyFor('suddendeath'), 'sprint:suddendeath')
  })
})
