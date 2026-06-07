import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeJapaneseText, makePreview } from './textNormalize'

describe('normalizeJapaneseText', () => {
  it('прибирає японську пунктуацію та пробіли за замовчуванням', () => {
    assert.equal(normalizeJapaneseText('おじいさん、たけを。'), 'おじいさんたけを')
  })

  it('прибирає пробіли між кана', () => {
    assert.equal(normalizeJapaneseText('お じ い さ ん'), 'おじいさん')
  })

  it('зберігає пунктуацію, якщо вимкнено', () => {
    const out = normalizeJapaneseText('はい。', false)
    assert.ok(out.includes('.') || out.includes('。'))
  })

  it('порожній рядок лишається порожнім', () => {
    assert.equal(normalizeJapaneseText(''), '')
  })
})

describe('makePreview', () => {
  it('коротке лишає без змін', () => {
    assert.equal(makePreview('привіт'), 'привіт')
  })

  it('довге обрізає з трьома крапками', () => {
    const out = makePreview('a'.repeat(100), 10)
    assert.equal(out, `${'a'.repeat(10)}...`)
  })
})
