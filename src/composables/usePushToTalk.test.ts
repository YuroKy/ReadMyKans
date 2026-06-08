import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { usePushToTalk } from './usePushToTalk'

const defer = <T>() => {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('usePushToTalk', () => {
  it('повний цикл: press → listening → release → onResult', async () => {
    const results: string[] = []
    const ptt = usePushToTalk({
      start: async () => true,
      recognize: async () => 'む',
      onResult: (t) => results.push(t),
    })

    await ptt.press()
    assert.equal(ptt.state.value, 'listening')

    await ptt.release()
    assert.equal(ptt.state.value, 'idle')
    assert.deepEqual(results, ['む'])
  })

  it('start не вдався → лишаємось idle, без результату', async () => {
    const results: string[] = []
    const ptt = usePushToTalk({
      start: async () => false,
      recognize: async () => 'む',
      onResult: (t) => results.push(t),
    })

    await ptt.press()
    assert.equal(ptt.state.value, 'idle')
    await ptt.release()
    assert.deepEqual(results, [])
  })

  it('порожній результат → onResult не викликається', async () => {
    const results: string[] = []
    const ptt = usePushToTalk({
      start: async () => true,
      recognize: async () => '   ',
      onResult: (t) => results.push(t),
    })
    await ptt.press()
    await ptt.release()
    assert.equal(ptt.state.value, 'idle')
    assert.deepEqual(results, [])
  })

  it('canStart=false → press ігнорується', async () => {
    let started = false
    const ptt = usePushToTalk({
      start: async () => {
        started = true
        return true
      },
      recognize: async () => 'む',
      canStart: () => false,
      onResult: () => {},
    })
    await ptt.press()
    assert.equal(ptt.state.value, 'idle')
    assert.equal(started, false)
  })

  it('відпускання ПІД ЧАС підключення → розпізнає після зʼєднання', async () => {
    const results: string[] = []
    const startGate = defer<boolean>()
    const ptt = usePushToTalk({
      start: () => startGate.promise,
      recognize: async () => 'か',
      onResult: (t) => results.push(t),
    })

    const pressPromise = ptt.press()
    assert.equal(ptt.state.value, 'connecting')

    await ptt.release()
    assert.equal(ptt.state.value, 'connecting')

    startGate.resolve(true)
    await pressPromise

    assert.equal(ptt.state.value, 'idle')
    assert.deepEqual(results, ['か'])
  })

  it('повторний press під час роботи ігнорується', async () => {
    let startCount = 0
    const ptt = usePushToTalk({
      start: async () => {
        startCount += 1
        return true
      },
      recognize: async () => 'む',
      onResult: () => {},
    })
    await ptt.press()
    await ptt.press()
    assert.equal(startCount, 1)
  })
})
