import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hashForView, viewForHash } from './route'
import type { AppView } from '../types'

const VIEWS: AppView[] = ['setup', 'reading', 'result', 'drill', 'sprint', 'memory', 'exam']

describe('route', () => {
  it('round-trips every view through its hash', () => {
    for (const view of VIEWS) {
      assert.equal(viewForHash(hashForView(view)), view)
    }
  })

  it('maps empty and bare hashes to setup', () => {
    assert.equal(viewForHash(''), 'setup')
    assert.equal(viewForHash('#'), 'setup')
    assert.equal(viewForHash('#/'), 'setup')
  })

  it('maps unknown hashes to setup', () => {
    assert.equal(viewForHash('#/nope'), 'setup')
    assert.equal(viewForHash('#/drill/extra'), 'setup')
  })

  it('tolerates trailing slashes', () => {
    assert.equal(viewForHash('#/drill/'), 'drill')
    assert.equal(viewForHash('#/reading//'), 'reading')
  })
})
