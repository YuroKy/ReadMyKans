import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { diffUnlocked } from './useAchievements'

describe('diffUnlocked', () => {
  it('відкриває нові й проставляє час', () => {
    const { map, newlyUnlocked } = diffUnlocked({}, ['a', 'b'], '2026-06-09T00:00:00Z')
    assert.deepEqual(newlyUnlocked, ['a', 'b'])
    assert.equal(map.a, '2026-06-09T00:00:00Z')
    assert.equal(map.b, '2026-06-09T00:00:00Z')
  })

  it('не перезаписує вже відкриті', () => {
    const prev = { a: '2020-01-01T00:00:00Z' }
    const { map, newlyUnlocked } = diffUnlocked(prev, ['a', 'c'], '2026-06-09T00:00:00Z')
    assert.deepEqual(newlyUnlocked, ['c'])
    assert.equal(map.a, '2020-01-01T00:00:00Z') // незмінний
    assert.equal(map.c, '2026-06-09T00:00:00Z')
  })

  it('без нових — порожній список', () => {
    const prev = { a: 'x', b: 'y' }
    const { newlyUnlocked } = diffUnlocked(prev, ['a', 'b'], 'now')
    assert.deepEqual(newlyUnlocked, [])
  })
})
