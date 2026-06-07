import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { levenshteinDistance, similarityPercentage } from './levenshtein'

describe('levenshteinDistance', () => {
  it('однакові рядки → 0', () => {
    assert.equal(levenshteinDistance('かな', 'かな'), 0)
  })

  it('одна заміна → 1', () => {
    assert.equal(levenshteinDistance('かな', 'きな'), 1)
  })

  it('вставка/видалення', () => {
    assert.equal(levenshteinDistance('かな', 'かなだ'), 1)
    assert.equal(levenshteinDistance('かなだ', 'かな'), 1)
  })

  it('коректно рахує по код-поінтах (juni-code)', () => {
    assert.equal(levenshteinDistance('あい', 'あい'), 0)
  })
})

describe('similarityPercentage', () => {
  it('ідентичні → 100', () => {
    assert.equal(similarityPercentage('かな', 'かな'), 100)
  })

  it('два порожні → 100', () => {
    assert.equal(similarityPercentage('', ''), 100)
  })

  it('повна розбіжність → 0', () => {
    assert.equal(similarityPercentage('かか', 'ねね'), 0)
  })

  it('половина збігу ≈ 50', () => {
    assert.equal(similarityPercentage('かな', 'かね'), 50)
  })
})
