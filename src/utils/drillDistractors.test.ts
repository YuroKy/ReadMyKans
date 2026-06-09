import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildDistractors, buildChoices, shuffle } from './drillDistractors'
import { kanaToRomaji } from './romaji'
import { isKatakana } from './kana'

describe('buildDistractors', () => {
  it('повертає задану кількість і ніколи не містить цілі', () => {
    const out = buildDistractors('か', { count: 3 })
    assert.equal(out.length, 3)
    assert.ok(!out.includes('か'))
  })

  it('плутанини мають найвищий пріоритет', () => {
    const out = buildDistractors('ね', { confusions: ['れ', 'わ'], count: 3 })
    assert.equal(out[0], 'れ')
    assert.equal(out[1], 'わ')
  })

  it('без плутанин бере сусідів по ряду (той самий приголосний)', () => {
    const out = buildDistractors('か', { count: 3 })
    // か-ряд: き く け こ
    for (const k of out) assert.ok('きくけこ'.includes(k), `${k} має бути з ка-ряду`)
  })

  it('не змішує скрипти: катакана → катакана', () => {
    const out = buildDistractors('カ', { count: 3 })
    for (const k of out) assert.ok(isKatakana(k), `${k} має бути катаканою`)
  })

  it('не повертає двох плиток з однаковим звуком', () => {
    const out = buildDistractors('し', { confusions: ['シ'], count: 3 })
    const sounds = out.map(kanaToRomaji)
    assert.equal(new Set(sounds).size, sounds.length)
    assert.ok(!sounds.includes('shi'))
  })

  it('не падає на дакутені (немає в базовій сітці) — добирає з пулу', () => {
    const out = buildDistractors('が', { universe: [...'がぎぐげご'], count: 3 })
    assert.equal(out.length, 3)
    assert.ok(!out.includes('が'))
  })
})

describe('shuffle', () => {
  it('детермінований із заданим RNG і зберігає елементи', () => {
    const seq = [0.99, 0.5, 0.0]
    let i = 0
    const rng = () => seq[i++ % seq.length]!
    const out = shuffle(['a', 'b', 'c', 'd'], rng)
    assert.equal(out.length, 4)
    assert.deepEqual([...out].sort(), ['a', 'b', 'c', 'd'])
  })

  it('не мутує вхідний масив', () => {
    const input = ['a', 'b', 'c']
    shuffle(input, () => 0)
    assert.deepEqual(input, ['a', 'b', 'c'])
  })
})

describe('buildChoices', () => {
  it('містить ціль і має розмір count+1', () => {
    const choices = buildChoices('か', { count: 3 }, () => 0)
    assert.equal(choices.length, 4)
    assert.ok(choices.includes('か'))
  })
})
