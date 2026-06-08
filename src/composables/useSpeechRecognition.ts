import { computed, ref } from 'vue'
import type {
  SessionStatus,
  SpeechRecognitionErrorEventLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
} from '../types'

const getSpeechRecognition = () => window.SpeechRecognition ?? window.webkitSpeechRecognition

const messageForSpeechError = (error: string): string => {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Доступ до мікрофона відхилено. Можна ввести розпізнаний текст вручну.'
    case 'no-speech':
      return 'Мовлення не виявлено. Спробуйте ще раз або введіть текст вручну.'
    case 'audio-capture':
      return 'Браузер не бачить мікрофон. Перевірте пристрій або скористайтеся ручним вводом.'
    case 'network':
      return 'Сервіс розпізнавання мовлення недоступний через мережу.'
    default:
      return 'Не вдалося розпізнати мовлення. Можна продовжити вручну.'
  }
}

export const useSpeechRecognition = () => {
  const recognition = ref<SpeechRecognitionLike | null>(null)
  const status = ref<SessionStatus>('idle')
  const finalTranscript = ref('')
  const interimTranscript = ref('')
  const errorMessage = ref('')
  const isSupported = computed(() => Boolean(getSpeechRecognition()))
  const transcript = computed(() => `${finalTranscript.value}${interimTranscript.value}`)

  let shouldListen = false

  const ensureRecognition = () => {
    const Constructor = getSpeechRecognition()

    if (!Constructor) {
      errorMessage.value =
        'Ваш браузер не підтримує Web Speech API. Для перевірки доступний ручний ввід.'
      status.value = 'error'
      return null
    }

    const instance = new Constructor()
    instance.lang = 'ja-JP'
    instance.continuous = true
    instance.interimResults = true
    instance.maxAlternatives = 1

    instance.onstart = () => {
      status.value = 'listening'
      errorMessage.value = ''
    }

    instance.onend = () => {
      if (shouldListen) {
        try {
          instance.start()
        } catch {
          window.setTimeout(() => {
            if (shouldListen) {
              try {
                instance.start()
              } catch {}
            }
          }, 250)
        }
        return
      }

      if (status.value === 'listening') {
        status.value = 'paused'
      }
    }

    instance.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return
      }

      shouldListen = false
      errorMessage.value = messageForSpeechError(event.error)
      status.value = 'error'
    }

    instance.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]!
        const text = result[0]?.transcript ?? ''

        if (result.isFinal) {
          finalTranscript.value = `${finalTranscript.value}${text}`
        } else {
          interim += text
        }
      }

      interimTranscript.value = interim
    }

    recognition.value = instance
    return instance
  }

  const start = () => {
    const instance = recognition.value ?? ensureRecognition()
    if (!instance) {
      return
    }

    shouldListen = true
    try {
      instance.start()
    } catch {}
  }

  const pause = () => {
    shouldListen = false
    recognition.value?.stop()
    status.value = 'paused'
  }

  const resume = () => {
    start()
  }

  const finish = () => {
    shouldListen = false
    recognition.value?.stop()
    status.value = 'finished'
  }

  const reset = () => {
    shouldListen = false
    recognition.value?.abort()
    recognition.value = null
    finalTranscript.value = ''
    interimTranscript.value = ''
    errorMessage.value = ''
    status.value = 'idle'
  }

  return {
    status,
    transcript,
    finalTranscript,
    interimTranscript,
    errorMessage,
    isSupported,
    start,
    pause,
    resume,
    finish,
    reset,
  }
}
