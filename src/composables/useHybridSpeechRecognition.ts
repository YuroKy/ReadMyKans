import { computed, ref } from 'vue'
import { useServerSpeechRecognition } from './useServerSpeechRecognition'
import { useSpeechRecognition } from './useSpeechRecognition'
import { useAsrPreference } from './useAsrPreference'

export type SpeechEngineMode = 'server' | 'browser'

export const useHybridSpeechRecognition = () => {
  const server = useServerSpeechRecognition()
  const browser = useSpeechRecognition()
  const { enginePreference } = useAsrPreference()
  const activeMode = ref<SpeechEngineMode>('server')
  const fallbackNotice = ref('')

  const active = computed(() => (activeMode.value === 'server' ? server : browser))

  const status = computed(() => active.value.status.value)
  const transcript = computed(() => active.value.transcript.value)
  const finalTranscript = computed(() => active.value.finalTranscript.value)
  const interimTranscript = computed(() => active.value.interimTranscript.value)
  const errorMessage = computed(() => active.value.errorMessage.value)
  const isSupported = computed(() => server.isSupported.value || browser.isSupported.value)
  const engineName = computed(() =>
    activeMode.value === 'server'
      ? server.engineName.value || 'локальний ASR сервер'
      : 'Web Speech API',
  )

  const start = async () => {
    fallbackNotice.value = ''
    browser.reset()
    server.reset()

    // Режим «Браузер»: пропускаємо сервер, одразу стартуємо Web Speech API
    if (enginePreference.value === 'browser') {
      activeMode.value = 'browser'
      browser.start()
      return
    }

    // Режим «Сервер» або «Авто»: спочатку пробуємо локальний ASR
    activeMode.value = 'server'
    const serverStarted = await server.start()

    if (serverStarted) {
      return
    }

    // Режим «Тільки сервер»: не робимо fallback, залишаємо помилку видимою
    if (enginePreference.value === 'server') {
      return
    }

    // Режим «Авто»: сервер недоступний — переходимо на Web Speech API
    fallbackNotice.value =
      server.errorMessage.value ||
      'Локальний ASR сервер недоступний. Використовується Web Speech API.'
    activeMode.value = 'browser'
    browser.start()
  }

  const pause = () => active.value.pause()
  const resume = () => {
    if (activeMode.value === 'server') {
      active.value.resume()
      return
    }

    browser.resume()
  }
  const finish = () => active.value.finish()
  const reset = () => {
    server.reset()
    browser.reset()
    fallbackNotice.value = ''
    activeMode.value = 'server'
  }

  return {
    status,
    transcript,
    finalTranscript,
    interimTranscript,
    errorMessage,
    fallbackNotice,
    isSupported,
    engineName,
    activeMode,
    enginePreference,
    start,
    pause,
    resume,
    finish,
    reset,
  }
}
