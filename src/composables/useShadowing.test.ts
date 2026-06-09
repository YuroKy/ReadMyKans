import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { useShadowing } from './useShadowing'

describe('useShadowing', () => {
  it('graceful, коли speechSynthesis недоступний (node)', () => {
    const shadow = useShadowing(ref('あいうえお'))
    assert.equal(shadow.supported, false)
    assert.equal(shadow.isPlaying.value, false)
    // не кидають виключень навіть без браузера
    shadow.play()
    shadow.toggle()
    shadow.stop()
    assert.equal(shadow.isPlaying.value, false)
  })

  it('rate за замовчуванням у розумних межах', () => {
    const shadow = useShadowing(ref(''))
    assert.ok(shadow.rate.value >= 0.5 && shadow.rate.value <= 1.5)
  })
})
