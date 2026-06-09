import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isStandalone } from './usePwaInstall'

const withWindow = (win: unknown, fn: () => void) => {
  const g = globalThis as { window?: unknown }
  const had = 'window' in g
  const prev = g.window
  g.window = win
  try {
    fn()
  } finally {
    if (had) g.window = prev
    else delete g.window
  }
}

test('isStandalone: false when there is no window (SSR / node)', () => {
  const g = globalThis as { window?: unknown }
  const had = 'window' in g
  const prev = g.window
  delete g.window
  try {
    assert.equal(isStandalone(), false)
  } finally {
    if (had) g.window = prev
  }
})

test('isStandalone: true when display-mode is standalone', () => {
  withWindow(
    { matchMedia: () => ({ matches: true }), navigator: {} },
    () => assert.equal(isStandalone(), true),
  )
})

test('isStandalone: true via iOS navigator.standalone', () => {
  withWindow(
    { matchMedia: () => ({ matches: false }), navigator: { standalone: true } },
    () => assert.equal(isStandalone(), true),
  )
})

test('isStandalone: false in a normal browser tab', () => {
  withWindow(
    { matchMedia: () => ({ matches: false }), navigator: { standalone: false } },
    () => assert.equal(isStandalone(), false),
  )
})
