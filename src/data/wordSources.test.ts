import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { displayFor, orderByUrgency, setCustomWords, translationFor, type WordEntry } from './wordSources'

describe('wordSources', () => {
  afterEach(() => setCustomWords([]))

  it('translationFor знаходить слово і повертає порожньо для невідомого', () => {
    assert.equal(translationFor('ねこ'), 'кіт')
    assert.equal(translationFor('ぬぬぬ'), '')
  })

  it('катакана-слова знаходяться і за хіраґана-формою (читання kuromoji)', () => {
    assert.equal(translationFor('テレビ'), 'телевізор')
    assert.equal(translationFor('てれび'), 'телевізор')
    assert.equal(translationFor('こーひー'), 'кава')
  })

  it('displayFor порожній для слів без гліфа', () => {
    assert.equal(displayFor('ねこ'), '')
    assert.equal(displayFor('ぬぬぬ'), '')
  })

  it('власні слова додаються і перекривають вбудовані', () => {
    setCustomWords([
      { kana: 'ぴかちゅう', translation: 'пікачу' },
      { kana: 'ねこ', translation: 'котик' },
    ])
    assert.equal(translationFor('ぴかちゅう'), 'пікачу')
    assert.equal(translationFor('ねこ'), 'котик')

    setCustomWords([])
    assert.equal(translationFor('ぴかちゅう'), '')
    assert.equal(translationFor('ねこ'), 'кіт')
  })

  it('orderByUrgency ставить слова з найслабшою каною першими', () => {
    const entries: WordEntry[] = [
      { kana: 'あい', translation: 'a' },
      { kana: 'うえ', translation: 'b' },
    ]
    const ordered = orderByUrgency(entries, { う: { correct: 0, wrong: 5 } }, {}, '2026-06-11')
    assert.deepEqual(
      ordered.map((entry) => entry.kana),
      ['うえ', 'あい'],
    )
  })

  it('orderByUrgency не мутує вхідний масив', () => {
    const entries: WordEntry[] = [
      { kana: 'あい', translation: 'a' },
      { kana: 'うえ', translation: 'b' },
    ]
    orderByUrgency(entries, { う: { correct: 0, wrong: 5 } }, {}, '2026-06-11')
    assert.deepEqual(
      entries.map((entry) => entry.kana),
      ['あい', 'うえ'],
    )
  })
})
