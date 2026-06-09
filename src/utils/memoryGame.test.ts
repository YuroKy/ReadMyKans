import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildDeck, hiraToKata, isMatch, type MemoryCard } from './memoryGame'

describe('hiraToKata', () => {
  it('конвертує хіраґану в катакану', () => {
    assert.equal(hiraToKata('あいう'), 'アイウ')
    assert.equal(hiraToKata('か'), 'カ')
  })

  it('не чіпає не-хіраґану', () => {
    assert.equal(hiraToKata('アa1'), 'アa1')
  })
})

describe('buildDeck', () => {
  const pool = ['あ', 'い', 'う', 'え', 'お']

  it('створює 2 картки на пару', () => {
    const deck = buildDeck(pool, 3, 'kana', () => 0)
    assert.equal(deck.length, 6)
  })

  it('кожен matchKey трапляється рівно двічі', () => {
    const deck = buildDeck(pool, 4, 'kana', () => 0)
    const counts = new Map<string, number>()
    for (const c of deck) counts.set(c.matchKey, (counts.get(c.matchKey) ?? 0) + 1)
    for (const n of counts.values()) assert.equal(n, 2)
  })

  it('режим kana: друга картка — катакана', () => {
    const deck = buildDeck(['あ'], 1, 'kana', () => 0)
    const faces = deck.map((c) => c.face).sort()
    assert.deepEqual(faces, ['あ', 'ア'])
    assert.ok(deck.every((c) => !c.romaji))
  })

  it('режим romaji: друга картка — латиниця', () => {
    const deck = buildDeck(['か'], 1, 'romaji', () => 0)
    const romajiCard = deck.find((c) => c.romaji)
    assert.equal(romajiCard?.face, 'ka')
  })

  it('прибирає дублікати за читанням (ぢ/じ → один)', () => {
    const deck = buildDeck(['じ', 'ぢ'], 2, 'kana', () => 0)
    // обидва читаються "ji" → лишається одна пара
    assert.equal(deck.length, 2)
  })
})

describe('isMatch', () => {
  const a: MemoryCard = { id: 'ka-a', face: 'か', matchKey: 'ka', romaji: false }
  const b: MemoryCard = { id: 'ka-b', face: 'カ', matchKey: 'ka', romaji: false }
  const c: MemoryCard = { id: 'ki-a', face: 'き', matchKey: 'ki', romaji: false }

  it('однаковий ключ, різні картки — збіг', () => {
    assert.equal(isMatch(a, b), true)
  })

  it('різні ключі — не збіг', () => {
    assert.equal(isMatch(a, c), false)
  })

  it('та сама картка — не збіг', () => {
    assert.equal(isMatch(a, a), false)
  })
})
