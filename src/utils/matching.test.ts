import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { advanceMatch, matchDetail } from './matching'

const chars = (s: string) => [...s]

describe('advanceMatch', () => {
  it('зараховує повний правильний збіг', () => {
    assert.equal(advanceMatch(chars('おじいさん'), chars('おじいさん'), 0), 5)
  })

  it('зараховує частковий префікс', () => {
    assert.equal(advanceMatch(chars('おじいさん'), chars('おじ'), 0), 2)
  })

  it('продовжує від уже підтвердженого вказівника (from)', () => {
    // підтверджено 2 (おじ), нова фраза містить продовження
    assert.equal(advanceMatch(chars('おじいさん'), chars('いさん'), 2), 5)
  })

  it('монотонний: ніколи не повертає менше за from', () => {
    assert.equal(advanceMatch(chars('おじいさん'), chars('щось не те'), 3), 3)
    assert.equal(advanceMatch(chars('おじいさん'), [], 3), 3)
  })

  it('толерантний до сміття всередині (пропускає зайві символи spoken)', () => {
    // ASR вставив сміття "ほ" між кана
    assert.equal(advanceMatch(chars('おじいさん'), chars('おほじいさん'), 0), 5)
  })

  it('толерантний до сміття на початку фрази', () => {
    assert.equal(advanceMatch(chars('おじ'), chars('ХХおじ'), 0), 2)
  })

  it('стійкий до ковзного вікна: фраза без початку, старт із підтвердженого', () => {
    // original: おじいさんが ; вже підтверджено 5 (おじいさん); вікно ASR з'їхало
    assert.equal(advanceMatch(chars('おじいさんが'), chars('さんが'), 5), 6)
  })

  it('романі-толерантність: ず та づ однакові на слух (zu)', () => {
    assert.equal(advanceMatch(chars('みかづき'), chars('みかずき'), 0), 4)
  })

  it('романі-толерантність: じ та ぢ однакові на слух (ji)', () => {
    assert.equal(advanceMatch(chars('はなぢ'), chars('はなじ'), 0), 3)
  })

  it('катакана = хірагана за вимовою', () => {
    assert.equal(advanceMatch(chars('おじ'), chars('オジ'), 0), 2)
  })

  it('не перевищує довжину оригіналу', () => {
    assert.equal(advanceMatch(chars('おじ'), chars('おじいさん'), 0), 2)
  })

  it('обрізає некоректний from у межі [0, length]', () => {
    assert.equal(advanceMatch(chars('おじ'), chars('おじ'), -5), 2)
    assert.equal(advanceMatch(chars('おじ'), chars('おじ'), 99), 2)
  })
})

describe('matchDetail', () => {
  it('повертає спробу = кану, вимовлену замість очікуваної', () => {
    // очікувалось む (індекс 3), користувач сказав も замість む
    const d = matchDetail(chars('むかしむかし'), chars('もかし'), 3)
    assert.equal(d.matched, 3)
    assert.equal(d.attempt, 'も')
  })

  it('повна відсутність збігу: спроба = перший символ', () => {
    const d = matchDetail(chars('むかし'), chars('もかし'), 0)
    assert.equal(d.matched, 0)
    assert.equal(d.attempt, 'も')
  })

  it('правильна вимова → немає спроби-помилки', () => {
    const d = matchDetail(chars('むかし'), chars('むかし'), 0)
    assert.equal(d.matched, 3)
    assert.equal(d.attempt, '')
  })

  it('частковий збіг → спроба = наступний нерозпізнаний символ', () => {
    // む か збіглись, далі мало бути し, а сказали さ
    const d = matchDetail(chars('むかし'), chars('むかさ'), 0)
    assert.equal(d.matched, 2)
    assert.equal(d.attempt, 'さ')
  })

  it('matched завжди збігається з advanceMatch', () => {
    const o = chars('おじいさん')
    const s = chars('おほじいさん')
    assert.equal(matchDetail(o, s, 0).matched, advanceMatch(o, s, 0))
  })
})
