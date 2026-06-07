import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { useKanaDrill } from './useKanaDrill'

// kuromoji не ініціалізований → toReadingHiragana = identity; тести на кані.

describe('useKanaDrill', () => {
  it('розбиває джерело на шматки по chunkSize=1', () => {
    const d = useKanaDrill(ref('むかし'), ref(1))
    assert.equal(d.total.value, 3)
    assert.deepEqual(d.currentChunk.value, ['む'])
    assert.equal(d.expectedKana.value, 'む')
    assert.equal(d.expectedRomaji.value, 'mu')
  })

  it('chunkSize=2 групує по дві кани', () => {
    const d = useKanaDrill(ref('むかし'), ref(2))
    assert.equal(d.total.value, 2)
    assert.deepEqual(d.currentChunk.value, ['む', 'か'])
    assert.equal(d.submitRomaji('muka'), 'correct')
  })

  it('submitRomaji: правильно / неправильно', () => {
    const d = useKanaDrill(ref('むか'), ref(1))
    assert.equal(d.submitRomaji('mu'), 'correct')
    assert.equal(d.lastOutcome.value, 'correct')
    d.next()
    assert.equal(d.submitRomaji('mo'), 'wrong')
    assert.equal(d.lastOutcome.value, 'wrong')
  })

  it('submitKana (голос): правильно / неправильно', () => {
    const d = useKanaDrill(ref('む'), ref(1))
    assert.equal(d.submitKana('も'), 'wrong')
    d.retry()
    assert.equal(d.submitKana('む'), 'correct')
  })

  it('submitKana толерантний до зайвого від ASR', () => {
    const d = useKanaDrill(ref('む'), ref(1))
    assert.equal(d.submitKana('むう'), 'correct')
  })

  it('は НЕ плутається з わ (сире は приймається для очікуваної は)', () => {
    // регрес: kuromoji вважав ізольовану は часткою → わ → хибна помилка
    const d = useKanaDrill(ref('は'), ref(1))
    assert.equal(d.submitKana('は'), 'correct')
  })

  it('next просуває індекс, isFinished в кінці', () => {
    const d = useKanaDrill(ref('むか'), ref(1))
    assert.equal(d.isFinished.value, false)
    d.submitRomaji('mu')
    d.next()
    d.submitRomaji('ka')
    d.next()
    assert.equal(d.isFinished.value, true)
  })

  it('correctCount рахує правильні', () => {
    const d = useKanaDrill(ref('むか'), ref(1))
    d.submitRomaji('mu')
    d.next()
    d.submitRomaji('xx')
    d.next()
    assert.equal(d.correctCount.value, 1)
  })

  it('reset повертає на початок', () => {
    const d = useKanaDrill(ref('むか'), ref(1))
    d.submitRomaji('mu')
    d.next()
    d.reset()
    assert.equal(d.index.value, 0)
    assert.equal(d.correctCount.value, 0)
  })

  it('ігнорує пунктуацію та пробіли в джерелі', () => {
    const d = useKanaDrill(ref('む、か し。'), ref(1))
    assert.equal(d.total.value, 3) // む, か, し
  })
})
