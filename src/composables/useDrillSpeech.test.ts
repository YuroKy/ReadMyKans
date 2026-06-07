import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { startDrillSpeech, isDrillSpeechSupported } from './useDrillSpeech'

// Керований мок Web Speech API
class MockRecognition {
  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onstart: (() => void) | null = null
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  static transcript = 'む'
  static failOnStart = false

  start() {
    if (MockRecognition.failOnStart) {
      this.onerror?.({ error: 'not-allowed' })
      this.onend?.()
      return
    }
    this.onstart?.()
  }

  stop() {
    const results = { length: 1, 0: { length: 1, 0: { transcript: MockRecognition.transcript } } }
    this.onresult?.({ resultIndex: 0, results })
    this.onend?.()
  }

  abort() {}
}

const setWindow = (ctor: unknown) => {
  ;(globalThis as Record<string, unknown>).window = ctor
    ? { SpeechRecognition: ctor }
    : {}
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window
  MockRecognition.failOnStart = false
  MockRecognition.transcript = 'む'
})

describe('useDrillSpeech', () => {
  it('isDrillSpeechSupported залежить від наявності API', () => {
    setWindow(MockRecognition)
    assert.equal(isDrillSpeechSupported(), true)
    setWindow(null)
    assert.equal(isDrillSpeechSupported(), false)
  })

  it('успішний цикл: started=true, stop → розпізнаний текст', async () => {
    setWindow(MockRecognition)
    MockRecognition.transcript = 'む'
    const s = startDrillSpeech()
    assert.equal(await s.started, true)
    s.stop()
    assert.equal(await s.result, 'む')
  })

  it('помилка старту (немає дозволу) → started=false, порожній результат', async () => {
    setWindow(MockRecognition)
    MockRecognition.failOnStart = true
    const s = startDrillSpeech()
    assert.equal(await s.started, false)
    assert.equal(await s.result, '')
  })

  it('немає Web Speech → started=false, порожньо', async () => {
    setWindow(null)
    const s = startDrillSpeech()
    assert.equal(await s.started, false)
    assert.equal(await s.result, '')
  })

  it('два сеанси поспіль працюють (без витоку стану)', async () => {
    setWindow(MockRecognition)

    MockRecognition.transcript = 'む'
    const s1 = startDrillSpeech()
    assert.equal(await s1.started, true)
    s1.stop()
    assert.equal(await s1.result, 'む')

    MockRecognition.transcript = 'か'
    const s2 = startDrillSpeech()
    assert.equal(await s2.started, true)
    s2.stop()
    assert.equal(await s2.result, 'か')
  })
})
