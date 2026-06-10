import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { useDrillSource } from './useDrillSource'
import { useKanaStats } from './useKanaStats'

describe('useDrillSource', () => {
  it('режим text → null (використовується сирий текст)', () => {
    const mode = ref('text')
    const { effectiveKana } = useDrillSource(mode)
    assert.equal(effectiveKana.value, null)
  })

  it('набір повертає його кану; невідомий id → null', () => {
    const mode = ref('hiragana')
    const { effectiveKana } = useDrillSource(mode)
    assert.ok(effectiveKana.value && [...effectiveKana.value].length >= 46)

    mode.value = 'no-such-set'
    assert.equal(effectiveKana.value, null)
  })

  it('режим vocab повертає слова словника через повноширинний пробіл', () => {
    const mode = ref('vocab')
    const { effectiveKana } = useDrillSource(mode)
    const words = effectiveKana.value!.split('　')
    assert.ok(words.length >= 80)
    assert.ok(words.includes('ねこ'))
    assert.ok(words.every((word) => word.length > 0))
  })

  it('режими weak і confusions будуються з накопиченої статистики', () => {
    const { record } = useKanaStats()
    record('ぬ', false, 'め')
    record('ぬ', false, 'め')
    record('め', false)

    const mode = ref('weak')
    const { effectiveKana } = useDrillSource(mode)
    assert.ok(effectiveKana.value!.includes('ぬ'))
    assert.equal(effectiveKana.value![0], 'ぬ') // найслабша першою

    mode.value = 'confusions'
    assert.ok(effectiveKana.value!.includes('ぬ'))
    assert.ok(effectiveKana.value!.includes('め'))
  })
})
