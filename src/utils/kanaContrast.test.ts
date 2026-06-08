import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kanaContrast } from './kanaContrast'

describe('kanaContrast', () => {
  it('однаковий приголосний, різна голосна (む vs も)', () => {
    const c = kanaContrast('む', 'も')
    assert.equal(c.aRomaji, 'mu')
    assert.equal(c.bRomaji, 'mo')
    assert.match(c.note, /приголосн/)
    assert.match(c.note, /голосн/)
  })

  it('однакова голосна, різний приголосний (か vs さ)', () => {
    const c = kanaContrast('か', 'さ')
    assert.equal(c.aRomaji, 'ka')
    assert.equal(c.bRomaji, 'sa')
    assert.match(c.note, /голосна/)
  })

  it('зовсім різні (き vs の)', () => {
    const c = kanaContrast('き', 'の')
    assert.match(c.note, /різні звуки|ki|no/)
  })

  it('не-кана → загальне пояснення', () => {
    const c = kanaContrast('漢', 'も')
    assert.equal(c.aRomaji, '')
    assert.match(c.note, /Порівняй/)
  })
})
