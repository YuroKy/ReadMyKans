import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { classifyKana, analyzeKanaDifficulty } from './kanaDifficulty'

describe('classifyKana', () => {
  it('базова кана → easy (хірагана й катакана)', () => {
    assert.equal(classifyKana('あ'), 'easy')
    assert.equal(classifyKana('か'), 'easy')
    assert.equal(classifyKana('カ'), 'easy')
    assert.equal(classifyKana('ん'), 'easy')
  })

  it('дзвінкі (дакутен) → medium', () => {
    assert.equal(classifyKana('が'), 'medium')
    assert.equal(classifyKana('じ'), 'medium')
    assert.equal(classifyKana('ガ'), 'medium')
  })

  it('хандакутен / комбо / малі / довгий знак → hard', () => {
    assert.equal(classifyKana('ぱ'), 'hard')
    assert.equal(classifyKana('ゃ'), 'hard')
    assert.equal(classifyKana('っ'), 'hard')
    assert.equal(classifyKana('ー'), 'hard')
  })

  it('не кана → null', () => {
    assert.equal(classifyKana('漢'), null)
    assert.equal(classifyKana('a'), null)
    assert.equal(classifyKana('。'), null)
  })
})

describe('analyzeKanaDifficulty', () => {
  it('рахує по рівнях; total = кількість кани', () => {
    const r = analyzeKanaDifficulty('あがぱ漢a')
    assert.equal(r.easy, 1)
    assert.equal(r.medium, 1)
    assert.equal(r.hard, 1)
    assert.equal(r.total, 3)
  })

  it('порожній текст → усі нулі', () => {
    assert.deepEqual(analyzeKanaDifficulty('漢字abc'), { easy: 0, medium: 0, hard: 0, total: 0 })
  })
})
