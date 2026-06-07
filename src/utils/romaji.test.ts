import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kanaToRomaji, textToRomaji, textToRomajiCompact, kanaCharsEqual } from './romaji'

describe('kanaToRomaji', () => {
  it('базова хірагана', () => {
    assert.equal(kanaToRomaji('あ'), 'a')
    assert.equal(kanaToRomaji('し'), 'shi')
    assert.equal(kanaToRomaji('つ'), 'tsu')
  })

  it('катакана зводиться до тієї ж романізації', () => {
    assert.equal(kanaToRomaji('ア'), 'a')
    assert.equal(kanaToRomaji('シ'), 'shi')
  })

  it('діграфи', () => {
    assert.equal(kanaToRomaji('きゃ'), 'kya')
    assert.equal(kanaToRomaji('しょ'), 'sho')
  })

  it('невідомий символ → порожній рядок', () => {
    assert.equal(kanaToRomaji('漢'), '')
  })
})

describe('textToRomaji / textToRomajiCompact', () => {
  it('розділяє склади пробілами', () => {
    assert.equal(textToRomaji('かな'), 'ka na')
  })

  it('компактний варіант без пробілів', () => {
    assert.equal(textToRomajiCompact('かな'), 'kana')
  })

  it('обробляє діграфи в потоці', () => {
    assert.equal(textToRomajiCompact('きょう'), 'kyou')
  })
})

describe('kanaCharsEqual', () => {
  it('ідентичні символи рівні', () => {
    assert.equal(kanaCharsEqual('か', 'か'), true)
  })

  it('омофони рівні: じ = ぢ (ji), ず = づ (zu)', () => {
    assert.equal(kanaCharsEqual('じ', 'ぢ'), true)
    assert.equal(kanaCharsEqual('ず', 'づ'), true)
  })

  it('катакана = хірагана за вимовою', () => {
    assert.equal(kanaCharsEqual('カ', 'か'), true)
  })

  it('різні за вимовою — не рівні', () => {
    assert.equal(kanaCharsEqual('か', 'き'), false)
    assert.equal(kanaCharsEqual('づ', 'ぢ'), false) // zu ≠ ji
  })

  it('не-кана без точного збігу — не рівні', () => {
    assert.equal(kanaCharsEqual('漢', '字'), false)
  })
})
