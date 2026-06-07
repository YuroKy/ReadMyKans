import { ref } from 'vue'

export type SourceState = 'unknown' | 'checking' | 'ok' | 'fail'

export interface ServerInfo {
  state: SourceState
  engine: string | null
  mode: 'online' | 'offline' | null
  message: string
}

export interface BrowserInfo {
  state: SourceState
  message: string
}

const getHealthUrl = () => {
  const ws = import.meta.env.VITE_ASR_WS_URL as string | undefined
  if (ws) {
    // ws://host:port/asr → http://host:port/health
    return ws.replace(/^ws/, 'http').replace(/\/asr$/, '') + '/health'
  }
  return 'http://127.0.0.1:3001/health'
}

const hasBrowserSpeech = () =>
  typeof window !== 'undefined' &&
  Boolean((window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition)

export const useAsrDiagnostics = () => {
  const server = ref<ServerInfo>({
    state: 'unknown',
    engine: null,
    mode: null,
    message: 'Не перевірено',
  })

  const browser = ref<BrowserInfo>({
    state: 'unknown',
    message: 'Не перевірено',
  })

  const isChecking = ref(false)

  const checkServer = async () => {
    server.value = { state: 'checking', engine: null, mode: null, message: 'Перевірка…' }

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 2500)
      const resp = await fetch(getHealthUrl(), { signal: controller.signal })
      clearTimeout(timer)

      const data = (await resp.json()) as {
        ok: boolean
        engine: string | null
        mode: 'online' | 'offline' | null
        message: string
      }

      server.value = {
        state: data.ok ? 'ok' : 'fail',
        engine: data.engine,
        mode: data.mode,
        message: data.ok
          ? `${data.engine} (${data.mode === 'offline' ? 'офлайн' : 'онлайн'})`
          : data.message || 'Двигун не налаштований',
      }
    } catch {
      server.value = {
        state: 'fail',
        engine: null,
        mode: null,
        message: 'Сервер недоступний. Запустіть «npm run dev:server».',
      }
    }
  }

  const checkBrowser = () => {
    if (hasBrowserSpeech()) {
      browser.value = {
        state: 'ok',
        message: 'Web Speech API доступний (потрібен інтернет)',
      }
    } else {
      browser.value = {
        state: 'fail',
        message: 'Браузер не підтримує Web Speech API',
      }
    }
  }

  const checkAll = async () => {
    isChecking.value = true
    checkBrowser()
    await checkServer()
    isChecking.value = false
  }

  return { server, browser, isChecking, checkServer, checkBrowser, checkAll }
}
