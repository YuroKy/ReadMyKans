import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { applyDakuten, toSmallKana } from './kanaCompose'

describe('applyDakuten', () => {
  it('складає дакутен: か→が, ハ→バ', () => {
    assert.equal(applyDakuten('か', '゛'), 'が')
    assert.equal(applyDakuten('ハ', '゛'), 'バ')
    assert.equal(applyDakuten('う', '゛'), 'ゔ')
  })

  it('складає хандакутен: は→ぱ, ホ→ポ', () => {
    assert.equal(applyDakuten('は', '゜'), 'ぱ')
    assert.equal(applyDakuten('ホ', '゜'), 'ポ')
  })

  it('несумісна кана повертається без змін', () => {
    assert.equal(applyDakuten('あ', '゛'), 'あ')
    assert.equal(applyDakuten('か', '゜'), 'か')
    assert.equal(applyDakuten('ん', '゛'), 'ん')
    assert.equal(applyDakuten('', '゛'), '')
  })
})

describe('toSmallKana', () => {
  it('зменшує сумісні кани в обох абетках', () => {
    assert.equal(toSmallKana('や'), 'ゃ')
    assert.equal(toSmallKana('つ'), 'っ')
    assert.equal(toSmallKana('ヨ'), 'ョ')
    assert.equal(toSmallKana('ツ'), 'ッ')
  })

  it("порожньо для кан без малої форми", () => {
    assert.equal(toSmallKana('か'), '')
    assert.equal(toSmallKana('ん'), '')
    assert.equal(toSmallKana(''), '')
  })
})
