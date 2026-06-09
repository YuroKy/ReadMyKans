import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { splitSentences } from './sentences'

describe('splitSentences', () => {
  it('порожній / пробільний вхід → []', () => {
    assert.deepEqual(splitSentences(''), [])
    assert.deepEqual(splitSentences('   \n  '), [])
  })

  it('текст без термінаторів → одне речення', () => {
    assert.deepEqual(splitSentences('あいうえお'), ['あいうえお'])
  })

  it('розбиває по 。！？ і лишає термінатор у реченні', () => {
    assert.deepEqual(splitSentences('あいう。かきく！さしす？'), [
      'あいう。',
      'かきく！',
      'さしす？',
    ])
  })

  it('розбиває по переносах рядків (термінатор не лишається)', () => {
    assert.deepEqual(splitSentences('一行目\n二行目\r\n三行目'), ['一行目', '二行目', '三行目'])
  })

  it('підтримує латинські !? і змішану пунктуацію', () => {
    assert.deepEqual(splitSentences('Hello! こんにちは。Bye?'), ['Hello!', 'こんにちは。', 'Bye?'])
  })

  it('не лишає порожніх шматків між термінатором і переносом', () => {
    assert.deepEqual(splitSentences('あ。\nい。'), ['あ。', 'い。'])
  })
})
