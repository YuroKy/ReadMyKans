import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { encouragement } from './encouragement'

describe('encouragement', () => {
  it('повертає рівні залежно від точності', () => {
    assert.equal(encouragement(100).title, 'Чудова робота!')
    assert.equal(encouragement(90).title, 'Чудова робота!')
    assert.equal(encouragement(75).title, 'Гарний результат!')
    assert.equal(encouragement(55).title, 'Непогано!')
    assert.equal(encouragement(20).title, 'Тренуймося далі!')
    assert.equal(encouragement(0).title, 'Тренуймося далі!')
  })

  it('кожен рівень має непорожній підзаголовок', () => {
    for (const value of [0, 55, 75, 95]) {
      assert.ok(encouragement(value).subtitle.length > 0)
    }
  })
})
