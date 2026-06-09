import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { track } from './analytics'

type GlobalWithWindow = typeof globalThis & { window?: unknown }
const g = globalThis as GlobalWithWindow

afterEach(() => {
  delete g.window
})

test('track не падає без window (node-середовище)', () => {
  assert.doesNotThrow(() => track('event'))
})

test('track не падає, коли umami відсутній (адблокер / dev)', () => {
  g.window = {}
  assert.doesNotThrow(() => track('event', { a: 1 }))
})

test('track передає назву івента й дані в umami.track', () => {
  const calls: Array<[string, unknown]> = []
  g.window = { umami: { track: (event: string, data?: unknown) => calls.push([event, data]) } }

  track('drill-finish', { format: 'choice', accuracy: 92 })

  assert.deepEqual(calls, [['drill-finish', { format: 'choice', accuracy: 92 }]])
})

test('track ковтає помилки з umami.track', () => {
  g.window = {
    umami: {
      track: () => {
        throw new Error('boom')
      },
    },
  }
  assert.doesNotThrow(() => track('event'))
})
