import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MNEMONICS, mnemonicFor } from './mnemonics'
import { HIRAGANA_ROWS, KATAKANA_ROWS } from '../utils/kana'

describe('mnemonics', () => {
  it('кожна базова кана (хіра + ката) має асоціацію', () => {
    const base = [...HIRAGANA_ROWS.flat(), ...KATAKANA_ROWS.flat()].filter(Boolean)
    for (const kana of base) {
      assert.ok(MNEMONICS[kana], `немає мнемоніки для «${kana}»`)
    }
  })

  it('дакутен-варіант успадковує образ базової кани', () => {
    const ga = mnemonicFor('が')
    assert.ok(ga.includes(MNEMONICS['か']!), 'が не містить образ か')
    assert.match(ga, /дзвінк/)
  })

  it('хандакутен-варіант успадковує образ і згадує «п»', () => {
    const pa = mnemonicFor('ぱ')
    assert.ok(pa.includes(MNEMONICS['は']!), 'ぱ не містить образ は')
    assert.match(pa, /«п»/)
  })

  it('невідомі символи — порожньо', () => {
    assert.equal(mnemonicFor('x'), '')
    assert.equal(mnemonicFor('ー'), '')
    assert.equal(mnemonicFor(''), '')
  })
})
