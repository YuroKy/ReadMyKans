import { ref, type Ref } from 'vue'

export type PttState = 'idle' | 'connecting' | 'listening' | 'processing'

export interface PushToTalkOptions {
  start: () => Promise<boolean>

  recognize: () => Promise<string>

  canStart?: () => boolean

  onResult: (text: string) => void
}

export interface PushToTalkController {
  state: Ref<PttState>
  press: () => Promise<void>
  release: () => Promise<void>
}

export const usePushToTalk = (opts: PushToTalkOptions): PushToTalkController => {
  const state = ref<PttState>('idle')
  let releaseRequested = false

  const doRecognize = async () => {
    state.value = 'processing'
    let text: string
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

    let ok: boolean
    try {
      ok = await opts.start()
    } catch {
      ok = false
    }

    if (!ok) {
      state.value = 'idle'
      return
    }

    if (releaseRequested) {
      await doRecognize()
    } else {
      state.value = 'listening'
    }
  }

  const release = async () => {
    if (state.value === 'connecting') {
      releaseRequested = true
      return
    }
    if (state.value !== 'listening') return
    await doRecognize()
  }

  return { state, press, release }
}
