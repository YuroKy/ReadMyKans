<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { SessionResult } from '../types'
import { useSpeechRecognition } from '../composables/useSpeechRecognition'
import { useTextComparison } from '../composables/useTextComparison'
import { advanceMatch, matchDetail } from '../utils/matching'
import { kanaCharsEqual, kanaToRomaji } from '../utils/romaji'
import {
  initReading,
  readingLoading,
  readingReady,
  toReadingHiragana,
  tokenizeReadings,
} from '../utils/reading'
import { toRubySegments } from '../utils/furigana'
import { normalizeJapaneseText } from '../utils/textNormalize'
import { speakKana, isSpeechSynthesisSupported } from '../utils/kanaSpeech'
import {
  clearReadingProgress,
  loadReadingProgress,
  saveReadingProgress,
} from '../utils/readingProgress'
import { charVisibility, FLASH_WINDOW, type HideMode } from '../utils/readingFocus'
import { useShadowing } from '../composables/useShadowing'
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

const shadow = useShadowing(computed(() => props.sourceText))
const furiganaMode = ref<'off' | 'furigana' | 'romaji'>('off')

// «Зникаючий текст»: off / fade (прочитане блюриться) / flash (вікно тексту
// блимає на 2 с і ховається — читаєш з памʼяті). Persisted окремим ключем.
const HIDE_KEY = 'kana-reading-hide'
const isHideMode = (v: unknown): v is HideMode => v === 'off' || v === 'fade' || v === 'flash'
const loadHideMode = (): HideMode => {
  if (typeof window === 'undefined') return 'off'
  const stored = localStorage.getItem(HIDE_KEY)
  return isHideMode(stored) ? stored : 'off'
}
const hideMode = ref<HideMode>(loadHideMode())
watch(hideMode, (value) => {
  if (typeof window !== 'undefined') localStorage.setItem(HIDE_KEY, value)
})
const rubySegments = computed(() => {
  void readingReady.value
  const mode = furiganaMode.value
  if (mode === 'off') return []
  return toRubySegments(tokenizeReadings(props.sourceText), mode)
})

const manualTranscript = ref('')
const startedAt = ref(Date.now())
const now = ref(Date.now())
const timerId = window.setInterval(() => {
  now.value = Date.now()
  // Тримаємо збережену тривалість свіжою навіть без нових збігів — щоб
  // після зависання/перезавантаження таймер не «відмотувався» назад.
  if (confirmedLen.value > 0 && now.value - lastPersistedAt > 5000) persistProgress()
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
// Скільки кан було відновлено зі збереженої сесії (0 — старт з нуля).
const resumedFrom = ref(0)

let lastPersistedAt = 0
const persistProgress = () => {
  if (confirmedLen.value <= 0) return
  lastPersistedAt = Date.now()
  saveReadingProgress({
    text: props.sourceText,
    confirmedLen: confirmedLen.value,
    elapsedMs: Date.now() - startedAt.value,
    savedAt: new Date().toISOString(),
  })
}

watch(normalizedSpokenChars, (spoken) => {
  confirmedLen.value = advanceMatch(normalizedOriginalChars.value, spoken, confirmedLen.value)
})

watch(confirmedLen, persistProgress)

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

// Блимання: вхід курсора в нове вікно відкриває його на 2 с (тікер `now`
// уже оновлюється кожні 500 мс — нового інтервалу не треба).
const flashUntil = ref(0)
watch(
  () => Math.floor(liveFeedback.value.currentIndex / FLASH_WINDOW),
  () => {
    flashUntil.value = Date.now() + 2000
  },
  { immediate: true },
)
const flashActive = computed(() => hideMode.value === 'flash' && now.value < flashUntil.value)
const reflash = () => {
  flashUntil.value = Date.now() + 2000
  now.value = Date.now()
}

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

    // Пунктуація і пробіли (без порівнюваного індексу) лишаються видимими —
    // ховаємо тільки кану, яку можна «підглянути».
    const visibility =
      index !== null
        ? charVisibility(
            index,
            liveFeedback.value.currentIndex,
            hideMode.value,
            FLASH_WINDOW,
            flashActive.value,
          )
        : 'visible'

    return {
      char,
      key: `${visibleIndex}-${char}`,
      state,
      visibility,
    }
  })
})

const formattedElapsed = computed(() => {
  const seconds = Math.max(0, Math.floor(elapsedMs.value / 1000))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
})

const speechSynthesisSupported = computed(() => isSpeechSynthesisSupported())

const speakCurrentKana = () => {
  speakKana(liveFeedback.value.expected, { rate: 0.75, pitch: 1 })
}

const restart = () => {
  reset()
  clearReadingProgress()
  manualTranscript.value = ''
  confirmedLen.value = 0
  resumedFrom.value = 0
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
  clearReadingProgress()
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
  // Якщо є збережена сесія саме цього тексту — продовжуємо з того ж місця.
  const saved = loadReadingProgress()
  if (saved && saved.text === props.sourceText) {
    confirmedLen.value = Math.min(saved.confirmedLen, normalizedOriginalChars.value.length)
    resumedFrom.value = confirmedLen.value
    startedAt.value = Date.now() - saved.elapsedMs
  } else {
    confirmedLen.value = 0
    startedAt.value = Date.now()
  }
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

    <p v-if="resumedFrom > 0" class="reading-note">
      ▶ Сесію відновлено: продовжуємо з {{ resumedFrom + 1 }}-ї кани з
      {{ liveFeedback.total }}. Кнопка «Спочатку» скине збережений прогрес.
    </p>

    <section class="panel reading-aids">
      <div class="aids-row">
        <div class="aid-block">
          <span class="eyebrow">Слухай і повторюй</span>
          <div class="shadow-controls">
            <button
              class="ghost-button small"
              type="button"
              :disabled="!shadow.supported"
              @click="shadow.toggle()"
            >
              {{ shadow.isPlaying.value ? '⏹ Стоп' : '🔊 Весь текст' }}
            </button>
            <label class="shadow-rate">
              <span>Темп</span>
              <input
                v-model.number="shadow.rate.value"
                type="range"
                min="0.5"
                max="1.3"
                step="0.1"
                class="mic-gain-slider"
                :disabled="!shadow.supported"
              >
            </label>
          </div>

          <div v-if="shadow.supported && shadow.hasSegments.value" class="shadow-steps">
            <div class="shadow-steps-head">
              <span class="shadow-steps-pos">Речення {{ shadow.currentIndex.value + 1 }} / {{ shadow.segments.value.length }}</span>
              <div class="shadow-steps-buttons">
                <button
                  class="ghost-button small"
                  type="button"
                  :disabled="shadow.currentIndex.value === 0"
                  aria-label="Попереднє речення"
                  @click="shadow.prev()"
                >
                  ◀
                </button>
                <button class="secondary-button small" type="button" @click="shadow.repeat()">
                  🔁 Повторити
                </button>
                <button
                  class="ghost-button small"
                  type="button"
                  :disabled="shadow.currentIndex.value >= shadow.segments.value.length - 1"
                  aria-label="Наступне речення"
                  @click="shadow.next()"
                >
                  ⏭
                </button>
              </div>
            </div>
            <p class="shadow-sentence" lang="ja">{{ shadow.currentSegment.value }}</p>
          </div>

          <p v-if="!shadow.supported" class="aid-note">
            Синтез мовлення недоступний у цьому браузері.
          </p>
        </div>

        <div class="aid-block">
          <span class="eyebrow">Зникаючий текст</span>
          <div class="furigana-toggle">
            <button type="button" :class="{ active: hideMode === 'off' }" @click="hideMode = 'off'">
              Вимк.
            </button>
            <button
              type="button"
              title="Прочитане зникає — не можна перечитати"
              :class="{ active: hideMode === 'fade' }"
              @click="hideMode = 'fade'"
            >
              🫥 Зникати
            </button>
            <button
              type="button"
              title="Шматок тексту блимає на 2 с і ховається — читай з пам'яті"
              :class="{ active: hideMode === 'flash' }"
              @click="hideMode = 'flash'"
            >
              ⚡ Блимання
            </button>
          </div>
          <button
            v-if="hideMode === 'flash'"
            class="ghost-button small"
            type="button"
            @click="reflash"
          >
            👁 Показати вікно ще раз
          </button>
        </div>

        <div class="aid-block">
          <span class="eyebrow">Підказки читання</span>
          <div class="furigana-toggle">
            <button type="button" :class="{ active: furiganaMode === 'off' }" @click="furiganaMode = 'off'">
              Вимк.
            </button>
            <button
              type="button"
              :class="{ active: furiganaMode === 'furigana' }"
              @click="furiganaMode = 'furigana'"
            >
              ふりがな
            </button>
            <button
              type="button"
              :class="{ active: furiganaMode === 'romaji' }"
              @click="furiganaMode = 'romaji'"
            >
              ромадзі
            </button>
          </div>
        </div>
      </div>

      <p v-if="furiganaMode !== 'off'" class="furigana-text" lang="ja">
        <ruby v-for="(seg, i) in rubySegments" :key="i">{{ seg.base }}<rt v-if="seg.ruby">{{ seg.ruby }}</rt></ruby>
      </p>
    </section>

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
        <span v-if="liveFeedback.hasMismatch">Не зараховано. Очікувалось: {{ liveFeedback.expected }}</span>
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
            :class="[item.state, item.visibility !== 'visible' ? `vis-${item.visibility}` : '']"
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

<style scoped>
.source-char {
  transition: filter 0.35s ease, opacity 0.35s ease;
}

.source-char.vis-blurred {
  filter: blur(6px);
  opacity: 0.35;
}

.source-char.vis-masked {
  filter: blur(9px);
  opacity: 0.12;
}

/* Поточну кану в режимі «зникати» видно, але помилку підсвічуємо як завжди;
   у «блиманні» курсор теж ховається разом із вікном — це і є вправа. */

.reading-aids {
  padding: 18px 22px;
  display: grid;
  gap: 14px;
}

.aids-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.aid-block {
  display: grid;
  gap: 8px;
  align-content: start;
}

.shadow-controls {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.shadow-rate {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--muted);
  font-weight: 600;
}

.shadow-rate input {
  width: 120px;
}

.shadow-steps {
  display: grid;
  gap: 8px;
  margin-top: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--surface-inset);
}

.shadow-steps-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.shadow-steps-pos {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--muted);
}

.shadow-steps-buttons {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.shadow-steps-buttons .secondary-button.small,
.shadow-steps-buttons .ghost-button.small {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.shadow-sentence {
  margin: 0;
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-size: 1.15rem;
  line-height: 1.7;
  color: var(--ink);
  word-break: break-word;
}

.aid-note {
  margin: 0;
  font-size: 0.8rem;
  color: var(--amber-strong);
}

.furigana-toggle {
  display: inline-flex;
  border-radius: 999px;
  background: var(--surface-inset);
  padding: 3px;
  gap: 2px;
}

.furigana-toggle button {
  border: 0;
  background: transparent;
  border-radius: 999px;
  padding: 6px 14px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.furigana-toggle button.active {
  background: var(--surface-raised);
  color: var(--primary);
  box-shadow: var(--shadow);
}

.furigana-text {
  margin: 0;
  border-radius: 18px;
  background: var(--surface-inset);
  padding: 18px 18px 8px;
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-size: 1.5rem;
  line-height: 2.6;
  color: var(--ink);
  word-break: break-word;
}

.furigana-text rt {
  font-size: 0.5em;
  color: var(--primary);
  font-weight: 700;
}

/* The inset boxes above are hard-coded light; on dark theme the text
   variables turn light too, so they need a dark surface to stay readable. */
[data-theme='dark'] .shadow-steps,
[data-theme='dark'] .furigana-toggle,
[data-theme='dark'] .furigana-text {
  background: #2c2640;
}

[data-theme='dark'] .furigana-toggle button.active {
  background: #403858;
}
</style>
