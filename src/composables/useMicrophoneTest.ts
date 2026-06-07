import { onUnmounted, ref, watch } from 'vue'

const DEVICE_KEY = 'kana-mic-device-id'
const GAIN_KEY = 'kana-mic-gain'
const NOISE_KEY = 'kana-mic-noise-suppression'

export const MAX_GAIN = 10 // 1000%

// ── Singletons: shared між тест-компонентом і ASR-захопленням ──────────────

export const selectedDeviceId = ref<string>(
  typeof window !== 'undefined' ? (localStorage.getItem(DEVICE_KEY) ?? '') : '',
)

export const micGain = ref<number>(
  typeof window !== 'undefined' ? Number(localStorage.getItem(GAIN_KEY) ?? '1') : 1,
)

// Шумоподавлення: вмикає браузерний DSP + JS noise gate в ASR-потоці
export const noiseSuppression = ref<boolean>(
  typeof window !== 'undefined' ? localStorage.getItem(NOISE_KEY) === '1' : false,
)

export const setSelectedDeviceId = (id: string) => {
  selectedDeviceId.value = id
  if (typeof window !== 'undefined') localStorage.setItem(DEVICE_KEY, id)
}

export const setMicGain = (value: number) => {
  micGain.value = Math.max(0, Math.min(MAX_GAIN, value))
  if (typeof window !== 'undefined') localStorage.setItem(GAIN_KEY, String(micGain.value))
}

export const setNoiseSuppression = (value: boolean) => {
  noiseSuppression.value = value
  if (typeof window !== 'undefined') localStorage.setItem(NOISE_KEY, value ? '1' : '0')
}

// Спільні аудіо-обмеження для getUserMedia (тест і ASR)
export const buildAudioConstraints = (): MediaTrackConstraints => {
  const constraints: MediaTrackConstraints = {
    channelCount: 1,
    echoCancellation: false,
    noiseSuppression: noiseSuppression.value,
    autoGainControl: false, // керуємо підсиленням вручну через micGain
  }
  if (selectedDeviceId.value) {
    constraints.deviceId = { ideal: selectedDeviceId.value }
  }
  return constraints
}

// ── Composable ───────────────────────────────────────────────────────────────

export const useMicrophoneTest = () => {
  const devices = ref<MediaDeviceInfo[]>([])
  const isTesting = ref(false)
  const audioLevel = ref(0)
  const error = ref('')
  // Моніторинг: чути власний голос через динаміки/навушники під час тесту
  const monitor = ref(true)

  let stream: MediaStream | null = null
  let audioCtx: AudioContext | null = null
  let gainNode: GainNode | null = null
  let monitorGain: GainNode | null = null
  let animFrame: number | null = null

  const cleanup = () => {
    if (animFrame !== null) {
      cancelAnimationFrame(animFrame)
      animFrame = null
    }
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    void audioCtx?.close()
    audioCtx = null
    gainNode = null
    monitorGain = null
    audioLevel.value = 0
    isTesting.value = false
  }

  const refreshDevices = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      const mics = all.filter((d) => d.kind === 'audioinput')
      devices.value = mics

      if (selectedDeviceId.value && !mics.some((d) => d.deviceId === selectedDeviceId.value)) {
        setSelectedDeviceId('')
      }
    } catch {
      error.value = 'Не вдалося отримати список мікрофонів.'
    }
  }

  const startTest = async () => {
    cleanup()
    error.value = ''

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: buildAudioConstraints() })
      await refreshDevices()

      audioCtx = new AudioContext()

      // source → gain → analyser
      gainNode = audioCtx.createGain()
      gainNode.gain.value = micGain.value

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256

      audioCtx.createMediaStreamSource(stream).connect(gainNode)
      gainNode.connect(analyser)

      // gain → monitorGain → динаміки (моніторинг власного голосу)
      monitorGain = audioCtx.createGain()
      monitorGain.gain.value = monitor.value ? 1 : 0
      gainNode.connect(monitorGain)
      monitorGain.connect(audioCtx.destination)

      isTesting.value = true

      const buf = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (!isTesting.value) return
        analyser.getByteFrequencyData(buf)
        audioLevel.value = buf.reduce((s, v) => s + v, 0) / (buf.length * 255)
        animFrame = requestAnimationFrame(tick)
      }
      animFrame = requestAnimationFrame(tick)
    } catch (e) {
      const name = e instanceof Error ? e.name : ''
      error.value =
        name === 'NotAllowedError' || name === 'PermissionDeniedError'
          ? 'Доступ до мікрофона відхилено. Дозвольте в налаштуваннях браузера.'
          : name === 'NotFoundError'
            ? 'Мікрофон не знайдено. Перевірте підключення пристрою.'
            : (e instanceof Error ? e.message : 'Не вдалося підключити мікрофон.')
    }
  }

  // Оновлюємо gain в реальному часі поки тест активний
  watch(micGain, (val) => {
    if (gainNode) gainNode.gain.value = val
  })

  // Браузерний noiseSuppression задається на рівні треку — потрібен рестарт тесту
  watch(noiseSuppression, () => {
    if (isTesting.value) void startTest()
  })

  // Вмикання/вимикання моніторингу наживо, без рестарту тесту
  watch(monitor, (on) => {
    if (monitorGain) monitorGain.gain.value = on ? 1 : 0
  })

  const stopTest = () => cleanup()
  onUnmounted(() => cleanup())

  return {
    selectedDeviceId,
    micGain,
    noiseSuppression,
    monitor,
    devices,
    isTesting,
    audioLevel,
    error,
    setSelectedDeviceId,
    setMicGain,
    setNoiseSuppression,
    refreshDevices,
    startTest,
    stopTest,
  }
}
