import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildKanaSets, findKanaSet } from './kanaSets'

describe('buildKanaSets', () => {
  const sets = buildKanaSets()

  it('містить основні набори', () => {
    const ids = sets.map((s) => s.id)
    assert.ok(ids.includes('hiragana'))
    assert.ok(ids.includes('katakana'))
    assert.ok(ids.includes('dakuten'))
    assert.ok(ids.includes('combos'))
  })

  it('усі набори мають непорожню кану', () => {
    assert.ok(sets.every((s) => s.kana.length > 0 && s.label.length > 0))
  })

  it('повна хіраґана = 46 базових символів', () => {
    const hira = sets.find((s) => s.id === 'hiragana')!
    assert.equal([...hira.kana].length, 46)
    assert.ok(hira.kana.includes('あ'))
    assert.ok(hira.kana.includes('ん'))
  })

  it('додає ряди ґодзюон', () => {
    assert.ok(sets.some((s) => s.id === 'row-0'))
    const row0 = findKanaSet('row-0')!
    assert.equal(row0.kana, 'あいうえお')
  })
})

describe('findKanaSet', () => {
  it('повертає набір за id або undefined', () => {
    assert.equal(findKanaSet('dakuten')?.id, 'dakuten')
    assert.equal(findKanaSet('nope'), undefined)
  })
})
