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
  focusInput()
})

const stats = useKanaStats()

const lastConfused = ref('')

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
      return '🔴 Кажіть кану…'
    case 'processing':
      return 'Обробка…'
    default:
      return '🎤 Тримай і кажи'
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

    <section class="panel drill-progress">
      <span>Картка {{ Math.min(index + 1, total) }} / {{ total }}</span>
      <strong>{{ correctCount }} правильних</strong>
    </section>

    <section v-if="isFinished" class="panel drill-card drill-done">
      <p class="eyebrow">Готово 🎉</p>
      <h2>{{ correctCount }} / {{ total }} правильних</h2>

      <div v-if="weakSummary.length" class="drill-weak">
        <span class="eyebrow">Варто повторити</span>
        <div class="drill-weak-list">
          <span v-for="w in weakSummary" :key="w.kana" class="drill-weak-chip">
            <strong>{{ w.kana }}</strong>
            <small>{{ kanaToRomaji(w.kana) }} · {{ w.wrong }} помилок</small>
          </span>
        </div>
      </div>

      <div class="drill-actions">
        <button class="primary-button" type="button" @click="restart">Спочатку</button>
        <button class="ghost-button" type="button" @click="emit('exit')">До тексту</button>
      </div>
    </section>

    <section
      v-else
      class="panel drill-card"
      :class="{ correct: lastOutcome === 'correct', wrong: lastOutcome === 'wrong' }"
    >
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
          class="secondary-button drill-mic"
          :class="{ active: micState === 'listening' }"
          @pointerdown.prevent="onMicPointerDown"
          @pointerup="micRelease"
          @pointercancel="micRelease"
        >
          {{ micLabel }}
        </button>
        <span class="drill-ptt-hint">Тримай кнопку, скажи кану, відпусти</span>
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
