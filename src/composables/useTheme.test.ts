import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolveInitialTheme } from './useTheme'

describe('resolveInitialTheme', () => {
  it('збережене значення має пріоритет', () => {
    assert.equal(resolveInitialTheme('dark', false), 'dark')
    assert.equal(resolveInitialTheme('light', true), 'light')
  })

  it('без збереженого — бере системну вподобу', () => {
    assert.equal(resolveInitialTheme(null, true), 'dark')
    assert.equal(resolveInitialTheme(null, false), 'light')
  })

  it('сміттєве значення ігнорується', () => {
    assert.equal(resolveInitialTheme('purple', true), 'dark')
    assert.equal(resolveInitialTheme('', false), 'light')
  })
})
