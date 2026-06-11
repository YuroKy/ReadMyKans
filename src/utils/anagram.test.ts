import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { shuffleTiles } from './anagram'

describe('shuffleTiles', () => {
  it('зберігає мультимножину кан', () => {
    const source = [...'ねこたま']
    const tiles = shuffleTiles(source)
    assert.deepEqual([...tiles].sort(), [...source].sort())
  })

  it('ніколи не повертає вихідний порядок, коли є дві різні плитки', () => {
    const source = [...'あいう']
    for (let run = 0; run < 200; run += 1) {
      const tiles = shuffleTiles(source)
      assert.notDeepEqual(tiles, source)
    }
  })

  it('навіть «злий» rng із тотожною перестановкою дає інший порядок', () => {
    // rng → 1-ε змушує Fisher–Yates лишити все на місці.
    const tiles = shuffleTiles([...'かなた'], () => 0.999999)
    assert.notDeepEqual(tiles, [...'かなた'])
  })

  it('константні і короткі послідовності — без зациклень', () => {
    assert.deepEqual(shuffleTiles(['あ', 'あ']), ['あ', 'あ'])
    assert.deepEqual(shuffleTiles(['あ']), ['あ'])
    assert.deepEqual(shuffleTiles([]), [])
  })

  it('не мутує вхідний масив', () => {
    const source = [...'あいうえ']
    shuffleTiles(source)
    assert.deepEqual(source, [...'あいうえ'])
  })
})
