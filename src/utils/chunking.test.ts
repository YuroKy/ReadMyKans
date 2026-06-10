import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  chunkKana,
  chunkKanaByWords,
  takeChunk,
  normalizeRomaji,
  checkRomajiAnswer,
  checkKanaAnswer,
} from './chunking'

const chars = (s: string) => [...s]

describe('chunkKana', () => {
  it('по одній кані (size=1)', () => {
    assert.deepEqual(chunkKana(chars('むかし'), 1), [['む'], ['か'], ['し']])
  })

  it('по дві кани', () => {
    assert.deepEqual(chunkKana(chars('むかしむ'), 2), [
      ['む', 'か'],
      ['し', 'む'],
    ])
  })

  it('останній неповний шматок зберігається', () => {
    assert.deepEqual(chunkKana(chars('むかし'), 2), [['む', 'か'], ['し']])
  })

  it('некоректний size зводиться до ≥1', () => {
    assert.equal(chunkKana(chars('むか'), 0).length, 2)
    assert.equal(chunkKana(chars('むか'), -3).length, 2)
  })
})

describe('chunkKanaByWords', () => {
  const words = (...ws: string[]) => ws.map((w) => [...w])

  it('не перетинає межі слів', () => {
    assert.deepEqual(chunkKanaByWords(words('むか', 'しき'), 5), [
      ['む', 'か'],
      ['し', 'き'],
    ])
  })

  it('коротке слово показується цілком (size 5, слово з 3 → 3)', () => {
    assert.deepEqual(chunkKanaByWords(words('むかし'), 5), [['む', 'か', 'し']])
  })

  it('довге слово ріжеться всередині слова', () => {
    assert.deepEqual(chunkKanaByWords(words('むかしむか'), 2), [
      ['む', 'か'],
      ['し', 'む'],
      ['か'],
    ])
  })

  it('режим «ціле слово» (велика size) → одне слово = один шматок', () => {
    assert.deepEqual(chunkKanaByWords(words('むかしむか', 'き'), 999), [
      ['む', 'か', 'し', 'む', 'か'],
      ['き'],
    ])
  })
})

describe('takeChunk', () => {
  const words = [chars('むかし'), chars('おじいさん'), chars('と')]

  it('бере size кан з початку слова', () => {
    assert.deepEqual(takeChunk(words, 0, 2), chars('むか'))
  })

  it('не перетинає межу слова (хвіст коротший за size)', () => {
    assert.deepEqual(takeChunk(words, 2, 4), chars('し'))
  })

  it('наскрізний offset потрапляє в середину другого слова', () => {
    assert.deepEqual(takeChunk(words, 4, 2), chars('じい'))
  })

  it('offset за кінцем — порожній шматок', () => {
    assert.deepEqual(takeChunk(words, 9, 3), [])
  })

  it('порожні слова — порожній шматок', () => {
    assert.deepEqual(takeChunk([], 0, 3), [])
  })

  it('size щонайменше 1', () => {
    assert.deepEqual(takeChunk(words, 0, 0), chars('む'))
  })
})

describe('normalizeRomaji', () => {
  it('кунрей → хепберн', () => {
    assert.equal(normalizeRomaji('si'), 'shi')
    assert.equal(normalizeRomaji('tu'), 'tsu')
    assert.equal(normalizeRomaji('hu'), 'fu')
    assert.equal(normalizeRomaji('zi'), 'ji')
  })

  it('прибирає регістр/пробіли/дефіси', () => {
    assert.equal(normalizeRomaji(' Mu - Ka '), 'muka')
  })

  it('хепберн лишається без змін', () => {
    assert.equal(normalizeRomaji('shi'), 'shi')
    assert.equal(normalizeRomaji('tsu'), 'tsu')
  })

  it('стягує довгі голосні (тире, подвоєння, макрон)', () => {
    assert.equal(normalizeRomaji('oji-sanga'), 'ojisanga')
    assert.equal(normalizeRomaji('ojiisanga'), 'ojisanga')
    assert.equal(normalizeRomaji('ojīsanga'), 'ojisanga')
  })
})

describe('checkRomajiAnswer', () => {
  it('правильна відповідь', () => {
    assert.equal(checkRomajiAnswer('む', 'mu'), true)
    assert.equal(checkRomajiAnswer('し', 'shi'), true)
    assert.equal(checkRomajiAnswer('し', 'si'), true)
  })

  it('неправильна відповідь', () => {
    assert.equal(checkRomajiAnswer('む', 'mo'), false)
  })

  it('шматок із кількох кан', () => {
    assert.equal(checkRomajiAnswer('むか', 'muka'), true)
    assert.equal(checkRomajiAnswer('むか', 'muki'), false)
  })

  it('довгий голосний (ー) приймається з тире, без нього і подвоєним', () => {
    assert.equal(checkRomajiAnswer('おじーさんが', 'oji-sanga'), true)
    assert.equal(checkRomajiAnswer('おじーさんが', 'ojisanga'), true)
    assert.equal(checkRomajiAnswer('おじーさんが', 'ojiisanga'), true)
    assert.equal(checkRomajiAnswer('おじーさんが', 'okisanga'), false)
  })

  it('довгий голосний у катакані (ラーメン)', () => {
    assert.equal(checkRomajiAnswer('ラーメン', 'ramen'), true)
    assert.equal(checkRomajiAnswer('ラーメン', 'raamen'), true)
    assert.equal(checkRomajiAnswer('ラーメン', 'ra-men'), true)
  })
})

describe('checkKanaAnswer', () => {
  it('точний збіг', () => {
    assert.equal(checkKanaAnswer(chars('む'), chars('む')), true)
  })

  it('помилка вимови', () => {
    assert.equal(checkKanaAnswer(chars('む'), chars('も')), false)
  })

  it('толерантний до зайвого в кінці (ASR додав)', () => {
    assert.equal(checkKanaAnswer(chars('む'), chars('むう')), true)
  })

  it('романі-толерантність じ/ぢ', () => {
    assert.equal(checkKanaAnswer(chars('ぢ'), chars('じ')), true)
  })

  it('замало розпізнаного → неправильно', () => {
    assert.equal(checkKanaAnswer(chars('むか'), chars('む')), false)
  })
})
