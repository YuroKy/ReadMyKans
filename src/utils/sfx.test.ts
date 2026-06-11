import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SFX_NOTES, resolveSfxEnabled } from './sfx'

test('resolveSfxEnabled: вимикає лише явне off', () => {
  assert.equal(resolveSfxEnabled(null), true)
  assert.equal(resolveSfxEnabled('on'), true)
  assert.equal(resolveSfxEnabled('garbage'), true)
  assert.equal(resolveSfxEnabled('off'), false)
})

test('SFX_NOTES: усі ноти валідні для планування в AudioContext', () => {
  for (const [name, notes] of Object.entries(SFX_NOTES)) {
    assert.ok(notes.length > 0, `${name}: порожній ефект`)
    for (const note of notes) {
      assert.ok(note.freq > 0, `${name}: частота має бути додатною`)
      assert.ok(note.at >= 0, `${name}: старт не може бути в минулому`)
      assert.ok(note.dur > 0, `${name}: тривалість має бути додатною`)
      if (note.gain !== undefined) {
        assert.ok(note.gain > 0 && note.gain <= 1, `${name}: gain поза межами`)
      }
    }
  }
})
