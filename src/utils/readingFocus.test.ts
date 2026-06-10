import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { charVisibility } from './readingFocus'

describe('charVisibility', () => {
  it('off — усе видно', () => {
    assert.equal(charVisibility(0, 5, 'off'), 'visible')
    assert.equal(charVisibility(99, 5, 'off'), 'visible')
  })

  it('fade: прочитане блюриться, решта видима', () => {
    assert.equal(charVisibility(3, 5, 'fade'), 'blurred')
    assert.equal(charVisibility(5, 5, 'fade'), 'visible')
    assert.equal(charVisibility(20, 5, 'fade'), 'visible')
  })

  it('flash: прочитане блюриться завжди', () => {
    assert.equal(charVisibility(1, 5, 'flash', 8, true), 'blurred')
    assert.equal(charVisibility(1, 5, 'flash', 8, false), 'blurred')
  })

  it('flash: поточне вікно видно лише під час блимання', () => {
    // вікно 0..7 (size 8), курсор на 5
    assert.equal(charVisibility(6, 5, 'flash', 8, true), 'visible')
    assert.equal(charVisibility(6, 5, 'flash', 8, false), 'masked')
  })

  it('flash: майбутні вікна замасковані навіть під час блимання', () => {
    assert.equal(charVisibility(9, 5, 'flash', 8, true), 'masked')
    assert.equal(charVisibility(25, 5, 'flash', 8, false), 'masked')
  })

  it('межа вікна: 7 у вікні курсора 5, а 8 — вже ні', () => {
    assert.equal(charVisibility(7, 5, 'flash', 8, true), 'visible')
    assert.equal(charVisibility(8, 5, 'flash', 8, true), 'masked')
  })

  it('windowSize щонайменше 1', () => {
    assert.equal(charVisibility(0, 0, 'flash', 0, true), 'visible')
  })
})
