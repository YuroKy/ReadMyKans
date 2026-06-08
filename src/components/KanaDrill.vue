<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useKanaDrill } from '../composables/useKanaDrill'
import {
  startDrillSpeech,
  isDrillSpeechSupported,
  type DrillSpeechSession,
} from '../composables/useDrillSpeech'
import { usePushToTalk } from '../composables/usePushToTalk'
import { useKanaStats, isWeak, topConfusion } from '../composables/useKanaStats'
import { isKana } from '../utils/kana'
import { kanaToRomaji, romajiToKana } from '../utils/romaji'
import { kanaContrast } from '../utils/kanaContrast'
import { analyzeKanaDifficulty } from '../utils/kanaDifficulty'
import { collectConfusionPairs } from '../utils/confusions'
import { encouragement } from '../utils/encouragement'
import SakuraDecor from './SakuraDecor.vue'

const props = defineProps<{ sourceText: string }>()
const emit = defineEmits<{ exit: [] }>()

const chunkSize = ref(1)
const sourceRef = computed(() => props.sourceText)

const {
  total,
  index,
  currentChunk,
  expectedKana,
  expectedRomaji,
  isFinished,
  correctCount,
  lastOutcome,
  lastAnswer,
  submitRomaji,
  submitKana,
  next,
  retry,
  reset,
} = useKanaDrill(sourceRef, chunkSize)

const answer = ref('')
const revealed = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

const focusInput = () => nextTick(() => inputEl.value?.focus())

watch(index, () => {
  answer.value = ''
  revealed.value = false
  lastConfused.value = ''
  focusInput()
})

watch(chunkSize, () => {
  reset()
  answer.value = ''
  revealed.value = false
  sessionPairs.value = []
  focusInput()
})

const stats = useKanaStats()

const lastConfused = ref('')
const sessionPairs = ref<Array<[string, string]>>([])

const isSingleKana = computed(() => currentChunk.value.length === 1)

const recordStat = (outcome: 'correct' | 'wrong', confusedKana: string) => {
  if (!isSingleKana.value) return
  const kana = expectedKana.value
  if (outcome === 'correct') {
    stats.record(kana, true)
    lastConfused.value = ''
  } else {
    const confused = confusedKana && confusedKana !== kana ? confusedKana : ''
    stats.record(kana, false, confused || undefined)
    lastConfused.value = confused
    if (confused) sessionPairs.value.push([kana, confused])
  }
}

const handleOutcome = (outcome: 'correct' | 'wrong') => {
  if (outcome === 'correct') {
    window.setTimeout(() => {
      if (!isFinished.value) next()
      else lastOutcome.value = null
    }, 800)
  }
}

const submit = () => {
  if (lastOutcome.value || !answer.value.trim()) return
  const outcome = submitRomaji(answer.value)
  recordStat(outcome, romajiToKana(answer.value))
  handleOutcome(outcome)
}

const micSupported = isDrillSpeechSupported()
let session: DrillSpeechSession | null = null

const {
  state: micState,
  press: micPress,
  release: micRelease,
} = usePushToTalk({
  start: () => {
    session = startDrillSpeech()
    return session.started
  },
  recognize: async () => {
    if (!session) return ''
    session.stop()
    const text = await session.result
    session = null
    return text
  },
  canStart: () => !lastOutcome.value && micSupported,
  onResult: (text) => {
    const outcome = submitKana(text)
    const firstKana = [...text].filter(isKana)[0] ?? ''
    recordStat(outcome, firstKana)
    handleOutcome(outcome)
  },
})

const micLabel = computed(() => {
  switch (micState.value) {
    case 'connecting':
      return 'Запуск мікрофона…'
    case 'listening':
      return 'Кажіть кану…'
    case 'processing':
      return 'Обробка…'
    default:
      return 'Натисни і скажи'
  }
})

const onMicPointerDown = (e: PointerEvent) => {
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  } catch {}
  void micPress()
}

onBeforeUnmount(() => session?.stop())

const tryAgain = () => {
  retry()
  answer.value = ''
  focusInput()
}

const skip = () => {
  next()
}

const restart = () => {
  reset()
  answer.value = ''
  revealed.value = false
  sessionPairs.value = []
  focusInput()
}

const ttsSupported = computed(() => typeof window !== 'undefined' && 'speechSynthesis' in window)

const speak = () => {
  if (!ttsSupported.value || !expectedKana.value) return
  const u = new SpeechSynthesisUtterance(expectedKana.value)
  const jaVoice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith('ja'))
  u.lang = 'ja-JP'
  u.rate = 0.7
  if (jaVoice) u.voice = jaVoice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

const chunkLabel = computed(() => {
  const n = chunkSize.value
  if (n === 1) return '1 кана'
  if (n >= 2 && n <= 4) return `${n} кани`
  return `${n} кан`
})

const youSaidRomaji = computed(() => {
  return lastAnswer.value
})

const currentStat = computed(() => stats.statFor(expectedKana.value))
const weakBadge = computed(() => isSingleKana.value && isWeak(currentStat.value))
const confusionHint = computed(() => (isSingleKana.value ? topConfusion(currentStat.value) : ''))

const contrast = computed(() =>
  lastOutcome.value === 'wrong' && lastConfused.value
    ? kanaContrast(expectedKana.value, lastConfused.value)
    : null,
)

const weakSummary = computed(() => stats.weak().slice(0, 10))

const wrongCount = computed(() => Math.max(0, total.value - correctCount.value))
const accuracy = computed(() =>
  total.value === 0 ? 0 : Math.round((correctCount.value / total.value) * 100),
)
const headline = computed(() => encouragement(accuracy.value))

const difficulty = computed(() => analyzeKanaDifficulty(props.sourceText))
const difficultyTiers = computed(() => {
  const data = difficulty.value
  const denom = data.total || 1
  const pct = (value: number) => Math.round((value / denom) * 100)
  return [
    { key: 'easy', label: 'Легкі', count: data.easy, pct: pct(data.easy) },
    { key: 'medium', label: 'Середні', count: data.medium, pct: pct(data.medium) },
    { key: 'hard', label: 'Складні', count: data.hard, pct: pct(data.hard) },
  ]
})
const donutGradient = computed(() => {
  const data = difficulty.value
  if (data.total === 0) return 'conic-gradient(var(--divider) 0 100%)'
  const easyEnd = (data.easy / data.total) * 100
  const mediumEnd = easyEnd + (data.medium / data.total) * 100
  return `conic-gradient(var(--mint-strong) 0 ${easyEnd}%, var(--sky-strong) ${easyEnd}% ${mediumEnd}%, var(--rose-strong) ${mediumEnd}% 100%)`
})
const drillConfusions = computed(() => collectConfusionPairs(sessionPairs.value, 5))

onMounted(() => focusInput())
</script>

<template>
  <main class="drill-layout">
    <section class="session-hero drill-hero">
      <div>
        <p class="eyebrow">Урок кани</p>
        <h1>Практика кани</h1>
      </div>
      <div class="drill-controls">
        <label class="drill-size">
          <span class="eyebrow">Розмір шматка: {{ chunkLabel }}</span>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            v-model.number="chunkSize"
            class="mic-gain-slider"
          />
        </label>
        <button class="ghost-button small" type="button" @click="emit('exit')">Вийти</button>
      </div>
    </section>

    <section v-if="!isFinished" class="panel drill-progress">
      <span>Картка {{ Math.min(index + 1, total) }} / {{ total }}</span>
      <strong>{{ correctCount }} правильних</strong>
    </section>

    <template v-if="isFinished">
      <section class="panel result-summary">
        <SakuraDecor density="rich" />
        <div class="result-summary-main">
          <div class="result-summary-head">
            <p class="eyebrow">Підсумок практики</p>
            <h1>{{ headline.title }}</h1>
            <p class="result-subtitle">{{ headline.subtitle }}</p>
          </div>
          <span class="result-badge">🌸 {{ correctCount }} / {{ total }} правильних</span>
        </div>

        <div class="accuracy-ring big" :style="{ '--score': `${accuracy}%` }">
          <strong>{{ accuracy }}%</strong>
          <span>точність</span>
        </div>
      </section>

      <section class="result-stats">
        <div class="panel mini-stat">
          <span>Карток усього</span>
          <strong>{{ total }}</strong>
        </div>
        <div class="panel mini-stat accent-ok">
          <span>Правильних</span>
          <strong>{{ correctCount }}</strong>
        </div>
        <div class="panel mini-stat accent-bad">
          <span>Помилок</span>
          <strong>{{ wrongCount }}</strong>
        </div>
        <div class="panel mini-stat">
          <span>Кан у тексті</span>
          <strong>{{ difficulty.total }}</strong>
        </div>
      </section>

      <section class="result-insights">
        <article class="panel insight-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Розбір</p>
              <h2>Складність кани</h2>
            </div>
          </div>

          <div class="difficulty-body">
            <div
              class="difficulty-donut"
              :style="{ '--donut': donutGradient }"
              role="img"
              aria-label="Розподіл кани за складністю"
            >
              <strong>{{ difficulty.total }}</strong>
              <span>кан</span>
            </div>
            <ul class="difficulty-legend">
              <li v-for="tier in difficultyTiers" :key="tier.key" :class="tier.key">
                <span class="difficulty-dot" />
                <span class="difficulty-label">{{ tier.label }}</span>
                <strong>{{ tier.count }}</strong>
                <small>({{ tier.pct }}%)</small>
              </li>
            </ul>
          </div>
        </article>

        <article class="panel insight-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Помилки</p>
              <h2>Найчастіші плутанини</h2>
            </div>
          </div>

          <ul v-if="drillConfusions.length" class="confusion-list">
            <li v-for="pair in drillConfusions" :key="`${pair.a}-${pair.b}`" class="confusion-row">
              <span class="confusion-pair">
                <b>{{ pair.a }}</b>
                <i>↔</i>
                <b>{{ pair.b }}</b>
              </span>
              <span class="confusion-count">{{ pair.count }}</span>
            </li>
          </ul>
          <p v-else class="empty-copy">Цього разу плутанини не зафіксовано. Так тримати! 🌸</p>
        </article>

        <article class="panel insight-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Повторення</p>
              <h2>Варто повторити</h2>
            </div>
          </div>

          <div v-if="weakSummary.length" class="drill-weak-list">
            <span v-for="w in weakSummary" :key="w.kana" class="drill-weak-chip">
              <strong>{{ w.kana }}</strong>
              <small>{{ kanaToRomaji(w.kana) }} · {{ w.wrong }} помилок</small>
            </span>
          </div>
          <p v-else class="empty-copy">Слабких кан поки немає — гарно йде! 🌸</p>
        </article>
      </section>

      <section class="session-actions" aria-label="Подальші дії">
        <button class="primary-button" type="button" @click="restart">Спочатку</button>
        <button class="secondary-button" type="button" @click="emit('exit')">До тексту</button>
      </section>
    </template>

    <section
      v-else
      class="panel drill-card"
      :class="{ correct: lastOutcome === 'correct', wrong: lastOutcome === 'wrong' }"
    >
      <SakuraDecor />
      <div class="drill-kana-row">
        <strong class="drill-kana">{{ expectedKana || '—' }}</strong>
        <button
          class="speaker-button"
          type="button"
          :disabled="!ttsSupported"
          title="Послухати вимову"
          aria-label="Послухати вимову"
          @click="speak"
        >
          ▷
        </button>
      </div>

      <div v-if="!lastOutcome && (weakBadge || confusionHint)" class="drill-cues">
        <span v-if="weakBadge" class="drill-cue warn">⚠️ Тут часто буває помилка</span>
        <span v-if="confusionHint" class="drill-cue confuse">
          💡 Не сплутай з <b>{{ confusionHint }}</b>
        </span>
      </div>

      <p v-if="revealed && !lastOutcome" class="drill-hint">
        Підказка: <b>{{ expectedRomaji }}</b>
      </p>

      <form v-if="!lastOutcome" class="drill-input-row" @submit.prevent="submit">
        <input
          ref="inputEl"
          v-model="answer"
          class="mic-select drill-input"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="Введіть ромадзі (напр. mu)"
        />
        <button class="primary-button" type="submit" :disabled="!answer.trim()">Перевірити</button>
      </form>

      <div v-if="!lastOutcome && micSupported" class="drill-ptt">
        <span class="drill-or">або</span>
        <button
          type="button"
          class="drill-mic"
          :class="{ active: micState === 'listening', busy: micState === 'connecting' || micState === 'processing' }"
          aria-label="Тримай і говори"
          @pointerdown.prevent="onMicPointerDown"
          @pointerup="micRelease"
          @pointercancel="micRelease"
        >
          <svg class="drill-mic-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" />
            <path
              d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <span class="drill-mic-label">{{ micLabel }}</span>
        <span class="drill-ptt-hint">Утримуй кнопку, скажи кану, відпусти</span>
      </div>

      <div v-if="!lastOutcome" class="drill-sub-actions">
        <button class="ghost-button small" type="button" @click="revealed = true">
          Показати підказку
        </button>
        <button class="ghost-button small" type="button" @click="skip">Пропустити</button>
      </div>

      <div v-if="lastOutcome === 'correct'" class="drill-feedback ok">
        <strong>✓ Правильно!</strong>
        <span>{{ expectedKana }} = {{ expectedRomaji }}</span>
      </div>

      <div v-else-if="lastOutcome === 'wrong'" class="drill-feedback bad">
        <strong>✗ Не зараховано</strong>
        <span
          >Ви назвали: <b>{{ youSaidRomaji || '—' }}</b></span
        >
        <span
          >Правильно: <b>{{ expectedKana }}</b> = <b>{{ expectedRomaji }}</b></span
        >

        <p v-if="contrast" class="drill-contrast">
          {{ contrast.note }}
        </p>

        <div class="drill-actions">
          <button class="secondary-button" type="button" @click="tryAgain">Спробувати ще</button>
          <button class="primary-button" type="button" @click="skip">Далі</button>
        </div>
      </div>

      <div v-if="lastOutcome && currentChunk.length > 1" class="drill-breakdown">
        <span v-for="(k, i) in currentChunk" :key="i" class="drill-kana-chip">
          {{ k }}<small>{{ kanaToRomaji(k) }}</small>
        </span>
      </div>
    </section>
  </main>
</template>
