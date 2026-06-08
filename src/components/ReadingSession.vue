<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { SessionResult } from '../types'
import { useSpeechRecognition } from '../composables/useSpeechRecognition'
import { useTextComparison } from '../composables/useTextComparison'
import { advanceMatch, matchDetail } from '../utils/matching'
import { kanaCharsEqual, kanaToRomaji } from '../utils/romaji'
import { initReading, readingLoading, readingReady, toReadingHiragana } from '../utils/reading'
import { normalizeJapaneseText } from '../utils/textNormalize'
import MicrophoneStatus from './MicrophoneStatus.vue'
import SakuraDecor from './SakuraDecor.vue'

const props = defineProps<{
  sourceText: string
}>()

const emit = defineEmits<{
  finish: [result: SessionResult]
  edit: []
}>()

const {
  status,
  transcript,
  finalTranscript,
  errorMessage,
  isSupported,
  start,
  pause,
  resume,
  finish,
  reset,
} = useSpeechRecognition()
const { compareTexts } = useTextComparison()

const manualTranscript = ref('')
const startedAt = ref(Date.now())
const now = ref(Date.now())
const timerId = window.setInterval(() => {
  now.value = Date.now()
}, 500)

const normalizedLength = computed(() => [...normalizeJapaneseText(props.sourceText)].length)
const elapsedMs = computed(() => now.value - startedAt.value)
const visibleTranscript = computed(() => {
  if (!isSupported.value || status.value === 'error') {
    return manualTranscript.value
  }

  return transcript.value
})

const normalizedOriginalChars = computed(() => {
  void readingReady.value
  return [...normalizeJapaneseText(toReadingHiragana(props.sourceText))]
})
const normalizedSpokenChars = computed(() => {
  void readingReady.value
  return [...normalizeJapaneseText(toReadingHiragana(visibleTranscript.value))]
})

const confirmedLen = ref(0)

watch(normalizedSpokenChars, (spoken) => {
  confirmedLen.value = advanceMatch(normalizedOriginalChars.value, spoken, confirmedLen.value)
})

const liveFeedback = computed(() => {
  const original = normalizedOriginalChars.value
  const spoken = normalizedSpokenChars.value
  const matched = Math.min(confirmedLen.value, original.length)
  const isComplete = original.length > 0 && matched >= original.length
  const currentIndex = isComplete ? Math.max(original.length - 1, 0) : matched
  const expectedKana = original[currentIndex] ?? ''

  const attempt = matchDetail(original, spoken, matched).attempt
  const hasMismatch = !isComplete && attempt !== '' && !kanaCharsEqual(expectedKana, attempt)
  const spokenAtCurrent = hasMismatch ? attempt : ''

  return {
    correctPrefixLength: matched,
    currentIndex,
    kanaIndex: currentIndex,
    expected: expectedKana,
    expectedRomaji: kanaToRomaji(expectedKana),
    spokenAtCurrent,
    spokenRomaji: kanaToRomaji(spokenAtCurrent),
    hasMismatch,
    isComplete,
    progress: original.length === 0 ? 0 : Math.min(matched + 1, original.length),
    total: original.length,
  }
})

const acceptedTranscript = computed(() =>
  normalizedOriginalChars.value.slice(0, liveFeedback.value.correctPrefixLength).join(''),
)
const rawRecognitionPreview = computed(() => visibleTranscript.value.trim())

const progressPercent = computed(() => {
  const total = liveFeedback.value.total
  if (total === 0) return 0
  return Math.round((liveFeedback.value.correctPrefixLength / total) * 100)
})

const isRecognizing = ref(false)
let recognizeTimer: ReturnType<typeof setTimeout> | null = null

watch(transcript, (next, prev) => {
  if (next !== prev && next.trim()) {
    isRecognizing.value = true
    if (recognizeTimer) clearTimeout(recognizeTimer)

    recognizeTimer = setTimeout(() => {
      isRecognizing.value = false
    }, 1200)
  }
})

const hasAnyRecognition = computed(() => rawRecognitionPreview.value.length > 0)

const sourceCharacters = computed(() => {
  let comparableIndex = 0

  return [...props.sourceText].map((char, visibleIndex) => {
    const normalized = normalizeJapaneseText(char)
    const index = normalized ? comparableIndex : null

    if (normalized) {
      comparableIndex += [...normalized].length
    }

    let state: 'plain' | 'done' | 'current' | 'error' = 'plain'

    if (index !== null) {
      if (liveFeedback.value.hasMismatch && index === liveFeedback.value.currentIndex) {
        state = 'error'
      } else if (index === liveFeedback.value.kanaIndex && !liveFeedback.value.isComplete) {
        state = 'current'
      } else if (index < liveFeedback.value.correctPrefixLength) {
        state = 'done'
      }
    }

    return {
      char,
      key: `${visibleIndex}-${char}`,
      state,
    }
  })
})

const formattedElapsed = computed(() => {
  const seconds = Math.max(0, Math.floor(elapsedMs.value / 1000))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
})

const speechSynthesisSupported = computed(
  () => typeof window !== 'undefined' && 'speechSynthesis' in window,
)

const speakCurrentKana = () => {
  const text = liveFeedback.value.expected

  if (!text || !speechSynthesisSupported.value) {
    return
  }

  const utterance = new SpeechSynthesisUtterance(text)
  const japaneseVoice = window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith('ja'))

  utterance.lang = 'ja-JP'
  utterance.rate = 0.75
  utterance.pitch = 1

  if (japaneseVoice) {
    utterance.voice = japaneseVoice
  }

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

const restart = () => {
  reset()
  manualTranscript.value = ''
  confirmedLen.value = 0
  startedAt.value = Date.now()
  now.value = Date.now()
  start()
}

const finishSession = () => {
  const isManual = !isSupported.value || status.value === 'error'

  const recognizedText = isManual
    ? visibleTranscript.value.trim()
    : normalizedOriginalChars.value.slice(0, liveFeedback.value.correctPrefixLength).join('')
  finish()
  const comparison = compareTexts(props.sourceText, recognizedText)
  const result: SessionResult = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    originalText: props.sourceText,
    recognizedText,
    accuracy: comparison.similarity,
    originalLength: comparison.normalizedOriginal.length,
    recognizedLength: comparison.normalizedSpoken.length,
    mismatchCount: comparison.mismatchCount,
    kanaToReview: comparison.kanaToReview,
    durationMs: elapsedMs.value,
    comparison,
  }

  emit('finish', result)
}

onMounted(() => {
  void initReading()
  confirmedLen.value = 0
  startedAt.value = Date.now()
  start()
})

onBeforeUnmount(() => {
  window.clearInterval(timerId)
  if (recognizeTimer) clearTimeout(recognizeTimer)
  reset()
})
</script>

<template>
  <main class="session-layout">
    <section class="session-hero">
      <SakuraDecor />
      <div>
        <p class="eyebrow">Сесія читання</p>
        <h1>Читайте японський текст уголос</h1>
      </div>
      <div class="session-clock">
        <span>Розпізнавання</span>
        <strong class="engine-label">Web Speech API</strong>
      </div>
      <div class="session-clock">
        <span>Тривалість</span>
        <strong>{{ formattedElapsed }}</strong>
      </div>
    </section>

    <MicrophoneStatus :status="status" :supported="isSupported" :message="errorMessage" />
    <p v-if="readingLoading && !readingReady" class="reading-note">
      ⏳ Завантаження словника читань (кандзі → кана)… порівняння стане точнішим за мить.
    </p>

    <section v-if="isSupported && status !== 'error'" class="panel recognition-progress">
      <div class="recognition-head">
        <span class="recognition-activity" :class="{ live: isRecognizing }">
          <span class="recognition-dot" aria-hidden="true" />
          {{
            isRecognizing
              ? 'Розпізнаю…'
              : hasAnyRecognition
                ? 'Очікую мовлення'
                : 'Почніть говорити'
          }}
        </span>
        <strong class="recognition-percent">{{ progressPercent }}%</strong>
      </div>

      <div
        class="progress-track"
        role="progressbar"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
      </div>

      <p class="recognition-raw">
        <span class="muted">Чую: </span>
        <span v-if="hasAnyRecognition">{{ rawRecognitionPreview }}</span>
        <span v-else class="muted">—</span>
      </p>
    </section>

    <section class="panel live-kana-panel" :class="{ 'has-error': liveFeedback.hasMismatch }">
      <div class="current-kana-card">
        <span class="eyebrow">Поточна кана</span>
        <div class="current-kana-main">
          <strong>{{ liveFeedback.expected || '—' }}</strong>
          <button
            class="speaker-button"
            type="button"
            :disabled="!speechSynthesisSupported || !liveFeedback.expected"
            :aria-label="`Прослухати вимову ${liveFeedback.expected}`"
            title="Прослухати вимову"
            @click="speakCurrentKana"
          >
            ▷
          </button>
        </div>
        <b class="romaji-text">{{ liveFeedback.expectedRomaji || 'romaji' }}</b>
        <span>{{ liveFeedback.progress }} / {{ liveFeedback.total }}</span>
      </div>

      <div class="spoken-kana-card">
        <span class="eyebrow">Ви назвали</span>
        <strong>{{ liveFeedback.spokenAtCurrent || '—' }}</strong>
        <b class="romaji-text">{{ liveFeedback.spokenRomaji || 'romaji' }}</b>
        <span v-if="liveFeedback.hasMismatch"
          >Не зараховано. Очікувалось: {{ liveFeedback.expected }}</span
        >
        <span v-else-if="liveFeedback.isComplete">Текст прочитано до кінця</span>
        <span v-else>Помилки на поточній кані немає</span>
      </div>

      <div class="kana-sketch" :class="{ wrong: liveFeedback.hasMismatch }" aria-hidden="true">
        {{ liveFeedback.hasMismatch ? liveFeedback.expected : liveFeedback.expected || 'あ' }}
      </div>
    </section>

    <section class="session-grid">
      <article class="panel reading-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Оригінал</p>
            <h2>{{ normalizedLength }} символів для перевірки</h2>
          </div>
        </div>
        <p class="source-text live-source-text">
          <span
            v-for="item in sourceCharacters"
            :key="item.key"
            class="source-char"
            :class="item.state"
          >
            {{ item.char }}
          </span>
        </p>
      </article>

      <article class="panel reading-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Зараховано</p>
            <h2>Правильний живий текст</h2>
          </div>
        </div>

        <div v-if="isSupported && status !== 'error'" class="accepted-box">
          <p class="transcript-box accepted-transcript">
            {{ acceptedTranscript || 'Сюди додається лише та частина, яку прочитано правильно.' }}
          </p>

          <div v-if="liveFeedback.hasMismatch" class="rejected-attempt">
            <span class="eyebrow">Спроба не зарахована</span>
            <strong>{{ liveFeedback.spokenAtCurrent || rawRecognitionPreview }}</strong>
            <span>
              Виправте поточну кану і продовжуйте. Неправильний фрагмент не додається в живий текст.
            </span>
          </div>
          <p v-else class="muted compact">
            Розпізнавання може приходити із затримкою, але в цей блок потрапляє тільки збіг з
            оригіналом.
          </p>
        </div>

        <div v-else class="manual-box">
          <p class="muted">Введіть те, що було прочитано, щоб перевірити алгоритм порівняння.</p>
          <textarea
            v-model="manualTranscript"
            class="manual-textarea"
            rows="8"
            placeholder="Введіть розпізнаний або прочитаний текст..."
          />
        </div>

        <p v-if="finalTranscript" class="muted compact">
          Сирий розпізнаний буфер: {{ finalTranscript.length }} знаків
        </p>
      </article>
    </section>

    <section class="session-actions" aria-label="Керування сесією">
      <button v-if="status === 'listening'" class="secondary-button" type="button" @click="pause">
        Пауза
      </button>
      <button
        v-else-if="isSupported && status !== 'finished'"
        class="secondary-button"
        type="button"
        @click="resume"
      >
        Продовжити
      </button>
      <button class="secondary-button" type="button" @click="restart">Спочатку</button>
      <button class="ghost-button" type="button" @click="emit('edit')">Редагувати текст</button>
      <button class="primary-button" type="button" @click="finishSession">Завершити</button>
    </section>
  </main>
</template>
