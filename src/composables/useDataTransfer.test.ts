import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildBundle, isValidBundle } from './useDataTransfer'

describe('buildBundle', () => {
  it('збирає лише наявні ключі та парсить JSON', () => {
    const store: Record<string, string> = {
      'kana-stats': '{"あ":{"correct":1,"wrong":0}}',
      'kana-theme': 'dark',
    }
    const bundle = buildBundle((k) => store[k] ?? null)
    assert.equal(bundle.app, 'ReadMyKans')
    assert.deepEqual(bundle.data['kana-stats'], { あ: { correct: 1, wrong: 0 } })
    assert.equal(bundle.data['kana-theme'], 'dark')
    assert.ok(!('kana-reader-history' in bundle.data))
  })
})

describe('isValidBundle', () => {
  it('приймає валідний бандл', () => {
    assert.equal(isValidBundle({ app: 'ReadMyKans', version: 1, exportedAt: 'x', data: {} }), true)
  })

  it('відхиляє чужі/зламані обʼєкти', () => {
    assert.equal(isValidBundle(null), false)
    assert.equal(isValidBundle({ app: 'other', data: {} }), false)
    assert.equal(isValidBundle({ app: 'ReadMyKans' }), false)
    assert.equal(isValidBundle('string'), false)
  })
})
