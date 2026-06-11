import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kanjiWordFor, orderByUrgency, setCustomWords, translationFor, type WordEntry } from './wordSources'

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

  it('kanjiWordFor шукає гліф за читанням і не залежить від словника N5', () => {
    // やま є і в словнику (без гліфа), і в кандзі-наборі — гліф має знайтись.
    assert.equal(kanjiWordFor('やま')?.display, '山')
    assert.equal(kanjiWordFor('ぬぬぬ'), undefined)
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
