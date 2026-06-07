import { computed, ref, watch } from 'vue'
import type { SessionStatus } from '../types'
import { buildAudioConstraints, micGain, noiseSuppression } from './useMicrophoneTest'

type AsrServerMessage =
  | {
      type: 'ready'
      engine: string
      sampleRate: number
    }
  | {
      type: 'partial'
      text: string
    }
  | {
      type: 'final'
      text: string
    }
  | {
      type: 'error'
      message: string
      recoverable: boolean
    }

const TARGET_SAMPLE_RATE = 16_000
const START_TIMEOUT_MS = 1400

// Поріг raw-рівня (до gain), вище якого вважаємо що є мовлення.
const SPEECH_RMS_THRESHOLD = 0.006
// «Send hangover»: поки минуло менше ніж N мс від останнього мовлення — шлемо
// аудіо безперервно (фрази лишаються суцільними для offline-трансдьюсера).
// Після довгої тиші перестаємо слати — щоб не годувати трансдьюсер тишею
// (інакше він галюцинує наповнювач). Останній результат при цьому ЛИШАЄТЬСЯ
// на екрані — нічого не очищуємо.
const SEND_HANGOVER_MS = 1_500

const getAsrUrl = () => {
  const configured = import.meta.env.VITE_ASR_WS_URL as string | undefined
  if (configured) return configured
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//127.0.0.1:3001/asr`
}

const downsample = (input: Float32Array, inputSampleRate: number) => {
  if (inputSampleRate === TARGET_SAMPLE_RATE) return input

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE
  const outputLength = Math.floor(input.length / ratio)
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio)
    const end = Math.min(Math.floor((i + 1) * ratio), input.length)
    let sum = 0
    for (let j = start; j < end; j += 1) sum += input[j] ?? 0
    output[i] = sum / Math.max(1, end - start)
  }

  return output
}

export const useServerSpeechRecognition = () => {
  const status = ref<SessionStatus>('idle')
  const transcript = ref('')
  const finalTranscript = ref('')
  const interimTranscript = ref('')
  const errorMessage = ref('')
  const engineName = ref('')
  const isSupported = computed(
    () =>
      typeof window !== 'undefined' &&
      'WebSocket' in window &&
      'mediaDevices' in navigator &&
      'AudioContext' in window,
  )

  let socket: WebSocket | null = null
  let mediaStream: MediaStream | null = null
  let audioContext: AudioContext | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let gainNode: GainNode | null = null
  let processorNode: ScriptProcessorNode | null = null

  // Час останнього кадру з мовленням — для «send hangover».
  let lastSpeechAt = -Infinity

  const cleanupAudio = () => {
    processorNode?.disconnect()
    gainNode?.disconnect()
    sourceNode?.disconnect()
    processorNode = null
    gainNode = null
    sourceNode = null
    mediaStream?.getTracks().forEach((track) => track.stop())
    mediaStream = null
    void audioContext?.close()
    audioContext = null
  }

  watch(micGain, (val) => {
    if (gainNode) gainNode.gain.value = val
  })

  const cleanupSocket = () => {
    if (socket) {
      socket.onmessage = null
      socket.onerror = null
      socket.onclose = null
      socket.close()
    }
    socket = null
  }

  const sendStart = () => {
    socket?.send(JSON.stringify({ type: 'start', sampleRate: TARGET_SAMPLE_RATE }))
  }

  const sendStop = () => {
    socket?.send(JSON.stringify({ type: 'stop' }))
  }

  const setupAudio = async () => {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: buildAudioConstraints() })

    audioContext = new AudioContext()
    sourceNode = audioContext.createMediaStreamSource(mediaStream)

    gainNode = audioContext.createGain()
    gainNode.gain.value = micGain.value

    processorNode = audioContext.createScriptProcessor(2048, 1, 1)

    processorNode.onaudioprocess = (event) => {
      if (!socket || socket.readyState !== WebSocket.OPEN || status.value !== 'listening') {
        return
      }

      const input = event.inputBuffer.getChannelData(0)
      const samples = downsample(input, audioContext?.sampleRate ?? TARGET_SAMPLE_RATE)

      // Рівень raw-сигналу (до підсилення) — не залежить від micGain
      const postGainRms = Math.sqrt(samples.reduce((s, v) => s + v * v, 0) / samples.length)
      const rawRms = postGainRms / Math.max(micGain.value, 1e-4)
      const threshold = noiseSuppression.value ? SPEECH_RMS_THRESHOLD * 1.8 : SPEECH_RMS_THRESHOLD

      if (rawRms >= threshold) {
        lastSpeechAt = performance.now()
      }

      // Шлемо безперервно під час фрази (мовлення + хвіст). На довгій тиші
      // зупиняємось — без галюцинацій; останній результат лишається на екрані.
      if (performance.now() - lastSpeechAt <= SEND_HANGOVER_MS) {
        socket.send(samples.buffer.slice(samples.byteOffset, samples.byteOffset + samples.byteLength))
      }
    }

    sourceNode.connect(gainNode)
    gainNode.connect(processorNode)
    processorNode.connect(audioContext.destination)
  }

  const handleServerMessage = (message: AsrServerMessage) => {
    if (message.type === 'ready') {
      engineName.value = message.engine
      errorMessage.value = ''
      return
    }

    if (message.type === 'partial') {
      // Дисплей = останній розпізнаний фрагмент (прогрес тримає компонент)
      interimTranscript.value = message.text
      transcript.value = message.text
      return
    }

    if (message.type === 'final') {
      finalTranscript.value = message.text
      interimTranscript.value = ''
      transcript.value = message.text
      return
    }

    errorMessage.value = message.message
    status.value = 'error'
  }

  const start = async () => {
    if (!isSupported.value) {
      errorMessage.value = 'Браузер не підтримує WebSocket або захоплення аудіо.'
      status.value = 'error'
      return false
    }

    cleanupAudio()
    cleanupSocket()
    lastSpeechAt = -Infinity
    status.value = 'idle'
    errorMessage.value = ''
    transcript.value = ''
    finalTranscript.value = ''
    interimTranscript.value = ''

    return new Promise<boolean>((resolve) => {
      let settled = false
      const startTimer = window.setTimeout(() => {
        if (settled) return
        settled = true
        errorMessage.value = 'Локальний ASR сервер не відповідає.'
        cleanupSocket()
        resolve(false)
      }, START_TIMEOUT_MS)

      socket = new WebSocket(getAsrUrl())
      socket.binaryType = 'arraybuffer'

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as AsrServerMessage

          if (message.type === 'ready' && !settled) {
            settled = true
            window.clearTimeout(startTimer)
            handleServerMessage(message)

            setupAudio()
              .then(() => {
                sendStart()
                status.value = 'listening'
                resolve(true)
              })
              .catch(() => {
                errorMessage.value = 'Не вдалося отримати доступ до мікрофона.'
                status.value = 'error'
                cleanupSocket()
                resolve(false)
              })
            return
          }

          if (message.type === 'error' && !settled) {
            settled = true
            window.clearTimeout(startTimer)
            handleServerMessage(message)
            cleanupSocket()
            resolve(false)
            return
          }

          handleServerMessage(message)
        } catch {
          errorMessage.value = 'ASR сервер повернув некоректну відповідь.'
        }
      }

      socket.onerror = () => {
        if (!settled) {
          settled = true
          window.clearTimeout(startTimer)
          errorMessage.value = `Не вдалося підключитися до локального ASR сервера (${getAsrUrl()}).`
          cleanupSocket()
          resolve(false)
        }
      }

      socket.onclose = (event) => {
        if (!settled) {
          settled = true
          window.clearTimeout(startTimer)
          errorMessage.value =
            event.reason || `Локальний ASR сервер закрив зʼєднання (${event.code}).`
          cleanupSocket()
          resolve(false)
          return
        }

        if (status.value === 'listening') {
          status.value = 'paused'
        }
      }
    })
  }

  const pause = () => {
    status.value = 'paused'
  }

  const resume = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      status.value = 'listening'
    }
  }

  const finish = () => {
    sendStop()
    status.value = 'finished'
    cleanupAudio()
  }

  const reset = () => {
    cleanupAudio()
    cleanupSocket()
    lastSpeechAt = -Infinity
    status.value = 'idle'
    transcript.value = ''
    finalTranscript.value = ''
    interimTranscript.value = ''
    errorMessage.value = ''
    engineName.value = ''
  }

  return {
    status,
    transcript,
    finalTranscript,
    interimTranscript,
    errorMessage,
    engineName,
    isSupported,
    start,
    pause,
    resume,
    finish,
    reset,
  }
}
