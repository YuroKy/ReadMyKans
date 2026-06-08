import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { chunkKana, normalizeRomaji, checkRomajiAnswer, checkKanaAnswer } from './chunking'

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
