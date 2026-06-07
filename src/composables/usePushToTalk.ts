import { ref, type Ref } from 'vue'

export type PttState = 'idle' | 'connecting' | 'listening' | 'processing'

export interface PushToTalkOptions {
  /** Почати розпізнавання; повертає true, якщо реально слухаємо. */
  start: () => Promise<boolean>
  /** Завершити й повернути розпізнаний текст (порожній — нічого не почули). */
  recognize: () => Promise<string>
  /** Чи можна зараз починати (напр. не під час показу фідбеку). */
  canStart?: () => boolean
  /** Викликається з непорожнім результатом. */
  onResult: (text: string) => void
}

export interface PushToTalkController {
  state: Ref<PttState>
  press: () => Promise<void>
  release: () => Promise<void>
}

/**
 * Стейт-машина «тримай і кажи», незалежна від DOM і конкретного ASR.
 *
 * idle → (press) connecting → (start ok) listening → (release) processing → idle
 *
 * Коректно обробляє відпускання ПІД ЧАС підключення: дочекається з'єднання
 * і одразу розпізнає (а не зависне в connecting).
 */
export const usePushToTalk = (opts: PushToTalkOptions): PushToTalkController => {
  const state = ref<PttState>('idle')
  let releaseRequested = false

  const doRecognize = async () => {
    state.value = 'processing'
    let text = ''
    try {
      text = await opts.recognize()
    } catch {
      text = ''
    }
    state.value = 'idle'
    if (text.trim()) opts.onResult(text.trim())
  }

  const press = async () => {
    if (state.value !== 'idle') return
    if (opts.canStart && !opts.canStart()) return

    releaseRequested = false
    state.value = 'connecting'

    let ok = false
    try {
      ok = await opts.start()
    } catch {
      ok = false
    }

    if (!ok) {
      state.value = 'idle'
      return
    }

    // Якщо встигли відпустити під час підключення — одразу розпізнаємо
    if (releaseRequested) {
      await doRecognize()
    } else {
      state.value = 'listening'
    }
  }

  const release = async () => {
    if (state.value === 'connecting') {
      releaseRequested = true // розпізнаємо щойно під'єднаємось
      return
    }
    if (state.value !== 'listening') return
    await doRecognize()
  }

  return { state, press, release }
}
