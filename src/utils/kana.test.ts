import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isHiragana, isKatakana, isKana, extractKana, analyzeKana } from './kana'

describe('класифікація кани', () => {
  it('хірагана', () => {
    assert.equal(isHiragana('あ'), true)
    assert.equal(isHiragana('ア'), false)
    assert.equal(isHiragana('漢'), false)
  })

  it('катакана', () => {
    assert.equal(isKatakana('ア'), true)
    assert.equal(isKatakana('あ'), false)
  })

  it('isKana — будь-яка кана', () => {
    assert.equal(isKana('あ'), true)
    assert.equal(isKana('ア'), true)
    assert.equal(isKana('漢'), false)
    assert.equal(isKana('a'), false)
  })
})

describe('extractKana', () => {
  it('лишає лише кану', () => {
    assert.deepEqual(extractKana('お漢じabc'), ['お', 'じ'])
  })
})

describe('analyzeKana', () => {
  it('рахує частоти й унікальні', () => {
    const r = analyzeKana('ああい')
    assert.equal(r.hiraganaCount, 3)
    assert.equal(r.katakanaCount, 0)
    assert.deepEqual(r.uniqueKana, ['あ', 'い'])
    assert.equal(r.mostFrequentKana[0]!.kana, 'あ')
    assert.equal(r.mostFrequentKana[0]!.count, 2)
  })
})
