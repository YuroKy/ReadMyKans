import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isSpeechSynthesisSupported, pickJapaneseVoice, speakKana } from './kanaSpeech'

// In the node test runtime there is no `window`, so the helper must degrade
// gracefully instead of throwing.
describe('kanaSpeech (без speechSynthesis)', () => {
  it('isSpeechSynthesisSupported = false без window', () => {
    assert.equal(isSpeechSynthesisSupported(), false)
  })

  it('pickJapaneseVoice повертає undefined без window', () => {
    assert.equal(pickJapaneseVoice(), undefined)
  })

  it('speakKana не падає і повертає false', () => {
    assert.equal(speakKana('あ'), false)
    assert.equal(speakKana('かな', { rate: 0.6 }), false)
  })

  it('speakKana повертає false на порожньому тексті', () => {
    assert.equal(speakKana('   '), false)
  })
})
