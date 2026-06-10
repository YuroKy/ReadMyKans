import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { VOCABULARY, translationFor } from './vocabulary'
import { isKana } from '../utils/kana'

describe('vocabulary', () => {
  it('містить достатньо слів', () => {
    assert.ok(VOCABULARY.length >= 80, `лише ${VOCABULARY.length} слів`)
  })

  it('кана-ключі унікальні', () => {
    const keys = VOCABULARY.map((entry) => entry.kana)
    assert.equal(new Set(keys).size, keys.length)
  })

  it('слова — лише кана (без кандзі), переклади непорожні', () => {
    for (const entry of VOCABULARY) {
      assert.ok(entry.kana.length > 0)
      assert.ok(
        [...entry.kana].every(isKana),
        `«${entry.kana}» містить не-кану`,
      )
      assert.ok(entry.translation.trim().length > 0, `«${entry.kana}» без перекладу`)
    }
  })

  it('translationFor знаходить слово і повертає порожньо для невідомого', () => {
    assert.equal(translationFor('ねこ'), 'кіт')
    assert.equal(translationFor('ぬぬぬ'), '')
  })

  it('катакана-слова знаходяться і за хіраґана-формою (читання kuromoji)', () => {
    assert.equal(translationFor('テレビ'), 'телевізор')
    assert.equal(translationFor('てれび'), 'телевізор')
    assert.equal(translationFor('こーひー'), 'кава')
  })
})
