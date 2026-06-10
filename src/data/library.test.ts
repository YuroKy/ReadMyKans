import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { LIBRARY, libraryTextById } from './library'
import { isKana } from '../utils/kana'

describe('library', () => {
  it('has unique non-empty ids', () => {
    const ids = LIBRARY.map((entry) => entry.id)
    assert.ok(ids.every((id) => id.length > 0))
    assert.equal(new Set(ids).size, ids.length)
  })

  it('every text contains kana to drill', () => {
    for (const entry of LIBRARY) {
      const kana = [...entry.text].filter(isKana)
      assert.ok(kana.length > 10, `${entry.id} has too little kana`)
    }
  })

  it('every text splits into words for chunking', () => {
    for (const entry of LIBRARY) {
      const words = entry.text.split(/\s+/u).filter((word) => [...word].some(isKana))
      assert.ok(words.length > 1, `${entry.id} should have multiple words`)
    }
  })

  it('looks up entries by id', () => {
    assert.equal(libraryTextById('kaguya')?.title, 'かぐやひめ')
    assert.equal(libraryTextById('nope'), undefined)
  })
})
